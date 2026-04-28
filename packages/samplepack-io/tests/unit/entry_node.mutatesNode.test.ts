import { describe, it, expect } from 'vitest';
import { EntryNode } from '../../src/registry/entry_node';

function makeNode({
  name,
  packageName,
  sampleType,
  skipped,
  keepStructure,
  path = 'foo',
}: {
  name?: string;
  packageName?: string;
  sampleType?: string;
  skipped?: boolean;
  keepStructure?: boolean;
  path?: string;
} = {}): EntryNode {
  const node = EntryNode.blankEntry(path);
  if (name !== undefined) node.setName(name);
  if (packageName !== undefined) node.setPackageName(packageName);
  if (sampleType !== undefined) node.setSampleType(sampleType);
  if (skipped !== undefined) node.setSkipped(skipped);
  if (keepStructure !== undefined) node.setKeepStructure(keepStructure);
  return node;
}

describe('EntryNode.mutatesNode', () => {
  it('returns false for identical nodes with default name', () => {
    const a = makeNode({ path: 'foo' });
    const b = makeNode({ path: 'foo' });
    expect(a.mutatesNode(b)).toBe(false);
  });

  it('returns true if this node name is set and does not match path', () => {
    const a = makeNode({ name: 'bar', path: 'foo' });
    const b = makeNode({ name: 'bar', path: 'foo' });
    expect(a.mutatesNode(b)).toBe(true);
  });

  it('returns true if packageName differs', () => {
    const a = makeNode({ path: 'foo', packageName: 'pkg1' });
    const b = makeNode({ path: 'foo', packageName: 'pkg2' });
    expect(a.mutatesNode(b)).toBe(true);
  });

  it('returns true if sampleType differs', () => {
    const a = makeNode({ path: 'foo', sampleType: 'wav' });
    const b = makeNode({ path: 'foo', sampleType: 'mp3' });
    expect(a.mutatesNode(b)).toBe(true);
  });

  it('returns true if skipped differs', () => {
    const a = makeNode({ path: 'foo', skipped: true });
    const b = makeNode({ path: 'foo', skipped: false });
    expect(a.mutatesNode(b)).toBe(true);
  });

  it('returns true if keepStructure differs', () => {
    const a = makeNode({ path: 'foo', keepStructure: true });
    const b = makeNode({ path: 'foo', keepStructure: false });
    expect(a.mutatesNode(b)).toBe(true);
  });

  it('returns false if all compared values are undefined and name matches path', () => {
    const a = makeNode({ path: 'foo' });
    const b = makeNode({ path: 'foo' });
    expect(a.mutatesNode(b)).toBe(false);
  });

  it('returns true if this.getName() does not match getPathName(this.path)', () => {
    const a = makeNode({ name: 'baz', path: 'foo/bar' });
    const b = makeNode({ name: 'baz', path: 'foo/bar' });
    expect(a.mutatesNode(b)).toBe(true);
  });
});
