import { describe, expect, it, vi } from "vitest";
import { createConstructionKitTransformer } from "../../../src";
import type { FileNode, TransformEntry, TransformSource } from "../../../src";

const createEntry = ({
  name,
  path,
  isFile,
  parent,
  children,
  sampleType,
}: {
  name: string;
  path: string;
  isFile: boolean;
  parent?: FileNode;
  children?: FileNode[];
  sampleType?: string;
}): TransformEntry => ({
  getName: () => name,
  getPath: () => path,
  getPackageName: () => undefined,
  getSampleType: () => sampleType,
  getOwnPackageName: () => undefined,
  getOwnSampleType: () => sampleType,
  isEnabled: () => false,
  isReadOnly: () => false,
  isFile: () => isFile,
  getParentNode: () => parent,
  getChildNodes: () => children ?? [],
  setName: vi.fn<(value: string | undefined) => void>(),
  setPackageName: vi.fn<(value: string | undefined) => void>(),
  setSampleType: vi.fn<(value: string | undefined) => void>(),
  setEnabled: vi.fn<(value: boolean) => void>(),
  setReadOnly: vi.fn<(value: boolean) => void>(),
});

const createDirectoryNode = (
  name: string,
  path: string,
  parent?: FileNode,
): FileNode => ({
  getName: () => name,
  getPath: () => path,
  getPackageName: () => undefined,
  getSampleType: () => undefined,
  isEnabled: () => false,
  isFile: () => false,
  getParentNode: () => parent,
  getChildNodes: () => [],
});

describe("createConstructionKitTransformer renaming kit descendants", () => {
  const transformer = createConstructionKitTransformer();

  it("re-joins a descendant's split name when clearing a sampleType assigned alongside it", () => {
    const kitsParent = createDirectoryNode("Trap Kits", "Trap Kits");
    const kitChild = createDirectoryNode(
      "Holiday Kit 01 - 140bpm - G",
      "Trap Kits/Holiday Kit 01 - 140bpm - G",
      kitsParent,
    );

    const parentEntry = createEntry({
      name: "Trap Kits",
      path: "Trap Kits",
      isFile: false,
      children: [kitChild],
    });
    const kitEntry = createEntry({
      name: "Holiday Kit 01 - 140bpm - G",
      path: "Trap Kits/Holiday Kit 01 - 140bpm - G",
      isFile: false,
      parent: kitsParent,
    });
    // Simulates DirectorySampleTypeTransformer's dash-separated split, which
    // renames "Hihats - Open" -> "Open" while setting sampleType "Hihats".
    // getPath() is fixed at construction and never mutated by a rename, so
    // its final segment ("Hihats - Open") still differs from the current name.
    const nestedEntry = createEntry({
      name: "Open",
      path: "Trap Kits/Holiday Kit 01 - 140bpm - G/Hihats - Open",
      isFile: false,
      parent: kitChild,
      sampleType: "Hihats",
    });

    const source: TransformSource = {
      eachTransformEntry: (fn) => {
        fn(parentEntry);
        fn(kitEntry);
        fn(nestedEntry);
      },
      eachTransformModification: (fn) => {
        fn(parentEntry);
        fn(kitEntry);
        fn(nestedEntry);
      },
    };

    transformer.transform(source);

    expect(nestedEntry.setName).toHaveBeenCalledWith("Hihats - Open");
    expect(nestedEntry.setSampleType).toHaveBeenCalledWith(undefined);
  });

  it("does not revert a descendant's rename when it never had its own sampleType", () => {
    const kitsParent = createDirectoryNode("Trap Kits", "Trap Kits");
    const kitChild = createDirectoryNode(
      "Holiday Kit 01 - 140bpm - G",
      "Trap Kits/Holiday Kit 01 - 140bpm - G",
      kitsParent,
    );

    const parentEntry = createEntry({
      name: "Trap Kits",
      path: "Trap Kits",
      isFile: false,
      children: [kitChild],
    });
    const kitEntry = createEntry({
      name: "Holiday Kit 01 - 140bpm - G",
      path: "Trap Kits/Holiday Kit 01 - 140bpm - G",
      isFile: false,
      parent: kitsParent,
    });
    // A cosmetic-only rename (e.g. whitespace trimming) with no own
    // sampleType assigned alongside it must be left alone.
    const nestedEntry = createEntry({
      name: "Cymbals",
      path: "Trap Kits/Holiday Kit 01 - 140bpm - G/Cymbals ",
      isFile: false,
      parent: kitChild,
    });

    const source: TransformSource = {
      eachTransformEntry: (fn) => {
        fn(parentEntry);
        fn(kitEntry);
        fn(nestedEntry);
      },
      eachTransformModification: (fn) => {
        fn(parentEntry);
        fn(kitEntry);
        fn(nestedEntry);
      },
    };

    transformer.transform(source);

    expect(nestedEntry.setName).not.toHaveBeenCalled();
  });
});
