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

describe("KeepParentsTransformer", () => {
  it("sets keepPath=true on directories that have files when --keep-parents is passed", async () => {
    const zipped = zipSync({
      "Kicks/kick.wav": strToU8("kick-data"),
      "Snares/snare.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-keep-parents-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [
          CLI_PATH,
          zipPath,
          "--analyse",
          "--keep-parents",
          "1",
          "-o",
          outputDir,
        ],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );

      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      expect(csv).toBe(
        [
          "path,name,packageName,sampleType,enabled",
          ",test-pack.zip,test-pack,Packs,false",
          "Kicks,,,Kicks,true",
          "Snares,,,Snares,true",
        ].join("\n"),
      );

      expect(
        (
          await stat(join(outputDir, "Kicks/test-pack/Kicks/kick.wav"))
        ).isFile(),
      ).toBe(true);
      expect(
        (
          await stat(join(outputDir, "Snares/test-pack/Snares/snare.wav"))
        ).isFile(),
      ).toBe(true);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("sets keepPath=true on directories with files when --analyse is passed without --keep-parents", async () => {
    const zipped = zipSync({
      "Kicks/kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-keep-parents-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--analyse"], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });

      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      expect(csv).toBe(
        [
          "path,name,packageName,sampleType,enabled",
          ",test-pack.zip,test-pack,Packs,false",
          "Kicks,,,Kicks,false",
          "Kicks/kick.wav,,,,true",
        ].join("\n"),
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("saves the auto-config with keepPath=true when --keep-parents is passed without --analyse", async () => {
    const zipped = zipSync({
      "Kicks/kick.wav": strToU8("kick-data"),
      "Snares/snare.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-keep-parents-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--keep-parents", "1"],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );

      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      expect(csv).toBe(
        [
          "path,name,packageName,sampleType,enabled",
          ",test-pack.zip,test-pack,Packs,false",
          "Kicks,,,,true",
          "Snares,,,,true",
        ].join("\n"),
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("only sets keepPath on directories with direct file children, leaving ancestor directories unset", async () => {
    const zipped = zipSync({
      "Guitar Pack/samples/guitar_stuff/guitar.wav": strToU8("guitar-data"),
      "Guitar Pack/samples/readme.txt": strToU8("readme-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-keep-parents-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--keep-parents", "1"],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );

      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      expect(csv).toBe(
        [
          "path,name,packageName,sampleType,enabled",
          ",test-pack.zip,test-pack,Packs,false",
          // Guitar Pack has no direct file children — appears without keepPath
          // so it can be individually toggled in the config
          "Guitar Pack,,,,false",
          // samples has readme.txt directly, so keepPath=true
          "Guitar Pack/samples,,,,true",
          // guitar_stuff has its own keepPath=true so it also appears,
          // allowing it to be toggled independently
          "Guitar Pack/samples/guitar_stuff,,,,true",
        ].join("\n"),
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("saves the auto-config with keepPath=true when -p shorthand is passed", async () => {
    const zipped = zipSync({
      "Kicks/kick.wav": strToU8("kick-data"),
      "Snares/snare.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-keep-parents-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "-p", "1"], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });

      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      expect(csv).toBe(
        [
          "path,name,packageName,sampleType,enabled",
          ",test-pack.zip,test-pack,Packs,false",
          "Kicks,,,,true",
          "Snares,,,,true",
        ].join("\n"),
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("sets keepPath=true on ancestor directories when --keep-parents 2 is passed", async () => {
    const zipped = zipSync({
      "Drums/Kicks/kick.wav": strToU8("kick-data"),
      "Drums/Snares/snare.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-keep-parents-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--keep-parents", "2"],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );

      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      expect(csv).toBe(
        [
          "path,name,packageName,sampleType,enabled",
          ",test-pack.zip,test-pack,Packs,false",
          "Drums,,,,true",
          "Drums/Kicks,,,,true",
          "Drums/Snares,,,,true",
        ].join("\n"),
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exits with error when --keep-parents depth is 0", async () => {
    const zipped = zipSync({ "Kicks/kick.wav": strToU8("kick-data") });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-keep-parents-"));
    const zipPath = join(tmpDir, "test-pack.zip");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--keep-parents", "0"],
        { encoding: "utf8" },
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "Error: --keep-parents requires a positive integer",
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
