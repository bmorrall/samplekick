import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("StripLeadingBracketTransformer", () => {
  it("strips a leading bracket pair left behind by common-prefix stripping in the auto-config", async () => {
    const zipped = zipSync({
      "Aurora Kit/Snares/Snare (Counter).wav": strToU8("counter-data"),
      "Aurora Kit/Snares/Snare (White).wav": strToU8("white-data"),
    });

    const tmpDir = await mkdtemp(
      join(tmpdir(), "samplekick-strip-leading-bracket-"),
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
      const rows = csv.split("\n").filter(Boolean);

      const counterRow = rows.find((row) =>
        row.startsWith("Aurora Kit/Snares/Snare (Counter).wav,"),
      );
      expect(counterRow).toContain("Counter.wav");

      const whiteRow = rows.find((row) =>
        row.startsWith("Aurora Kit/Snares/Snare (White).wav,"),
      );
      expect(whiteRow).toContain("White.wav");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
