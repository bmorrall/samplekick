import { describe, it, expect } from "vitest";
import { EntryNode } from "../../../src/registry/entry_node";

describe("EntryNode.blankEntry", () => {
  it("should create a node with all getters undefined and isFile false", () => {
    const node = EntryNode.blankEntry("test/path");
    expect(node.getName()).toBe("path");
    expect(node.getPath()).toBe("test/path");
    expect(node.getPackageName()).toBeUndefined();
    expect(node.getSampleType()).toBeUndefined();
    expect(node.isSkipped()).toBeUndefined();
    expect(node.isKeepStructure()).toBeUndefined();
    expect(node.isFile()).toBe(false);
  });
});

describe("EntryNode.buildRootNode", () => {
  it("should create a root node with the name set and path empty", () => {
    const node = EntryNode.buildRootNode("rootName");
    expect(node.getName()).toBe("rootName");
    expect(node.getPath()).toBe("");
    expect(node.getPackageName()).toBeUndefined();
    expect(node.getSampleType()).toBeUndefined();
    expect(node.isSkipped()).toBeUndefined();
    expect(node.isKeepStructure()).toBeUndefined();
    expect(node.isFile()).toBe(false);
  });
});
