import { execFile } from "node:child_process";
import { rename, rm, unlink } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { promisify } from "node:util";
import type { ConfigEntry, PostProcessor } from "samplekick-io";
import { BIT_DEPTH_24, BIT_DEPTH_32, formatBitDepth, formatSampleRate } from "samplekick-io";

const execFileAsync = promisify((
  file: string,
  args: string[],
  callback: (err: Error | null) => void,
): void => {
  execFile(file, args, (err) => { callback(err); });
});

const execFileWithOutputAsync = promisify((
  file: string,
  args: string[],
  callback: (err: Error | null, stdout: string) => void,
): void => {
  execFile(file, args, { encoding: "utf8" }, (err, stdout) => { callback(err, stdout); });
});

export type FfmpegRunner = (args: string[]) => Promise<void>;
export type FfmpegVersionRunner = () => Promise<string>;
export type ConvertErrorHandler = (destPath: string, error: Error) => void;

const defaultRunner: FfmpegRunner = async (args) => {
  await execFileAsync("ffmpeg", args);
};

const defaultVersionRunner: FfmpegVersionRunner = async () =>
  (await execFileWithOutputAsync("ffmpeg", ["-version"])).split("\n")[0].trim();

export const getFfmpegVersion = async (runner: FfmpegVersionRunner = defaultVersionRunner): Promise<string> =>
  await runner();

const defaultErrorHandler: ConvertErrorHandler = (destPath, error) => {
  console.warn(`Warning: could not convert ${destPath}: ${error.message}`);
};

const AUDIO_EXTENSIONS = new Set([".wav", ".aiff", ".aif", ".mp3"]);

export interface AudioConverterOptions {
  targetBitDepth: number;
  targetSampleRate: number;
  onDebug?: (message: string) => void;
}

export class AudioConverter implements PostProcessor {
  private readonly runFfmpeg: FfmpegRunner;
  private readonly onError: ConvertErrorHandler;
  private readonly onDebug: ((message: string) => void) | undefined;
  private readonly targetBitDepth: number;
  private readonly targetSampleRate: number;

  constructor(
    runFfmpeg: FfmpegRunner = defaultRunner,
    onError: ConvertErrorHandler = defaultErrorHandler,
    options: AudioConverterOptions,
  ) {
    const { onDebug, targetBitDepth, targetSampleRate } = options;
    this.runFfmpeg = runFfmpeg;
    this.onError = onError;
    this.onDebug = onDebug;
    this.targetBitDepth = targetBitDepth;
    this.targetSampleRate = targetSampleRate;
  }

  async processFile(destPath: string, _entry: ConfigEntry): Promise<void> {
    const ext = extname(destPath).toLowerCase();
    if (!AUDIO_EXTENSIONS.has(ext)) return;

    const dir = dirname(destPath);
    const base = basename(destPath, ext);
    const outputPath = join(dir, `${base}.wav`);
    const tempPath = `${destPath}.converting.wav`;

    const sampleFmt = this.targetBitDepth === BIT_DEPTH_24 ? "s24" : this.targetBitDepth === BIT_DEPTH_32 ? "s32" : "s16";
    this.onDebug?.(`Converting ${basename(destPath)} to ${formatBitDepth(this.targetBitDepth)} ${formatSampleRate(this.targetSampleRate)} WAV`);
    try {
      await this.runFfmpeg(["-i", destPath, "-ar", String(this.targetSampleRate), "-sample_fmt", sampleFmt, "-y", tempPath]);
      await rename(tempPath, outputPath);
      if (outputPath !== destPath) {
        await unlink(destPath);
      }
    } catch (err) {
      await rm(tempPath, { force: true });
      this.onError(destPath, err instanceof Error ? err : new Error(String(err)));
    }
  }
}
