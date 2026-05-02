import { execFile } from "node:child_process";
import { rename, rm, unlink } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { promisify } from "node:util";
import type { ConfigEntry, PostProcessor } from "samplekick-io";

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
  process.stderr.write(`Warning: could not convert ${destPath}: ${error.message}\n`);
};

const AUDIO_EXTENSIONS = new Set([".wav", ".aiff", ".aif", ".mp3"]);

export class AudioConverter implements PostProcessor {
  private readonly runFfmpeg: FfmpegRunner;
  private readonly onError: ConvertErrorHandler;
  private readonly onDebug: ((message: string) => void) | undefined;

  constructor(
    runFfmpeg: FfmpegRunner = defaultRunner,
    onError: ConvertErrorHandler = defaultErrorHandler,
    onDebug?: (message: string) => void,
  ) {
    this.runFfmpeg = runFfmpeg;
    this.onError = onError;
    this.onDebug = onDebug;
  }

  async processFile(destPath: string, _entry: ConfigEntry): Promise<void> {
    const ext = extname(destPath).toLowerCase();
    if (!AUDIO_EXTENSIONS.has(ext)) return;

    const dir = dirname(destPath);
    const base = basename(destPath, ext);
    const outputPath = join(dir, `${base}.wav`);
    const tempPath = `${destPath}.converting.wav`;

    this.onDebug?.(`Converting ${basename(destPath)} to 16-bit 48 kHz WAV`);
    try {
      await this.runFfmpeg(["-i", destPath, "-ar", "48000", "-sample_fmt", "s16", "-y", tempPath]);
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
