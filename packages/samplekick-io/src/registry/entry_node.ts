import { prettyPrint } from "./pretty_print";
import { getPathName } from "../path_utils";
import type { ConfigEntry, FileEntry, FileNode, TransformEntry } from "../types";

export class EntryNode implements ConfigEntry, FileEntry, FileNode, TransformEntry {

  static buildRootNode(name: string): EntryNode {
    const entry = this.blankEntry("");
    entry.setName(name);
    return entry;
  }

  static blankEntry(path: string): EntryNode {
    return new EntryNode(
      path,
      undefined,
      undefined,
    );
  }

  static fromEntry(entry: FileEntry, parentNode?: EntryNode): EntryNode {
    return new EntryNode(entry.getPath(), entry, parentNode);
  }

  private readonly path: string;
  private readonly entryRef: { current: FileEntry | undefined } = { current: undefined };
  private readonly parentNode?: EntryNode;
  private readonly nodeLookup = new Map<string, EntryNode>();

  private name?: string;
  private packageName?: string;
  private sampleType?: string;
  private skipped?: boolean;
  private keepStructure?: boolean;

  constructor(path: string, entry?: FileEntry, parentNode?: EntryNode) {
    this.path = path;
    this.parentNode = parentNode;

    if (entry !== undefined) {
      this.replaceEntry(entry);
    }

    if (parentNode === undefined) {
      return;
    }

    const pathParts = path.split("/").reverse();
    const [pathName = ""] = pathParts;

    const expectedPath =
      parentNode.parentNode === undefined
        ? pathName
        : `${parentNode.getPath()}/${pathName}`;

    if (expectedPath !== path) {
      throw new Error(
        `Entry path "${path}" does not match expected path "${expectedPath}"`,
      );
    }
  }

  private get entry(): FileEntry | undefined {
    return this.entryRef.current;
  }

  isFile(): boolean {
    return this.entry !== undefined;
  }

  // ConfigEntry methods

  getName(): string {
    return this.name ?? this.entry?.getName() ?? getPathName(this.path);
  }

  getEntryName(): string {
    return this.entry?.getName() ?? getPathName(this.path);
  }

  isRootNode(): boolean {
    return this.path === "";
  }

  getPath(): string {
    return this.path;
  }

  getPackageName(): string | undefined {
    return this.packageName ?? this.parentNode?.getPackageName();
  }

  getSampleType(): string | undefined {
    return this.sampleType ?? this.parentNode?.getSampleType();
  }

  isSkipped(): boolean | undefined {
    return this.skipped ?? this.parentNode?.isSkipped();
  }

  isKeepStructure(): boolean | undefined {
    return this.keepStructure ?? this.parentNode?.isKeepStructure();
  }

  async copyToPath(path: string): Promise<void> {
    await this.entry?.copyToPath(path);
  }

  replaceEntry(entry: FileEntry): void {
    if (this.getChildNodes().length > 0) {
      throw new Error("Cannot set entry on a node with children");
    }
    if (entry.getPath() !== this.path) {
      throw new Error(
        `Entry path "${entry.getPath()}" does not match node path "${this.path}"`,
      );
    }
    this.entryRef.current = entry;
  }

  // Tagging methods

  getOwnName(): string | undefined {
    return this.name;
  }

  setName(name: string | undefined): void {
    this.name = name;
  }

  getOwnPackageName(): string | undefined {
    return this.packageName;
  }

  setPackageName(name: string | undefined): void {
    this.packageName = name;
  }

  getOwnSampleType(): string | undefined {
    return this.sampleType;
  }

  setSampleType(type: string | undefined): void {
    this.sampleType = type;
  }

  getOwnKeepStructure(): boolean | undefined {
    return this.keepStructure;
  }

  getOwnSkipped(): boolean | undefined {
    return this.skipped;
  }

  setSkipped(skipped: boolean): void {
    this.skipped = skipped;
  }

  setKeepStructure(value: boolean): void {
    this.keepStructure = value;
  }

  // Node management methods

  addNode(entry: FileEntry): EntryNode {
    const pathName = getPathName(entry.getPath());
    const existing = this.nodeLookup.get(pathName);
    if (existing !== undefined) {
      throw new Error(`Node already exists at path "${entry.getPath()}"`);
    }

    const node = new EntryNode(entry.getPath(), entry, this);
    this.nodeLookup.set(pathName, node);
    return node;
  }

  addBlankNode(name: string, path: string): EntryNode {
    const existing = this.nodeLookup.get(name);
    if (existing !== undefined) {
      return existing;
    }

    const node = new EntryNode(path, undefined, this)
    this.nodeLookup.set(name, node);
    return node;
  }

  getNode(name: string): EntryNode | undefined {
    return this.nodeLookup.get(name);
  }

  getChildNodes(): EntryNode[] {
    return [...this.nodeLookup.values()];
  }

  getParentNode(): EntryNode | undefined {
    return this.parentNode;
  }

  // Traversal methods

  eachLeafNode(fn: (node: EntryNode) => void): void {
    const children = this.getChildNodes();
    if (this.isFile() && children.length === 0) {
      fn(this);
      return;
    }
    for (const child of children) {
      child.eachLeafNode(fn);
    }
  }

  eachDescendant(fn: (node: EntryNode) => void): void {
    fn(this);
    const sorted = [...this.nodeLookup.values()].sort((a, b) => a.getName().localeCompare(b.getName()));
    for (const child of sorted) {
      child.eachDescendant(fn);
    }
  }

  eachMutatedEntry(fn: (node: EntryNode) => void): void {
    const isLeafFile = this.isFile() && this.getChildNodes().length === 0;
    if (this.parentNode === undefined || this.mutatesNode(this.parentNode) || isLeafFile) {
      fn(this);
    }
    for (const child of this.getChildNodes()) {
      child.eachMutatedEntry(fn);
    }
  }

  // Comparison method

  /**
   * Returns true if this node's key properties differ from the given node.
   * Compares getPackageName, getSampleType, isSkipped, isKeepStructure.
   */
  mutatesNode(node: EntryNode): boolean {
    // name has been changed
    if (this.getName() !== getPathName(this.path)) return true;

    // other properties have been changed
    if (this.getPackageName() !== node.getPackageName()) return true;
    if (this.getSampleType() !== node.getSampleType()) return true;
    if (this.isSkipped() !== node.isSkipped()) return true;
    if (this.isKeepStructure() !== node.isKeepStructure()) return true;
    return false;
  }

  // Debug Helpers

  toString(verbose = false): string {
    return prettyPrint(this, verbose);
  }
}
