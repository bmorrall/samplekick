import { describe, expect, it } from "vitest";
import {
  OrganisedPathStrategy,
} from "../../src";
import { SP404Mk2NameTransformer, DefaultRootPackageNameTransformer } from "../../src/transformers";
import { createZipRegistry } from "../support";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

describe("SP404 Mk2 end-to-end sample processing", () => {
  it("loads a zip, sanitizes names, applies manual edits, and produces the expected structure", async () => {
    // Build a zip archive with SP404-unfriendly names:
    // accented characters, dashes, and multiple dots
    const registry = await createZipRegistry("SP404 Påck.zip", {
      "Drüms/kick-01 (main).wav": "data",
      "Drüms/snâre.01.wav": "data",
      "Léad Loops/synth-pad.wav": "data",
      "Backing Loops/bass-line.wav": "data",
    });
    registry.setPathStrategy(OrganisedPathStrategy);

    // Sanitize all node names for SP404 Mk2 compatibility:
    //   Drüms              → Drums
    //   kick-01 (main).wav → kick-01 (main).wav  (hyphen preserved)
    //   snâre.01.wav       → snare_01.wav
    //   Léad Loops         → Lead Loops
    //   Backing Loops      → Backing Loops  (unchanged — space and letters are valid)
    //   synth-pad.wav      → synth-pad.wav  (hyphen preserved)
    //   bass-line.wav      → bass-line.wav  (hyphen preserved)
    registry.applyTransform(SP404Mk2NameTransformer);

    // Set default package name based on root zip name (minus extension)
    registry.applyTransform(DefaultRootPackageNameTransformer);

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
        "┣━━ Drums [renamed, type:Drums & Percussion]",
        "┃   ├── kick-01 (main).wav",
        "┃   └── snare_alt.wav [renamed, skipped]",
        "├── Lead Loops [renamed]",
        "│   └── synth-pad.wav",
        "└── Backing Loops",
        "    └── bass-line.wav",
        "",
      ].join("\n"),
    );

    // Export all non-skipped entries to a temp directory and verify all expected files exist
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sp404-export-"));
    try {
      await registry.exportToDirectory(tmpDir, {});

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
        "Drums & Percussion/SP404 Pack/Drums/kick-01 (main).wav",
        "Melodic Loops/SP404 Pack/synth-pad.wav",
        "Melodic Loops/SP404 Pack/bass-line.wav",
      ];
      expectedFiles.sort();
      expect(relExportedFiles).toEqual(expectedFiles);
    } finally {
      // Clean up temp directory
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
