import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("root transforms (--analyse)", () => {
  it("sets packageName from the zip stem (DefaultRootPackageNameTransformer)", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-analyse-"));
    const zipPath = join(tmpDir, "mypack.zip");
    const dataDir = join(tmpDir, "data");
    try {
      await writeFile(zipPath, zipped);
      const result = spawnSync("node", [CLI_PATH, zipPath, "--analyse"], {
        encoding: "utf8", env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });
      expect(result.status).toBe(0);
      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      const rootRow = csv.split("\n").find((row) => row.startsWith(","));
      expect(rootRow).toBe(",mypack.zip,mypack,,,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("expands CamelCase packageName (ExpandRootPackageNameTransformer)", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-analyse-"));
    const zipPath = join(tmpDir, "CoolPack-v2.zip");
    const dataDir = join(tmpDir, "data");
    try {
      await writeFile(zipPath, zipped);
      const result = spawnSync("node", [CLI_PATH, zipPath, "--analyse"], {
        encoding: "utf8", env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });
      expect(result.status).toBe(0);
      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      // Name stays as zip filename; packageName is expanded
      const rootRow = csv.split("\n").find((row) => row.startsWith(","));
      expect(rootRow).toBe(",CoolPack-v2.zip,Cool Pack - v2,,,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
