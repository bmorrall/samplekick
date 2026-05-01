import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CONVERTIBLE_EXTENSIONS, convertToSixteenBit } from "../src/audio_converter";
import { makeWav } from "./support";

describe("CONVERTIBLE_EXTENSIONS", () => {
  it("includes .wav, .aif, and .aiff", () => {
    expect(CONVERTIBLE_EXTENSIONS.has(".wav")).toBe(true);
    expect(CONVERTIBLE_EXTENSIONS.has(".aif")).toBe(true);
    expect(CONVERTIBLE_EXTENSIONS.has(".aiff")).toBe(true);
  });

  it("does not include .mp3", () => {
    expect(CONVERTIBLE_EXTENSIONS.has(".mp3")).toBe(false);
  });
});

describe("convertToSixteenBit", () => {
  it("converts a 24-bit WAV to 16-bit PCM in place", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-test-"));
    const filePath = join(tmpDir, "kick.wav");
    try {
      await writeFile(filePath, makeWav(24));
      await convertToSixteenBit(filePath);
      const output = await readFile(filePath);
      // WAV bitsPerSample field is at offset 34 (little-endian uint16)
      expect(output.readUInt16LE(34)).toBe(16);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("leaves no temporary file after a successful conversion", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-test-"));
    const filePath = join(tmpDir, "kick.wav");
    try {
      await writeFile(filePath, makeWav(24));
      await convertToSixteenBit(filePath);
      await expect(stat(join(tmpDir, "kick.tmp.wav"))).rejects.toThrow();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("throws and leaves no temporary file when the file cannot be processed", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-test-"));
    const filePath = join(tmpDir, "kick.wav");
    try {
      await writeFile(filePath, "not-valid-audio-data");
      await expect(convertToSixteenBit(filePath)).rejects.toThrow();
      await expect(stat(join(tmpDir, "kick.tmp.wav"))).rejects.toThrow();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
