import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("SkipJunkTransformer", () => {
  it("excludes children of __MACOSX from the stdout CSV", async () => {
    const zipped = zipSync({
      "__MACOSX/._kick.wav": strToU8("macosx-data"),
      "Drums/kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-skip-"));
    const zipPath = join(tmpDir, "test-pack.zip");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      const rows = result.stdout.trim().split("\n");
      const paths = rows.slice(1).map((row) => row.split(",")[0]);

      expect(paths).toContain("__MACOSX");
      expect(paths).not.toContain("__MACOSX/._kick.wav");
      expect(paths).toContain("Drums/kick.wav");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("excludes children of __MACOSX from the auto-config CSV saved by --analyse", async () => {
    const zipped = zipSync({
      "__MACOSX/._kick.wav": strToU8("macosx-data"),
      "Drums/kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-skip-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--analyse"],
        { encoding: "utf8", env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir } },
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      const rows = csv.trim().split("\n");
      const paths = rows.slice(1).map((row) => row.split(",")[0]);

      expect(paths).toContain("__MACOSX");
      expect(paths).not.toContain("__MACOSX/._kick.wav");
      expect(paths).toContain("Drums/kick.wav");

      // __MACOSX row should have skip=true
      const macosxRow = rows.find((row) => row.startsWith("__MACOSX,"));
      expect(macosxRow?.split(",")[4]).toBe("true");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
