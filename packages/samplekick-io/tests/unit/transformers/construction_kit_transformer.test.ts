import { describe, expect, it, vi } from "vitest";
import { createConstructionKitTransformer } from "../../../src";
import type { FileNode, TransformEntry, TransformSource } from "../../../src";

const createEntry = ({
  name,
  path,
  isFile,
  parent,
  children,
  packageName,
  sampleType,
}: {
  name: string;
  path: string;
  isFile: boolean;
  parent?: FileNode;
  children?: FileNode[];
  packageName?: string;
  sampleType?: string;
}): TransformEntry => ({
  getName: () => name,
  getPath: () => path,
  getPackageName: () => packageName,
  getSampleType: () => sampleType,
  getOwnPackageName: () => packageName,
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

describe("createConstructionKitTransformer", () => {
  const transformer = createConstructionKitTransformer();

  it("enables direct child kit directories beneath a kits parent", () => {
    const kitsParent = createDirectoryNode(
      "Construction Kits",
      "Construction Kits",
    );
    const kitChild = createDirectoryNode(
      "Construction Kit 1 - Nightcall - Dm 95BPM",
      "Construction Kits/Construction Kit 1 - Nightcall - Dm 95BPM",
      kitsParent,
    );
    const nonKitChild = createDirectoryNode(
      "Bonus Loops",
      "Construction Kits/Bonus Loops",
      kitsParent,
    );

    const parentEntry = createEntry({
      name: "Construction Kits",
      path: "Construction Kits",
      isFile: false,
      children: [kitChild, nonKitChild],
    });
    const kitEntry = createEntry({
      name: "Construction Kit 1 - Nightcall - Dm 95BPM",
      path: "Construction Kits/Construction Kit 1 - Nightcall - Dm 95BPM",
      isFile: false,
      parent: kitsParent,
    });
    const otherEntry = createEntry({
      name: "Bonus Loops",
      path: "Construction Kits/Bonus Loops",
      isFile: false,
      parent: kitsParent,
    });

    const source: TransformSource = {
      eachTransformEntry: (fn) => {
        fn(parentEntry);
        fn(kitEntry);
        fn(otherEntry);
      },
      eachTransformModification: (fn) => {
        fn(parentEntry);
        fn(kitEntry);
        fn(otherEntry);
      },
    };

    transformer.transform(source);

    expect(kitEntry.setEnabled).toHaveBeenCalledWith(true);
    expect(kitEntry.setReadOnly).toHaveBeenCalledWith(true);
    expect(otherEntry.setEnabled).not.toHaveBeenCalled();
    expect(otherEntry.setReadOnly).not.toHaveBeenCalled();
  });

  it("matches kits and kit names case-insensitively", () => {
    const kitsParent = createDirectoryNode("SONG KITS", "SONG KITS");
    const kitChild = createDirectoryNode(
      "Song Kit 02 - 90BPM C#maj",
      "SONG KITS/Song Kit 02 - 90BPM C#maj",
      kitsParent,
    );

    const parentEntry = createEntry({
      name: "SONG KITS",
      path: "SONG KITS",
      isFile: false,
      children: [kitChild],
    });
    const kitEntry = createEntry({
      name: "Song Kit 02 - 90BPM C#maj",
      path: "SONG KITS/Song Kit 02 - 90BPM C#maj",
      isFile: false,
      parent: kitsParent,
    });

    const source: TransformSource = {
      eachTransformEntry: (fn) => {
        fn(parentEntry);
        fn(kitEntry);
      },
      eachTransformModification: (fn) => {
        fn(parentEntry);
        fn(kitEntry);
      },
    };

    transformer.transform(source);

    expect(kitEntry.setEnabled).toHaveBeenCalledWith(true);
    expect(kitEntry.setReadOnly).toHaveBeenCalledWith(true);
  });

  it("enables all descendant directories beneath a matched kit directory", () => {
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
    const nestedEntry = createEntry({
      name: "Drums",
      path: "Trap Kits/Holiday Kit 01 - 140bpm - G/Drums",
      isFile: false,
      parent: kitChild,
      packageName: "Old Package",
      sampleType: "Drums",
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

    expect(kitEntry.setEnabled).toHaveBeenCalledWith(true);
    expect(nestedEntry.setEnabled).toHaveBeenCalledWith(true);
    expect(kitEntry.setReadOnly).toHaveBeenCalledWith(true);
    expect(nestedEntry.setReadOnly).toHaveBeenCalledWith(true);
    expect(nestedEntry.setPackageName).toHaveBeenCalledWith(undefined);
    expect(nestedEntry.setSampleType).toHaveBeenCalledWith(undefined);
    expect(kitEntry.setPackageName).not.toHaveBeenCalled();
    expect(kitEntry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not act when parent does not contain kits", () => {
    const nonKitsParent = createDirectoryNode("Song Folder", "Song Folder");
    const kitChild = createDirectoryNode(
      "Song Kit 01 - 103BPM Gbmaj",
      "Song Folder/Song Kit 01 - 103BPM Gbmaj",
      nonKitsParent,
    );

    const parentEntry = createEntry({
      name: "Song Folder",
      path: "Song Folder",
      isFile: false,
      children: [kitChild],
    });
    const kitEntry = createEntry({
      name: "Song Kit 01 - 103BPM Gbmaj",
      path: "Song Folder/Song Kit 01 - 103BPM Gbmaj",
      isFile: false,
      parent: nonKitsParent,
    });

    const source: TransformSource = {
      eachTransformEntry: (fn) => {
        fn(parentEntry);
        fn(kitEntry);
      },
      eachTransformModification: (fn) => {
        fn(parentEntry);
        fn(kitEntry);
      },
    };

    transformer.transform(source);

    expect(kitEntry.setEnabled).not.toHaveBeenCalled();
    expect(kitEntry.setReadOnly).not.toHaveBeenCalled();
  });
});
