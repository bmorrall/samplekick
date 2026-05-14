import { execFile } from "node:child_process";
import { promisify } from "node:util";

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

const execFileWithStderrAsync = promisify(
  (
    file: string,
    args: string[],
    callback: (err: Error | null, stderr: string) => void,
  ): void => {
    // volumedetect uses a null muxer and may exit non-zero; always resolve
    execFile(file, args, { encoding: "utf8" }, (_err, _stdout, stderr) => {
      callback(null, stderr);
    });
  },
);

export type FfmpegRunner = (args: string[]) => Promise<void>;
export type FfmpegProbeRunner = (args: string[]) => Promise<string>;
export type FfmpegVersionRunner = () => Promise<string>;

export const createFfmpegRunner = (): FfmpegRunner => async (args) => {
  await execFileAsync("ffmpeg", args);
};

export const createFfmpegProbeRunner = (): FfmpegProbeRunner => async (args) =>
  await execFileWithStderrAsync("ffmpeg", args);

const defaultVersionRunner: FfmpegVersionRunner = async () =>
  (await execFileWithOutputAsync("ffmpeg", ["-version"])).split("\n")[0].trim();

export const getFfmpegVersion = async (
  runner: FfmpegVersionRunner = defaultVersionRunner,
): Promise<string> => await runner();
