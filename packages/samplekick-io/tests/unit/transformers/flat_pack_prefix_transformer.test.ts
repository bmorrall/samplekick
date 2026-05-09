import { describe, expect, it, vi } from "vitest";
import { createFlatPackPrefixTransformer } from "../../../src";
import type { FileNode, TransformEntry, TransformSource } from "../../../src";
import { createTransformEntry } from "../../support";

// Minimal root FileNode stub — the parentNode used by all child entries.
// Its path must match the dir entry's path so stripPrefixByParentPath lookup succeeds.
const makeRootStub = (): FileNode => ({
  getPath: () => "",
  getName: () => "root",
  getPackageName: () => undefined,
  getSampleType: () => undefined,
  isSkipped: () => undefined,
  isKeepStructure: () => undefined,
  isFile: () => false,
  getParentNode: () => undefined,
  getChildNodes: () => [],
});

/**
 * Builds a TransformSource for a flat directory scenario:
 * - eachTransformEntry visits the directory entry (root, no parent)
 * - eachTransformModification visits non-keepStructure children (mirroring registry behaviour)
 */
const createFlatPackSource = (
  dirEntry: TransformEntry,
  childEntries: TransformEntry[],
): TransformSource => ({
  eachTransformEntry: (fn) => { fn(dirEntry); },
  eachTransformModification: (fn) => {
    childEntries.filter((c) => c.isKeepStructure() !== true).forEach(fn);
  },
});

const makeDir = (
  children: TransformEntry[],
  opts: { sampleType?: string } = {},
): TransformEntry => ({
  ...createTransformEntry({ name: "root", path: "", isFile: false }),
  getSampleType: () => opts.sampleType,
  getOwnSampleType: () => opts.sampleType,
  getParentNode: () => undefined,
  getChildNodes: () => children,
  setPackageName: vi.fn<(name: string | undefined) => void>(),
  setSampleType: vi.fn<(name: string | undefined) => void>(),
  setName: vi.fn<(name: string | undefined) => void>(),
  setSkipped: vi.fn<(skipped: boolean) => void>(),
  setKeepStructure: vi.fn<(value: boolean) => void>(),
});

const makeChild = (
  name: string,
  opts: { path?: string; keepStructure?: boolean; skipped?: boolean } = {},
): TransformEntry => {
  const rootStub = makeRootStub();
  return createTransformEntry({
    name,
    path: opts.path ?? name,
    keepStructure: opts.keepStructure,
    skipped: opts.skipped,
    isFile: true,
    parentNode: rootStub,
  });
};

describe("createFlatPackPrefixTransformer", () => {
  describe("happy path", () => {
    it("sets packageName to the shared prefix and sampleType to Packs", () => {
      const c1 = makeChild("Sounds by Sunwarper - SP404 Pack - 01 D4.wav");
      const c2 = makeChild("Sounds by Sunwarper - SP404 Pack - 02 E4.wav");
      const dir = makeDir([c1, c2]);

      createFlatPackPrefixTransformer(createFlatPackSource(dir, [c1, c2]));

      expect(dir.setPackageName).toHaveBeenCalledWith("Sounds by Sunwarper - SP404 Pack");
      expect(dir.setSampleType).toHaveBeenCalledWith("Packs");
    });

    it("strips the shared prefix from all children that carry it", () => {
      const c1 = makeChild("Sounds by Sunwarper - SP404 Pack - 01 D4.wav");
      const c2 = makeChild("Sounds by Sunwarper - SP404 Pack - 02 E4.wav");
      const dir = makeDir([c1, c2]);

      createFlatPackPrefixTransformer(createFlatPackSource(dir, [c1, c2]));

      expect(c1.setName).toHaveBeenCalledWith("01 D4.wav");
      expect(c2.setName).toHaveBeenCalledWith("02 E4.wav");
    });

    it("also strips the prefix from non-audio files that carry it", () => {
      const c1 = makeChild("Sounds by Sunwarper - SP404 Pack - 01 D4.wav");
      const c2 = makeChild("Sounds by Sunwarper - SP404 Pack - 02 E4.wav");
      const c3 = makeChild("Sounds by Sunwarper - SP404 Pack - LICENSE.pdf");
      const dir = makeDir([c1, c2, c3]);

      createFlatPackPrefixTransformer(createFlatPackSource(dir, [c1, c2, c3]));

      expect(c3.setName).toHaveBeenCalledWith("LICENSE.pdf");
    });

    it("does not strip the prefix from children that do not carry it", () => {
      const c1 = makeChild("Sounds by Sunwarper - SP404 Pack - 01 D4.wav");
      const c2 = makeChild("Sounds by Sunwarper - SP404 Pack - 02 E4.wav");
      const c3 = makeChild("album.jpg");
      const dir = makeDir([c1, c2, c3]);

      createFlatPackPrefixTransformer(createFlatPackSource(dir, [c1, c2, c3]));

      expect(c3.setName).not.toHaveBeenCalled();
    });

    it("uses the path for audio extension detection, not just the name", () => {
      const c1 = makeChild("Pack - 01 kick", { path: "root/Pack - 01 kick.wav" });
      const c2 = makeChild("Pack - 02 snare", { path: "root/Pack - 02 snare.AIFF" });
      const dir = makeDir([c1, c2]);

      createFlatPackPrefixTransformer(createFlatPackSource(dir, [c1, c2]));

      expect(dir.setSampleType).toHaveBeenCalledWith("Packs");
    });
  });

  describe("does not act", () => {
    it("does not act when sampleType is already set on the directory", () => {
      const c1 = makeChild("Pack - 01 kick.wav");
      const c2 = makeChild("Pack - 02 snare.wav");
      const dir = makeDir([c1, c2], { sampleType: "Drums" });

      createFlatPackPrefixTransformer(createFlatPackSource(dir, [c1, c2]));

      expect(dir.setPackageName).not.toHaveBeenCalled();
      expect(dir.setSampleType).not.toHaveBeenCalled();
      expect(c1.setName).not.toHaveBeenCalled();
    });

    it("does not act when there is fewer than 2 audio files", () => {
      const c1 = makeChild("Pack - 01 kick.wav");
      const c2 = makeChild("Pack - LICENSE.pdf");
      const dir = makeDir([c1, c2]);

      createFlatPackPrefixTransformer(createFlatPackSource(dir, [c1, c2]));

      expect(dir.setSampleType).not.toHaveBeenCalled();
      expect(c1.setName).not.toHaveBeenCalled();
    });

    it("does not act when audio files share no ' - ' boundary in their common prefix", () => {
      const c1 = makeChild("Pack01 kick.wav");
      const c2 = makeChild("Pack02 snare.wav");
      const dir = makeDir([c1, c2]);

      createFlatPackPrefixTransformer(createFlatPackSource(dir, [c1, c2]));

      expect(dir.setSampleType).not.toHaveBeenCalled();
      expect(c1.setName).not.toHaveBeenCalled();
    });

    it("does not act when any child is a sub-directory (non-flat)", () => {
      const rootStub = makeRootStub();
      const grandchild = createTransformEntry({ name: "kick.wav", path: "subdir/kick.wav", isFile: true });
      const subDirEntry = createTransformEntry({ name: "subdir", path: "subdir", isFile: false, parentNode: rootStub });
      const subDirWithChild: TransformEntry = {
        ...subDirEntry,
        getChildNodes: () => [grandchild],
      };
      const c1 = makeChild("Pack - 01 kick.wav");
      const dir = makeDir([subDirWithChild, c1]);

      createFlatPackPrefixTransformer(createFlatPackSource(dir, [subDirWithChild, c1]));

      expect(dir.setSampleType).not.toHaveBeenCalled();
    });

    it("does not act when the entry has a parent (non-root)", () => {
      const rootStub = makeRootStub();
      const c1 = makeChild("Pack - 01 kick.wav");
      const c2 = makeChild("Pack - 02 snare.wav");
      // Non-root dir: has a parent
      const nonRootDir: TransformEntry = {
        ...makeDir([c1, c2]),
        getParentNode: () => rootStub,
      };

      createFlatPackPrefixTransformer(createFlatPackSource(nonRootDir, [c1, c2]));

      expect(nonRootDir.setSampleType).not.toHaveBeenCalled();
      expect(c1.setName).not.toHaveBeenCalled();
    });
  });

  describe("keepStructure / skipped children", () => {
    it("does not rename a keepStructure child even if it carries the prefix", () => {
      const c1 = makeChild("Pack - 01 kick.wav");
      const c2 = makeChild("Pack - 02 snare.wav");
      const c3 = makeChild("Pack - project.mid", { keepStructure: true });
      const dir = makeDir([c1, c2, c3]);

      createFlatPackPrefixTransformer(createFlatPackSource(dir, [c1, c2, c3]));

      expect(c3.setName).not.toHaveBeenCalled();
    });

    it("never calls setKeepStructure", () => {
      const c1 = makeChild("Pack - 01 kick.wav");
      const c2 = makeChild("Pack - 02 snare.wav");
      const dir = makeDir([c1, c2]);

      createFlatPackPrefixTransformer(createFlatPackSource(dir, [c1, c2]));

      expect(dir.setKeepStructure).not.toHaveBeenCalled();
      expect(c1.setKeepStructure).not.toHaveBeenCalled();
      expect(c2.setKeepStructure).not.toHaveBeenCalled();
    });
  });
});
