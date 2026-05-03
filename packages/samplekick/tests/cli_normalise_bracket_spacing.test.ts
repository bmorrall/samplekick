import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("NormaliseBracketSpacingTransformer", () => {
  it("fixes bracket spacing for all SP404 bracket types in the auto-config", async () => {
    const zipped = zipSync({
      "kick(hard)/sample.wav": strToU8("kick-data"),
      "snare[soft]/sample.wav": strToU8("snare-data"),
      "hats{open}/sample.wav": strToU8("hat-data"),
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
      const rows = csv.split("\n");

      expect(rows.find((r) => r.startsWith("kick(hard),"))).toBe("kick(hard),kick (hard),,,,");
      expect(rows.find((r) => r.startsWith("snare[soft],"))).toBe("snare[soft],snare [soft],,,,");
      expect(rows.find((r) => r.startsWith("hats{open},"))).toBe("hats{open},hats {open},,,,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
