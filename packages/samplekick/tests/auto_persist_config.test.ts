import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
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
      const result1 = spawnSync("node", [CLI_PATH, zipPath, "-o", outputDir1], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });
      expect(result1.status).toBe(0);

      // Verify a config file was saved keyed by fingerprint
      const files = await readdir(dataDir);
      expect(files).toHaveLength(1);
      const autoConfigPath = join(dataDir, files[0]);

      // Overwrite the auto-saved config with a custom rename
      await writeFile(autoConfigPath, JSON.stringify([{ path: "Drums/kick.wav", name: "custom_kick.wav" }]));

      // Second run: loads the modified auto-saved config
      const result2 = spawnSync("node", [CLI_PATH, zipPath, "-o", outputDir2], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });
      expect(result2.status).toBe(0);
      expect(await readFile(join(outputDir2, "Drums/custom_kick.wav"), "utf8")).toBe("kick-data");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("does not auto-save when --config is passed", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const config = JSON.stringify([{ path: "Drums/kick.wav", name: "explicit.wav" }]);

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.json");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      spawnSync("node", [CLI_PATH, zipPath, "--config", configPath], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });

      await expect(stat(dataDir)).rejects.toThrow();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
