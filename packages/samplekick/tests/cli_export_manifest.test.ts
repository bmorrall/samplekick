import { spawnSync } from "node:child_process";
import {
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";
import { EXPORT_MANIFEST_DIR } from "samplekick-io";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("export manifest", () => {
  it("re-exporting to the same directory after a rename removes the stale file", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const firstResult = spawnSync(
        "node",
        [CLI_PATH, zipPath, "-x", outputDir],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );
      expect(firstResult.stderr).toBe("");
      expect(firstResult.status).toBe(0);
      expect(await readFile(join(outputDir, "Drums/kick.wav"), "utf8")).toBe(
        "kick-data",
      );

      const manifestDir = join(outputDir, EXPORT_MANIFEST_DIR);
      const manifestFilesAfterFirstRun = await readdir(manifestDir);
      expect(manifestFilesAfterFirstRun).toHaveLength(1);
      const [manifestFileName] = manifestFilesAfterFirstRun;
      const manifestPath = join(manifestDir, manifestFileName);
      expect(await readFile(manifestPath, "utf8")).toBe(
        ["originalPath,outputPath", "Drums/kick.wav,Drums/kick.wav"].join("\n"),
      );

      const configPath = join(tmpDir, "config.csv");
      await writeFile(
        configPath,
        [
          "path,name,packageName,sampleType,enabled",
          "Drums/kick.wav,kick-renamed.wav,,,",
        ].join("\n"),
      );

      const secondResult = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--digest", configPath, "-x", outputDir],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );
      expect(secondResult.stderr).toBe("");
      expect(secondResult.status).toBe(0);

      expect(
        await readFile(join(outputDir, "Drums/kick-renamed.wav"), "utf8"),
      ).toBe("kick-data");
      await expect(stat(join(outputDir, "Drums/kick.wav"))).rejects.toThrow();

      expect(await readFile(manifestPath, "utf8")).toBe(
        [
          "originalPath,outputPath",
          "Drums/kick.wav,Drums/kick-renamed.wav",
        ].join("\n"),
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
