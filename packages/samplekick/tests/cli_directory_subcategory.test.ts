import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("DirectorySubcategoryTransformer", () => {
  it('tags "Latin" under "Drum Loops" as "Drum Loops - Latin" in the auto-config', async () => {
    const zipped = zipSync({
      "Drum Loops/Latin/loop.wav": strToU8("loop-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-dir-subcategory-"));
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

      const row = csv
        .split("\n")
        .find((r) => r.startsWith("Drum Loops/Latin,"));
      expect(row).toBe("Drum Loops/Latin,,,Drum Loops - Latin,,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("does not tag a child directory whose parent has no known sampleType", async () => {
    const zipped = zipSync({
      "Bonks/Latin/loop.wav": strToU8("loop-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-dir-subcategory-"));
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

      const row = csv.split("\n").find((r) => r.startsWith("Bonks/Latin,"));
      expect(row).toBe("Bonks/Latin,,,,,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('tags "Alien Technology" under a brand-prefixed "FX & Foley" pack as "Foley - Alien Technology"', async () => {
    const zipped = zipSync({
      "Ghosthack x Boom - Sci-Fi Horror FX & Foley/Alien Technology/alarm.wav":
        strToU8("data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-dir-subcategory-"));
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

      const row = csv
        .split("\n")
        .find((r) =>
          r.startsWith(
            "Ghosthack x Boom - Sci-Fi Horror FX & Foley/Alien Technology,",
          ),
        );
      expect(row).toBe(
        "Ghosthack x Boom - Sci-Fi Horror FX & Foley/Alien Technology,,,Foley - Alien Technology,,",
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
