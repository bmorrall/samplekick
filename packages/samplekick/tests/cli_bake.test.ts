import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("--bake-digest flag", () => {
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
        [
          CLI_PATH,
          zipPath,
          "--bake-digest",
          "--device",
          "sp404mk2",
          "--squash",
        ],
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
      expect(csv).toContain("Drum-Hits,DrumHits,,,false");
      expect(csv).toContain("Drum-Hits/snare hit.wav,snareHit.wav,,,true");
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
        [CLI_PATH, zipPath, "--bake-digest", "--device", "sp404mk2"],
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
      expect(csv).toContain("Dr\u00fcms,Drums,,,false");
      expect(csv).toContain("Dr\u00fcms/sn\u00e2re.wav,snare.wav,,,true");
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
          "path,name,packageName,sampleType,enabled",
          "Drum-Hits,,,Drums,false",
        ].join("\n"),
      );

      const result = spawnSync(
        "node",
        [
          CLI_PATH,
          zipPath,
          "--bake-digest",
          "--squash",
          "--digest",
          configPath,
        ],
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

      expect(csv).toContain("Drum-Hits,DrumHits,,Drums,false"); // was: "Drum-Hits,,,"
      expect(csv).toContain("Drum-Hits/snare hit.wav,snareHit.wav,,,true"); // was: "Drum-Hits/snare hit.wav,,,"
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
        [CLI_PATH, zipPath, "--bake-digest", "--analyse"],
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
          "path,name,packageName,sampleType,enabled",
          ",test-pack.zip,test-pack,Packs,false",
          "Drums,Drums,,Drums,false",
          "Drums/kick.wav,kick.wav,,,true",
        ].join("\n"),
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
