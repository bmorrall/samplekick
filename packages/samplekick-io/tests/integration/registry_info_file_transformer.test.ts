import { describe, it, expect } from "vitest";
import { createInfoFileTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("InfoFileTransformer integration", () => {
  it("disables .txt, .pdf, and .url files while leaving audio files enabled", () => {
    const registry = createRegistry("test-pack", [
      createFileEntry({ path: "readme.txt" }),
      createFileEntry({ path: "kick.wav" }),
      createFileEntry({ path: "info.pdf" }),
      createFileEntry({ path: "website.url" }),
    ]);

    registry.applyTransform(createInfoFileTransformer());

    expect(registry.toString()).toBe(
      [
        "test-pack [skipped]",
        "├── readme.txt [?] [skipped]",
        "├── kick.wav [?]",
        "├── info.pdf [?] [skipped]",
        "└── website.url [?] [skipped]",
        "",
      ].join("\n"),
    );
  });
});
