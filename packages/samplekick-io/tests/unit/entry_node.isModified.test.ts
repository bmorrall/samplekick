import { describe, it, expect } from "vitest";
import { EntryNode } from "../../src/registry/entry_node";
import type { FileEntry } from "../../src/types";

function makeFileEntry(path: string): FileEntry {
  return {
    getPath: () => path,
    getName: () => path.split("/").at(-1) ?? path,
    // eslint-disable-next-line @typescript-eslint/require-await -- stub that always throws
    copyToPath: async () => {
      /* v8 ignore next */
      throw new Error("Not implemented");
    },
  };
}

describe("EntryNode.isModified", () => {
  describe("blank directory node (enabled defaults to false)", () => {
    it("returns false with no changes", () => {
      const node = EntryNode.blankEntry("folder");
      expect(node.isModified()).toBe(false);
    });

    it("returns false when setEnabled is called with the directory default (false)", () => {
      const node = EntryNode.blankEntry("folder");
      node.setEnabled(false);
      expect(node.isModified()).toBe(false);
    });

    it("returns true when enabled is set to true", () => {
      const node = EntryNode.blankEntry("folder");
      node.setEnabled(true);
      expect(node.isModified()).toBe(true);
    });
  });

  describe("file node (enabled defaults to true)", () => {
    it("returns false with no changes", () => {
      const node = EntryNode.fromEntry(makeFileEntry("folder/track.wav"));
      expect(node.isModified()).toBe(false);
    });

    it("returns false when setEnabled is called with the file default (true)", () => {
      const node = EntryNode.fromEntry(makeFileEntry("folder/track.wav"));
      node.setEnabled(true);
      expect(node.isModified()).toBe(false);
    });

    it("returns true when enabled is set to false", () => {
      const node = EntryNode.fromEntry(makeFileEntry("folder/track.wav"));
      node.setEnabled(false);
      expect(node.isModified()).toBe(true);
    });
  });

  describe("name changes", () => {
    it("returns false when setName is called with the same value as the path basename", () => {
      // sanitise-name transformers call setName unconditionally — setting
      // the name to the same value as the basename must not count as modified
      const node = EntryNode.blankEntry("folder/track.wav");
      node.setName("track.wav");
      expect(node.isModified()).toBe(false);
    });

    it("returns true when setName is called with a value that differs from the path basename", () => {
      const node = EntryNode.blankEntry("folder/track.wav");
      node.setName("Renamed Track");
      expect(node.isModified()).toBe(true);
    });

    it("returns false when setName is cleared back to undefined", () => {
      const node = EntryNode.blankEntry("folder/track.wav");
      node.setName("Renamed Track");
      node.setName(undefined);
      expect(node.isModified()).toBe(false);
    });
  });

  describe("packageName", () => {
    it("returns true when packageName is set", () => {
      const node = EntryNode.blankEntry("folder");
      node.setPackageName("my-pack");
      expect(node.isModified()).toBe(true);
    });

    it("returns false when packageName is cleared back to undefined", () => {
      const node = EntryNode.blankEntry("folder");
      node.setPackageName("my-pack");
      node.setPackageName(undefined);
      expect(node.isModified()).toBe(false);
    });
  });

  describe("sampleType", () => {
    it("returns true when sampleType is set", () => {
      const node = EntryNode.blankEntry("folder");
      node.setSampleType("Loops");
      expect(node.isModified()).toBe(true);
    });

    it("returns false when sampleType is cleared back to undefined", () => {
      const node = EntryNode.blankEntry("folder");
      node.setSampleType("Loops");
      node.setSampleType(undefined);
      expect(node.isModified()).toBe(false);
    });
  });
});
