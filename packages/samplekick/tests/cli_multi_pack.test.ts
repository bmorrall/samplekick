import { spawnSync } from "node:child_process";
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("MultiPackNameTransformer", () => {
  it("tags ancestor directories with ' - ' in the name as packageName in the auto-config", async () => {
    const zipped = zipSync({
      "Ghosthack - Ultimate Freebie Collection/Acapellas and Vocals/Ghosthack - UPB2022 Vocal Freebie/Wet/Chants/Ghosthack_Ayla 128bpm_Chant 5 WET.wav":
        strToU8("data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-multi-pack-"));
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

      const topLevelRow = rows.find((row) =>
        row.startsWith("Ghosthack - Ultimate Freebie Collection,"),
      );
      expect(topLevelRow).toBe(
        "Ghosthack - Ultimate Freebie Collection,,,Ghosthack - Ultimate Freebie Collection,,",
      );

      const subPackRow = rows.find((row) =>
        row.startsWith(
          "Ghosthack - Ultimate Freebie Collection/Acapellas and Vocals/Ghosthack - UPB2022 Vocal Freebie,",
        ),
      );
      expect(subPackRow).toBe(
        "Ghosthack - Ultimate Freebie Collection/Acapellas and Vocals/Ghosthack - UPB2022 Vocal Freebie,,,Ghosthack - UPB2022 Vocal Freebie,,",
      );

      const neutralRow = rows.find((row) =>
        row.startsWith(
          "Ghosthack - Ultimate Freebie Collection/Acapellas and Vocals,",
        ),
      );
      expect(neutralRow).toBe(
        "Ghosthack - Ultimate Freebie Collection/Acapellas and Vocals,,,,Vocals - Acapellas,",
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("tags kit-named subdirectories even when parent has ' - '", async () => {
    const zipped = zipSync({
      "Ghosthack - Ultimate Freebie Collection/Construction Kits/Ghosthack - Advent Calendar 2019 - Day 12 - Trap Kits/Holiday Kit 04 - 140bpm - Bmaj/04. One-Shot Samples/Synth 2 - C.wav":
        strToU8("data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-multi-pack-"));
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

      // Advent Calendar dir: parent is "Construction Kits" (no ' - ') → tagged
      const adventRow = rows.find((row) =>
        row.startsWith(
          "Ghosthack - Ultimate Freebie Collection/Construction Kits/Ghosthack - Advent Calendar 2019 - Day 12 - Trap Kits,",
        ),
      );
      expect(adventRow).toBe(
        "Ghosthack - Ultimate Freebie Collection/Construction Kits/Ghosthack - Advent Calendar 2019 - Day 12 - Trap Kits,,,Ghosthack - Advent Calendar 2019 - Day 12 - Trap Kits,,",
      );

      // Holiday Kit dir: has 'Kit' in name → tagged even though parent has ' - '
      const holidayRow = rows.find((row) =>
        row.startsWith(
          "Ghosthack - Ultimate Freebie Collection/Construction Kits/Ghosthack - Advent Calendar 2019 - Day 12 - Trap Kits/Holiday Kit 04 - 140bpm - Bmaj,",
        ),
      );
      expect(holidayRow).toBe(
        "Ghosthack - Ultimate Freebie Collection/Construction Kits/Ghosthack - Advent Calendar 2019 - Day 12 - Trap Kits/Holiday Kit 04 - 140bpm - Bmaj,,Holiday Kit 04 - Bmaj 140bpm,Ghosthack - Holiday Kit 04 - Bmaj 140bpm,,",
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("accepts -m as a short alias for --analyse-multi-pack", async () => {
    const zipped = zipSync({
      "Ghosthack - Ultimate Freebie Collection/Drums/kick.wav": strToU8("data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-multi-pack-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "-m"], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
      });

      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      expect(csv).toContain("Ghosthack - Ultimate Freebie Collection");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exports files to the organised path when -o is passed", async () => {
    const zipped = zipSync({
      "Ghosthack - Ultimate Freebie Collection/Acapellas and Vocals/Ghosthack - UPB2022 Vocal Freebie/Wet/Chants/Ghosthack_Ayla 128bpm_Chant 5 WET.wav":
        strToU8("audio-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-multi-pack-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--analyse-multi-pack", "-o", outputDir],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir },
        },
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      // File should exist somewhere under the output dir
      const outputStat = await stat(outputDir);
      expect(outputStat.isDirectory()).toBe(true);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("does not tag directories without ' - ' as packageName", async () => {
    const zipped = zipSync({
      "Loops/Drums/kick.wav": strToU8("data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-multi-pack-"));
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

      // "Loops" has no ' - ' so should not be tagged as packageName
      const loopsRow = rows.find((row) => row.startsWith("Loops,"));
      expect(loopsRow).toBe("Loops,,,,Loops,");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
