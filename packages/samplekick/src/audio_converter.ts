import { rename, rm } from "node:fs/promises";
import { basename, dirname, extname } from "node:path";
import { execa } from "execa";
import { ffmpegPath, isFfmpegAvailable } from "node-av/ffmpeg";

// Formats the SP-404 supports that have a meaningful bit depth
export const CONVERTIBLE_EXTENSIONS = new Set([".wav", ".aif", ".aiff"]);

const codecFor = (ext: string): string => {
  if (ext === ".aif" || ext === ".aiff") return "pcm_s16be";
  return "pcm_s16le"; // .wav
};

export const convertToSixteenBit = async (filePath: string): Promise<void> => {
  if (!isFfmpegAvailable()) {
    throw new Error("ffmpeg binary not available");
  }

  const ext = extname(filePath).toLowerCase();
  const codec = codecFor(ext);
  const tmpPath = `${dirname(filePath)}/${basename(filePath, ext)}.tmp${ext}`;

  const args = [
    "-i", filePath,
    "-acodec", codec,
    "-map_metadata", "0",
    "-y",
    tmpPath,
  ];

  try {
    await execa(ffmpegPath(), args);
    await rename(tmpPath, filePath);
  } catch (err) {
    await rm(tmpPath, { force: true });
    throw err;
  }
};
