import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";
const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("samplekick CLI", () => {
  it("writes registry config as CSV to a file when --write-config is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--write-config", configPath], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("path,name,packageName,sampleType,skip,keepPath");

      const fileContent = await readFile(configPath, "utf8");
      expect(fileContent).toContain("path,name,packageName,sampleType,skip,keepPath");
      expect(fileContent).toContain("Drums/kick.wav");
      expect(fileContent).toContain("Loops/bass.wav");

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("writes registry config to a file and exports samples when both --write-config and -o are passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--write-config", configPath, "--preserve-paths", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      const fileContent = await readFile(configPath, "utf8");
      expect(fileContent).toContain("path,name,packageName,sampleType,skip,keepPath");
      expect(fileContent).toContain("Drums/kick.wav");

      expect(await readFile(join(outputDir, "Drums/kick.wav"), "utf8")).toBe("kick-data");

      expect(result.stdout).toContain("Drums/kick.wav");
      expect(result.stdout).toContain(`Exported 1 file to ${outputDir}`);

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("applies config from a CSV file when --config is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });

    const config = [
      "path,name,packageName,sampleType,skip,keepPath",
      "Drums/kick.wav,My Kick.wav,,,,",
      "Loops/bass.wav,,,,true,",
    ].join("\n");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--config", configPath, "--preserve-paths", "-o", outputDir], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      expect(await readFile(join(outputDir, "Drums/My Kick.wav"), "utf8")).toBe("kick-data");
      await expect(stat(join(outputDir, "Drums/kick.wav"))).rejects.toThrow();
      await expect(stat(join(outputDir, "Loops/bass.wav"))).rejects.toThrow();

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("inherits skip from a folder row when exporting", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
      "Loops/synth.wav": strToU8("synth-data"),
    });

    const config = [
      "path,name,packageName,sampleType,skip,keepPath",
      "Loops,,,,true,",
    ].join("\n");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--config", configPath, "--preserve-paths", "-o", outputDir], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      expect(await readFile(join(outputDir, "Drums/kick.wav"), "utf8")).toBe("kick-data");
      await expect(stat(join(outputDir, "Loops/bass.wav"))).rejects.toThrow();
      await expect(stat(join(outputDir, "Loops/synth.wav"))).rejects.toThrow();

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("outputs CSV to stdout when --config is passed without --output", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
    });

    const config = [
      "path,name,packageName,sampleType,skip,keepPath",
      "Drums/kick.wav,,Percussion,,,",
    ].join("\n");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--config", configPath], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("Drums/kick.wav");
      expect(result.stdout).toContain("Percussion");

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
