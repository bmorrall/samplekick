import { describe, expect, it } from "vitest";
import {
  AUDIO_EXTENSIONS,
  BIT_DEPTH_16,
  BIT_DEPTH_24,
  BIT_DEPTH_32,
  SAMPLE_RATE_44100,
  SAMPLE_RATE_48000,
  SAMPLE_RATE_96000,
  formatBitDepth,
  formatSampleRate,
} from "../../src/audio_format";

describe("audio_format", () => {
  it("exposes expected constants", () => {
    expect(BIT_DEPTH_16).toBe(16);
    expect(BIT_DEPTH_24).toBe(24);
    expect(BIT_DEPTH_32).toBe(32);
    expect(SAMPLE_RATE_44100).toBe(44100);
    expect(SAMPLE_RATE_48000).toBe(48000);
    expect(SAMPLE_RATE_96000).toBe(96000);
  });

  it("contains expected audio extensions", () => {
    expect(AUDIO_EXTENSIONS.has(".wav")).toBe(true);
    expect(AUDIO_EXTENSIONS.has(".aiff")).toBe(true);
    expect(AUDIO_EXTENSIONS.has(".aif")).toBe(true);
    expect(AUDIO_EXTENSIONS.has(".mp3")).toBe(true);
    expect(AUDIO_EXTENSIONS.has(".flac")).toBe(false);
  });

  it("formats sample rates as kHz", () => {
    expect(formatSampleRate(SAMPLE_RATE_44100)).toBe("44.1 kHz");
    expect(formatSampleRate(SAMPLE_RATE_48000)).toBe("48 kHz");
    expect(formatSampleRate(SAMPLE_RATE_96000)).toBe("96 kHz");
  });

  it("formats bit depth values", () => {
    expect(formatBitDepth(BIT_DEPTH_16)).toBe("16-bit");
    expect(formatBitDepth(BIT_DEPTH_24)).toBe("24-bit");
    expect(formatBitDepth(BIT_DEPTH_32)).toBe("32-bit");
  });
});
