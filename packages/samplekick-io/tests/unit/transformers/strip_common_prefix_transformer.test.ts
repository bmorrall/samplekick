import { describe, expect, it, vi } from "vitest";
import { createStripCommonPrefixTransformer } from "../../../src";
import type { FileNode, TransformEntry, TransformSource } from "../../../src";
import { createTransformEntry } from "../../support";

const transformer = createStripCommonPrefixTransformer();

const makeParentStub = (path = "Kit Folder"): FileNode => ({
  getPath: () => path,
  getName: () => path,
  getPackageName: () => undefined,
  getSampleType: () => undefined,
  isEnabled: () => false,
  isFile: () => false,
  getParentNode: () => undefined,
  getChildNodes: () => [],
});

const makeDir = (
  children: TransformEntry[],
  opts: { path?: string; parent?: FileNode } = {},
): TransformEntry => {
  const parent = opts.parent ?? makeParentStub();
  const path = opts.path ?? "Kit Folder/Kit";
  return {
    ...createTransformEntry({ name: "Kit", path, isFile: false }),
    getParentNode: () => parent,
    getChildNodes: () => children,
    setPackageName: vi.fn<(name: string | undefined) => void>(),
    setSampleType: vi.fn<(name: string | undefined) => void>(),
    setName: vi.fn<(name: string | undefined) => void>(),
    setEnabled: vi.fn<(value: boolean) => void>(),
    setReadOnly: vi.fn<(value: boolean) => void>(),
  };
};

const makeChild = (
  name: string,
  opts: { readOnly?: boolean; parentPath?: string } = {},
): TransformEntry => {
  const parent = makeParentStub(opts.parentPath ?? "Kit Folder/Kit");
  return createTransformEntry({
    name,
    path: `Kit Folder/Kit/${name}`,
    isFile: true,
    parentNode: parent,
  });
};

const makeSource = (
  dirEntry: TransformEntry,
  childEntries: TransformEntry[],
): TransformSource => ({
  eachTransformEntry: (fn) => {
    fn(dirEntry);
  },
  eachTransformModification: (fn) => {
    childEntries.filter((c) => c.isReadOnly() !== true).forEach(fn);
  },
});

describe("createStripCommonPrefixTransformer", () => {
  describe("happy path", () => {
    it("strips the common prefix from all audio children", () => {
      const c1 = makeChild(
        "Ghosthack - OSS Kit Aftershock Bass Loop Gmin 140bpm.wav",
      );
      const c2 = makeChild(
        "Ghosthack - OSS Kit Aftershock Chords Loop Gmin 140bpm.wav",
      );
      const c3 = makeChild(
        "Ghosthack - OSS Kit Aftershock Pad Loop Gmin 140bpm.wav",
      );
      const dir = makeDir([c1, c2, c3]);

      transformer.transform(makeSource(dir, [c1, c2, c3]));

      expect(c1.setName).toHaveBeenCalledWith("Bass Loop Gmin 140bpm.wav");
      expect(c2.setName).toHaveBeenCalledWith("Chords Loop Gmin 140bpm.wav");
      expect(c3.setName).toHaveBeenCalledWith("Pad Loop Gmin 140bpm.wav");
    });

    it("handles underscore-delimited prefixes", () => {
      const c1 = makeChild("KIT_001_Kick.wav");
      const c2 = makeChild("KIT_001_Snare.wav");
      const c3 = makeChild("KIT_001_HiHat.wav");
      const dir = makeDir([c1, c2, c3]);

      transformer.transform(makeSource(dir, [c1, c2, c3]));

      expect(c1.setName).toHaveBeenCalledWith("Kick.wav");
      expect(c2.setName).toHaveBeenCalledWith("Snare.wav");
      expect(c3.setName).toHaveBeenCalledWith("HiHat.wav");
    });

    it("also strips non-audio children that share the prefix", () => {
      const c1 = makeChild("Brand Kit Bass.wav");
      const c2 = makeChild("Brand Kit Snare.wav");
      const c3 = makeChild("Brand Kit README.txt");
      const dir = makeDir([c1, c2, c3]);

      transformer.transform(makeSource(dir, [c1, c2, c3]));

      expect(c1.setName).toHaveBeenCalledWith("Bass.wav");
      expect(c2.setName).toHaveBeenCalledWith("Snare.wav");
      expect(c3.setName).toHaveBeenCalledWith("README.txt");
    });
  });

  describe("does not act when", () => {
    it("directory is root (no parent)", () => {
      const c1 = makeChild("Brand Kit Bass.wav");
      const c2 = makeChild("Brand Kit Snare.wav");
      const rootDir: TransformEntry = {
        ...createTransformEntry({ name: "root", path: "", isFile: false }),
        getParentNode: () => undefined,
        getChildNodes: () => [c1, c2],
        setName: vi.fn<(name: string | undefined) => void>(),
        setPackageName: vi.fn<(name: string | undefined) => void>(),
        setSampleType: vi.fn<(name: string | undefined) => void>(),
        setEnabled: vi.fn<(value: boolean) => void>(),
        setReadOnly: vi.fn<(value: boolean) => void>(),
      };

      transformer.transform(makeSource(rootDir, [c1, c2]));

      expect(c1.setName).not.toHaveBeenCalled();
      expect(c2.setName).not.toHaveBeenCalled();
    });

    it("fewer than two audio files in the directory", () => {
      const c1 = makeChild("Kit Bass.wav");
      const dir = makeDir([c1]);

      transformer.transform(makeSource(dir, [c1]));

      expect(c1.setName).not.toHaveBeenCalled();
    });

    it("audio files share no common prefix ending at a word boundary", () => {
      const c1 = makeChild("Alpha.wav");
      const c2 = makeChild("Bravo.wav");
      const dir = makeDir([c1, c2]);

      transformer.transform(makeSource(dir, [c1, c2]));

      expect(c1.setName).not.toHaveBeenCalled();
      expect(c2.setName).not.toHaveBeenCalled();
    });

    it("common raw prefix has no word boundary separator", () => {
      const c1 = makeChild("ABCKick.wav");
      const c2 = makeChild("ABCSnare.wav");
      const dir = makeDir([c1, c2]);

      transformer.transform(makeSource(dir, [c1, c2]));

      expect(c1.setName).not.toHaveBeenCalled();
      expect(c2.setName).not.toHaveBeenCalled();
    });

    it("does not strip a non-audio child whose name does not start with the prefix", () => {
      // Two audio files give the prefix; a non-audio file with a different name is untouched.
      const c1 = makeChild("Brand Kit Bass.wav");
      const c2 = makeChild("Brand Kit Snare.wav");
      const c3 = makeChild("Other README.txt");
      const dir = makeDir([c1, c2, c3]);

      transformer.transform(makeSource(dir, [c1, c2, c3]));

      expect(c1.setName).toHaveBeenCalledWith("Bass.wav");
      expect(c2.setName).toHaveBeenCalledWith("Snare.wav");
      expect(c3.setName).not.toHaveBeenCalled();
    });
  });
});
