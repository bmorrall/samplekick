import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("NormaliseCommaSpacingTransformer", () => {
  it("normalises spaces around commas in the auto-config", async () => {
    const zipped = zipSync({
      "Kicks , Snares/kick.wav": strToU8("kick-data"),
      "Hi-Hats ,Percussion/hat.wav": strToU8("hat-data"),
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

      // "Kicks , Snares" should be renamed to "Kicks, Snares"
      const kicksRow = csv.split("\n").find((row) => row.startsWith("Kicks , Snares,"));
      expect(kicksRow).toBe("Kicks , Snares,Kicks, Snares,,,,");

      // "Hi-Hats ,Percussion" should be renamed to "Hi-Hats, Percussion"
      const hatsRow = csv.split("\n").find((row) => row.startsWith("Hi-Hats ,Percussion,"));
      expect(hatsRow).toBe("Hi-Hats ,Percussion,Hi-Hats, Percussion,,,,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("normalises underscores around commas in underscore mode", async () => {
    const zipped = zipSync({
      "Kicks_,_Snares/kick.wav": strToU8("kick-data"),
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

      // "Kicks_,_Snares" should be renamed to "Kicks,_Snares"
      const kicksRow = csv.split("\n").find((row) => row.startsWith("Kicks_,_Snares,"));
      expect(kicksRow).toBe("Kicks_,_Snares,Kicks,_Snares,,,,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
