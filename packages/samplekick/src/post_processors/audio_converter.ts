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

export type FfmpegRunner = (args: string[]) => Promise<void>;

const defaultRunner: FfmpegRunner = async (args) => {
  await execFileAsync("ffmpeg", args);
};

const AUDIO_EXTENSIONS = new Set([".wav", ".aiff", ".aif", ".mp3"]);

export class AudioConverter implements PostProcessor {
  private readonly runFfmpeg: FfmpegRunner;

  constructor(runFfmpeg: FfmpegRunner = defaultRunner) {
    this.runFfmpeg = runFfmpeg;
  }

  async processFile(destPath: string, _entry: ConfigEntry): Promise<void> {
    const ext = extname(destPath).toLowerCase();
    if (!AUDIO_EXTENSIONS.has(ext)) return;

    const dir = dirname(destPath);
    const base = basename(destPath, ext);
    const outputPath = join(dir, `${base}.wav`);
    const tempPath = `${destPath}.converting.wav`;

    try {
      await this.runFfmpeg(["-i", destPath, "-ar", "48000", "-sample_fmt", "s16", "-y", tempPath]);
      await rename(tempPath, outputPath);
      if (outputPath !== destPath) {
        await unlink(destPath);
      }
    } catch (err) {
      await rm(tempPath, { force: true });
      throw err;
    }
  }
}
