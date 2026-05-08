import { describe, expect, it } from "vitest";
import { createGhosthackNameTransformer } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

describe("createGhosthackNameTransformer", () => {
  it('normalises "Ghosthack-Pack Name.wav" to include spaced hyphen', () => {
    const entry = createTransformEntry({ name: "Ghosthack-Bass Loops.wav" });
    createGhosthackNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Ghosthack - Bass Loops.wav");
  });

  it('normalises "Ghosthack- Pack Name.wav" (space only after hyphen)', () => {
    const entry = createTransformEntry({ name: "Ghosthack- Bass Loops.wav" });
    createGhosthackNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Ghosthack - Bass Loops.wav");
  });

  it('normalises "Ghosthack -Pack Name.wav" (space only before hyphen)', () => {
    const entry = createTransformEntry({ name: "Ghosthack -Bass Loops.wav" });
    createGhosthackNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Ghosthack - Bass Loops.wav");
  });

  it('normalises "Ghosthack Pack Name" (no hyphen at all)', () => {
    const entry = createTransformEntry({ name: "Ghosthack Bass Loops" });
    createGhosthackNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Ghosthack - Bass Loops");
  });

  it('leaves "Ghosthack - Pack Name" unchanged', () => {
    const entry = createTransformEntry({ name: "Ghosthack - Bass Loops" });
    createGhosthackNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Ghosthack - Bass Loops");
  });

  it("matches case-insensitively", () => {
    const entry = createTransformEntry({ name: "GHOSTHACK-Bass Loops" });
    createGhosthackNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Ghosthack - Bass Loops");
  });

  it("does not act on names that do not start with Ghosthack", () => {
    const entry = createTransformEntry({ name: "Some Other Pack.wav" });
    createGhosthackNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Some Other Pack.wav");
  });

  it("normalises packageName when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", packageName: "Ghosthack-Bass Loops" });
    createGhosthackNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Ghosthack - Bass Loops");
  });

  it("normalises sampleType when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", sampleType: "Ghosthack-Drums" });
    createGhosthackNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Ghosthack - Drums");
  });

  it("does not call setPackageName when packageName is undefined", () => {
    const entry = createTransformEntry({ name: "Ghosthack-Pack.wav" });
    createGhosthackNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not call setSampleType when sampleType is undefined", () => {
    const entry = createTransformEntry({ name: "Ghosthack-Pack.wav" });
    createGhosthackNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not call setSkipped or setKeepStructure", () => {
    const entry = createTransformEntry({ name: "Ghosthack-Pack.wav" });
    createGhosthackNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setSkipped).not.toHaveBeenCalled();
    expect(entry.setKeepStructure).not.toHaveBeenCalled();
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({ name: "Ghosthack-Pack.wav", packageName: "Ghosthack-Pack", keepStructure: true });
    createGhosthackNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });
});
