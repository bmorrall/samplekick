import { describe, it, expect } from "vitest";
import { createArchiveFileTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("ArchiveFileTransformer integration", () => {
  it("sets sampleType to Archive for an unrecognised .zip path", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "extras/bonus.zip" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createArchiveFileTransformer());
    expect(registry.toString()).toBe(
      [
        "root",
        "├── extras",
        "│   ┗━━ bonus.zip [?] [type:Archive]",
        "└── samples",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("sets sampleType to Ableton Projects for a .zip under an Ableton path", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Ableton/My Set.zip" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createArchiveFileTransformer());
    expect(registry.toString()).toBe(
      [
        "root",
        "├── Ableton",
        "│   ┗━━ My Set.zip [?] [type:Ableton Projects]",
        "└── samples",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("sets sampleType to FL Studio Projects for a .zip under an FL Studio path", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "FL Studio/My Song.zip" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createArchiveFileTransformer());
    expect(registry.toString()).toBe(
      [
        "root",
        "├── FL Studio",
        "│   ┗━━ My Song.zip [?] [type:FL Studio Projects]",
        "└── samples",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
