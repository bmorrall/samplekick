import { describe, expect, it } from "vitest";
import { OrganisedPathStrategy, DirtywaveM8Preset } from "../../src";
import { createDefaultRootPackageNameTransformer } from "../../src/transformers";
import {
  createZipRegistry,
  applyDeviceTransforms,
  applyDeviceValidators,
} from "../support";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

describe("Dirtywave M8 end-to-end sample processing", () => {
  it("loads a zip, applies metadata, and produces the expected structure", async () => {
    const registry = await createZipRegistry("M8 Pack.zip", {
      "Drums/kick.wav": "data",
      "Drums/snare.wav": "data",
      "Loops/bass.wav": "data",
    });
    registry.setPathStrategy(OrganisedPathStrategy);

    registry.applyTransform(createDefaultRootPackageNameTransformer());

    // Apply Dirtywave M8 transforms (none — all file names are valid as-is)
    applyDeviceTransforms(registry, DirtywaveM8Preset);

    // Register Dirtywave M8 validators to enforce path length limits on export:
    //   max path length is 127 characters including the "Samples/" prefix (8 chars)
    applyDeviceValidators(registry, DirtywaveM8Preset);

    registry.setSampleType("Percussion");
    registry.setSampleType("Drums", "Drums");
    registry.setSampleType("Loops", "Loops");

    expect(registry.toString()).toBe(
      [
        "M8 Pack.zip [pkg:M8 Pack, type:Percussion, skipped]",
        "├── Drums [type:Drums, skipped]",
        "│   ├── kick.wav",
        "│   └── snare.wav",
        "└── Loops [type:Loops, skipped]",
        "    └── bass.wav",
        "",
      ].join("\n"),
    );

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "m8-export-"));
    try {
      await registry.exportToDirectory(tmpDir, {});

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

      const relExportedFiles = exportedFiles.map((f) =>
        f.replace(tmpDir + path.sep, ""),
      );
      relExportedFiles.sort();

      const expectedFiles = [
        "Drums/M8 Pack/kick.wav",
        "Drums/M8 Pack/snare.wav",
        "Loops/M8 Pack/bass.wav",
      ];
      expectedFiles.sort();

      expect(relExportedFiles).toEqual(expectedFiles);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
