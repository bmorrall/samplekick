import { describe, it, expect } from "vitest";
import { EntryNode } from "../../../src/registry/entry_node";
import { createFileEntry } from "../../support";

const buildTree = (): EntryNode => {
  const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
  const a = root.addNode(createFileEntry({ path: "a" }));
  a.addNode(createFileEntry({ path: "a/b" }));
  a.addNode(createFileEntry({ path: "a/c" }));
  const d = root.addNode(createFileEntry({ path: "d" }));
  d.addNode(createFileEntry({ path: "d/e" }));
  return root;
};

describe("EntryNode.toString", () => {
  describe("tree structure", () => {
    it("prints a single node with no children", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      expect(root.toString()).toBe("root [?]\n");
    });

    it("prints a flat list of children", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      root.addNode(createFileEntry({ path: "a" }));
      root.addNode(createFileEntry({ path: "b" }));
      expect(root.toString()).toBe(
        [
          "root",
          "├── a [?]",
          "└── b [?]",
          "",
        ].join("\n"),
      );
    });

    it("prints a nested tree with correct connectors", () => {
      const root = buildTree();
      expect(root.toString()).toBe(
        [
          "root",
          "├── a",
          "│   ├── b [?]",
          "│   └── c [?]",
          "└── d",
          "    └── e [?]",
          "",
        ].join("\n"),
      );
    });
  });

  describe("pkg and type tags", () => {
    it("shows inherited pkg and type on the root node", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      root.setPackageName("my-pack");
      root.setSampleType("Loops");
      expect(root.toString()).toBe("root [pkg:my-pack, type:Loops]\n");
    });

    it("shows own pkg and type on a child node", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      const child = root.addNode(createFileEntry({ path: "a" }));
      child.setPackageName("child-pack");
      child.setSampleType("Hits");
      expect(root.toString()).toBe(
        [
          "root",
          "└── a [pkg:child-pack, type:Hits]",
          "",
        ].join("\n"),
      );
    });

    it("does not show inherited pkg and type on child nodes", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      root.setPackageName("my-pack");
      root.setSampleType("Loops");
      root.addNode(createFileEntry({ path: "a" }));
      expect(root.toString()).toBe(
        [
          "root [pkg:my-pack, type:Loops]",
          "└── a",
          "",
        ].join("\n"),
      );
    });
  });

  describe("keepStructure connectors", () => {
    it("uses thick connectors for a non-last child with keepStructure", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      const a = root.addNode(createFileEntry({ path: "a" }));
      a.setKeepStructure(true);
      root.addNode(createFileEntry({ path: "b" }));
      expect(root.toString()).toBe(
        [
          "root",
          "┣━━ a [?]",
          "└── b [?]",
          "",
        ].join("\n"),
      );
    });

    it("uses thick connectors for a last child with keepStructure", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      root.addNode(createFileEntry({ path: "a" }));
      const b = root.addNode(createFileEntry({ path: "b" }));
      b.setKeepStructure(true);
      expect(root.toString()).toBe(
        [
          "root",
          "├── a [?]",
          "┗━━ b [?]",
          "",
        ].join("\n"),
      );
    });

    it("uses thick vertical bar for descendants of a keepStructure node", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      const a = root.addNode(createFileEntry({ path: "a" }));
      a.setKeepStructure(true);
      a.addNode(createFileEntry({ path: "a/b" }));
      a.addNode(createFileEntry({ path: "a/c" }));
      root.addNode(createFileEntry({ path: "d" }));
      expect(root.toString()).toBe(
        [
          "root",
          "┣━━ a",
          "┃   ├── b [?]",
          "┃   └── c [?]",
          "└── d [?]",
          "",
        ].join("\n"),
      );
    });

    it("does not use thick connectors for a node with keepStructure inherited but not own", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      const a = root.addNode(createFileEntry({ path: "a" }));
      a.setKeepStructure(true);
      const b = a.addNode(createFileEntry({ path: "a/b" }));
      b.addNode(createFileEntry({ path: "a/b/c" }));
      expect(root.toString()).toBe(
        [
          "root",
          "┗━━ a",
          "    └── b",
          "        └── c [?]",
          "",
        ].join("\n"),
      );
    });
  });

  describe("skipped tag", () => {
    it("appends [skipped] to an entry with isSkipped true", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      const child = root.addNode(createFileEntry({ path: "a" }));
      child.setSkipped(true);
      expect(root.toString()).toBe(
        [
          "root",
          "└── a [?] [skipped]",
          "",
        ].join("\n"),
      );
    });

    it("does not append [skipped] when isSkipped is false", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      const child = root.addNode(createFileEntry({ path: "a" }));
      child.setSkipped(false);
      expect(root.toString()).toBe(
        [
          "root",
          "└── a [?]",
          "",
        ].join("\n"),
      );
    });

    it("shows ... instead of children when a directory is skipped", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      const parent = root.addNode(createFileEntry({ path: "a" }));
      parent.setSkipped(true);
      parent.addNode(createFileEntry({ path: "a/b" }));
      expect(root.toString()).toBe(
        [
          "root",
          "└── a [skipped]",
          "    └── ...",
          "",
        ].join("\n"),
      );
    });

    it("combines skipped with pkg and type tags", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      const child = root.addNode(createFileEntry({ path: "a" }));
      child.setPackageName("my-pack");
      child.setSampleType("Loops");
      child.setSkipped(true);
      expect(root.toString()).toBe(
        [
          "root",
          "└── a [pkg:my-pack, type:Loops, skipped]",
          "",
        ].join("\n"),
      );
    });
  });

  describe("orig tag", () => {
    it("shows [renamed] tag on a child node when its name differs from the entry name", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      const child = root.addNode(createFileEntry({ path: "original.wav" }));
      child.setName("renamed.wav");
      expect(root.toString()).toBe(
        [
          "root",
          "└── renamed.wav [?] [renamed]",
          "",
        ].join("\n"),
      );
    });

    it("does not show [renamed] tag when the name matches the entry name", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      const child = root.addNode(createFileEntry({ path: "original.wav" }));
      child.setName("original.wav");
      expect(root.toString()).toBe(
        [
          "root",
          "└── original.wav [?]",
          "",
        ].join("\n"),
      );
    });

    it("does not show [renamed] tag on the root node", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "original" }));
      root.setName("renamed");
      expect(root.toString()).toBe("renamed [?]\n");
    });
  });

  describe("verbose mode", () => {
    it("shows inherited pkg and type on child nodes when verbose is true", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      root.setPackageName("my-pack");
      root.setSampleType("Loops");
      root.addNode(createFileEntry({ path: "a" }));
      expect(root.toString(true)).toBe(
        [
          "root [pkg:my-pack, type:Loops]",
          "└── a [pkg:my-pack, type:Loops]",
          "",
        ].join("\n"),
      );
    });

    it("shows own pkg and type over inherited values when verbose is true", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      root.setPackageName("parent-pack");
      root.setSampleType("Loops");
      const child = root.addNode(createFileEntry({ path: "a" }));
      child.setPackageName("child-pack");
      expect(root.toString(true)).toBe(
        [
          "root [pkg:parent-pack, type:Loops]",
          "└── a [pkg:child-pack, type:Loops]",
          "",
        ].join("\n"),
      );
    });

    it("does not show inherited tags on child nodes when verbose is false", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      root.setPackageName("my-pack");
      root.setSampleType("Loops");
      root.addNode(createFileEntry({ path: "a" }));
      expect(root.toString(false)).toBe(
        [
          "root [pkg:my-pack, type:Loops]",
          "└── a",
          "",
        ].join("\n"),
      );
    });

    it("shows orig tag on a renamed child node when verbose is true", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      const child = root.addNode(createFileEntry({ path: "original.wav" }));
      child.setName("renamed.wav");
      expect(root.toString(true)).toBe(
        [
          "root",
          "└── renamed.wav [?] [renamed, orig:original.wav]",
          "",
        ].join("\n"),
      );
    });
  });

  describe("[?] missing required tags", () => {
    it("shows [?] on a leaf node with no packageName or sampleType", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      root.addNode(createFileEntry({ path: "a.wav" }));
      expect(root.toString()).toBe(
        [
          "root",
          "└── a.wav [?]",
          "",
        ].join("\n"),
      );
    });

    it("shows [?] on a leaf node missing sampleType but with packageName", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      const child = root.addNode(createFileEntry({ path: "a.wav" }));
      child.setPackageName("my-pack");
      expect(root.toString()).toBe(
        [
          "root",
          "└── a.wav [?] [pkg:my-pack]",
          "",
        ].join("\n"),
      );
    });

    it("shows [?] on a leaf node missing packageName but with sampleType", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      const child = root.addNode(createFileEntry({ path: "a.wav" }));
      child.setSampleType("Hits");
      expect(root.toString()).toBe(
        [
          "root",
          "└── a.wav [?] [type:Hits]",
          "",
        ].join("\n"),
      );
    });

    it("does not show [?] on a leaf node that inherits both packageName and sampleType", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      root.setPackageName("my-pack");
      root.setSampleType("Loops");
      root.addNode(createFileEntry({ path: "a.wav" }));
      expect(root.toString()).toBe(
        [
          "root [pkg:my-pack, type:Loops]",
          "└── a.wav",
          "",
        ].join("\n"),
      );
    });

    it("does not show [?] on a non-leaf node missing packageName and sampleType", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      const dir = root.addNode(createFileEntry({ path: "dir" }));
      dir.addNode(createFileEntry({ path: "dir/a.wav" }));
      expect(root.toString()).toBe(
        [
          "root",
          "└── dir",
          "    └── a.wav [?]",
          "",
        ].join("\n"),
      );
    });
  });
});
