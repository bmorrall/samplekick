import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { makeMinimalWav } from "./support";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("Dirtywave M8 device preset", () => {
  it("exports and converts a configured pack to organised paths", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": makeMinimalWav(),
      "Loops/bass.wav": makeMinimalWav(),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      // First run: analyse to save auto-config
      const firstRun = spawnSync("node", [CLI_PATH, zipPath, "--analyse", "--device", "dirtywavem8"], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });
      expect(firstRun.stderr).toBe("");
      expect(firstRun.status).toBe(0);

      const [autoConfigFile] = await readdir(dataDir);
      const autoConfig = await readFile(join(dataDir, autoConfigFile), "utf8");
      expect(autoConfig).toBe([
        "path,name,packageName,sampleType,skip,keepPath",
        ",test-pack.zip,test-pack,,,",
        "Drums,,,Drums,,",
        "Drums/kick.wav,,,,,",
        "Loops,,,Loops,,",
        "Loops/bass.wav,,,,,",
      ].join("\n"));

      // Write config with packageName and sampleTypes
      await writeFile(join(dataDir, autoConfigFile), [
        "path,name,packageName,sampleType,skip,keepPath",
        ",test-pack.zip,my-pack,,,",
        "Drums,,,Percussion,,",
        "Drums/kick.wav,,,,,",
        "Loops,,,Loops,,",
        "Loops/bass.wav,,,,,",
      ].join("\n"));

      // Second run: convert and export
      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--device", "dirtywavem8", "--convert", "-o", outputDir],
        { encoding: "utf8", env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir } },
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      const kickBuf = await readFile(join(outputDir, "Percussion/my-pack/kick.wav"));
      expect(kickBuf.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(kickBuf.readUInt32LE(24)).toBe(44100); // sample rate
      expect(kickBuf.readUInt16LE(34)).toBe(16);    // bits per sample

      const bassBuf = await readFile(join(outputDir, "Loops/my-pack/bass.wav"));
      expect(bassBuf.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(bassBuf.readUInt32LE(24)).toBe(44100);
      expect(bassBuf.readUInt16LE(34)).toBe(16);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
