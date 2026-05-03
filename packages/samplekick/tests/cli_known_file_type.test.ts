import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("KnownFileTypeTransformer", () => {
  it("tags .mid files with sampleType MIDI in the auto-config", async () => {
    const zipped = zipSync({
      "MIDI/groove.mid": strToU8("midi-data"),
      "Drums/kick.wav": strToU8("kick-data"),
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

      const midRow = csv.split("\n").find((row) => row.includes("groove.mid"));
      expect(midRow).toBeDefined();
      // sampleType column (index 3) should be "MIDI"
      expect(midRow?.split(",")[3]).toBe("MIDI");

      const wavRow = csv.split("\n").find((row) => row.includes("kick.wav"));
      expect(wavRow).toBeDefined();
      expect(wavRow?.split(",")[3]).toBe("");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("tags .fxp files with sampleType Serum Presets in the auto-config", async () => {
    const zipped = zipSync({
      "Presets/bass.fxp": strToU8("fxp-data"),
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

      const fxpRow = csv.split("\n").find((row) => row.includes("bass.fxp"));
      expect(fxpRow).toBeDefined();
      expect(fxpRow?.split(",")[3]).toBe("Serum Presets");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
