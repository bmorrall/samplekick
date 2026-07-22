import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("BrandPrefixTransformer", () => {
  it("prefixes child packageNames with parent's Ghosthack brand in the auto-config", async () => {
    const zipped = zipSync({
      "Ghosthack - Ultimate Freebie Collection/Construction Kits/Ghosthack - Advent Calendar 2019 - Day 12 - Trap Kits/Holiday Kit 01 - 140bpm - G/03. WAV Loops/808 Bass - 140bpm - G.wav":
        strToU8("data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-brand-prefix-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--analyse-multi-pack"],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );

      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      const rows = csv.split("\n").filter(Boolean);

      // Top-level: Ghosthack root
      const topLevelRow = rows.find((row) =>
        row.startsWith("Ghosthack - Ultimate Freebie Collection,"),
      );
      expect(topLevelRow).toBe(
        "Ghosthack - Ultimate Freebie Collection,Ultimate Freebie Collection,Ghosthack - Ultimate Freebie Collection,,false",
      );

      // Advent Calendar: tagged by MultiPackNameTransformer, should be prefixed by BrandPrefixTransformer
      const adventRow = rows.find((row) =>
        row.startsWith(
          "Ghosthack - Ultimate Freebie Collection/Construction Kits/Ghosthack - Advent Calendar 2019 - Day 12 - Trap Kits,",
        ),
      );
      expect(adventRow).toContain(
        "Ghosthack - Advent Calendar 2019 - Day 12 - Trap Kits",
      );

      // Holiday Kit: tagged by MultiPackNameTransformer, should be prefixed by BrandPrefixTransformer
      const holidayRow = rows.find((row) =>
        row.startsWith(
          "Ghosthack - Ultimate Freebie Collection/Construction Kits/Ghosthack - Advent Calendar 2019 - Day 12 - Trap Kits/Holiday Kit 01 - 140bpm - G,",
        ),
      );
      expect(holidayRow).toContain("Ghosthack - Holiday Kit 01 - 140bpm - G");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("prefixes child packageNames with parent's Cymatics brand in the auto-config", async () => {
    const zipped = zipSync({
      "Cymatics - Mystery Pack Vol 4/Bundle 01/file.wav": strToU8("data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-brand-prefix-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--analyse-multi-pack"],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );

      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      const rows = csv.split("\n").filter(Boolean);

      // Top-level: Cymatics root
      const topLevelRow = rows.find((row) =>
        row.startsWith("Cymatics - Mystery Pack Vol 4,"),
      );
      expect(topLevelRow).toBe(
        "Cymatics - Mystery Pack Vol 4,Mystery Pack Vol 4,Cymatics - Mystery Pack Vol 4,,false",
      );

      // Bundle: has no ' - ' in name, so MultiPackNameTransformer does not tag it,
      // meaning BrandPrefixTransformer also cannot fire (no own packageName to prefix)
      const bundleRow = rows.find((row) =>
        row.startsWith("Cymatics - Mystery Pack Vol 4/Bundle 01,"),
      );
      expect(bundleRow).toBe(
        "Cymatics - Mystery Pack Vol 4/Bundle 01,,,,false",
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
