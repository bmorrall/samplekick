import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("SquashNameTransformer", () => {
  it("does not persist squashed names to the auto-config", async () => {
    const zipped = zipSync({
      "Bass Loops/kick drum 01.wav": strToU8("kick-data"),
      "Drum-Hits/snare hit.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-squash-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--analyse", "--squash"],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );

      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");

      // Auto-config should reflect the pre-squash (normalised) names
      expect(csv).toContain("Bass Loops,");
      expect(csv).toContain("Drum-Hits,");
      expect(csv).not.toContain("BassLoops");
      expect(csv).not.toContain("DrumHits");
      expect(csv).not.toContain("kickDrum");
      expect(csv).not.toContain("snareHit");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("applies squashed names to --dump-digest output", async () => {
    const zipped = zipSync({
      "Bass Loops/kick drum 01.wav": strToU8("kick-data"),
      "Drum-Hits/snare hit.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-squash-"));
    const zipPath = join(tmpDir, "test-pack.zip");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--squash", "--dump-digest"],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
        },
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Bass Loops,BassLoops,,,false");
      expect(result.stdout).toContain("Drum-Hits,DrumHits,,,false");
      expect(result.stdout).toContain(
        "Bass Loops/kick drum 01.wav,kickDrum01.wav,,,true",
      );
      expect(result.stdout).toContain(
        "Drum-Hits/snare hit.wav,snareHit.wav,,,true",
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
