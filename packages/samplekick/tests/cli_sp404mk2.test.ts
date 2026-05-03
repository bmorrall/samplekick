import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";
import { makeMinimalWav } from "./support";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("SP-404MKII device preset", () => {
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

      // First run: no config yet — all entries skipped, auto-config is saved
      const firstRun = spawnSync("node", [CLI_PATH, zipPath, "--device", "sp404mk2", "--convert"], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });
      expect(firstRun.stderr).toBe("");
      expect(firstRun.status).toBe(0);

      // Auto-config is saved with folder rows and leaf paths
      const [autoConfigFile] = await readdir(dataDir);
      const autoConfig = await readFile(join(dataDir, autoConfigFile), "utf8");
      expect(autoConfig).toBe([
        "path,name,packageName,sampleType,skip,keepPath",
        ",test_pack.zip,,,,",
        "Drums,,,,,",
        "Drums/kick.wav,,,,,",
        "Loops,,,,,",
        "Loops/bass.wav,,,,,",
      ].join("\n"));

      // Set packageName on the root node, sampleType on each folder node, and override sampleType on the bass leaf
      await writeFile(join(dataDir, autoConfigFile), [
        "path,name,packageName,sampleType,skip,keepPath",
        ",test_pack.zip,my-pack,,,",
        "Drums,,,Percussion,,",
        "Drums/kick.wav,,,,,",
        "Loops,,,Loops,,",
        "Loops/bass.wav,,,Loops - Bass,,",
      ].join("\n"));

      // Second run: auto-config now has sampleType/packageName — exports to organised paths
      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--device", "sp404mk2", "--convert", "-o", outputDir],
        { encoding: "utf8", env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir } },
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      const kickBuf = await readFile(join(outputDir, "Percussion/my-pack/kick.wav"));
      expect(kickBuf.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(kickBuf.readUInt32LE(24)).toBe(48000); // sample rate
      expect(kickBuf.readUInt16LE(34)).toBe(16);    // bits per sample

      const bassBuf = await readFile(join(outputDir, "Loops - Bass/my-pack/bass.wav"));
      expect(bassBuf.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(bassBuf.readUInt32LE(24)).toBe(48000);
      expect(bassBuf.readUInt16LE(34)).toBe(16);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("sanitizes non-ASCII filenames and exports to organised paths using sanitized auto-config paths", async () => {
    const zipped = zipSync({
      "Dr\u00fcms/sn\u00e2re.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      // First run: entry is skipped, auto-config saved with sanitized paths (Drums/snare.wav)
      const firstRun = spawnSync("node", [CLI_PATH, zipPath, "--device", "sp404mk2"], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });
      expect(firstRun.stderr).toBe("");
      expect(firstRun.status).toBe(0);

      // Auto-config preserves original paths and stores sanitized names in the name column
      const [autoConfigFile] = await readdir(dataDir);
      const autoConfig = await readFile(join(dataDir, autoConfigFile), "utf8");
      expect(autoConfig).toBe([
        "path,name,packageName,sampleType,skip,keepPath",
        ",test_pack.zip,,,,",
        "Dr\u00fcms,Drums,,,,",
        "Dr\u00fcms/sn\u00e2re.wav,snare.wav,,,,",
      ].join("\n"));

      // Set packageName and sampleType on the folder node
      await writeFile(join(dataDir, autoConfigFile), [
        "path,name,packageName,sampleType,skip,keepPath",
        "Dr\u00fcms,,my-pack,Percussion,,",
      ].join("\n"));

      // Second run: exports to organised paths using sanitized names
      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--device", "sp404mk2", "-o", outputDir],
        { encoding: "utf8", env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir } },
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);
      expect(await readFile(join(outputDir, "Percussion/my-pack/snare.wav"), "utf8")).toBe("snare-data");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
