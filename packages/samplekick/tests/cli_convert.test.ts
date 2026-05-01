import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("--convert flag", () => {
  it("exports non-audio files unchanged when --convert is passed", async () => {
    const zipped = zipSync({
      "Patches/preset.nki": strToU8("preset-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--convert", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      expect(await readFile(join(outputDir, "Patches/preset.nki"), "utf8")).toBe("preset-data");

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("reports a warning to stderr and exits with code 0 when ffmpeg fails to convert an audio file", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("not-valid-audio"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--convert", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toContain("Warning: could not convert");
      expect(result.stderr).toContain("kick.wav");

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
