import { describe, expect, it } from "vitest";
import { NormaliseBracketSpacingTransformer } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

describe("NormaliseBracketSpacingTransformer", () => {
  it("adds a space before ( when touching a preceding word", () => {
    const entry = createTransformEntry({ name: "kick(hard).wav" });
    NormaliseBracketSpacingTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick (hard).wav");
  });

  it("adds a space before [ when touching a preceding word", () => {
    const entry = createTransformEntry({ name: "kick[hard].wav" });
    NormaliseBracketSpacingTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick [hard].wav");
  });

  it("adds a space before { when touching a preceding word", () => {
    const entry = createTransformEntry({ name: "kick{hard}.wav" });
    NormaliseBracketSpacingTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick {hard}.wav");
  });

  it("removes a space after (", () => {
    const entry = createTransformEntry({ name: "kick( hard).wav" });
    NormaliseBracketSpacingTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick (hard).wav");
  });

  it("removes a space before )", () => {
    const entry = createTransformEntry({ name: "kick(hard ).wav" });
    NormaliseBracketSpacingTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick (hard).wav");
  });

  it("adds a space after ) when followed by a word character", () => {
    const entry = createTransformEntry({ name: "kick(hard)drum.wav" });
    NormaliseBracketSpacingTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick (hard) drum.wav");
  });

  it("does not add a space after ) when followed by a file extension dot", () => {
    const entry = createTransformEntry({ name: "kick(hard).wav" });
    NormaliseBracketSpacingTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick (hard).wav");
  });

  it("handles inner spaces and missing outer space together", () => {
    const entry = createTransformEntry({ name: "kick( hard ).wav" });
    NormaliseBracketSpacingTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick (hard).wav");
  });

  it("leaves already-correct spacing unchanged", () => {
    const entry = createTransformEntry({ name: "kick (hard).wav" });
    NormaliseBracketSpacingTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick (hard).wav");
  });

  it("normalises packageName when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", packageName: "My Pack(vol 1)" });
    NormaliseBracketSpacingTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("My Pack (vol 1)");
  });

  it("normalises sampleType when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", sampleType: "Drums[deep]" });
    NormaliseBracketSpacingTransformer(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Drums [deep]");
  });

  it("does not call setPackageName when packageName is undefined", () => {
    const entry = createTransformEntry({ name: "kick(hard).wav" });
    NormaliseBracketSpacingTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not call setSampleType when sampleType is undefined", () => {
    const entry = createTransformEntry({ name: "kick(hard).wav" });
    NormaliseBracketSpacingTransformer(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not call setSkipped or setKeepStructure", () => {
    const entry = createTransformEntry({ name: "kick(hard).wav" });
    NormaliseBracketSpacingTransformer(singleEntryTransformSource(entry));
    expect(entry.setSkipped).not.toHaveBeenCalled();
    expect(entry.setKeepStructure).not.toHaveBeenCalled();
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({ name: "kick(hard).wav", packageName: "Pack(1)", sampleType: "Drums[soft]", keepStructure: true });
    NormaliseBracketSpacingTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });
});
