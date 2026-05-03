import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("NormaliseHyphenTransformer", () => {
  it("normalises hyphens touching adjacent words in the auto-config", async () => {
    const zipped = zipSync({
      "Drums- Bass/kick.wav": strToU8("kick-data"),
      "Kicks -Snares/snare.wav": strToU8("snare-data"),
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

      // "Drums- Bass" folder should be renamed to "Drums - Bass"
      const drumsRow = csv.split("\n").find((row) => row.startsWith("Drums- Bass,"));
      expect(drumsRow).toBe("Drums- Bass,Drums - Bass,,,,");

      // "Kicks -Snares" folder should be renamed to "Kicks - Snares"
      const kicksRow = csv.split("\n").find((row) => row.startsWith("Kicks -Snares,"));
      expect(kicksRow).toBe("Kicks -Snares,Kicks - Snares,,,,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("normalisation persists on a second --analyse run against an existing auto-config", async () => {
    const zipped = zipSync({
      "Drums- Bass/kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-analyse-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      // First run: saves auto-config with normalised name
      const runOnce = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--analyse"],
        { encoding: "utf8", env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir } },
      );
      expect(runOnce.status).toBe(0);

      // Simulate a stale auto-config with no name override (as if saved before transformer existed)
      const [configFile] = await readdir(dataDir);
      const configPath = join(dataDir, configFile);
      const staleConfig = "path,name,packageName,sampleType,skip,keepPath\nDrums- Bass,,,,,\nDrums- Bass/kick.wav,,,,,";
      await writeFile(configPath, staleConfig);

      // Second run: transformer should still normalise despite the stale config not having a name
      const runTwice = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--analyse"],
        { encoding: "utf8", env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir } },
      );
      expect(runTwice.status).toBe(0);

      const csv = await readFile(configPath, "utf8");
      const drumsRow = csv.split("\n").find((row) => row.startsWith("Drums- Bass,"));
      expect(drumsRow).toBe("Drums- Bass,Drums - Bass,,,,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
