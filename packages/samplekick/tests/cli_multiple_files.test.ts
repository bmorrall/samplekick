import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("multiple input files", () => {
  it("exports samples from two zip files into the output directory", async () => {
    const zipped1 = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const zipped2 = zipSync({ "Loops/hihat.wav": strToU8("hihat-data") });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath1 = join(tmpDir, "pack1.zip");
    const zipPath2 = join(tmpDir, "pack2.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath1, zipped1);
      await writeFile(zipPath2, zipped2);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath1, zipPath2, "-x", outputDir],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
        },
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      const kick = await stat(join(outputDir, "Drums/kick.wav"));
      expect(kick.isFile()).toBe(true);

      const hihat = await stat(join(outputDir, "Loops/hihat.wav"));
      expect(hihat.isFile()).toBe(true);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("performs a dry run across two zip files without writing any files", async () => {
    const zipped1 = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const zipped2 = zipSync({ "Loops/hihat.wav": strToU8("hihat-data") });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath1 = join(tmpDir, "pack1.zip");
    const zipPath2 = join(tmpDir, "pack2.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath1, zipped1);
      await writeFile(zipPath2, zipped2);

      const result = spawnSync("node", [CLI_PATH, zipPath1, zipPath2], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      // A blank line should separate the output of the two files
      expect(result.stdout).toContain("\n\n");

      // No files written to disk
      await expect(stat(dataDir)).rejects.toThrow();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("analyses and exports samples from two zip files grouped by sample type", async () => {
    const zipped1 = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Drums/snare.wav": strToU8("snare-data"),
    });
    const zipped2 = zipSync({
      "Loops/hihat.wav": strToU8("hihat-data"),
      "Loops/clap.wav": strToU8("clap-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath1 = join(tmpDir, "pack1.zip");
    const zipPath2 = join(tmpDir, "pack2.zip");
    const outputDir = join(tmpDir, "output");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath1, zipped1);
      await writeFile(zipPath2, zipped2);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath1, zipPath2, "--analyse", "-o", outputDir],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      // pack1: Drums directory is recognised → samples exported under Drums/pack1/
      const pack1Kick = await stat(join(outputDir, "Drums/pack1/kick.wav"));
      expect(pack1Kick.isFile()).toBe(true);

      const pack1Snare = await stat(join(outputDir, "Drums/pack1/snare.wav"));
      expect(pack1Snare.isFile()).toBe(true);

      // pack2: Loops directory is recognised → samples exported under Loops/pack2/
      const pack2Hihat = await stat(join(outputDir, "Loops/pack2/hihat.wav"));
      expect(pack2Hihat.isFile()).toBe(true);

      const pack2Clap = await stat(join(outputDir, "Loops/pack2/clap.wav"));
      expect(pack2Clap.isFile()).toBe(true);

      // Two separate auto-config files saved (one per pack fingerprint)
      const savedConfigs = await readdir(dataDir);
      expect(savedConfigs).toHaveLength(2);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
