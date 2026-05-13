import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("AcapellaTransformer", () => {
  it('tags an "Acapellas" directory with sampleType in the auto-config', async () => {
    const zipped = zipSync({
      "Acapellas/vocal.wav": strToU8("data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-acapella-"));
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

      const dirRow = csv
        .split("\n")
        .find((row) => row.startsWith("Acapellas,"));
      expect(dirRow).toBe("Acapellas,,,,Vocals - Acapellas,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('tags an "Acapellas and Vocals" directory with sampleType in the auto-config', async () => {
    const zipped = zipSync({
      "Acapellas and Vocals/vocal.wav": strToU8("data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-acapella-"));
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

      const dirRow = csv
        .split("\n")
        .find((row) => row.startsWith("Acapellas and Vocals,"));
      expect(dirRow).toBe("Acapellas and Vocals,,,,Vocals - Acapellas,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
