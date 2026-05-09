import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("NormaliseKeyTagTransformer", () => {
  it("normalises key tag variants to Cmaj/Cmin form in the auto-config", async () => {
    const zipped = zipSync({
      "Loops C Major/piano.wav": strToU8("piano-data"),
      "Bass F# Minor/bass.wav": strToU8("bass-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-key-"));
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
      const rows = csv.split("\n");

      const loopsRow = rows.find((r) => r.startsWith("Loops C Major,"));
      expect(loopsRow).toContain("Loops Cmaj");

      const bassRow = rows.find((r) => r.startsWith("Bass F# Minor,"));
      expect(bassRow).toContain("Bass F#min");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
