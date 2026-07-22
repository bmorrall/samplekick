import { describe, expect, it } from "vitest";
import { createStripCymaticsPrefixTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

describe("createStripCymaticsPrefixTransformer", () => {
  it('strips "Cymatics-" prefix from a file name', () => {
    const entry = createTransformEntry({ name: "Cymatics-Bass Loop.wav" });
    const transformer = createStripCymaticsPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Bass Loop.wav");
  });

  it('strips "Cymatics - " prefix (spaced hyphen) from a file name', () => {
    const entry = createTransformEntry({ name: "Cymatics - Bass Loop.wav" });
    const transformer = createStripCymaticsPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Bass Loop.wav");
  });

  it('strips "Cymatics_" prefix from a file name', () => {
    const entry = createTransformEntry({ name: "Cymatics_Bass Loop.wav" });
    const transformer = createStripCymaticsPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Bass Loop.wav");
  });

  it('strips "Cymatics " prefix (no hyphen) from a file name', () => {
    const entry = createTransformEntry({ name: "Cymatics Bass Loop.wav" });
    const transformer = createStripCymaticsPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Bass Loop.wav");
  });

  it("matches case-insensitively", () => {
    const entry = createTransformEntry({ name: "CYMATICS-Bass Loop.wav" });
    const transformer = createStripCymaticsPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Bass Loop.wav");
  });

  it("does not act on names that do not start with Cymatics", () => {
    const entry = createTransformEntry({ name: "Some Other Pack.wav" });
    const transformer = createStripCymaticsPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it('leaves "Cymatics x Collab Name" unchanged (cross-collab prefix)', () => {
    const entry = createTransformEntry({
      name: "Cymatics x Boom - Sci-Fi Horror FX & Foley.wav",
    });
    const transformer = createStripCymaticsPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("does not act on skipped directories", () => {
    const entry = createTransformEntry({
      name: "Cymatics - Bass Loops",
      isFile: false,
      enabled: true,
      packageName: "Cymatics - Bass Loops",
    });
    const transformer = createStripCymaticsPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("strips the prefix from a directory whose own packageName is a Cymatics pack", () => {
    const entry = createTransformEntry({
      name: "Cymatics - Bass Loops",
      isFile: false,
      packageName: "Cymatics - Bass Loops",
    });
    const transformer = createStripCymaticsPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Bass Loops");
  });

  it("does not strip a directory whose packageName is undefined", () => {
    const entry = createTransformEntry({
      name: "Cymatics - Bass Loops",
      isFile: false,
    });
    const transformer = createStripCymaticsPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("does not strip a directory whose packageName does not reference Cymatics", () => {
    const entry = createTransformEntry({
      name: "Cymatics - Bass Loops",
      isFile: false,
      packageName: "Ghosthack - Bass Loops",
    });
    const transformer = createStripCymaticsPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("leaves a Cymatics-tagged directory's collab name unchanged", () => {
    const entry = createTransformEntry({
      name: "Cymatics x Boom - Sci-Fi Horror FX",
      isFile: false,
      packageName: "Cymatics - Sci-Fi Horror FX",
    });
    const transformer = createStripCymaticsPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("does not call setPackageName or setSampleType for a tagged directory", () => {
    const entry = createTransformEntry({
      name: "Cymatics - Bass Loops",
      isFile: false,
      packageName: "Cymatics - Bass Loops",
      sampleType: "Cymatics - Drums",
    });
    const transformer = createStripCymaticsPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not call setPackageName or setSampleType (file names only)", () => {
    const entry = createTransformEntry({
      name: "Cymatics-Bass Loop.wav",
      packageName: "Cymatics-Bass Loops",
      sampleType: "Cymatics-Drums",
    });
    const transformer = createStripCymaticsPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not modify the name when keepStructure is true", () => {
    const entry = createTransformEntry({
      name: "Cymatics-Bass Loop.wav",
      readOnly: true,
    });
    const transformer = createStripCymaticsPrefixTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });
});
