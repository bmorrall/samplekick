import { describe, expect, it } from "vitest";
import { createCymaticsNameTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

const transformer = createCymaticsNameTransformer();

describe("createCymaticsNameTransformer", () => {
  it('normalises "Cymatics-Pack Name.wav" to include spaced hyphen', () => {
    const entry = createTransformEntry({ name: "Cymatics-Bass Loops.wav" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Cymatics - Bass Loops.wav");
  });

  it('normalises "Cymatics- Pack Name.wav" (space only after hyphen)', () => {
    const entry = createTransformEntry({ name: "Cymatics- Bass Loops.wav" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Cymatics - Bass Loops.wav");
  });

  it('normalises "Cymatics -Pack Name.wav" (space only before hyphen)', () => {
    const entry = createTransformEntry({ name: "Cymatics -Bass Loops.wav" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Cymatics - Bass Loops.wav");
  });

  it('normalises "Cymatics Pack Name" (no hyphen at all)', () => {
    const entry = createTransformEntry({ name: "Cymatics Bass Loops" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Cymatics - Bass Loops");
  });

  it('leaves "Cymatics - Pack Name" unchanged', () => {
    const entry = createTransformEntry({ name: "Cymatics - Bass Loops" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Cymatics - Bass Loops");
  });

  it("matches case-insensitively", () => {
    const entry = createTransformEntry({ name: "CYMATICS-Bass Loops" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Cymatics - Bass Loops");
  });

  it("does not act on names that do not start with Cymatics", () => {
    const entry = createTransformEntry({ name: "Some Other Pack.wav" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Some Other Pack.wav");
  });

  it("normalises packageName when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      packageName: "Cymatics-Bass Loops",
    });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Cymatics - Bass Loops");
  });

  it("normalises sampleType when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      sampleType: "Cymatics-Drums",
    });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Cymatics - Drums");
  });

  it("does not call setPackageName when packageName is undefined", () => {
    const entry = createTransformEntry({ name: "Cymatics-Pack.wav" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not call setSampleType when sampleType is undefined", () => {
    const entry = createTransformEntry({ name: "Cymatics-Pack.wav" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not call setSkipped or setKeepStructure", () => {
    const entry = createTransformEntry({ name: "Cymatics-Pack.wav" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSkipped).not.toHaveBeenCalled();
    expect(entry.setKeepStructure).not.toHaveBeenCalled();
  });

  it('leaves "Cymatics x Collab Name" unchanged (cross-collab prefix)', () => {
    const entry = createTransformEntry({
      name: "Cymatics x Splice - Future Bass",
    });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith(
      "Cymatics x Splice - Future Bass",
    );
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({
      name: "Cymatics-Pack.wav",
      packageName: "Cymatics-Pack",
      keepStructure: true,
    });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });
});
