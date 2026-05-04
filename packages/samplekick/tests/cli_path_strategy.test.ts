import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("path strategy", () => {
  it("skips all entries on initial run when no config is set", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      await expect(stat(join(outputDir, "Drums/kick.wav"))).rejects.toThrow();
      await expect(stat(join(outputDir, "Loops/bass.wav"))).rejects.toThrow();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("logs rejected entries with reason when no config is set and --verbose is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--verbose", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("rejected: Drums/kick.wav: Missing sampleType and packageName");
      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exports no files and output directory is empty when no config is set", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      const entries = await readdir(outputDir).catch(() => []);
      expect(entries).toHaveLength(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exports to original source paths when --preserve-paths is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--preserve-paths", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      expect(await readFile(join(outputDir, "Drums/kick.wav"), "utf8")).toBe("kick-data");
      expect(await readFile(join(outputDir, "Loops/bass.wav"), "utf8")).toBe("bass-data");
      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
