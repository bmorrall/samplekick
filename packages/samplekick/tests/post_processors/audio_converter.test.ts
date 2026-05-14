import { rename, rm, unlink } from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DigestEntry } from "samplekick-io";
import {
  BIT_DEPTH_16,
  BIT_DEPTH_24,
  BIT_DEPTH_32,
  SAMPLE_RATE_44100,
  SAMPLE_RATE_48000,
  SAMPLE_RATE_96000,
} from "samplekick-io";
import {
  AudioConverter,
  parseMaxVolumedB,
} from "../../src/post_processors/audio_converter";
import type { AudioConverterOptions } from "../../src/post_processors/audio_converter";
import type { FfmpegRunner } from "../../src/adaptors/ffmpeg";

vi.mock("node:fs/promises", () => ({
  rename: vi.fn().mockResolvedValue(undefined),
  rm: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
}));

const createEntry = (path = "drums/kick.wav"): DigestEntry => ({
  getPath: () => path,
  getName: () => path.split("/").pop() ?? path,
  getPackageName: () => undefined,
  getSampleType: () => undefined,
  isSkipped: () => undefined,
  isKeepStructure: () => undefined,
});

const buildConverter = (
  runFfmpeg: FfmpegRunner,
  overrides: Partial<AudioConverterOptions> = {},
): AudioConverter =>
  new AudioConverter(runFfmpeg, {
    targetBitDepth: BIT_DEPTH_16,
    targetSampleRate: SAMPLE_RATE_48000,
    onError: vi.fn<(destPath: string, error: Error) => void>(),
    ...overrides,
  });

describe("AudioConverter", () => {
  const mockRename = vi.mocked(rename);
  const mockRm = vi.mocked(rm);
  const mockUnlink = vi.mocked(unlink);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("WAV files", () => {
    it("runs ffmpeg with 16-bit 48kHz conversion settings", async () => {
      const runFfmpeg = vi.fn().mockResolvedValue(undefined);
      const converter = buildConverter(runFfmpeg);

      await converter.processFile("/output/drums/kick.wav", createEntry());

      expect(runFfmpeg).toHaveBeenCalledWith([
        "-i",
        "/output/drums/kick.wav",
        "-ar",
        "48000",
        "-sample_fmt",
        "s16",
        "-y",
        "/output/drums/kick.wav.converting.wav",
      ]);
    });

    it("runs ffmpeg with 24-bit 44.1kHz conversion settings", async () => {
      const runFfmpeg = vi.fn().mockResolvedValue(undefined);
      const converter = buildConverter(runFfmpeg, {
        targetBitDepth: BIT_DEPTH_24,
        targetSampleRate: SAMPLE_RATE_44100,
      });

      await converter.processFile("/output/drums/kick.wav", createEntry());

      expect(runFfmpeg).toHaveBeenCalledWith([
        "-i",
        "/output/drums/kick.wav",
        "-ar",
        "44100",
        "-sample_fmt",
        "s24",
        "-y",
        "/output/drums/kick.wav.converting.wav",
      ]);
    });

    it("runs ffmpeg with 32-bit 96kHz conversion settings", async () => {
      const runFfmpeg = vi.fn().mockResolvedValue(undefined);
      const converter = buildConverter(runFfmpeg, {
        targetBitDepth: BIT_DEPTH_32,
        targetSampleRate: SAMPLE_RATE_96000,
      });

      await converter.processFile("/output/drums/kick.wav", createEntry());

      expect(runFfmpeg).toHaveBeenCalledWith([
        "-i",
        "/output/drums/kick.wav",
        "-ar",
        "96000",
        "-sample_fmt",
        "s32",
        "-y",
        "/output/drums/kick.wav.converting.wav",
      ]);
    });

    it("renames the temp file to the original path", async () => {
      const runFfmpeg = vi.fn().mockResolvedValue(undefined);
      const converter = buildConverter(runFfmpeg);

      await converter.processFile("/output/drums/kick.wav", createEntry());

      expect(mockRename).toHaveBeenCalledWith(
        "/output/drums/kick.wav.converting.wav",
        "/output/drums/kick.wav",
      );
    });

    it("does not unlink the original when the extension is already .wav", async () => {
      const runFfmpeg = vi.fn().mockResolvedValue(undefined);
      const converter = buildConverter(runFfmpeg);

      await converter.processFile("/output/drums/kick.wav", createEntry());

      expect(mockUnlink).not.toHaveBeenCalled();
    });
  });

  describe("MP3 files", () => {
    it("converts to WAV and removes the original .mp3", async () => {
      const runFfmpeg = vi.fn().mockResolvedValue(undefined);
      const converter = buildConverter(runFfmpeg);

      await converter.processFile(
        "/output/drums/kick.mp3",
        createEntry("drums/kick.mp3"),
      );

      expect(runFfmpeg).toHaveBeenCalledWith([
        "-i",
        "/output/drums/kick.mp3",
        "-ar",
        "48000",
        "-sample_fmt",
        "s16",
        "-y",
        "/output/drums/kick.mp3.converting.wav",
      ]);
      expect(mockRename).toHaveBeenCalledWith(
        "/output/drums/kick.mp3.converting.wav",
        "/output/drums/kick.wav",
      );
      expect(mockUnlink).toHaveBeenCalledWith("/output/drums/kick.mp3");
    });
  });

  describe("AIFF files", () => {
    it("converts .aiff to WAV and removes the original", async () => {
      const runFfmpeg = vi.fn().mockResolvedValue(undefined);
      const converter = buildConverter(runFfmpeg);

      await converter.processFile(
        "/output/drums/kick.aiff",
        createEntry("drums/kick.aiff"),
      );

      expect(mockRename).toHaveBeenCalledWith(
        "/output/drums/kick.aiff.converting.wav",
        "/output/drums/kick.wav",
      );
      expect(mockUnlink).toHaveBeenCalledWith("/output/drums/kick.aiff");
    });

    it("converts .aif to WAV and removes the original", async () => {
      const runFfmpeg = vi.fn().mockResolvedValue(undefined);
      const converter = buildConverter(runFfmpeg);

      await converter.processFile(
        "/output/drums/kick.aif",
        createEntry("drums/kick.aif"),
      );

      expect(mockRename).toHaveBeenCalledWith(
        "/output/drums/kick.aif.converting.wav",
        "/output/drums/kick.wav",
      );
      expect(mockUnlink).toHaveBeenCalledWith("/output/drums/kick.aif");
    });
  });

  describe("non-audio files", () => {
    it("skips .nki files without calling ffmpeg", async () => {
      const runFfmpeg = vi.fn();
      const converter = buildConverter(runFfmpeg);

      await converter.processFile(
        "/output/patches/preset.nki",
        createEntry("patches/preset.nki"),
      );

      expect(runFfmpeg).not.toHaveBeenCalled();
      expect(mockRename).not.toHaveBeenCalled();
    });

    it("skips .txt files without calling ffmpeg", async () => {
      const runFfmpeg = vi.fn();
      const converter = buildConverter(runFfmpeg);

      await converter.processFile(
        "/output/README.txt",
        createEntry("README.txt"),
      );

      expect(runFfmpeg).not.toHaveBeenCalled();
    });
  });

  describe("onDebug", () => {
    it("calls onDebug with 'Converting <filename> to 16-bit 48 kHz WAV'", async () => {
      const runFfmpeg = vi.fn().mockResolvedValue(undefined);
      const onDebug = vi.fn<(message: string) => void>();
      const converter = buildConverter(runFfmpeg, { onDebug });

      await converter.processFile("/output/drums/kick.wav", createEntry());

      expect(onDebug).toHaveBeenCalledWith(
        "Converting kick.wav to 16-bit 48 kHz WAV",
      );
    });

    it("does not call onDebug for non-audio files", async () => {
      const runFfmpeg = vi.fn();
      const onDebug = vi.fn<(message: string) => void>();
      const converter = buildConverter(runFfmpeg, { onDebug });

      await converter.processFile(
        "/output/patches/preset.nki",
        createEntry("patches/preset.nki"),
      );

      expect(onDebug).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("cleans up the temp file when ffmpeg fails", async () => {
      const runFfmpeg = vi
        .fn()
        .mockRejectedValue(new Error("ffmpeg not found"));
      const converter = buildConverter(runFfmpeg, {
        onError: vi.fn<(destPath: string, error: Error) => void>(),
      });

      await converter.processFile("/output/drums/kick.wav", createEntry());

      expect(mockRm).toHaveBeenCalledWith(
        "/output/drums/kick.wav.converting.wav",
        { force: true },
      );
    });

    it("calls onError with the destPath and error when ffmpeg fails", async () => {
      const runFfmpeg = vi.fn().mockRejectedValue(new Error("exit code 1"));
      const onError = vi.fn<(destPath: string, error: Error) => void>();
      const converter = buildConverter(runFfmpeg, { onError });

      await converter.processFile("/output/drums/kick.wav", createEntry());

      expect(onError).toHaveBeenCalledWith(
        "/output/drums/kick.wav",
        expect.any(Error),
      );
    });

    it("does not throw when ffmpeg fails", async () => {
      const runFfmpeg = vi.fn().mockRejectedValue(new Error("exit code 1"));
      const converter = buildConverter(runFfmpeg, {
        onError: vi.fn<(destPath: string, error: Error) => void>(),
      });

      await expect(
        converter.processFile("/output/drums/kick.wav", createEntry()),
      ).resolves.toBeUndefined();
    });
  });

  describe("normaliseLevel", () => {
    const PROBE_STDERR_M3_5 =
      "[Parsed_volumedetect_0 @ 0x...] mean_volume: -10.0 dB\n[Parsed_volumedetect_0 @ 0x...] max_volume: -3.5 dB\n";
    const PROBE_STDERR_0 =
      "[Parsed_volumedetect_0 @ 0x...] max_volume: 0.0 dB\n";

    it("runs the probe with volumedetect args before converting", async () => {
      const runFfmpeg = vi.fn().mockResolvedValue(undefined);
      const runFfmpegProbe = vi.fn().mockResolvedValue(PROBE_STDERR_M3_5);
      const converter = new AudioConverter(
        runFfmpeg,
        {
          targetBitDepth: BIT_DEPTH_16,
          targetSampleRate: SAMPLE_RATE_48000,
          onError: vi.fn<(destPath: string, error: Error) => void>(),
          normaliseLevel: true,
        },
        runFfmpegProbe,
      );

      await converter.processFile("/output/drums/kick.wav", createEntry());

      expect(runFfmpegProbe).toHaveBeenCalledWith([
        "-i",
        "/output/drums/kick.wav",
        "-af",
        "volumedetect",
        "-f",
        "null",
        "-",
      ]);
    });

    it("adds a volume filter to ffmpeg args when peak is below 0 dB", async () => {
      const runFfmpeg = vi.fn().mockResolvedValue(undefined);
      const runFfmpegProbe = vi.fn().mockResolvedValue(PROBE_STDERR_M3_5);
      const converter = new AudioConverter(
        runFfmpeg,
        {
          targetBitDepth: BIT_DEPTH_16,
          targetSampleRate: SAMPLE_RATE_48000,
          onError: vi.fn<(destPath: string, error: Error) => void>(),
          normaliseLevel: true,
        },
        runFfmpegProbe,
      );

      await converter.processFile("/output/drums/kick.wav", createEntry());

      expect(runFfmpeg).toHaveBeenCalledWith([
        "-i",
        "/output/drums/kick.wav",
        "-af",
        "volume=3.5dB",
        "-ar",
        "48000",
        "-sample_fmt",
        "s16",
        "-y",
        "/output/drums/kick.wav.converting.wav",
      ]);
    });

    it("skips the volume filter when max_volume is already 0.0 dB", async () => {
      const runFfmpeg = vi.fn().mockResolvedValue(undefined);
      const runFfmpegProbe = vi.fn().mockResolvedValue(PROBE_STDERR_0);
      const converter = new AudioConverter(
        runFfmpeg,
        {
          targetBitDepth: BIT_DEPTH_16,
          targetSampleRate: SAMPLE_RATE_48000,
          onError: vi.fn<(destPath: string, error: Error) => void>(),
          normaliseLevel: true,
        },
        runFfmpegProbe,
      );

      await converter.processFile("/output/drums/kick.wav", createEntry());

      expect(runFfmpeg).not.toHaveBeenCalledWith(
        expect.arrayContaining(["-af"]),
      );
    });

    it("proceeds without gain when probe output cannot be parsed", async () => {
      const runFfmpeg = vi.fn().mockResolvedValue(undefined);
      const runFfmpegProbe = vi.fn().mockResolvedValue("unrecognised output");
      const converter = new AudioConverter(
        runFfmpeg,
        {
          targetBitDepth: BIT_DEPTH_16,
          targetSampleRate: SAMPLE_RATE_48000,
          onError: vi.fn<(destPath: string, error: Error) => void>(),
          normaliseLevel: true,
        },
        runFfmpegProbe,
      );

      await converter.processFile("/output/drums/kick.wav", createEntry());

      expect(runFfmpeg).not.toHaveBeenCalledWith(
        expect.arrayContaining(["-af"]),
      );
      expect(runFfmpeg).toHaveBeenCalledOnce();
    });

    it("does not run probe when normaliseLevel is not set", async () => {
      const runFfmpeg = vi.fn().mockResolvedValue(undefined);
      const runFfmpegProbe = vi.fn();
      const converter = new AudioConverter(
        runFfmpeg,
        {
          targetBitDepth: BIT_DEPTH_16,
          targetSampleRate: SAMPLE_RATE_48000,
          onError: vi.fn<(destPath: string, error: Error) => void>(),
        },
        runFfmpegProbe,
      );

      await converter.processFile("/output/drums/kick.wav", createEntry());

      expect(runFfmpegProbe).not.toHaveBeenCalled();
    });
  });

  describe("parseMaxVolumedB", () => {
    it("extracts a negative dB value", () => {
      expect(parseMaxVolumedB("max_volume: -3.5 dB\n")).toBe(-3.5);
    });

    it("extracts 0.0 dB", () => {
      expect(parseMaxVolumedB("max_volume: 0.0 dB\n")).toBe(0);
    });

    it("returns null when max_volume line is absent", () => {
      expect(parseMaxVolumedB("some other output")).toBeNull();
    });
  });
});
