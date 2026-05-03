import { describe, expect, it, vi } from "vitest";
import { SP404Mk2NameTransformer } from "../../../src";
import type { TransformEntry } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

describe("SP404Mk2NameTransformer", () => {
  it("leaves already-valid names unchanged", () => {
    const entry = createTransformEntry({ name: "kick_01 (take).wav" });
    SP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick_01 (take).wav");
  });

  it("preserves all allowed punctuation characters", () => {
    const entry = createTransformEntry({ name: "A _!&()+,=@[]{}.wav" });
    SP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("A _!&()+,=@[]{}.wav");
  });

  it("preserves digits and upper/lowercase letters", () => {
    const entry = createTransformEntry({ name: "ABCabc123.wav" });
    SP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("ABCabc123.wav");
  });

  it("normalizes accents and unsupported punctuation", () => {
    const entry = createTransformEntry({ name: "parênt [parent]" });
    SP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("parent [parent]");
  });

  it("preserves only the final extension dot", () => {
    const entry = createTransformEntry({ name: "kick.01.alt.wav" });
    SP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick_01_alt.wav");
  });

  it("truncates long names while preserving the extension", () => {
    const entry = createTransformEntry({ name: `${"x".repeat(90)}.wav` });
    SP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith(`${"x".repeat(76)}.wav`);
  });

  it("truncates a long name with no extension to exactly 80 characters", () => {
    const entry = createTransformEntry({ name: "x".repeat(90) });
    SP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("x".repeat(80));
  });

  it("only calls setName and no other setters when packageName and sampleType are absent", () => {
    const entry = createTransformEntry({ name: "parênt [parent]" });
    SP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
    expect(entry.setSkipped).not.toHaveBeenCalled();
    expect(entry.setKeepStructure).not.toHaveBeenCalled();
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({ name: "Drüms", packageName: "Påck", sampleType: "Drüms", keepStructure: true });
    SP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("sanitizes packageName when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", packageName: "SP404 Påck" });
    SP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("SP404 Pack");
  });

  it("sanitizes sampleType when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", sampleType: "Drüms" });
    SP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Drums");
  });

  it("truncates to 80 characters when the extension is too long to preserve", () => {
    let capturedName: string | undefined = undefined;
    const entry: TransformEntry = {
      ...createTransformEntry({ name: `x.${"e".repeat(90)}` }),
      setName: vi.fn<(name: string | undefined) => void>((name) => {
        capturedName = name;
      }),
    };
    SP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(capturedName).toHaveLength(80);
    expect(capturedName).toMatch(/^x\./v);
  });
});
