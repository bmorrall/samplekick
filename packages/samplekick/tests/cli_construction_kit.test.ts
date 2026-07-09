import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("ConstructionKitTransformer", () => {
  it("enables matched kit directories and descendants in auto-config", async () => {
    const zipped = zipSync({
      "Song Kits/Song Kit 01 - 103BPM Gbmaj/Drums/kick.wav":
        strToU8("kick-data"),
      "Song Kits/Song Kit 01 - 103BPM Gbmaj/Drums/Chopped/chop.wav":
        strToU8("chop-data"),
      "Song Kits/Song Kit 02 - 90BPM C#maj/Melody/melody.wav":
        strToU8("melody-data"),
      "Song Kits/Preview Loops/preview.wav": strToU8("preview-data"),
      "Other Folder/Song Kit 03 - 95BPM Dmin/snare.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(
      join(tmpdir(), "samplekick-construction-kit-"),
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

      const rowSongKit1 = csv
        .split("\n")
        .find((r) => r.startsWith("Song Kits/Song Kit 01 - 103BPM Gbmaj,"));
      const rowSongKit1Drums = csv
        .split("\n")
        .find((r) =>
          r.startsWith("Song Kits/Song Kit 01 - 103BPM Gbmaj/Drums,"),
        );
      const rowSongKit1DrumsChopped = csv
        .split("\n")
        .find((r) =>
          r.startsWith("Song Kits/Song Kit 01 - 103BPM Gbmaj/Drums/Chopped,"),
        );
      const rowSongKit2 = csv
        .split("\n")
        .find((r) => r.startsWith("Song Kits/Song Kit 02 - 90BPM C#maj,"));
      const rowPreviewLoops = csv
        .split("\n")
        .find((r) => r.startsWith("Song Kits/Preview Loops,"));
      const rowOtherFolderKit = csv
        .split("\n")
        .find((r) => r.startsWith("Other Folder/Song Kit 03 - 95BPM Dmin,"));

      expect(rowSongKit1).toBe(
        "Song Kits/Song Kit 01 - 103BPM Gbmaj,Song Kit 01 - Gbmaj 103bpm,,,true",
      );
      expect(rowSongKit1Drums).toBe(
        "Song Kits/Song Kit 01 - 103BPM Gbmaj/Drums,,,,true",
      );
      expect(rowSongKit1DrumsChopped).toBe(
        "Song Kits/Song Kit 01 - 103BPM Gbmaj/Drums/Chopped,,,,true",
      );
      expect(rowSongKit2).toBe(
        "Song Kits/Song Kit 02 - 90BPM C#maj,Song Kit 02 - C#maj 90bpm,,,true",
      );
      expect(rowPreviewLoops).toBe("Song Kits/Preview Loops,,,Loops,false");
      expect(rowOtherFolderKit).toBe(
        "Other Folder/Song Kit 03 - 95BPM Dmin,Song Kit 03 - Dmin 95bpm,,,false",
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("does not retain MIDI tags for directories under a matched kit subtree", async () => {
    const zipped = zipSync({
      "Song Kits/Song Kit 01 - 103BPM Gbmaj/MIDI/Lead  --  128BPM  .mid":
        strToU8("midi-data"),
      "Song Kits/Song Kit 01 - 103BPM Gbmaj/Drums/kick.wav":
        strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(
      join(tmpdir(), "samplekick-construction-kit-"),
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

      const kitRow = csv
        .split("\n")
        .find((r) => r.startsWith("Song Kits/Song Kit 01 - 103BPM Gbmaj,"));
      const midiDirRow = csv
        .split("\n")
        .find((r) =>
          r.startsWith("Song Kits/Song Kit 01 - 103BPM Gbmaj/MIDI,"),
        );
      const midiFileRow = csv
        .split("\n")
        .find((r) =>
          r.startsWith(
            "Song Kits/Song Kit 01 - 103BPM Gbmaj/MIDI/Lead  --  128BPM  .mid,",
          ),
        );

      expect(kitRow).toBe(
        "Song Kits/Song Kit 01 - 103BPM Gbmaj,Song Kit 01 - Gbmaj 103bpm,,,true",
      );
      expect(midiDirRow).toBe(
        "Song Kits/Song Kit 01 - 103BPM Gbmaj/MIDI,,,,true",
      );
      expect(midiFileRow).toBe(
        "Song Kits/Song Kit 01 - 103BPM Gbmaj/MIDI/Lead  --  128BPM  .mid,Lead -  - 128bpm .mid,,,true",
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
