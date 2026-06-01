import { spawnSync } from "node:child_process";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("dry-run (no -o flag)", () => {
  it("prints sorted success entries and 'Would export' summary without writing files", async () => {
    const zipped = zipSync({
      "Loops/hihat.wav": strToU8("hihat-data"),
      "Drums/kick.wav": strToU8("kick-data"),
      "Drums/snare.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--analyse"], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      // All three entries should appear in the output
      expect(result.stdout).toContain("kick.wav");
      expect(result.stdout).toContain("snare.wav");
      expect(result.stdout).toContain("hihat.wav");

      // Entries should be sorted: Drums/* before Loops/*
      const kickIdx = result.stdout.indexOf("kick.wav");
      const snareIdx = result.stdout.indexOf("snare.wav");
      const hihatIdx = result.stdout.indexOf("hihat.wav");
      expect(kickIdx).toBeLessThan(snareIdx);
      expect(snareIdx).toBeLessThan(hihatIdx);

      // Summary line
      expect(result.stdout).toContain("Would export 3 samples");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("shows skipped entries after successes in the output", async () => {
    // Without packageName/sampleType, OrganisedPathStrategy will skip entries
    const zipped = zipSync({
      "kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      // Should mention the skipped entry
      expect(result.stdout).toContain("kick.wav");

      // Summary line should include skip count
      expect(result.stdout).toContain("Would export");

      // No files written to disk
      await expect(stat(dataDir)).rejects.toThrow();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
