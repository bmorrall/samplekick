import { spawnSync } from "node:child_process";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("EPIPE handling (pipe to head)", () => {
  it("does not crash when stdout is closed early (dry run)", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Drums/snare.wav": strToU8("snare-data"),
      "Loops/hihat.wav": strToU8("hihat-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-epipe-"));
    const zipPath = join(tmpDir, "test-pack.zip");

    try {
      await writeFile(zipPath, zipped);

      // Use a shell pipe so head's early exit delivers a real EPIPE to the CLI process.
      // Paths are passed via env vars to avoid shell-escaping issues.
      const result = spawnSync(
        "sh",
        ["-c", 'node "$CLI" "$ZIP" --preserve-paths | head -1'],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            CLI: CLI_PATH,
            ZIP: zipPath,
            SAMPLEKICK_DATA_DIR: join(tmpDir, "data"),
          },
        },
      );

      expect(result.stderr).toBe("");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("completes the export even when stdout is closed early", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Drums/snare.wav": strToU8("snare-data"),
      "Loops/hihat.wav": strToU8("hihat-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-epipe-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      // Use a shell pipe so head's early exit delivers a real EPIPE to the CLI process.
      // Paths are passed via env vars to avoid shell-escaping issues.
      const result = spawnSync(
        "sh",
        ["-c", 'node "$CLI" "$ZIP" --preserve-paths -o "$OUT" | head -1'],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            CLI: CLI_PATH,
            ZIP: zipPath,
            OUT: outputDir,
            SAMPLEKICK_DATA_DIR: join(tmpDir, "data"),
          },
        },
      );

      expect(result.stderr).toBe("");

      // Verify the export completed fully despite the broken pipe
      await expect(
        stat(join(outputDir, "Drums/kick.wav")),
      ).resolves.toBeDefined();
      await expect(
        stat(join(outputDir, "Drums/snare.wav")),
      ).resolves.toBeDefined();
      await expect(
        stat(join(outputDir, "Loops/hihat.wav")),
      ).resolves.toBeDefined();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
