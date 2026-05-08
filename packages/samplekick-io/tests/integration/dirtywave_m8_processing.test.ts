import { describe, expect, it } from "vitest";
import { OrganisedPathStrategy } from "../../src";
import { createDefaultRootPackageNameTransformer } from "../../src/transformers";
import { createZipRegistry } from "../support";
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

    registry.applyTransform(createDefaultRootPackageNameTransformer);

    registry.setSampleType("Percussion");
    registry.setSampleType("Drums", "Drums");
    registry.setSampleType("Loops", "Loops");

    expect(registry.toString()).toBe(
      [
        "M8 Pack.zip [pkg:M8 Pack, type:Percussion]",
        "├── Drums [type:Drums]",
        "│   ├── kick.wav",
        "│   └── snare.wav",
        "└── Loops [type:Loops]",
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
