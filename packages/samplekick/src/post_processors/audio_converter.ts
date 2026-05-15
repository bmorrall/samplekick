import { execFile } from "node:child_process";
import { rename, rm, unlink } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { promisify } from "node:util";
import type { DigestEntry, PostProcessor } from "samplekick-io";
import {
  AUDIO_EXTENSIONS,
  BIT_DEPTH_24,
  BIT_DEPTH_32,
  formatBitDepth,
  formatSampleRate,
} from "samplekick-io";
import type { FfmpegProbeRunner } from "../adaptors/ffmpeg";

const execFileAsync = promisify(
  (
    file: string,
    args: string[],
    callback: (err: Error | null) => void,
  ): void => {
    execFile(file, args, (err) => {
      callback(err);
    });
  },
);

const execFileWithOutputAsync = promisify(
  (
    file: string,
    args: string[],
    callback: (err: Error | null, stdout: string) => void,
  ): void => {
    execFile(file, args, { encoding: "utf8" }, (err, stdout) => {
      callback(err, stdout);
    });
  },
);

export type FfmpegRunner = (args: string[]) => Promise<void>;
export type FfmpegVersionRunner = () => Promise<string>;

const defaultRunner: FfmpegRunner = async (args) => {
  await execFileAsync("ffmpeg", args);
};

const defaultVersionRunner: FfmpegVersionRunner = async () =>
  (await execFileWithOutputAsync("ffmpeg", ["-version"])).split("\n")[0].trim();

export const getFfmpegVersion = async (
  runner: FfmpegVersionRunner = defaultVersionRunner,
): Promise<string> => await runner();

export interface AudioConverterOptions {
  targetBitDepth: number;
  targetSampleRate: number;
  onError: (destPath: string, error: Error) => void;
  onDebug?: (message: string) => void;
  normaliseLevel?: boolean;
}

export const parseMaxVolumedB = (stderr: string): number | null => {
  const match = /max_volume:\s*(?<peak>[+\-]?\d+(?:[.]\d+)?)\s*dB/v.exec(
    stderr,
  );
  if (match === null) return null;
  return parseFloat(match.groups?.peak ?? "");
};

export class AudioConverter implements PostProcessor {
  private readonly runFfmpeg: FfmpegRunner;
  private readonly runFfmpegProbe: FfmpegProbeRunner | undefined;
  private readonly onError: (destPath: string, error: Error) => void;
  private readonly onDebug: ((message: string) => void) | undefined;
  private readonly targetBitDepth: number;
  private readonly targetSampleRate: number;
  private readonly normaliseLevel: boolean;

  constructor(
    runFfmpeg: FfmpegRunner = defaultRunner,
    options: AudioConverterOptions,
    runFfmpegProbe?: FfmpegProbeRunner,
  ) {
    const {
      onDebug,
      onError,
      normaliseLevel,
      targetBitDepth,
      targetSampleRate,
    } = options;
    this.runFfmpeg = runFfmpeg;
    this.runFfmpegProbe = runFfmpegProbe;
    this.onError = onError;
    this.onDebug = onDebug;
    this.targetBitDepth = targetBitDepth;
    this.targetSampleRate = targetSampleRate;
    this.normaliseLevel = normaliseLevel === true;
  }

  private async probeGainArg(destPath: string): Promise<string | undefined> {
    if (!this.normaliseLevel || this.runFfmpegProbe === undefined) {
      return undefined;
    }
    this.onDebug?.(`Normalising ${basename(destPath)} (probing peak level)`);
    const stderr = await this.runFfmpegProbe([
      "-i",
      destPath,
      "-af",
      "volumedetect",
      "-f",
      "null",
      "-",
    ]);
    const maxVol = parseMaxVolumedB(stderr);
    if (maxVol !== null && maxVol < 0) {
      return `volume=${-maxVol}dB`;
    }
    return undefined;
  }

  async processFile(destPath: string, _entry: DigestEntry): Promise<void> {
    const ext = extname(destPath).toLowerCase();
    if (!AUDIO_EXTENSIONS.has(ext)) return;

    const dir = dirname(destPath);
    const base = basename(destPath, ext);
    const outputPath = join(dir, `${base}.wav`);
    const tempPath = `${destPath}.converting.wav`;

    const sampleFmt =
      this.targetBitDepth === BIT_DEPTH_24
        ? "s24"
        : this.targetBitDepth === BIT_DEPTH_32
          ? "s32"
          : "s16";

    const gainArg = await this.probeGainArg(destPath);

    this.onDebug?.(
      `Converting ${basename(destPath)} to ${formatBitDepth(this.targetBitDepth)} ${formatSampleRate(this.targetSampleRate)} WAV`,
    );
    try {
      const conversionArgs: string[] = ["-i", destPath];
      if (gainArg !== undefined) {
        conversionArgs.push("-af", gainArg);
      }
      conversionArgs.push(
        "-ar",
        String(this.targetSampleRate),
        "-sample_fmt",
        sampleFmt,
        "-y",
        tempPath,
      );
      await this.runFfmpeg(conversionArgs);
      await rename(tempPath, outputPath);
      if (outputPath !== destPath) {
        await unlink(destPath);
      }
    } catch (err) {
      await rm(tempPath, { force: true });
      this.onError(
        destPath,
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  }
}
