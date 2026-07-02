import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("DirectorySampleTypeTransformer", () => {
  it("tags a Drums directory with sampleType in the auto-config", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Drums/snare.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-analyse-"));
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

      const dirRow = csv.split("\n").find((row) => row.startsWith("Drums,"));
      expect(dirRow).toBe("Drums,,,Drums,false");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("tags a Percussion directory with sampleType in the auto-config", async () => {
    const zipped = zipSync({
      "Percussion/shaker.wav": strToU8("shaker-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-analyse-"));
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

      const dirRow = csv
        .split("\n")
        .find((row) => row.startsWith("Percussion,"));
      expect(dirRow).toBe("Percussion,,,Percussion,false");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('tags a "Loop Stems & MIDI" directory with sampleType "Loops" in the auto-config', async () => {
    const zipped = zipSync({
      "Loop Stems & MIDI/loop.wav": strToU8("loop-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-analyse-"));
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

      const dirRow = csv
        .split("\n")
        .find((row) => row.startsWith("Loop Stems & MIDI,"));
      expect(dirRow).toBe("Loop Stems & MIDI,,,Loops,false");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("does not tag an unrecognised directory", async () => {
    const zipped = zipSync({
      "Bonks/lead.wav": strToU8("lead-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-analyse-"));
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

      const dirRow = csv.split("\n").find((row) => row.startsWith("Bonks,"));
      expect(dirRow).toBe("Bonks,,,,false");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('tags a "Cymatics - SESSIONS - Drum Breaks" directory with sampleType "Drum Breaks" in the auto-config', async () => {
    const zipped = zipSync({
      "Cymatics - SESSIONS - Drum Breaks/break.wav": strToU8("break-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-analyse-"));
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

      const dirRow = csv
        .split("\n")
        .find((row) => row.startsWith("Cymatics - SESSIONS - Drum Breaks,"));
      expect(dirRow).toBe(
        "Cymatics - SESSIONS - Drum Breaks,,,Drum Breaks,false",
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
