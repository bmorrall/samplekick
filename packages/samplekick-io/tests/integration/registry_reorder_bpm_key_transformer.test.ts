import { describe, it, expect } from "vitest";
import { createReorderBpmKeyTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("ReorderBpmKeyTransformer integration", () => {
  it("reorders BPM-before-key folder names to key-before-BPM", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "120bpm Amin/lead.wav" }),
      createFileEntry({ path: "Cmaj 90bpm/bass.wav" }),
      createFileEntry({ path: "Drums/kick.wav" }),
    ]);
    registry.applyTransform(createReorderBpmKeyTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── Amin 120bpm [renamed, skipped]",
        "│   └── lead.wav [?]",
        "├── Cmaj 90bpm [skipped]",
        "│   └── bass.wav [?]",
        "└── Drums [skipped]",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
