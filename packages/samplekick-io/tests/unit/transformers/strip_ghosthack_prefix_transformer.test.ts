import { describe, expect, it } from "vitest";
import { createStripGhosthackPrefixTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

describe("createStripGhosthackPrefixTransformer", () => {
  it('strips "Ghosthack-" prefix from a file name', () => {
    const entry = createTransformEntry({ name: "Ghosthack-Bass Loop.wav" });
    const transformer = createStripGhosthackPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Bass Loop.wav");
  });

  it('strips "Ghosthack - " prefix (spaced hyphen) from a file name', () => {
    const entry = createTransformEntry({ name: "Ghosthack - Bass Loop.wav" });
    const transformer = createStripGhosthackPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Bass Loop.wav");
  });

  it('strips "Ghosthack_" prefix from a file name', () => {
    const entry = createTransformEntry({ name: "Ghosthack_Bass Loop.wav" });
    const transformer = createStripGhosthackPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Bass Loop.wav");
  });

  it('strips "Ghosthack " prefix (no hyphen) from a file name', () => {
    const entry = createTransformEntry({ name: "Ghosthack Bass Loop.wav" });
    const transformer = createStripGhosthackPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Bass Loop.wav");
  });

  it("matches case-insensitively", () => {
    const entry = createTransformEntry({ name: "GHOSTHACK-Bass Loop.wav" });
    const transformer = createStripGhosthackPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Bass Loop.wav");
  });

  it("does not act on names that do not start with Ghosthack", () => {
    const entry = createTransformEntry({ name: "Some Other Pack.wav" });
    const transformer = createStripGhosthackPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it('leaves "Ghosthack x Collab Name" unchanged (cross-collab prefix)', () => {
    const entry = createTransformEntry({
      name: "Ghosthack x Boom - Sci-Fi Horror FX & Foley.wav",
    });
    const transformer = createStripGhosthackPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("does not act on skipped directories", () => {
    const entry = createTransformEntry({
      name: "Ghosthack - Bass Loops",
      isFile: false,
      enabled: true,
      packageName: "Ghosthack - Bass Loops",
    });
    const transformer = createStripGhosthackPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("strips the prefix from a directory whose own packageName is a Ghosthack pack", () => {
    const entry = createTransformEntry({
      name: "Ghosthack - Bass Loops",
      isFile: false,
      packageName: "Ghosthack - Bass Loops",
    });
    const transformer = createStripGhosthackPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Bass Loops");
  });

  it("does not strip a directory whose packageName is undefined", () => {
    const entry = createTransformEntry({
      name: "Ghosthack - Bass Loops",
      isFile: false,
    });
    const transformer = createStripGhosthackPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("does not strip a directory whose packageName does not reference Ghosthack", () => {
    const entry = createTransformEntry({
      name: "Ghosthack - Bass Loops",
      isFile: false,
      packageName: "Cymatics - Bass Loops",
    });
    const transformer = createStripGhosthackPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("leaves a Ghosthack-tagged directory's collab name unchanged", () => {
    const entry = createTransformEntry({
      name: "Ghosthack x Boom - Sci-Fi Horror FX",
      isFile: false,
      packageName: "Ghosthack - Sci-Fi Horror FX",
    });
    const transformer = createStripGhosthackPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("does not call setPackageName or setSampleType for a tagged directory", () => {
    const entry = createTransformEntry({
      name: "Ghosthack - Bass Loops",
      isFile: false,
      packageName: "Ghosthack - Bass Loops",
      sampleType: "Ghosthack - Drums",
    });
    const transformer = createStripGhosthackPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not call setPackageName or setSampleType (file names only)", () => {
    const entry = createTransformEntry({
      name: "Ghosthack-Bass Loop.wav",
      packageName: "Ghosthack-Bass Loops",
      sampleType: "Ghosthack-Drums",
    });
    const transformer = createStripGhosthackPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not modify the name when keepStructure is true", () => {
    const entry = createTransformEntry({
      name: "Ghosthack-Bass Loop.wav",
      readOnly: true,
    });
    const transformer = createStripGhosthackPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });
});
