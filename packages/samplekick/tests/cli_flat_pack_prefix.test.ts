import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("FlatPackPrefixTransformer", () => {
  it("sets packageName and sampleType=Packs on root and strips prefixes from children", async () => {
    // Files are at the root of the zip (flat-pack structure)
    const zipped = zipSync({
      "Sounds by Sunwarper - SP404 Pack - 01 D4.wav": strToU8("audio"),
      "Sounds by Sunwarper - SP404 Pack - 02 E4.wav": strToU8("audio"),
      "album.jpg": strToU8("img"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-flat-pack-"));
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
      const rows = csv.split("\n");

      // Root row: path is empty, so it starts with ","
      const rootRow = rows.find((r) => r.startsWith(","));
      expect(rootRow).toContain("Sounds by Sunwarper - SP404 Pack");
      expect(rootRow).toContain("Packs");

      // Audio children have the prefix stripped and the first segment prepended
      const wav1Row = rows.find((r) => r.startsWith("Sounds by Sunwarper - SP404 Pack - 01 D4.wav,"));
      expect(wav1Row).toContain("Sounds by Sunwarper - 01 D4.wav");

      const wav2Row = rows.find((r) => r.startsWith("Sounds by Sunwarper - SP404 Pack - 02 E4.wav,"));
      expect(wav2Row).toContain("Sounds by Sunwarper - 02 E4.wav");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("does not apply when root has sub-directories", async () => {
    const zipped = zipSync({
      "Samples/Pack - 01 kick.wav": strToU8("audio"),
      "Samples/Pack - 02 snare.wav": strToU8("audio"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-flat-pack-"));
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
      const rootRow = csv.split("\n").find((r) => r.startsWith(","));
      expect(rootRow).not.toContain("Packs");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
