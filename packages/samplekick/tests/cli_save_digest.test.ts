import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("--save-digest flag", () => {
  it("saves auto-tags to the data dir when --save-digest is passed without --analyse", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-save-digest-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--save-digest"], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      const files = await readdir(dataDir);
      expect(files).toHaveLength(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("saves auto-tags to the data dir when --save-digest is combined with --digest", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const config = [
      "path,name,packageName,sampleType,enabled",
      "Drums/kick.wav,custom_kick.wav,,,",
    ].join("\n");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-save-digest-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--digest", configPath, "--save-digest"],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      // --digest normally skips auto-save; --save-digest forces a write to the data dir
      const files = await readdir(dataDir);
      expect(files).toHaveLength(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("does not save to the data dir without --save-digest when --digest is passed", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const config = [
      "path,name,packageName,sampleType,enabled",
      "Drums/kick.wav,custom_kick.wav,,,",
    ].join("\n");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-save-digest-"));
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
});
