import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("--no-packs flag", () => {
  it("rejects files tagged as Packs when --no-packs is passed", async () => {
    // Pack with a Packs-level root dir and a sample — after --analyse the root
    // gets sampleType=Packs; --no-packs should then reject its children on export.
    const zipped = zipSync({
      "My Pack/kick.wav": strToU8("kick-data"),
      "My Pack/snare.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-no-packs-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--analyse", "--no-packs", "-o", outputDir],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
        },
      );

      expect(result.status).toBe(0);
      // Files should be rejected (not written) because sampleType = "Packs"
      expect(result.stdout).toContain("entry is categorised as 'Packs'");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("allows files with a non-Packs sampleType when --no-packs is passed", async () => {
    const zipped = zipSync({
      "My Pack/kick.als": strToU8("als-data"),
      "My Pack/kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-no-packs-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--analyse", "--no-packs", "-o", outputDir],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
        },
      );

      expect(result.status).toBe(0);
      // My Pack has an .als file so it gets sampleType=Ableton Projects, not Packs — should pass
      expect(result.stdout).not.toContain("entry is categorised as 'Packs'");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
