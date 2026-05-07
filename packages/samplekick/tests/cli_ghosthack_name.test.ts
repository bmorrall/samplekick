import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("GhosthackNameTransformer", () => {
  it("normalises Ghosthack prefix variants in the auto-config", async () => {
    const zipped = zipSync({
      "Ghosthack-Bass Loops/kick.wav": strToU8("kick-data"),
      "Ghosthack -Drum Hits/snare.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-analyse-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--analyse"],
        { encoding: "utf8", env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir } },
      );

      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");

      const bassRow = csv.split("\n").find((row) => row.startsWith("Ghosthack-Bass Loops,"));
      expect(bassRow).toContain("Ghosthack - Bass Loops");

      const drumRow = csv.split("\n").find((row) => row.startsWith("Ghosthack -Drum Hits,"));
      expect(drumRow).toContain("Ghosthack - Drum Hits");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
