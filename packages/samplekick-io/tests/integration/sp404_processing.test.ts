import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";
import {
  OrganisedPathStrategy,
  Registry,
  ZipDataSource,
} from "../../src";
import { SP404Mk2NameTransformer, DefaultPackageNameTransformer } from "../../src/transformers";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

describe("SP404 Mk2 end-to-end sample processing", () => {
  it("loads a zip, sanitizes names, applies manual edits, and produces the expected structure", async () => {
    // Build a zip archive with SP404-unfriendly names:
    // accented characters, dashes, and multiple dots
    const zipped = zipSync({
      "Drüms/kick-01 (main).wav": strToU8("data"),
      "Drüms/snâre.01.wav": strToU8("data"),
      "Léad Loops/synth-pad.wav": strToU8("data"),
      "Backing Loops/bass-line.wav": strToU8("data"),
    });

    // Load into registry via ZipDataSource
    const dataSource = await ZipDataSource.fromBlob(new Blob([Buffer.from(zipped)]));
    const registry = new Registry("SP404 Påck.zip", dataSource);
    registry.setPathStrategy(OrganisedPathStrategy);

    // Sanitize all node names for SP404 Mk2 compatibility:
    //   Drüms              → Drums
    //   kick-01 (main).wav → kick_01 (main).wav
    //   snâre.01.wav       → snare_01.wav
    //   Léad Loops         → Lead Loops
    //   Backing Loops      → Backing Loops  (unchanged — space and letters are valid)
    //   synth-pad.wav      → synth_pad.wav
    //   bass-line.wav      → bass_line.wav
    registry.applyTransform(SP404Mk2NameTransformer);

    // Set default package name based on root zip name (minus extension)
    registry.applyTransform(DefaultPackageNameTransformer);

    // Apply metadata and manual edits using original paths (paths are immutable)
    registry.setSampleType("Melodic Loops");
    registry.setSampleType("Drüms", "Drums & Percussion");
    registry.setKeepStructure("Drüms", true);
    registry.setSkipped("Drüms/snâre.01.wav", true);
    registry.setName("Drüms/snâre.01.wav", "snare_alt.wav");

    // Verify keepStructure (does not appear in toString)
    expect(registry.getEntry("Drüms")?.isKeepStructure()).toBe(true);

    // The tree shows sanitized names, own pkg/type tags per node, inherited tags on root,
    // and [skipped] on any node where isSkipped is true
    expect(registry.toString()).toBe(
      [
        "SP404 Pack.zip [pkg:SP404 Pack, type:Melodic Loops]",
        "┣━━ Drums* [type:Drums & Percussion]",
        "┃   ├── kick_01 (main).wav*",
        "┃   └── snare_alt.wav* [skipped]",
        "├── Lead Loops*",
        "│   └── synth_pad.wav*",
        "└── Backing Loops",
        "    └── bass_line.wav*",
        "",
      ].join("\n"),
    );

    // Export all non-skipped entries to a temp directory and verify all expected files exist
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sp404-export-"));
    try {
      await registry.exportToDirectory(tmpDir);

      // List all files recursively in the export directory
      async function listFiles(dir: string): Promise<string[]> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(
          entries.map(async (entry) => {
            const res = path.resolve(dir, entry.name);
            return entry.isDirectory() ? await listFiles(res) : res;
          }),
        );
        return files.flat();
      }
      const exportedFiles = await listFiles(tmpDir);

      // Sort both arrays before comparison to avoid order issues
      const relExportedFiles = exportedFiles.map((f) =>
        f.replace(tmpDir + path.sep, ""),
      );
      relExportedFiles.sort();
      const expectedFiles = [
        "Drums & Percussion/SP404 Pack/Drums/kick_01 (main).wav",
        "Melodic Loops/SP404 Pack/synth_pad.wav",
        "Melodic Loops/SP404 Pack/bass_line.wav",
      ];
      expectedFiles.sort();
      expect(relExportedFiles).toEqual(expectedFiles);
    } finally {
      // Clean up temp directory
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
