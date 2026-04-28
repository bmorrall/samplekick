import { describe, it, expect } from "vitest";
import { EntryNode } from "../../../src/registry/entry_node";
import { createFileEntry } from "../../support";

describe("EntryNode", () => {
  // Flatten isFile tests to reduce nesting
  it("isFile: should be true when entryRef.current is present", () => {
    const entry = createFileEntry({ path: "foo/bar.wav" });
    const node = EntryNode.fromEntry(entry);
    expect(node.isFile()).toBe(true);
  });

  it("isFile: should be true after replaceEntry with a new entry", () => {
    const entry1 = createFileEntry({ path: "foo/bar1.wav" });
    // Replacement entry must have the same path as the node
    const entry2 = createFileEntry({ path: "foo/bar1.wav" });
    const node = EntryNode.fromEntry(entry1);
    node.replaceEntry(entry2);
    expect(node.isFile()).toBe(true);
  });

  it("replaceEntry: throws if replacement entry path does not match node path", () => {
    const entry1 = createFileEntry({ path: "foo/bar1.wav" });
    const entry2 = createFileEntry({ path: "foo/bar2.wav" });
    const node = EntryNode.fromEntry(entry1);
    expect(() => { node.replaceEntry(entry2); }).toThrow(
      'Entry path "foo/bar2.wav" does not match node path "foo/bar1.wav"'
    );
  });

  describe("getName", () => {
    it("returns the name of the node", () => {
      const node = EntryNode.fromEntry(createFileEntry({ path: "root" }));
      expect(node.getName()).toBe("root");
    });

    it("allows a root node to have an internal path that does not match its name", () => {
      const node = EntryNode.fromEntry(createFileEntry({ path: "", name: "root" }));
      expect(node.getName()).toBe("root");
      expect(node.getPath()).toBe("");
    });

    it("returns the renamed node name when setName is used", () => {
      const node = EntryNode.fromEntry(createFileEntry({ path: "root" }));

      node.setName("renamed-root");

      expect(node.getName()).toBe("renamed-root");
      expect(node.getPath()).toBe("root");
    });

    it("falls back to the entry name when the name override is cleared", () => {
      const node = EntryNode.fromEntry(createFileEntry({ path: "root" }));
      node.setName("renamed-root");

      node.setName(undefined);

      expect(node.getName()).toBe("root");
    });
  });

  it("allows a child entry name to differ from the last path segment", () => {
    const root = EntryNode.fromEntry(createFileEntry({ path: "root" }));
    const entry = createFileEntry({ path: "child", name: "wrong" });

    const child = root.addNode(entry);

    expect(child.getPath()).toBe("child");
    expect(child.getName()).toBe("wrong");
  });

  it("finds a child by path name after setName changes its display name", () => {
    const root = EntryNode.fromEntry(createFileEntry({ path: "root" }));
    const child = root.addNode(createFileEntry({ path: "child" }));

    child.setName("renamed-child");

    expect(root.getNode("child")).toBe(child);
    expect(root.getNode("renamed-child")).toBeUndefined();
  });

  it("finds a child by path name when the entry name differs from the path leaf", () => {
    const root = EntryNode.fromEntry(createFileEntry({ path: "root" }));
    const child = root.addNode(
      createFileEntry({ path: "child", name: "display-child" }),
    );

    expect(root.getNode("child")).toBe(child);
    expect(root.getNode("display-child")).toBeUndefined();
  });

  it("throws when entry path does not match the parent-derived path", () => {
    const root = EntryNode.fromEntry(createFileEntry({ path: "root" }));
    const child = root.addNode(createFileEntry({ path: "child" }));

    expect(() => child.addNode(createFileEntry({ path: "grandchild" }))).toThrow(
      'Entry path "grandchild" does not match expected path "child/grandchild"',
    );
  });

  describe("getPath", () => {
    it("returns the name for a root node", () => {
      const node = EntryNode.fromEntry(createFileEntry({ path: "root" }));
      expect(node.getPath()).toBe("root");
    });

    it("returns parent/child path for a child node", () => {
      const parent = EntryNode.fromEntry(createFileEntry({ path: "root" }));
      const child = parent.addNode(createFileEntry({ path: "child" }));
      expect(child.getPath()).toBe("child");
    });

    it("returns deeply nested path", () => {
      const root = EntryNode.fromEntry(createFileEntry({ path: "root" }));
      const child = root.addNode(createFileEntry({ path: "child" }));
      const grandchild = child.addNode(
        createFileEntry({ path: "child/grandchild" }),
      );
      expect(grandchild.getPath()).toBe("child/grandchild");
    });
  });

  // Tagging tests

  describe("getPackageName", () => {
    it("returns undefined when no package name is set", () => {
      const node = EntryNode.blankEntry("node");
      expect(node.getPackageName()).toBeUndefined();
    });

    it("returns the package name set on the node", () => {
      const node = EntryNode.blankEntry("node");
      node.setPackageName("my-package");
      expect(node.getPackageName()).toBe("my-package");
    });

    it("inherits package name from parent if not set on node", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setPackageName("my-package");
      const child = parent.addNode(EntryNode.blankEntry("child"));
      expect(child.getPackageName()).toBe("my-package");
    });

    it("prefers the child entry package name over the parent entry package name", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setPackageName("parent-entry");
      const child = parent.addNode(EntryNode.blankEntry("child"));
      child.setPackageName("child-entry");
      expect(child.getPackageName()).toBe("child-entry");
    });

    it("returns undefined if no package name is set on node or ancestors", () => {
      const root = EntryNode.blankEntry("root");
      const child = root.addNode(EntryNode.blankEntry("child"));
      expect(child.getPackageName()).toBeUndefined();
    });
  });

  describe("setPackageName", () => {
    it("sets the package name for a node", () => {
      const node = EntryNode.blankEntry("node");
      node.setPackageName("my-package");
      expect(node.getPackageName()).toBe("my-package");
    });

    it("overrides inherited package name", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setPackageName("parent-package");
      const child = parent.addNode(EntryNode.blankEntry("child"));
      child.setPackageName("child-package");
      expect(child.getPackageName()).toBe("child-package");
    });
  });

  describe("getSampleType", () => {
    it("returns undefined when no sample type is set", () => {
      const node = EntryNode.blankEntry("node");
      expect(node.getSampleType()).toBeUndefined();
    });

    it("falls back to the entry sample type when no override exists", () => {
      const node = EntryNode.blankEntry("node");
      node.setSampleType("entry-type");
      expect(node.getSampleType()).toBe("entry-type");
    });

    it("returns the sample type set on the node", () => {
      const node = EntryNode.blankEntry("node");
      node.setSampleType("typeA");
      expect(node.getSampleType()).toBe("typeA");
    });

    it("inherits sample type from parent if not set on node", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setSampleType("typeA");
      const child = parent.addNode(EntryNode.blankEntry("child"));
      expect(child.getSampleType()).toBe("typeA");
    });

    it("prefers the child entry sample type over the parent entry sample type", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setSampleType("parent-type");
      const child = parent.addNode(EntryNode.blankEntry("child"));
      child.setSampleType("child-type");
      expect(child.getSampleType()).toBe("child-type");
    });

    it("returns undefined if no sample type is set on node or ancestors", () => {
      const root = EntryNode.blankEntry("root");
      const child = root.addNode(EntryNode.blankEntry("child"));
      expect(child.getSampleType()).toBeUndefined();
    });
  });

  describe("setSampleType", () => {
    it("sets the sample type for a node", () => {
      const node = EntryNode.blankEntry("node");
      node.setSampleType("typeA");
      expect(node.getSampleType()).toBe("typeA");
    });

    it("overrides inherited sample type", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setSampleType("typeA");
      const child = parent.addNode(EntryNode.blankEntry("child"));
      child.setSampleType("typeB");
      expect(child.getSampleType()).toBe("typeB");
    });
  });

  describe("isSkipped", () => {
    it("returns undefined when skipped has not been set", () => {
      const node = EntryNode.blankEntry("node");
      expect(node.isSkipped()).toBeUndefined();
    });

    it("returns true when skipped is set to true", () => {
      const node = EntryNode.blankEntry("node");
      node.setSkipped(true);
      expect(node.isSkipped()).toBe(true);
    });

    it("returns false when skipped is set to false", () => {
      const node = EntryNode.blankEntry("node");
      node.setSkipped(false);
      expect(node.isSkipped()).toBe(false);
    });

    it("inherits skipped from parent if not set on node", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setSkipped(true);
      const child = parent.addNode(EntryNode.blankEntry("child"));

      expect(child.isSkipped()).toBe(true);
    });

    it("prefers the child entry skipped value over the parent entry skipped value", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setSkipped(false);
      const child = parent.addNode(EntryNode.blankEntry("child"));
      child.setSkipped(true);
      expect(child.isSkipped()).toBe(true);
    });

    it("returns false if the child entry skipped value is false", () => {
      const root = EntryNode.blankEntry("root");
      root.setSkipped(false);
      const child = root.addNode(EntryNode.blankEntry("child"));
      child.setSkipped(false);
      expect(child.isSkipped()).toBe(false);
    });
  });

  describe("setSkipped", () => {
    it("sets skipped to true for a node", () => {
      const node = EntryNode.blankEntry("node");
      node.setSkipped(true);
      expect(node.isSkipped()).toBe(true);
    });

    it("sets skipped to false for a node", () => {
      const node = EntryNode.blankEntry("node");
      node.setSkipped(true);
      node.setSkipped(false);
      expect(node.isSkipped()).toBe(false);
    });

    it("overrides inherited skipped value", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setSkipped(true);
      const child = parent.addNode(EntryNode.blankEntry("child"));
      child.setSkipped(false);
      expect(child.isSkipped()).toBe(false);
    });
  });

  describe("isKeepStructure", () => {
    it("returns undefined when keepStructure has not been set", () => {
      const node = EntryNode.blankEntry("node");
      expect(node.isKeepStructure()).toBeUndefined();
    });

    it("falls back to the entry keepStructure value when no override exists", () => {
      const node = EntryNode.blankEntry("node");
      node.setKeepStructure(true);
      expect(node.isKeepStructure()).toBe(true);
    });

    it("inherits keepStructure from parent if not set on node", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setKeepStructure(true);
      const child = parent.addNode(EntryNode.blankEntry("child"));
      expect(child.isKeepStructure()).toBe(true);
    });

    it("prefers the child entry keepStructure value over the parent entry keepStructure value", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setKeepStructure(false);
      const child = parent.addNode(EntryNode.blankEntry("child"));
      child.setKeepStructure(true);
      expect(child.isKeepStructure()).toBe(true);
    });
  });

  // Node management tests

  describe("addNode", () => {
    it("adds a child node and returns it", () => {
      const root = EntryNode.blankEntry("root");
      const child = root.addNode(EntryNode.blankEntry("child"));
      expect(child).toBeInstanceOf(EntryNode);
      expect(child.getName()).toBe("child");
    });

    it("returns existing node if name already exists", () => {
      const root = EntryNode.blankEntry("root");
      const child1 = root.addNode(EntryNode.blankEntry("child"));
      const child2 = root.addNode(EntryNode.blankEntry("child"));
      expect(child1).toBe(child2);
    });

    it("sets the parent node correctly", () => {
      const root = EntryNode.blankEntry("root");
      const child = root.addNode(EntryNode.blankEntry("child"));
      expect(child.getParentNode()).toBe(root);
    });
  });

  describe("getNode", () => {
    it("returns the child node by name", () => {
      const root = EntryNode.blankEntry("root");
      const child = root.addNode(EntryNode.blankEntry("child"));
      expect(root.getNode("child")).toBe(child);
    });

    it("returns undefined if node does not exist", () => {
      const root = EntryNode.blankEntry("root");
      expect(root.getNode("nonexistent")).toBeUndefined();
    });
  });

  describe("getChildNodes", () => {
    it("returns an empty array when there are no children", () => {
      const root = EntryNode.blankEntry("root");
      expect(root.getChildNodes()).toEqual([]);
    });

    it("returns all child nodes", () => {
      const root = EntryNode.blankEntry("root");
      const a = root.addNode(EntryNode.blankEntry("a"));
      const b = root.addNode(EntryNode.blankEntry("b"));
      expect(root.getChildNodes()).toEqual([a, b]);
    });

    it("does not include grandchildren", () => {
      const root = EntryNode.blankEntry("root");
      const child = root.addNode(EntryNode.blankEntry("child"));
      child.addNode(EntryNode.blankEntry("child/grandchild"));
      expect(root.getChildNodes()).toEqual([child]);
    });
  });

  describe("getParentNode", () => {
    it("returns undefined for a root node", () => {
      const root = EntryNode.blankEntry("root");
      expect(root.getParentNode()).toBeUndefined();
    });

    it("returns the parent node for a child node", () => {
      const root = EntryNode.blankEntry("root");
      const child = root.addNode(EntryNode.blankEntry("child"));
      expect(child.getParentNode()).toBe(root);
    });
  });

  describe("toString", () => {
    it("renders a leaf node", () => {
      const node = EntryNode.blankEntry("root");
      expect(node.toString()).toBe("root\n");
    });

    it("renders the renamed node name", () => {
      const node = EntryNode.blankEntry("root");
      node.setName("renamed-root");

      expect(node.toString()).toBe("renamed-root\n");
    });

    it("renders a node with children", () => {
      const root = EntryNode.blankEntry("root");
      root.addNode(EntryNode.blankEntry("a"));
      root.addNode(EntryNode.blankEntry("b"));
      expect(root.toString()).toBe(
        "root\n" +
        "├── a\n" +
        "└── b\n"
      );
    });

    it("renders tags when set", () => {
      const node = EntryNode.blankEntry("root");
      node.setPackageName("my-pkg");
      node.setSampleType("typeA");
      expect(node.toString()).toBe("root [pkg:my-pkg, type:typeA]\n");
    });

    it("renders inherited tags on the root node", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setPackageName("my-pkg");
      parent.setSampleType("typeA");
      const child = parent.addNode(EntryNode.blankEntry("child"));
      expect(child.toString()).toBe("child [pkg:my-pkg, type:typeA]\n");
    });

    it("does not render inherited tags on child nodes", () => {
      const root = EntryNode.blankEntry("root");
      root.setPackageName("my-pkg");
      root.setSampleType("typeA");
      const child = root.addNode(EntryNode.blankEntry("child"));
      child.addNode(EntryNode.blankEntry("child/grandchild"));
      expect(child.toString()).toBe(
        "child [pkg:my-pkg, type:typeA]\n" +
        "└── grandchild\n",
      );
    });
  });

  describe("getOwnName", () => {
    it("returns ", () => {
      const node = EntryNode.fromEntry(createFileEntry({ path: "root" }));
      expect(node.getName()).toBe("root");
      expect(node.getOwnName()).toBeUndefined();
    });

    it("returns the override name after setName is called", () => {
      const node = EntryNode.blankEntry("root");
      node.setName("renamed");
      expect(node.getOwnName()).toBe("renamed");
    });
  });

  describe("getOwnSkipped", () => {
    it("returns undefined when skipped has not been set", () => {
      const node = EntryNode.blankEntry("root");
      expect(node.getOwnSkipped()).toBeUndefined();
    });

    it("returns the skipped value after setSkipped is called", () => {
      const node = EntryNode.blankEntry("root");
      node.setSkipped(true);
      expect(node.getOwnSkipped()).toBe(true);
    });
  });
});
