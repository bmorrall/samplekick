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
    expect(() => {
      node.replaceEntry(entry2);
    }).toThrow(
      'Entry path "foo/bar2.wav" does not match node path "foo/bar1.wav"',
    );
  });

  describe("getName", () => {
    it("returns the name of the node", () => {
      const node = EntryNode.fromEntry(createFileEntry({ path: "root" }));
      expect(node.getName()).toBe("root");
    });

    it("allows a root node to have an internal path that does not match its name", () => {
      const node = EntryNode.fromEntry(
        createFileEntry({ path: "", name: "root" }),
      );
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

    expect(() =>
      child.addNode(createFileEntry({ path: "grandchild" })),
    ).toThrow(
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

  describe("isEnabled", () => {
    it("returns false for a directory when enabled has not been set", () => {
      const node = EntryNode.blankEntry("node");
      expect(node.isEnabled()).toBe(false);
    });

    it("returns false when set to false", () => {
      const node = EntryNode.blankEntry("node");
      node.setEnabled(false);
      expect(node.isEnabled()).toBe(false);
    });

    it("returns true when set to true", () => {
      const node = EntryNode.blankEntry("node");
      node.setEnabled(true);
      expect(node.isEnabled()).toBe(true);
    });

    it("is not inherited from parent — child dir returns false by default when only parent has value", () => {
      const parent = EntryNode.buildRootNode("parent");
      parent.setEnabled(true);
      const child = parent.addBlankNode("child", "child");

      expect(child.isEnabled()).toBe(false);
    });

    it("returns the child's own value when set, regardless of parent", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setEnabled(false);
      const child = parent.addNode(EntryNode.blankEntry("child"));
      child.setEnabled(true);
      expect(child.isEnabled()).toBe(true);
    });

    it("returns false when set directly on the child", () => {
      const root = EntryNode.blankEntry("root");
      root.setEnabled(false);
      const child = root.addNode(EntryNode.blankEntry("child"));
      child.setEnabled(false);
      expect(child.isEnabled()).toBe(false);
    });
  });

  describe("setEnabled", () => {
    it("sets enabled to false for a node", () => {
      const node = EntryNode.blankEntry("node");
      node.setEnabled(false);
      expect(node.isEnabled()).toBe(false);
    });

    it("sets enabled to true for a node", () => {
      const node = EntryNode.blankEntry("node");
      node.setEnabled(false);
      node.setEnabled(true);
      expect(node.isEnabled()).toBe(true);
    });

    it("sets own value independently of parent", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setEnabled(true);
      const child = parent.addNode(EntryNode.blankEntry("child"));
      child.setEnabled(false);
      expect(child.isEnabled()).toBe(false);
    });
  });

  describe("isReadOnly", () => {
    it("returns undefined when readOnly has not been set", () => {
      const node = EntryNode.blankEntry("node");
      expect(node.isReadOnly()).toBeUndefined();
    });

    it("returns true when set to true", () => {
      const node = EntryNode.blankEntry("node");
      node.setReadOnly(true);
      expect(node.isReadOnly()).toBe(true);
    });

    it("inherits readOnly from parent if not set on node", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setReadOnly(true);
      const child = parent.addNode(EntryNode.blankEntry("child"));
      expect(child.isReadOnly()).toBe(true);
    });

    it("prefers the child entry readOnly value over the parent entry readOnly value", () => {
      const parent = EntryNode.blankEntry("parent");
      parent.setReadOnly(false);
      const child = parent.addNode(EntryNode.blankEntry("child"));
      child.setReadOnly(true);
      expect(child.isReadOnly()).toBe(true);
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

    it("throws if a node already exists at that path", () => {
      const root = EntryNode.blankEntry("root");
      root.addNode(EntryNode.blankEntry("child"));
      const duplicate = (): void => {
        root.addNode(EntryNode.blankEntry("child"));
      };
      expect(duplicate).toThrow('Node already exists at path "child"');
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
      expect(node.toString()).toBe("root [skipped]\n");
    });

    it("renders the renamed node name", () => {
      const node = EntryNode.blankEntry("node");
      node.setName("renamed-node");

      expect(node.toString()).toBe("renamed-node [renamed, skipped]\n");
    });

    it("renders a node with children", () => {
      const root = EntryNode.blankEntry("root");
      root.addNode(EntryNode.blankEntry("a"));
      root.addNode(EntryNode.blankEntry("b"));
      expect(root.toString()).toBe(
        ["root [skipped]", "├── a [?]", "└── b [?]", ""].join("\n"),
      );
    });

    it("renders tags when set", () => {
      const node = EntryNode.blankEntry("root");
      node.setPackageName("my-pkg");
      node.setSampleType("typeA");
      expect(node.toString()).toBe("root [pkg:my-pkg, type:typeA, skipped]\n");
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
        ["child [pkg:my-pkg, type:typeA]", "└── grandchild", ""].join("\n"),
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

  describe("eachMutatedEntry", () => {
    it("includes root and leaf file nodes", () => {
      const root = EntryNode.buildRootNode("pack");
      const folder = root.addBlankNode("drums", "drums");
      const leaf = folder.addNode(createFileEntry({ path: "drums/kick.wav" }));

      const visited: string[] = [];
      root.eachMutatedEntry((node) => {
        visited.push(node.getPath());
      });

      expect(visited).toEqual(["", "drums/kick.wav"]);
      expect(leaf.isFile()).toBe(true);
    });

    it("includes nodes that mutate relative to their parent", () => {
      const root = EntryNode.buildRootNode("pack");
      const folder = root.addBlankNode("drums", "drums");
      folder.setPackageName("drum-pack");

      const visited: string[] = [];
      root.eachMutatedEntry((node) => {
        visited.push(node.getPath());
      });

      expect(visited).toContain("");
      expect(visited).toContain("drums");
    });
  });
});
