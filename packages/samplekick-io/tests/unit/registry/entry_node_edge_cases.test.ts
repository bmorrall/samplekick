import { describe, it, expect } from "vitest";
import { EntryNode } from "../../../src/registry/entry_node";
import { createFileEntry } from "../../support";

describe("EntryNode edge cases", () => {

  it("throws if entry path does not match node path (with parent)", () => {
    const parent = new EntryNode("foo");
    // The entry path is 'foo/baz', but node path is 'foo/bar', so this should throw
    expect(() => new EntryNode("foo/bar", createFileEntry({ path: "foo/baz" }), parent)).toThrow(
      'Entry path "foo/baz" does not match node path "foo/bar"'
    );
  });

  it("throws if expectedPath does not match path", () => {
    const parent = new EntryNode("foo");
    // The only valid child path for parent 'foo' is 'foo/bar', so 'bar/baz' is invalid
    expect(() => new EntryNode("bar/baz", undefined, parent)).toThrow(
      'Entry path "bar/baz" does not match expected path "baz"'
    );
  });

  it("throws if replaceEntry is called on a node with children", () => {
    const parent = new EntryNode("foo");
    // Add a valid child node (child path must be 'bar' for parent 'foo')
    parent.addBlankNode("bar", "bar");
    expect(() => { parent.replaceEntry(createFileEntry({ path: "foo" })); }).toThrow(
      "Cannot set entry on a node with children"
    );
  });

  it("addNode throws if a node already exists at that path", () => {
    const parent = new EntryNode("foo");
    const entry = createFileEntry({ path: "bar" });
    parent.addNode(entry);
    expect(() => parent.addNode(entry)).toThrow('Node already exists at path "bar"');
  });

  it("addBlankNode returns existing child if present", () => {
    const parent = new EntryNode("foo");
    // addBlankNode expects the path to be 'foo/bar' for child 'bar'
    const blank1 = parent.addBlankNode("bar", "bar");
    const blank2 = parent.addBlankNode("bar", "bar");
    expect(blank1).toBe(blank2);
  });
});
