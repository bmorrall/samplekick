import { describe, it, expect } from "vitest";
import { createNormaliseQuotesTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("NormaliseQuotesTransformer integration", () => {
  it("applies createNormaliseQuotesTransformer to replace curly quotes with straight quotes", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "\u2018Kicks\u2019/kick.wav" }),
      createFileEntry({ path: "\u201CSynths\u201D/pad.wav" }),
      createFileEntry({ path: "Drums/snare.wav" }),
    ]);
    registry.applyTransform(createNormaliseQuotesTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "\u251C\u2500\u2500 'Kicks' [renamed, skipped]",
        "\u2502   \u2514\u2500\u2500 kick.wav [?]",
        '\u251C\u2500\u2500 "Synths" [renamed, skipped]',
        "\u2502   \u2514\u2500\u2500 pad.wav [?]",
        "\u2514\u2500\u2500 Drums [skipped]",
        "    \u2514\u2500\u2500 snare.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
