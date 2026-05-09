import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("NormaliseDashesTransformer", () => {
  it("replaces en and em dashes with hyphen-minus in the auto-config", async () => {
    const zipped = zipSync({
      "Drums \u2013 Bass/kick.wav": strToU8("kick-data"),
      "Hi\u2014Hats/hat.wav": strToU8("hat-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-dashes-"));
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

      const enDashRow = rows.find((r) => r.startsWith("Drums \u2013 Bass,"));
      expect(enDashRow).toContain("Drums - Bass");

      const emDashRow = rows.find((r) => r.startsWith("Hi\u2014Hats,"));
      expect(emDashRow).toContain("Hi-Hats");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
