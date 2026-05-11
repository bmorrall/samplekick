import { describe, expect, it } from "vitest";
import { createNormaliseQuotesTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

describe("createNormaliseQuotesTransformer", () => {
  it("replaces left single quotation mark with apostrophe", () => {
    const entry = createTransformEntry({ name: "\u2018kick\u2019.wav" });
    const transformer = createNormaliseQuotesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("'kick'.wav");
  });

  it("replaces left double quotation mark with straight double quote", () => {
    const entry = createTransformEntry({ name: "\u201Ckick\u201D.wav" });
    const transformer = createNormaliseQuotesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith('"kick".wav');
  });

  it("replaces mixed curly quotes in a name", () => {
    const entry = createTransformEntry({
      name: "\u2018It\u2019s a \u201Ckick\u201D.wav",
    });
    const transformer = createNormaliseQuotesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("'It's a \"kick\".wav");
  });

  it("does not rename entries that have no curly quotes", () => {
    const entry = createTransformEntry({ name: "kick.wav" });
    const transformer = createNormaliseQuotesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick.wav");
  });
});
