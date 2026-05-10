import { describe, expect, it } from "vitest";
import { createSP404Mk2ProjectTransformer } from "../../../src";
import { createTransformEntry, createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("createSP404Mk2ProjectTransformer", () => {
  describe("when a directory has a SMPL child", () => {
    it("sets sampleType to SP-404MKII Projects", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "MY_PROJECT", isFile: false },
        [{ name: "SMPL" }],
      );
      createSP404Mk2ProjectTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("SP-404MKII Projects");
    });

    it("sets keepStructure to true", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "MY_PROJECT", isFile: false },
        [{ name: "SMPL" }],
      );
      createSP404Mk2ProjectTransformer(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("matches SMPL case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "MY_PROJECT", isFile: false },
        [{ name: "smpl" }],
      );
      createSP404Mk2ProjectTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("SP-404MKII Projects");
    });
  });

  describe("when a directory has a PTN child", () => {
    it("sets sampleType to SP-404MKII Projects", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "MY_PROJECT", isFile: false },
        [{ name: "PTN" }],
      );
      createSP404Mk2ProjectTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("SP-404MKII Projects");
    });

    it("sets keepStructure to true", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "MY_PROJECT", isFile: false },
        [{ name: "PTN" }],
      );
      createSP404Mk2ProjectTransformer(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("matches PTN case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "MY_PROJECT", isFile: false },
        [{ name: "ptn" }],
      );
      createSP404Mk2ProjectTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("SP-404MKII Projects");
    });
  });

  describe("when neither SMPL nor PTN child is present", () => {
    it("does not set sampleType or keepStructure", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "MY_PROJECT", isFile: false },
        [{ name: "PICTURE" }],
      );
      createSP404Mk2ProjectTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe("when the entry has no children", () => {
    it("does not set sampleType or keepStructure", () => {
      const entry = createTransformEntry({ name: "MY_PROJECT" });
      createSP404Mk2ProjectTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });
});
