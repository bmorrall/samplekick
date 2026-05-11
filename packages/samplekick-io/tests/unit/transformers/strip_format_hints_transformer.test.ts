import { describe, expect, it } from "vitest";
import { createStripFormatHintsTransformer } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

describe("createStripFormatHintsTransformer", () => {
  it("strips a bracketed WAV hint from a folder name", () => {
    const entry = createTransformEntry({ name: "Samples (WAV)" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Samples");
  });

  it("strips a bracketed hint using square brackets", () => {
    const entry = createTransformEntry({ name: "Loops [24bit]" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Loops");
  });

  it("strips a hyphen-suffix bit depth hint", () => {
    const entry = createTransformEntry({ name: "Drums - 24bit" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Drums");
  });

  it("strips a hyphen-suffix sample rate hint", () => {
    const entry = createTransformEntry({ name: "Bass - 44.1kHz" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Bass");
  });

  it("strips a bracketed WAV hint from a file name", () => {
    const entry = createTransformEntry({ name: "kick (WAV).wav" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick.wav");
  });

  it("strips a bracketed AIFF hint", () => {
    const entry = createTransformEntry({ name: "Samples (AIFF)" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Samples");
  });

  it("strips a bracketed AIFF-C hint", () => {
    const entry = createTransformEntry({ name: "Samples (AIFF-C)" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Samples");
  });

  it("strips a hyphen-suffix 48kHz hint", () => {
    const entry = createTransformEntry({ name: "Pads - 48kHz" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Pads");
  });

  it("strips a hyphen-suffix 16-bit hint", () => {
    const entry = createTransformEntry({ name: "Drums - 16-bit" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Drums");
  });

  it("is case-insensitive for bracketed hints", () => {
    const entry = createTransformEntry({ name: "Samples (wav)" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Samples");
  });

  it("is case-insensitive for hyphen-suffix hints", () => {
    const entry = createTransformEntry({ name: "Drums - 24BIT" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Drums");
  });

  it("does not strip a bracketed Stems hint", () => {
    const entry = createTransformEntry({ name: "Loops [STEMS]" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Loops [STEMS]");
  });

  it("does not strip a hyphen-suffix Stems hint", () => {
    const entry = createTransformEntry({ name: "Loops - Stems" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Loops - Stems");
  });

  it("leaves a name without hints unchanged", () => {
    const entry = createTransformEntry({ name: "Kick Drums" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Kick Drums");
  });

  it("normalises packageName when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", packageName: "My Pack (WAV)" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("My Pack");
  });

  it("normalises sampleType when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", sampleType: "Loops [24bit]" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Loops");
  });

  it("does not call setPackageName when packageName is undefined", () => {
    const entry = createTransformEntry({ name: "Samples (WAV)" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not call setSampleType when sampleType is undefined", () => {
    const entry = createTransformEntry({ name: "Samples (WAV)" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not call setSkipped or setKeepStructure", () => {
    const entry = createTransformEntry({ name: "Samples (WAV)" });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSkipped).not.toHaveBeenCalled();
    expect(entry.setKeepStructure).not.toHaveBeenCalled();
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({ name: "Samples (WAV)", packageName: "My Pack (WAV)", sampleType: "Loops [24bit]", keepStructure: true });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not modify any fields when skipped is true", () => {
    const entry = createTransformEntry({ name: "Samples (WAV)", skipped: true });
    createStripFormatHintsTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });
});
