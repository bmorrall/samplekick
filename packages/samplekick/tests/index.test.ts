import { execSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { beforeAll, describe, expect, it } from "vitest";
const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("samplekick CLI", () => {
  beforeAll(() => {
    execSync("pnpm build", {
      cwd: resolve(import.meta.dirname, ".."),
    });
  });

  describe("argument validation", () => {
    it("prints help and exits with code 0 when no arguments are supplied", () => {
      const result = spawnSync("node", [CLI_PATH], { encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Usage:");
    });

    it("exits with code 1 and prints an error when the zip-file argument is missing", () => {
      const result = spawnSync("node", [CLI_PATH, "-o", "/tmp/out"], { encoding: "utf8" });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("<zip-file>");
    });

    it("prints help and exits with code 0 when --help is passed", () => {
      const result = spawnSync("node", [CLI_PATH, "--help"], { encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Usage:");
    });

    it("prints help and exits with code 0 when -h is passed", () => {
      const result = spawnSync("node", [CLI_PATH, "-h"], { encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Usage:");
    });
  });

  it("prints registry tree to stdout and exits with code 0 when --debug is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--debug"], { encoding: "utf8" });
      expect(result.status).toBe(0);

      const expected = [
        "test-pack.zip",
        "├── Drums",
        "│   └── kick.wav",
        "└── Loops",
        "    └── bass.wav",
      ].join("\n");
      expect(result.stdout.trim()).toBe(expected);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("dumps registry config as JSON to stdout when --output is omitted", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
      ".DS_Store": strToU8("junk"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath], { encoding: "utf8" });
      expect(result.status).toBe(0);

      const parsed: unknown = JSON.parse(result.stdout);
      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(4);
      expect(parsed).toContainEqual(expect.objectContaining({ path: "Drums/kick.wav" }));
      expect(parsed).toContainEqual(expect.objectContaining({ path: "Loops/bass.wav" }));
      expect(parsed).toContainEqual(expect.objectContaining({ path: ".DS_Store", isSkipped: true }));
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("processes a zip file and outputs files to the target directory", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Drums/snare.wav": strToU8("snare-data"),
      "Loops/bass.wav": strToU8("bass-data"),
      "__MACOSX/Drums/._kick.wav": strToU8("junk"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      execSync(`node ${CLI_PATH} "${zipPath}" -o "${outputDir}"`);

      expect(await readFile(join(outputDir, "Drums/kick.wav"), "utf8")).toBe("kick-data");
      expect(await readFile(join(outputDir, "Drums/snare.wav"), "utf8")).toBe("snare-data");
      expect(await readFile(join(outputDir, "Loops/bass.wav"), "utf8")).toBe("bass-data");
      await expect(stat(join(outputDir, "__MACOSX/Drums/._kick.wav"))).rejects.toThrow();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("outputs junk entries when --allow-junk is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "__MACOSX/Drums/._kick.wav": strToU8("junk"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      execSync(`node ${CLI_PATH} "${zipPath}" --allow-junk -o "${outputDir}"`);

      expect(await readFile(join(outputDir, "Drums/kick.wav"), "utf8")).toBe("kick-data");
      expect(await readFile(join(outputDir, "__MACOSX/Drums/._kick.wav"), "utf8")).toBe("junk");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
