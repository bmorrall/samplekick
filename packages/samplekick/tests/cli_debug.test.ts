import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("--debug flag", () => {
  it("prints registry tree to stdout and exits with code 0 when --debug is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });
    const config = [
      "path,name,packageName,sampleType,enabled",
      "Drums/kick.wav,kick_01.wav,,,",
    ].join("\n");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--digest", configPath, "--debug"],
        { encoding: "utf8" },
      );

      expect(result.stderr).toBe("");
      const expected = [
        "test-pack.zip [skipped]",
        "├── Drums [skipped]",
        "│   └── kick_01.wav [?] [renamed]",
        "└── Loops [skipped]",
        "    └── bass.wav [?]",
      ].join("\n");
      expect(result.stdout.trim()).toBe(expected);

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("prints registry tree with inherited tags when --debug --verbose is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });
    const config = [
      "path,name,packageName,sampleType,enabled",
      "Drums,,my-pack,Percussion,",
      "Drums/kick.wav,kick_01.wav,,,",
    ].join("\n");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--digest", configPath, "--debug", "--verbose"],
        { encoding: "utf8" },
      );

      expect(result.stderr).toBe("");
      const expected = [
        `Reading: ${zipPath}`,
        `Using digest: ${configPath}`,
        "test-pack.zip [skipped]",
        "├── Drums [pkg:my-pack, type:Percussion, skipped]",
        "│   └── kick_01.wav [renamed, pkg:my-pack, type:Percussion, orig:kick.wav]",
        "└── Loops [skipped]",
        "    └── bass.wav [?]",
      ].join("\n");
      expect(result.stdout.trim()).toBe(expected);

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
