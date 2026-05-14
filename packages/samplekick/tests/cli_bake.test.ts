import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("--bake flag", () => {
  it("persists device and squash transforms to the auto-config", async () => {
    const zipped = zipSync({
      "Drum-Hits/snare hit.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-bake-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--bake", "--device", "sp404mk2", "--squash"],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");

      // Device and squash transforms are baked into the saved config
      expect(csv).toContain("Drum-Hits,false,DrumHits,");
      expect(csv).toContain("Drum-Hits/snare hit.wav,false,snareHit.wav,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("persists only device transforms when --squash is not passed", async () => {
    const zipped = zipSync({
      "Dr\u00fcms/sn\u00e2re.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-bake-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--bake", "--device", "sp404mk2"],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");

      // SP-404MkII name sanitization is baked in
      expect(csv).toContain("Dr\u00fcms,false,Drums,");
      expect(csv).toContain("Dr\u00fcms/sn\u00e2re.wav,false,snare.wav,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("persists to the auto-config path even when --digest is provided", async () => {
    const zipped = zipSync({
      "Drum-Hits/snare hit.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-bake-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);
      // Input config has no name set for the directory entry
      await writeFile(
        configPath,
        [
          "path,keepPath,name,packageName,sampleType,skip",
          "Drum-Hits,,,,Drums,",
        ].join("\n"),
      );

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--bake", "--squash", "--digest", configPath],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      // Auto-config is written to the fingerprint-keyed path even though --digest was used.
      // The squash transform derives names from the paths, overwriting the empty name column.
      const [autoConfigFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, autoConfigFile), "utf8");

      expect(csv).toContain("Drum-Hits,false,DrumHits,"); // was: "Drum-Hits,,,"
      expect(csv).toContain("Drum-Hits/snare hit.wav,false,snareHit.wav,"); // was: "Drum-Hits/snare hit.wav,,,"
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("writes the name column even when the name matches the path basename", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-bake-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--bake", "--analyse"],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");

      expect(csv).toBe(
        [
          "path,keepPath,name,packageName,sampleType,skip",
          ",false,test-pack.zip,test-pack,Packs,false", // root: name is zip filename; packageName derived from it
          "Drums,false,Drums,,Drums,false", // directory: sampleType set by analyse
          "Drums/kick.wav,false,kick.wav,,,false", // file: name locked in explicitly
        ].join("\n"),
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
