import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

/** Minimal valid PCM WAV: mono, 24-bit, 44100 Hz, 1 sample of silence */
const makeMinimalWav = (): Uint8Array => {
  const buf = Buffer.alloc(47);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(39, 4);
  buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);      // PCM
  buf.writeUInt16LE(1, 22);      // mono
  buf.writeUInt32LE(44100, 24);  // sample rate
  buf.writeUInt32LE(132300, 28); // byte rate (44100 * 3)
  buf.writeUInt16LE(3, 32);      // block align (1 ch * 24-bit / 8)
  buf.writeUInt16LE(24, 34);     // bits per sample
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(3, 40);      // data size (1 sample * 3 bytes)
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
};

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

      const result = spawnSync("node", [CLI_PATH, zipPath, "--convert", "-o", outputDir], {
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

      const result = spawnSync("node", [CLI_PATH, zipPath, "--convert", "-o", outputDir], {
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

  it("reports a warning to stderr and exits with code 0 when ffmpeg fails to convert an audio file", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("not-valid-audio"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--convert", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toContain("Warning: could not convert");
      expect(result.stderr).toContain("kick.wav");

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

      const result = spawnSync("node", [CLI_PATH, zipPath, "--convert", "--verbose", "-o", outputDir], {
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

      const result = spawnSync("node", [CLI_PATH, zipPath, "--convert", "-o", outputDir], {
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

      const result = spawnSync(process.execPath, [CLI_PATH, zipPath, "--convert", "-o", outputDir], {
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

      const result = spawnSync("node", [CLI_PATH, zipPath, "--convert", "--verbose", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stdout).toContain("Using ffmpeg: ffmpeg version");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
