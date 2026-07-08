import { spawnSync } from "node:child_process";
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("auto-persist config", () => {
  it("saves config to data dir on first run and loads it on subsequent runs", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");
    const outputDir1 = join(tmpDir, "output1");
    const outputDir2 = join(tmpDir, "output2");

    try {
      await writeFile(zipPath, zipped);

      // First run: no config exists yet, auto-saves config to data dir
      const result1 = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--analyse", "-o", outputDir1],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );
      expect(result1.status).toBe(0);

      // Verify a config file was saved keyed by fingerprint
      const files = await readdir(dataDir);
      expect(files).toHaveLength(1);
      const autoConfigPath = join(dataDir, files[0]);

      // Overwrite the auto-saved config with a custom rename
      await writeFile(
        autoConfigPath,
        [
          "path,name,packageName,sampleType,enabled",
          "Drums/kick.wav,custom_kick.wav,,,",
        ].join("\n"),
      );

      // Second run: loads the modified auto-saved config
      const result2 = spawnSync("node", [CLI_PATH, zipPath, "-x", outputDir2], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });
      expect(result2.status).toBe(0);
      expect(
        await readFile(join(outputDir2, "Drums/custom_kick.wav"), "utf8"),
      ).toBe("kick-data");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("does not auto-save when --analyse is not passed", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      spawnSync("node", [CLI_PATH, zipPath], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });

      await expect(stat(dataDir)).rejects.toThrow();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("does not auto-save when --digest is passed", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const config = [
      "path,name,packageName,sampleType,enabled",
      "Drums/kick.wav,explicit.wav,,,",
    ].join("\n");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      spawnSync("node", [CLI_PATH, zipPath, "--digest", configPath], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });

      await expect(stat(dataDir)).rejects.toThrow();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("ignores auto-config when --rebuild is passed", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      // First run: save auto-config
      spawnSync("node", [CLI_PATH, zipPath, "--analyse", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });

      const files = await readdir(dataDir);
      const autoConfigPath = join(dataDir, files[0]);

      // Overwrite with a custom rename
      await writeFile(
        autoConfigPath,
        [
          "path,name,packageName,sampleType,enabled",
          "Drums/kick.wav,custom_kick.wav,,,",
        ].join("\n"),
      );

      // Second run with --rebuild: should ignore the custom rename
      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--rebuild", "-x", outputDir],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );
      expect(result.status).toBe(0);
      await expect(
        readFile(join(outputDir, "Drums/kick.wav"), "utf8"),
      ).resolves.toBe("kick-data");
      await expect(
        stat(join(outputDir, "Drums/custom_kick.wav")),
      ).rejects.toThrow();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("ignores auto-config when -r shorthand is passed", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      spawnSync("node", [CLI_PATH, zipPath, "--analyse", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });

      const files = await readdir(dataDir);
      await writeFile(
        join(dataDir, files[0]),
        [
          "path,name,packageName,sampleType,enabled",
          "Drums/kick.wav,custom_kick.wav,,,",
        ].join("\n"),
      );

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "-r", "-x", outputDir],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );
      expect(result.status).toBe(0);
      await expect(
        readFile(join(outputDir, "Drums/kick.wav"), "utf8"),
      ).resolves.toBe("kick-data");
      await expect(
        stat(join(outputDir, "Drums/custom_kick.wav")),
      ).rejects.toThrow();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
