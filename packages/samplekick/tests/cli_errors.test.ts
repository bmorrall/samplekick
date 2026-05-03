import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("samplekick CLI error handling", () => {
  it("exits with code 1 and prints an error when the zip file does not exist", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "nonexistent.zip");

    try {
      const result = spawnSync("node", [CLI_PATH, zipPath], { encoding: "utf8" });

      expect(result.stderr).toContain("Error: file not found");
      expect(result.stderr).toContain("nonexistent.zip");

      expect(result.status).toBe(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exits with code 1 and prints an error when the zip file is not a valid zip", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "invalid.zip");

    try {
      await writeFile(zipPath, "not a zip file");

      const result = spawnSync("node", [CLI_PATH, zipPath], { encoding: "utf8" });

      expect(result.stderr).toContain("Error: not a valid zip file");
      expect(result.stderr).toContain("invalid.zip");

      expect(result.status).toBe(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exits with code 1 and prints an error when the --config file does not exist", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--config", join(tmpDir, "nonexistent.csv")],
        { encoding: "utf8" },
      );

      expect(result.stderr).toContain("Error: config file not found");
      expect(result.stderr).toContain("nonexistent.csv");

      expect(result.status).toBe(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exits with code 1 and prints an error when the --write path is not writable", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const writePath = join(tmpDir, "nonexistent-subdir", "config.json");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--write", writePath], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toContain("Error: could not write to");
      expect(result.stderr).toContain("config.json");

      expect(result.status).toBe(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exits with code 1 and prints an error when the --output path is not writable", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    // Create a file at the output path so mkdir inside it fails with ENOTDIR
    const outputPath = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(outputPath, "not a directory");

      const result = spawnSync("node", [CLI_PATH, zipPath, "--preserve-paths", "-o", outputPath], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toContain("Error: could not export to");
      expect(result.stderr).toContain("output");

      expect(result.status).toBe(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
