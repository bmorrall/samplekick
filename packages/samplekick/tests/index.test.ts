import { execSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ZipArchive } from "@shortercode/webzip";
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

  it("dumps registry config as JSON to stdout when --output is omitted", async () => {
    const archive = new ZipArchive();
    await archive.set("Drums/kick.wav", "kick-data");
    await archive.set("Loops/bass.wav", "bass-data");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");

    try {
      const buffer = Buffer.from(await archive.to_blob().arrayBuffer());
      await writeFile(zipPath, buffer);

      const result = spawnSync("node", [CLI_PATH, zipPath], { encoding: "utf8" });
      expect(result.status).toBe(0);

      const parsed: unknown = JSON.parse(result.stdout);
      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(3);
      expect(parsed).toContainEqual(expect.objectContaining({ path: "Drums/kick.wav" }));
      expect(parsed).toContainEqual(expect.objectContaining({ path: "Loops/bass.wav" }));
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("processes a zip file and outputs files to the target directory", async () => {
    const archive = new ZipArchive();
    await archive.set("Drums/kick.wav", "kick-data");
    await archive.set("Drums/snare.wav", "snare-data");
    await archive.set("Loops/bass.wav", "bass-data");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      const buffer = Buffer.from(await archive.to_blob().arrayBuffer());
      await writeFile(zipPath, buffer);

      execSync(`node ${CLI_PATH} "${zipPath}" -o "${outputDir}"`);

      expect(await readFile(join(outputDir, "Drums/kick.wav"), "utf8")).toBe("kick-data");
      expect(await readFile(join(outputDir, "Drums/snare.wav"), "utf8")).toBe("snare-data");
      expect(await readFile(join(outputDir, "Loops/bass.wav"), "utf8")).toBe("bass-data");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
