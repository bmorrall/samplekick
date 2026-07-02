import { describe, expect, it } from "vitest";
import { createTruncateNameTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

describe("createTruncateNameTransformer", () => {
  it("leaves names within the limit unchanged", () => {
    const entry = createTransformEntry({ name: "kick.wav" });
    createTruncateNameTransformer(10).transform(
      singleEntryTransformSource(entry),
    );
    expect(entry.setName).toHaveBeenCalledWith("kick.wav");
  });

  it("does not truncate a name that is exactly at the limit", () => {
    const entry = createTransformEntry({ name: "1234567890" });
    createTruncateNameTransformer(10).transform(
      singleEntryTransformSource(entry),
    );
    expect(entry.setName).toHaveBeenCalledWith("1234567890");
  });

  it("truncates a long name with no extension to the max length", () => {
    const entry = createTransformEntry({ name: "x".repeat(90) });
    createTruncateNameTransformer(80).transform(
      singleEntryTransformSource(entry),
    );
    expect(entry.setName).toHaveBeenCalledWith("x".repeat(80));
  });

  it("truncates a long name while preserving the extension", () => {
    const entry = createTransformEntry({ name: `${"x".repeat(90)}.wav` });
    createTruncateNameTransformer(80).transform(
      singleEntryTransformSource(entry),
    );
    expect(entry.setName).toHaveBeenCalledWith(`${"x".repeat(76)}.wav`);
  });

  it("truncates when the extension itself is at the max length", () => {
    const entry = createTransformEntry({ name: `abc.${"x".repeat(80)}` });
    createTruncateNameTransformer(80).transform(
      singleEntryTransformSource(entry),
    );
    expect(entry.setName).toHaveBeenCalledWith(
      `abc.${"x".repeat(80)}`.slice(0, 80),
    );
  });

  it("also truncates packageName when present", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      packageName: "x".repeat(90),
    });
    createTruncateNameTransformer(80).transform(
      singleEntryTransformSource(entry),
    );
    expect(entry.setPackageName).toHaveBeenCalledWith("x".repeat(80));
  });

  it("also truncates sampleType when present", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      sampleType: "x".repeat(90),
    });
    createTruncateNameTransformer(80).transform(
      singleEntryTransformSource(entry),
    );
    expect(entry.setSampleType).toHaveBeenCalledWith("x".repeat(80));
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({
      name: "x".repeat(90),
      readOnly: true,
    });
    createTruncateNameTransformer(80).transform(
      singleEntryTransformSource(entry),
    );
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("does not modify any fields when skipped is true", () => {
    const entry = createTransformEntry({
      name: "x".repeat(90),
      enabled: false,
    });
    createTruncateNameTransformer(80).transform(
      singleEntryTransformSource(entry),
    );
    expect(entry.setName).not.toHaveBeenCalled();
  });
});
