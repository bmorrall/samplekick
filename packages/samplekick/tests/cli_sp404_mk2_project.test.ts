import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("SP404Mk2ProjectTransformer", () => {
  it("tags SP-404MKII project folders with sampleType and keepStructure in the auto-config", async () => {
    const zipped = zipSync({
      "MY_PROJECT/SMPL/BANK1-01.SMP": strToU8("smp-data"),
      "MY_PROJECT/PTN/PATTERNCHAIN_00.CHN": strToU8("chn-data"),
    });

    const tmpDir = await mkdtemp(
      join(tmpdir(), "samplekick-sp404mk2-project-"),
    );
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
        .find((row) => row.startsWith("MY_PROJECT,"));
      expect(dirRow).toBe("MY_PROJECT,true,,,SP-404MKII Projects,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
