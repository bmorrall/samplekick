import { execSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";
import { makeWav } from "./support";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("samplekick CLI --convert flag", () => {
  it("converts a 24-bit WAV to 16-bit in place when --convert is passed", async () => {
    const zipped = zipSync({ "Drums/kick.wav": makeWav(24) });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");
    try {
      await writeFile(zipPath, zipped);
      execSync(`node ${CLI_PATH} "${zipPath}" -o "${outputDir}" --convert`);
      const output = await readFile(join(outputDir, "Drums/kick.wav"));
      // WAV bitsPerSample field is at offset 34 (little-endian uint16)
      expect(output.readUInt16LE(34)).toBe(16);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("leaves a 16-bit WAV unchanged when --convert is passed", async () => {
    const zipped = zipSync({ "Drums/kick.wav": makeWav(16) });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");
    try {
      await writeFile(zipPath, zipped);
      execSync(`node ${CLI_PATH} "${zipPath}" -o "${outputDir}" --convert`);
      const output = await readFile(join(outputDir, "Drums/kick.wav"));
      expect(output.readUInt16LE(34)).toBe(16);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("copies a 24-bit WAV unchanged when --convert is not passed", async () => {
    const zipped = zipSync({ "Drums/kick.wav": makeWav(24) });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");
    try {
      await writeFile(zipPath, zipped);
      execSync(`node ${CLI_PATH} "${zipPath}" -o "${outputDir}"`);
      const output = await readFile(join(outputDir, "Drums/kick.wav"));
      expect(output.readUInt16LE(34)).toBe(24);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("copies non-WAV files unchanged when --convert is passed", async () => {
    const zipped = zipSync({ "Drums/beat.mp3": strToU8("fake-mp3-data") });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");
    try {
      await writeFile(zipPath, zipped);
      execSync(`node ${CLI_PATH} "${zipPath}" -o "${outputDir}" --convert`);
      expect(await readFile(join(outputDir, "Drums/beat.mp3"), "utf8")).toBe("fake-mp3-data");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
