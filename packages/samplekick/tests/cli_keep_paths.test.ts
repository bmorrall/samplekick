import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("KeepPathsTransformer", () => {
  it("sets keepPath=true for every digest row when --keep-paths is passed", async () => {
    const zipped = zipSync({
      "Drums/Kicks/kick.wav": strToU8("kick-data"),
      "Drums/Snares/snare.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-keep-paths-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--analyse", "--keep-paths"],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );

      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      const lines = csv.trimEnd().split("\n");

      expect(lines[0]).toBe("path,keepPath,name,packageName,sampleType,skip");
      for (const line of lines.slice(1)) {
        expect(line.split(",")[1]).toBe("true");
      }
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
