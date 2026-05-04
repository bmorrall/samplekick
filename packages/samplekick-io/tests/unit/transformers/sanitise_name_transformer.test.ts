import { describe, expect, it, vi } from "vitest";
import { createSanitiseNameTransformer } from "../../../src/transformers/sanitise_name_transformer";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

const upperCase = (s: string): string => s.toUpperCase();
const prefixed = (s: string): string => `x_${s}`;

describe("createSanitiseNameTransformer", () => {
  it("always sanitizes the name", () => {
    const transform = createSanitiseNameTransformer(upperCase);
    const entry = createTransformEntry({ name: "kick.wav" });
    transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("KICK.WAV");
  });

  it("sanitizes packageName when the entry has one", () => {
    const transform = createSanitiseNameTransformer(upperCase);
    const entry = createTransformEntry({ name: "kick.wav", packageName: "my-pack" });
    transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("MY-PACK");
  });

  it("sanitizes sampleType when the entry has one", () => {
    const transform = createSanitiseNameTransformer(upperCase);
    const entry = createTransformEntry({ name: "kick.wav", sampleType: "drums" });
    transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("DRUMS");
  });

  it("does not call setPackageName when packageName is undefined", () => {
    const transform = createSanitiseNameTransformer(upperCase);
    const entry = createTransformEntry({ name: "kick.wav" });
    transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not call setSampleType when sampleType is undefined", () => {
    const transform = createSanitiseNameTransformer(upperCase);
    const entry = createTransformEntry({ name: "kick.wav" });
    transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("applies the sanitizer function to all present fields", () => {
    const sanitize = vi.fn<(s: string) => string>(prefixed);
    const transform = createSanitiseNameTransformer(sanitize);
    const entry = createTransformEntry({ name: "kick.wav", packageName: "pack", sampleType: "drums" });
    transform(singleEntryTransformSource(entry));
    expect(sanitize).toHaveBeenCalledTimes(3);
    expect(entry.setName).toHaveBeenCalledWith("x_kick.wav");
    expect(entry.setPackageName).toHaveBeenCalledWith("x_pack");
    expect(entry.setSampleType).toHaveBeenCalledWith("x_drums");
  });

  it("does not call setSkipped or setKeepStructure", () => {
    const transform = createSanitiseNameTransformer(upperCase);
    const entry = createTransformEntry({ name: "kick.wav", packageName: "pack", sampleType: "drums" });
    transform(singleEntryTransformSource(entry));
    expect(entry.setSkipped).not.toHaveBeenCalled();
    expect(entry.setKeepStructure).not.toHaveBeenCalled();
  });

  it("does not sanitize any fields when keepStructure is true", () => {
    const transform = createSanitiseNameTransformer(upperCase);
    const entry = createTransformEntry({ name: "kick.wav", packageName: "pack", sampleType: "drums", keepStructure: true });
    transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not sanitize any fields when skipped is true", () => {
    const transform = createSanitiseNameTransformer(upperCase);
    const entry = createTransformEntry({ name: "kick.wav", packageName: "pack", sampleType: "drums", skipped: true });
    transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });
});
