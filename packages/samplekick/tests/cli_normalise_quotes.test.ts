import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("NormaliseQuotesTransformer", () => {
  it("replaces curly quotes in folder and file names in the auto-config", async () => {
    const zipped = zipSync({
      "\u2018Kicks\u2019/kick.wav": strToU8("kick-data"),
      "\u201CSynths\u201D/pad.wav": strToU8("pad-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-analyse-"));
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

      expect(rows.find((r) => r.startsWith("\u2018Kicks\u2019,"))).toBe(
        "\u2018Kicks\u2019,,'Kicks',,,",
      );
      expect(rows.find((r) => r.startsWith("\u201CSynths\u201D,"))).toBe(
        '\u201CSynths\u201D,,"""Synths""",,,',
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
