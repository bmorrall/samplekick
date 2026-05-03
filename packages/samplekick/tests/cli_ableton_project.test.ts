import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("AbletonProjectTransformer", () => {
  it("tags Ableton project folders with sampleType and keepStructure in the auto-config", async () => {
    const zipped = zipSync({
      "My Project/My Project.als": strToU8("als-data"),
      "My Project/Samples/kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-analyse-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--analyse"],
        { encoding: "utf8", env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir } },
      );

      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");

      // The "My Project" directory row should have sampleType=Ableton Projects and keepPath=true
      const dirRow = csv.split("\n").find((row) => row.startsWith("My Project,"));
      expect(dirRow).toBe("My Project,,,Ableton Projects,,true");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
