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

  it("does not act when parent does not contain kits and has only one kit sibling", () => {
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

  it("enables kit directories directly under a non-kits-named parent with 2+ kit siblings", () => {
    const packRoot = createDirectoryNode(
      "Chillwave Elements",
      "Chillwave Elements",
    );
    const kitChild1 = createDirectoryNode(
      "Kit 01 - Sway - Gmin 70bpm",
      "Chillwave Elements/Kit 01 - Sway - Gmin 70bpm",
      packRoot,
    );
    const kitChild2 = createDirectoryNode(
      "Kit 02 - Mellow - Cmin 70bpm",
      "Chillwave Elements/Kit 02 - Mellow - Cmin 70bpm",
      packRoot,
    );
    const nonKitChild = createDirectoryNode(
      "Additional Content",
      "Chillwave Elements/Additional Content",
      packRoot,
    );

    const parentEntry = createEntry({
      name: "Chillwave Elements",
      path: "Chillwave Elements",
      isFile: false,
      children: [kitChild1, kitChild2, nonKitChild],
    });
    const kitEntry1 = createEntry({
      name: "Kit 01 - Sway - Gmin 70bpm",
      path: "Chillwave Elements/Kit 01 - Sway - Gmin 70bpm",
      isFile: false,
      parent: packRoot,
    });
    const kitEntry2 = createEntry({
      name: "Kit 02 - Mellow - Cmin 70bpm",
      path: "Chillwave Elements/Kit 02 - Mellow - Cmin 70bpm",
      isFile: false,
      parent: packRoot,
    });
    const otherEntry = createEntry({
      name: "Additional Content",
      path: "Chillwave Elements/Additional Content",
      isFile: false,
      parent: packRoot,
    });

    const source: TransformSource = {
      eachTransformEntry: (fn) => {
        fn(parentEntry);
        fn(kitEntry1);
        fn(kitEntry2);
        fn(otherEntry);
      },
      eachTransformModification: (fn) => {
        fn(parentEntry);
        fn(kitEntry1);
        fn(kitEntry2);
        fn(otherEntry);
      },
    };

    transformer.transform(source);

    expect(kitEntry1.setEnabled).toHaveBeenCalledWith(true);
    expect(kitEntry1.setReadOnly).toHaveBeenCalledWith(true);
    expect(kitEntry2.setEnabled).toHaveBeenCalledWith(true);
    expect(kitEntry2.setReadOnly).toHaveBeenCalledWith(true);
    expect(otherEntry.setEnabled).not.toHaveBeenCalled();
    expect(otherEntry.setReadOnly).not.toHaveBeenCalled();
  });

  it("enables every direct child directory beneath a stems container regardless of its name", () => {
    const stemsParent = createDirectoryNode("Loop Stems", "Loop Stems");
    const loopChild1 = createDirectoryNode(
      "Apple Drum Loop - 102bpm",
      "Loop Stems/Apple Drum Loop - 102bpm",
      stemsParent,
    );
    const loopChild2 = createDirectoryNode(
      "Bruised Drum Loop - 112bpm",
      "Loop Stems/Bruised Drum Loop - 112bpm",
      stemsParent,
    );

    const parentEntry = createEntry({
      name: "Loop Stems",
      path: "Loop Stems",
      isFile: false,
      children: [loopChild1, loopChild2],
    });
    const loopEntry1 = createEntry({
      name: "Apple Drum Loop - 102bpm",
      path: "Loop Stems/Apple Drum Loop - 102bpm",
      isFile: false,
      parent: stemsParent,
    });
    const loopEntry2 = createEntry({
      name: "Bruised Drum Loop - 112bpm",
      path: "Loop Stems/Bruised Drum Loop - 112bpm",
      isFile: false,
      parent: stemsParent,
    });

    const source: TransformSource = {
      eachTransformEntry: (fn) => {
        fn(parentEntry);
        fn(loopEntry1);
        fn(loopEntry2);
      },
      eachTransformModification: (fn) => {
        fn(parentEntry);
        fn(loopEntry1);
        fn(loopEntry2);
      },
    };

    transformer.transform(source);

    expect(parentEntry.setEnabled).not.toHaveBeenCalled();
    expect(loopEntry1.setEnabled).toHaveBeenCalledWith(true);
    expect(loopEntry1.setReadOnly).toHaveBeenCalledWith(true);
    expect(loopEntry2.setEnabled).toHaveBeenCalledWith(true);
    expect(loopEntry2.setReadOnly).toHaveBeenCalledWith(true);
  });

  it("matches singular 'Stem' and a '& MIDI' suffix case-insensitively", () => {
    const stemsParent = createDirectoryNode(
      "loop stems & midi",
      "loop stems & midi",
    );
    const loopChild = createDirectoryNode(
      "Andromeda - 108bpm",
      "loop stems & midi/Andromeda - 108bpm",
      stemsParent,
    );

    const parentEntry = createEntry({
      name: "loop stems & midi",
      path: "loop stems & midi",
      isFile: false,
      children: [loopChild],
    });
    const loopEntry = createEntry({
      name: "Andromeda - 108bpm",
      path: "loop stems & midi/Andromeda - 108bpm",
      isFile: false,
      parent: stemsParent,
    });

    const source: TransformSource = {
      eachTransformEntry: (fn) => {
        fn(parentEntry);
        fn(loopEntry);
      },
      eachTransformModification: (fn) => {
        fn(parentEntry);
        fn(loopEntry);
      },
    };

    transformer.transform(source);

    expect(loopEntry.setEnabled).toHaveBeenCalledWith(true);
    expect(loopEntry.setReadOnly).toHaveBeenCalledWith(true);
  });

  it("does not treat a plain directory without 'stem'/'stems' in its name as a stems container", () => {
    const plainParent = createDirectoryNode("Drum Loops", "Drum Loops");
    const loopChild = createDirectoryNode(
      "Apple Drum Loop - 102bpm",
      "Drum Loops/Apple Drum Loop - 102bpm",
      plainParent,
    );

    const parentEntry = createEntry({
      name: "Drum Loops",
      path: "Drum Loops",
      isFile: false,
      children: [loopChild],
    });
    const loopEntry = createEntry({
      name: "Apple Drum Loop - 102bpm",
      path: "Drum Loops/Apple Drum Loop - 102bpm",
      isFile: false,
      parent: plainParent,
    });

    const source: TransformSource = {
      eachTransformEntry: (fn) => {
        fn(parentEntry);
        fn(loopEntry);
      },
      eachTransformModification: (fn) => {
        fn(parentEntry);
        fn(loopEntry);
      },
    };

    transformer.transform(source);

    expect(loopEntry.setEnabled).not.toHaveBeenCalled();
    expect(loopEntry.setReadOnly).not.toHaveBeenCalled();
  });
});
