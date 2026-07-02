import { describe, it, expect } from "vitest";
import { createKnownFileTypeTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("KnownFileTypeTransformer integration", () => {
  it("applies createKnownFileTypeTransformer to set sampleType on .dnprj files", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "projects/song.dnprj" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createKnownFileTypeTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── projects [skipped]",
        "│   └── song.dnprj [?] [type:Digitone Projects]",
        "└── samples [skipped]",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies createKnownFileTypeTransformer to set sampleType on .dnsnd files", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "sounds/patch.dnsnd" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createKnownFileTypeTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── sounds [skipped]",
        "│   └── patch.dnsnd [?] [type:Digitone Sounds]",
        "└── samples [skipped]",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies createKnownFileTypeTransformer to set sampleType on .fxp files", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "presets/bass.fxp" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createKnownFileTypeTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── presets [skipped]",
        "│   └── bass.fxp [?] [type:Serum Presets]",
        "└── samples [skipped]",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
