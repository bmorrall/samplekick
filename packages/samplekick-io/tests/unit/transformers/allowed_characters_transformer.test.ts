import { describe, expect, it } from "vitest";
import { createAllowedCharactersTransform } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

const testPunctuation = new Set([" ", "-", "_", "!", "&", "(", ")", "+", ",", "=", "@", "[", "]", "{", "}"]);

const transform = createAllowedCharactersTransform(testPunctuation);

describe("createAllowedCharactersTransform", () => {
  it("leaves already-valid names unchanged", () => {
    const entry = createTransformEntry({ name: "kick_01 (take).wav" });
    transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick_01 (take).wav");
  });

  it("preserves all allowed punctuation characters", () => {
    const entry = createTransformEntry({ name: "A _!&()+,=@[]{}.wav" });
    transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("A _!&()+,=@[]{}.wav");
  });

  it("preserves digits and upper/lowercase letters", () => {
    const entry = createTransformEntry({ name: "ABCabc123.wav" });
    transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("ABCabc123.wav");
  });

  it("replaces disallowed characters with underscores", () => {
    const entry = createTransformEntry({ name: "Invalid*Char?.wav" });
    transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Invalid_Char_.wav");
  });

  it("replaces characters not in the punctuation set with underscores", () => {
    const custom = createAllowedCharactersTransform(new Set(["#"]));
    const entry = createTransformEntry({ name: "my#tag!.wav" });
    custom(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("my#tag_.wav");
  });

  it("replaces disallowed unicode characters with underscores (no accent normalization)", () => {
    const entry = createTransformEntry({ name: "it\u2019s a sample.wav" });
    transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("it_s a sample.wav");
  });

  it("preserves only the final extension dot", () => {
    const entry = createTransformEntry({ name: "kick.01.alt.wav" });
    transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick_01_alt.wav");
  });

  it("only calls setName and no other setters when packageName and sampleType are absent", () => {
    const entry = createTransformEntry({ name: "Invalid*Char?.wav" });
    transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
    expect(entry.setSkipped).not.toHaveBeenCalled();
    expect(entry.setKeepStructure).not.toHaveBeenCalled();
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({ name: "Drüms", packageName: "Påck", sampleType: "Drüms", keepStructure: true });
    transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("sanitizes packageName when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", packageName: "SP404 Pack" });
    transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("SP404 Pack");
  });

  it("sanitizes sampleType when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", sampleType: "Drums" });
    transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Drums");
  });
});
