import { describe, it, expect } from "vitest";
import { EntryNode } from "../../src/registry/entry_node";

function makeNode({
  name,
  packageName,
  sampleType,
  enabled,
  path = "foo",
}: {
  name?: string;
  packageName?: string;
  sampleType?: string;
  enabled?: boolean;
  path?: string;
} = {}): EntryNode {
  const node = EntryNode.blankEntry(path);
  if (name !== undefined) node.setName(name);
  if (packageName !== undefined) node.setPackageName(packageName);
  if (sampleType !== undefined) node.setSampleType(sampleType);
  if (enabled !== undefined) node.setEnabled(enabled);
  return node;
}

describe("EntryNode.mutatesNode", () => {
  it("returns false for identical nodes with default name", () => {
    const a = makeNode({ path: "foo" });
    const b = makeNode({ path: "foo" });
    expect(a.mutatesNode(b)).toBe(false);
  });

  it("returns true if this node name is set and does not match path", () => {
    const a = makeNode({ name: "bar", path: "foo" });
    const b = makeNode({ name: "bar", path: "foo" });
    expect(a.mutatesNode(b)).toBe(true);
  });

  it("returns true if packageName differs", () => {
    const a = makeNode({ path: "foo", packageName: "pkg1" });
    const b = makeNode({ path: "foo", packageName: "pkg2" });
    expect(a.mutatesNode(b)).toBe(true);
  });

  it("returns true if sampleType differs", () => {
    const a = makeNode({ path: "foo", sampleType: "wav" });
    const b = makeNode({ path: "foo", sampleType: "mp3" });
    expect(a.mutatesNode(b)).toBe(true);
  });

  it("returns true if enabled differs", () => {
    const a = makeNode({ path: "foo", enabled: false });
    const b = makeNode({ path: "foo", enabled: true });
    expect(a.mutatesNode(b)).toBe(true);
  });

  it("returns false if all compared values are undefined and name matches path", () => {
    const a = makeNode({ path: "foo" });
    const b = makeNode({ path: "foo" });
    expect(a.mutatesNode(b)).toBe(false);
  });

  it("returns true if this.getName() does not match getPathName(this.path)", () => {
    const a = makeNode({ name: "baz", path: "foo/bar" });
    const b = makeNode({ name: "baz", path: "foo/bar" });
    expect(a.mutatesNode(b)).toBe(true);
  });
});
