import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

/**
 * 24-bit mono 44100 Hz PCM WAV with 1000 samples at half amplitude (≈ -6 dB).
 * Enough data for ffmpeg's resampler to produce output when upsampling to 48 kHz,
 * so that volumedetect reports a meaningful peak after conversion.
 */
const makeHalfAmplitudeWav = (): Uint8Array => {
  const SAMPLE_COUNT = 1000;
  const DATA_SIZE = SAMPLE_COUNT * 3; // 24-bit = 3 bytes per sample
  const buf = Buffer.alloc(44 + DATA_SIZE, 0);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + DATA_SIZE, 4);
  buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(44100, 24); // sample rate
  buf.writeUInt32LE(44100 * 3, 28); // byte rate
  buf.writeUInt16LE(3, 32); // block align
  buf.writeUInt16LE(24, 34); // bits per sample
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(DATA_SIZE, 40);
  // All samples at 0x400000 (half of 24-bit max ≈ -6 dBFS)
  for (let i = 0; i < SAMPLE_COUNT; i += 1) {
    buf[44 + i * 3 + 2] = 0x40; // MSB; lower two bytes stay 0x00
  }
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
};

describe("--normalise-level flag", () => {
  it("normalises a WAV file to 0 dBFS peak on export", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": makeHalfAmplitudeWav(),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-normalise-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [
          CLI_PATH,
          zipPath,
          "--convert",
          "-d",
          "sp404mk2",
          "--normalise-level",
          "--preserve-paths",
          "-o",
          outputDir,
        ],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
        },
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      // Verify the output is a valid WAV
      const outHeader = await readFile(join(outputDir, "Drums/kick.wav"));
      expect(outHeader.subarray(0, 4).toString("ascii")).toBe("RIFF");

      // Probe the peak level via ffmpeg volumedetect
      const probe = spawnSync(
        "ffmpeg",
        [
          "-i",
          join(outputDir, "Drums/kick.wav"),
          "-af",
          "volumedetect",
          "-f",
          "null",
          "-",
        ],
        { encoding: "utf8" },
      );
      const match = /max_volume:\s*(?<peak>[+\-]?\d+(?:[.]\d+)?)\s*dB/v.exec(
        probe.stderr,
      );
      expect(match?.groups?.peak).toBeDefined();
      const maxVol = parseFloat(match?.groups?.peak ?? "NaN");
      // Allow a small tolerance for integer rounding at 16-bit
      expect(maxVol).toBeGreaterThanOrEqual(-1.0);
      expect(maxVol).toBeLessThanOrEqual(0.0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exits with code 1 and prints an error when --normalise-level is used without --convert", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": makeHalfAmplitudeWav(),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-normalise-"));
    const zipPath = join(tmpDir, "test-pack.zip");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--normalise-level", "-d", "sp404mk2"],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
        },
      );

      expect(result.stderr).toContain("--normalise-level requires --convert");
      expect(result.status).toBe(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("prints a normalising debug message when --verbose is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": makeHalfAmplitudeWav(),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-normalise-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [
          CLI_PATH,
          zipPath,
          "--convert",
          "-d",
          "sp404mk2",
          "--normalise-level",
          "--verbose",
          "--preserve-paths",
          "-o",
          outputDir,
        ],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
        },
      );

      expect(result.stdout).toContain("Normalising");
      expect(result.stdout).toContain("kick.wav");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
