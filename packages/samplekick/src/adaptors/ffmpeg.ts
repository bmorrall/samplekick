import { execFile } from "node:child_process";
import { promisify } from "node:util";

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

export const createFfmpegRunner = (): FfmpegRunner => async (args) => {
  await execFileAsync("ffmpeg", args);
};

const defaultVersionRunner: FfmpegVersionRunner = async () =>
  (await execFileWithOutputAsync("ffmpeg", ["-version"])).split("\n")[0].trim();

export const getFfmpegVersion = async (runner: FfmpegVersionRunner = defaultVersionRunner): Promise<string> =>
  await runner();
