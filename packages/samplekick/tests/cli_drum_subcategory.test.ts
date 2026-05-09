import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("DrumSubcategoryTransformer", () => {
  it('tags a "Drum Fills" directory with sampleType in the auto-config', async () => {
    const zipped = zipSync({
      "Drum Fills/fill.wav": strToU8("fill-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-drum-subcategory-"));
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

      const dirRow = csv.split("\n").find((row) => row.startsWith("Drum Fills,"));
      expect(dirRow).toBe("Drum Fills,,,Drum Fills,,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('tags a "Fills" directory under "Drums" with sampleType in the auto-config', async () => {
    const zipped = zipSync({
      "Drums/Fills/fill.wav": strToU8("fill-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-drum-subcategory-"));
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

      const dirRow = csv.split("\n").find((row) => row.startsWith("Drums/Fills,"));
      expect(dirRow).toBe("Drums/Fills,,,Drum Fills,,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('tags a "Drum - Fills" directory with sampleType in the auto-config', async () => {
    const zipped = zipSync({
      "Drum - Fills/fill.wav": strToU8("fill-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-drum-subcategory-"));
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

      const dirRow = csv.split("\n").find((row) => row.startsWith("Drum - Fills,"));
      expect(dirRow).toBe("Drum - Fills,,,Drum Fills,,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('tags a "Drum Breaks" directory with sampleType in the auto-config', async () => {
    const zipped = zipSync({
      "Drum Breaks/break.wav": strToU8("break-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-drum-subcategory-"));
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

      const dirRow = csv.split("\n").find((row) => row.startsWith("Drum Breaks,"));
      expect(dirRow).toBe("Drum Breaks,,,Drum Breaks,,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
