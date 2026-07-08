import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("StripFormatHintsTransformer", () => {
  it("strips bracketed and hyphen-suffix format hints in the auto-config", async () => {
    const zipped = zipSync({
      "Samples (WAV)/kick.wav": strToU8("kick-data"),
      "Drums - 24bit/snare.wav": strToU8("snare-data"),
      "Bass - 44.1kHz/bass.wav": strToU8("bass-data"),
      "Loops [STEMS]/stem.wav": strToU8("stem-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-format-hints-"));
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

      expect(rows.find((r) => r.startsWith("Samples (WAV),"))).toBe(
        "Samples (WAV),Samples,,,false",
      );
      expect(rows.find((r) => r.startsWith("Drums - 24bit,"))).toBe(
        "Drums - 24bit,Drums,,Drums,false",
      );
      expect(rows.find((r) => r.startsWith("Bass - 44.1kHz,"))).toBe(
        "Bass - 44.1kHz,Bass,,Bass,false",
      );
      expect(rows.find((r) => r.startsWith("Loops [STEMS],"))).toBe(
        "Loops [STEMS],,,,false",
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
