import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";
import { makeMinimalWav } from "./support";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("--convert flag", () => {
  it("converts a WAV file from 24-bit 44.1 kHz to 16-bit 48 kHz and exports it successfully", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": makeMinimalWav(),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--convert", "-d", "sp404mk2", "--preserve-paths", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      const outStat = await stat(join(outputDir, "Drums/kick.wav"));
      expect(outStat.isFile()).toBe(true);

      const outHeader = await readFile(join(outputDir, "Drums/kick.wav"));
      expect(outHeader.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(outHeader.readUInt32LE(24)).toBe(48000); // sample rate
      expect(outHeader.readUInt16LE(34)).toBe(16);    // bits per sample
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exports non-audio files unchanged when --convert is passed", async () => {
    const zipped = zipSync({
      "Patches/preset.nki": strToU8("preset-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--convert", "-d", "sp404mk2", "--preserve-paths", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      expect(await readFile(join(outputDir, "Patches/preset.nki"), "utf8")).toBe("preset-data");

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("reports a conversion error to stdout and exits with code 0 when ffmpeg fails to convert an audio file", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("not-valid-audio"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--convert", "-d", "sp404mk2", "--preserve-paths", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("Could not convert");
      expect(result.stdout).toContain("kick.wav");

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("prints a converting debug message to stdout when --verbose is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": makeMinimalWav(),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--convert", "-d", "sp404mk2", "--verbose", "--preserve-paths", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stdout).toContain("Converting");
      expect(result.stdout).toContain("kick.wav");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("does not print a converting debug message to stdout without --verbose", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": makeMinimalWav(),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--convert", "-d", "sp404mk2", "--preserve-paths", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stdout).not.toContain("Converting");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exits with code 1 and prints an error when ffmpeg is not found", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": makeMinimalWav(),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(process.execPath, [CLI_PATH, zipPath, "--convert", "-d", "sp404mk2", "--preserve-paths", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data"), PATH: tmpDir },
      });

      expect(result.stderr).toContain("ffmpeg not found");
      expect(result.status).toBe(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("prints the ffmpeg version to stdout when --verbose is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": makeMinimalWav(),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--convert", "-d", "sp404mk2", "--verbose", "--preserve-paths", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stdout).toContain("Using ffmpeg: ffmpeg version");
      const autoConfigIdx = result.stdout.indexOf("Using auto-config:");
      const ffmpegIdx = result.stdout.indexOf("Using ffmpeg:");
      expect(autoConfigIdx).toBeGreaterThan(-1);
      expect(ffmpegIdx).toBeGreaterThan(autoConfigIdx);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
