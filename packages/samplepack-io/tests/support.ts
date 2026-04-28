import { vi } from "vitest";
import type {
  ConfigSource,
  FileSource,
  ConfigEntry,
  FileEntry,
  FileNode,
  TransformEntry,
  TransformSource,
} from "../src";
import { getPathName } from "../src/path_utils";

// Entries

export const createConfigEntry = ({
  path,
  name,
  packageName,
  sampleType,
  skipped,
  keepStructure,
}: {
  path: string;
  name?: string;
  packageName?: string;
  sampleType?: string;
  skipped?: boolean;
  keepStructure?: boolean;
}): ConfigEntry => ({
  getPath: () => path,
  getName: () => name ?? getPathName(path),
  getPackageName: () => packageName,
  getSampleType: () => sampleType,
  isSkipped: () => skipped,
  isKeepStructure: () => keepStructure,
});

export const createFileEntry = (opts: {
  path: string;
  name?: string;
}): FileEntry => ({
  getPath: () => opts.path,
  getName: () => opts.name ?? getPathName(opts.path),
  // eslint-disable-next-line @typescript-eslint/require-await -- stub that always throws
  copyToPath: async (_path: string): Promise<void> => {
    /* v8 ignore next */
    throw new Error("Not implemented");
  },
});

export const createTransformEntry = (opts: {
  name: string;
  path?: string;
  packageName?: string;
  sampleType?: string;
  skipped?: boolean;
  keepStructure?: boolean;
  isFile?: boolean;
  parentNode?: FileNode;
}): TransformEntry => ({
  // istanbul ignore next: test stub, not meant to be covered
  getName: () => opts.name,
  // istanbul ignore next
  getPath: () => opts.path ?? "",
  // istanbul ignore next
  getPackageName: () => opts.packageName,
  // istanbul ignore next
  getSampleType: () => opts.sampleType,
  // istanbul ignore next
  isSkipped: () => opts.skipped,
  // istanbul ignore next
  isKeepStructure: () => opts.keepStructure,
  // istanbul ignore next
  isFile: () => opts.isFile ?? true,
  // istanbul ignore next
  getParentNode: () => opts.parentNode,
  // istanbul ignore next
  getChildNodes: () => [],
  // istanbul ignore next
  setName: vi.fn<(name: string | undefined) => void>(),
  // istanbul ignore next
  setPackageName: vi.fn<(name: string | undefined) => void>(),
  // istanbul ignore next
  setSampleType: vi.fn<(name: string | undefined) => void>(),
  // istanbul ignore next
  setSkipped: vi.fn<(name: boolean | undefined) => void>(),
  // istanbul ignore next
  setKeepStructure: vi.fn<(name: boolean | undefined) => void>(),
});

export const createTransformEntryInHierarchy = (
  parents: Array<{
    name: string;
    packageName?: string;
    sampleType?: string;
    skipped?: boolean;
    keepStructure?: boolean;
  }> = [],
  part: {
    name: string;
    path?: string;
    packageName?: string;
    sampleType?: string;
    skipped?: boolean;
    keepStructure?: boolean;
    isFile?: boolean;
  },
  children: Array<{
    name: string;
    packageName?: string;
    sampleType?: string;
    skipped?: boolean;
    keepStructure?: boolean;
  }> = [],
): TransformEntry => {
  // Build parent chain using mutable refs so each node can reference its child
  let currentPath = "";
  let lastParent: FileNode | undefined = undefined;
  let prevChildRef: { current: FileNode | undefined } | undefined = undefined;

  for (const parentPart of parents) {
    currentPath = currentPath === "" ? parentPart.name : `${currentPath}/${parentPart.name}`;
    const path = currentPath;
    const currentParent = lastParent;
    const nodeChildRef: { current: FileNode | undefined } = { current: undefined };
    const parentNode: FileNode = {
      getPath: () => path,
      getName: () => parentPart.name,
      getPackageName: () => parentPart.packageName,
      getSampleType: () => parentPart.sampleType,
      isSkipped: () => parentPart.skipped,
      isKeepStructure: () => parentPart.keepStructure,
      isFile: () => false,
      getParentNode: () => currentParent,
      getChildNodes: () => (nodeChildRef.current === undefined ? [] : [nodeChildRef.current]),
    };
    if (prevChildRef !== undefined) {
      prevChildRef.current = parentNode;
    }
    prevChildRef = nodeChildRef;
    lastParent = parentNode;
  }

  const entryPath = part.path ?? (currentPath === "" ? part.name : `${currentPath}/${part.name}`);
  const entryParent = lastParent;
  const childNodesRef: { current: FileNode[] } = { current: [] };

  const entry: TransformEntry = {
    // istanbul ignore next: test stub, not meant to be covered
    getName: () => part.name,
    // istanbul ignore next
    getPath: () => entryPath,
    // istanbul ignore next
    getPackageName: () => part.packageName,
    // istanbul ignore next
    getSampleType: () => part.sampleType,
    // istanbul ignore next
    isSkipped: () => part.skipped,
    // istanbul ignore next
    isKeepStructure: () => part.keepStructure,
    // istanbul ignore next
    isFile: () => part.isFile ?? true,
    // istanbul ignore next
    getParentNode: () => entryParent,
    // istanbul ignore next
    getChildNodes: () => childNodesRef.current,
    // istanbul ignore next
    setName: vi.fn<(name: string | undefined) => void>(),
    // istanbul ignore next
    setPackageName: vi.fn<(name: string | undefined) => void>(),
    // istanbul ignore next
    setSampleType: vi.fn<(name: string | undefined) => void>(),
    // istanbul ignore next
    setSkipped: vi.fn<(name: boolean | undefined) => void>(),
    // istanbul ignore next
    setKeepStructure: vi.fn<(name: boolean | undefined) => void>(),
  };

  // Wire last parent's child ref to entry
  if (prevChildRef !== undefined) {
    prevChildRef.current = entry;
  }

  // Build child nodes
  childNodesRef.current = children.map((childPart) => {
    const childPath = `${entryPath}/${childPart.name}`;
    return {
      getPath: () => childPath,
      getName: () => childPart.name,
      getPackageName: () => childPart.packageName,
      getSampleType: () => childPart.sampleType,
      isSkipped: () => childPart.skipped,
      isKeepStructure: () => childPart.keepStructure,
      isFile: () => true,
      getParentNode: () => entry,
      getChildNodes: () => [],
    };
  });

  return entry;
};

// Config Source

export const singleEntryTransformSource = (entry: TransformEntry): TransformSource => ({
  eachTransformEntry: (fn: (e: TransformEntry) => void) => {
    fn(entry);
  },
});

export const createConfigSource = (
  nodes: ConfigEntry[],
): ConfigSource => ({
  eachConfigEntry: (fn: (entry: ConfigEntry) => void) => {
    nodes.forEach(fn);
  },
});

export const collectConfigEntries = (
  configSource: ConfigSource,
): ConfigEntry[] => {
  const entries: ConfigEntry[] = [];

  configSource.eachConfigEntry((entry) => {
    entries.push(entry);
  });

  return entries;
};

export const createFileNodeHierarchy = (
  rootName: string,
  parts: Array<{
    name: string;
    packageName?: string;
    sampleType?: string;
    skipped?: boolean;
    keepStructure?: boolean;
  }>,
): FileNode => {
  // Each node uses a mutable ref so its child can be assigned after the child is created
  const rootChildRef: { current: FileNode | undefined } = { current: undefined };
  const root: FileNode = {
    getPath: () => "",
    getName: () => rootName,
    getPackageName: () => undefined,
    getSampleType: () => undefined,
    isSkipped: () => undefined,
    isKeepStructure: () => undefined,
    isFile: () => false,
    getParentNode: () => undefined,
    getChildNodes: () => (rootChildRef.current === undefined ? [] : [rootChildRef.current]),
  };
  let parent: FileNode = root;
  let leaf: FileNode = root;
  let prevChildRef: { current: FileNode | undefined } = rootChildRef;
  let currentPath = "";
  for (const part of parts) {
    currentPath = currentPath === "" ? part.name : `${currentPath}/${part.name}`;
    const path = currentPath;
    const currentParent = parent;
    const nodeChildRef: { current: FileNode | undefined } = { current: undefined };
    const node: FileNode = {
      getPath: () => path,
      getName: () => part.name,
      getPackageName: () => part.packageName,
      getSampleType: () => part.sampleType,
      isSkipped: () => part.skipped,
      isKeepStructure: () => part.keepStructure,
      isFile: () => true,
      getParentNode: () => currentParent,
      getChildNodes: () => (nodeChildRef.current === undefined ? [] : [nodeChildRef.current]),
    };
    prevChildRef.current = node;
    prevChildRef = nodeChildRef;
    leaf = node;
    parent = node;
  }
  return leaf;
};

// File Source

export const createFileSource = (entries: FileEntry[]): FileSource => ({
  eachFileEntry: (fn: (entry: FileEntry) => void) => {
    entries.forEach(fn);
  },
});

export const collectFileEntries = (fileSource: FileSource): FileEntry[] => {
  const entries: FileEntry[] = [];

  fileSource.eachFileEntry((entry) => {
    entries.push(entry);
  });

  return entries;
}

// Registry

export const loadRegistry = (
  registry: { load: (fileSource: FileSource) => void },
  files: FileEntry[],
): void => {
  registry.load(createFileSource(files));
};
