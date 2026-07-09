import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("InfoFileTransformer", () => {
  it("disables .txt files in the auto-config", async () => {
    const zipped = zipSync({
      "readme.txt": strToU8("text-data"),
      "Drums/kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-info-file-"));
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

      const txtRow = csv.split("\n").find((row) => row.includes("readme.txt"));
      expect(txtRow).toBeDefined();
      expect(txtRow?.split(",")[4]).toBe("false");

      const wavRow = csv.split("\n").find((row) => row.includes("kick.wav"));
      expect(wavRow).toBeDefined();
      expect(wavRow?.split(",")[4]).toBe("true");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("disables .pdf and .url files in the auto-config", async () => {
    const zipped = zipSync({
      "info.pdf": strToU8("pdf-data"),
      "website.url": strToU8("url-data"),
      "snare.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-info-file-"));
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

      const pdfRow = csv.split("\n").find((row) => row.includes("info.pdf"));
      expect(pdfRow).toBeDefined();
      expect(pdfRow?.split(",")[4]).toBe("false");

      const urlRow = csv.split("\n").find((row) => row.includes("website.url"));
      expect(urlRow).toBeDefined();
      expect(urlRow?.split(",")[4]).toBe("false");

      const wavRow = csv.split("\n").find((row) => row.includes("snare.wav"));
      expect(wavRow).toBeDefined();
      expect(wavRow?.split(",")[4]).toBe("true");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
