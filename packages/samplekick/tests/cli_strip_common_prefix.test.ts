import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("StripCommonPrefixTransformer", () => {
  it("strips the shared prefix from files in a subdirectory", async () => {
    const zipped = zipSync({
      "OSS Kit Aftershock/Ghosthack - OSS Kit Aftershock Bass Loop Gmin 140bpm.wav":
        strToU8("audio"),
      "OSS Kit Aftershock/Ghosthack - OSS Kit Aftershock Chords Loop Gmin 140bpm.wav":
        strToU8("audio"),
      "OSS Kit Aftershock/Ghosthack - OSS Kit Aftershock Pad Loop Gmin 140bpm.wav":
        strToU8("audio"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-strip-prefix-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--analyse"], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });

      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      const rows = csv.split("\n");

      const bassRow = rows.find((r) =>
        r.startsWith(
          "OSS Kit Aftershock/Ghosthack - OSS Kit Aftershock Bass Loop Gmin 140bpm.wav,",
        ),
      );
      expect(bassRow).toContain("Bass Loop Gmin 140bpm.wav");

      const chordsRow = rows.find((r) =>
        r.startsWith(
          "OSS Kit Aftershock/Ghosthack - OSS Kit Aftershock Chords Loop Gmin 140bpm.wav,",
        ),
      );
      expect(chordsRow).toContain("Chords Loop Gmin 140bpm.wav");

      const padRow = rows.find((r) =>
        r.startsWith(
          "OSS Kit Aftershock/Ghosthack - OSS Kit Aftershock Pad Loop Gmin 140bpm.wav,",
        ),
      );
      expect(padRow).toContain("Pad Loop Gmin 140bpm.wav");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("does not strip at root level", async () => {
    const zipped = zipSync({
      "Brand Kit Bass.wav": strToU8("audio"),
      "Brand Kit Snare.wav": strToU8("audio"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-strip-prefix-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--analyse"], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });

      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      const rows = csv.split("\n");

      // Name column should be empty — file was not renamed
      const bassRow = rows.find((r) => r.startsWith("Brand Kit Bass.wav,"));
      expect(bassRow).toMatch(/^Brand Kit Bass\.wav,,/v);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
