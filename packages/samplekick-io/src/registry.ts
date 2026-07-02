import { join } from "node:path";
import { EntryNode } from "./registry/entry_node";
import { prettyPrint } from "./registry/pretty_print";
import { getPathName, splitPath } from "./path_utils";
import { SourcePathStrategy } from "./path_strategies/source_path_strategy";
import { SkipResult } from "./types";
import type {
  LeafNode,
  PathStrategy,
  DigestSource,
  FileSource,
  DigestEntry,
  FileEntry,
  Transform,
  TransformEntry,
  TransformSource,
  ExportOptions,
  PostProcessor,
  Validate,
} from "./types";

const isLeafNode = (node: EntryNode): node is EntryNode & LeafNode =>
  node.getParentNode() !== undefined;

const buildRootNodeFromFileSource = (fileSource: FileSource): EntryNode => {
  const rootNode = EntryNode.buildRootNode(fileSource.getName());
  fileSource.eachFileEntry((entry) => {
    if (entry.getPath() === "") {
      throw new Error("Entry path must not be empty");
    }
    let currentNode: EntryNode = rootNode;
    const [, ...parentPartsReversed] = [
      ...splitPath(entry.getPath()),
    ].reverse();
    let currentPath = "";
    for (const part of parentPartsReversed.reverse()) {
      currentPath = currentPath === "" ? part : `${currentPath}/${part}`;
      let nextNode = currentNode.getNode(part);
      nextNode ??= currentNode.addBlankNode(part, currentPath);
      currentNode = nextNode;
    }
    currentNode.addNode(entry);
  });
  return rootNode;
};

const toOwnDigestEntry = (node: EntryNode): DigestEntry => ({
  getPath: () => node.getPath(),
  getName: () => node.getOwnName() ?? getPathName(node.getPath()),
  getPackageName: () => node.getOwnPackageName(),
  getSampleType: () => node.getOwnSampleType(),
  isEnabled: () => node.isEnabled(),
});

interface HasRawEnabled {
  rawEnabled: () => boolean | undefined;
}

const hasRawEnabled = (
  entry: DigestEntry,
): entry is DigestEntry & HasRawEnabled => "rawEnabled" in entry;

const applyEntryDigest = (node: EntryNode, entry: DigestEntry): void => {
  const name = entry.getName();
  const packageName = entry.getPackageName();
  const sampleType = entry.getSampleType();
  const enabled = hasRawEnabled(entry) ? entry.rawEnabled() : entry.isEnabled();
  // Only set name if it differs from the default (path-derived) name, so existing
  // transformer-set names are not overwritten when a digest has no name override
  if (name !== getPathName(entry.getPath())) {
    node.setName(name);
  }
  if (packageName !== undefined) {
    node.setPackageName(packageName);
  }
  if (sampleType !== undefined) {
    node.setSampleType(sampleType);
  }
  if (enabled !== undefined) {
    node.setEnabled(enabled);
  }
};

export class Registry implements FileSource, DigestSource {
  private readonly rootNode: EntryNode;
  private pathStrategy: PathStrategy = SourcePathStrategy;
  private readonly postProcessors: PostProcessor[] = [];
  private readonly validators: Validate[] = [];
  private readonly fingerprint: string;

  constructor(fileSource: FileSource) {
    this.rootNode = buildRootNodeFromFileSource(fileSource);
    this.fingerprint = fileSource.getFingerprint();
  }

  // FileSource methods

  getName(): string {
    return this.rootNode.getName();
  }

  getFingerprint(): string {
    return this.fingerprint;
  }

  eachFileEntry(fn: (entry: FileEntry) => void): void {
    this.rootNode.eachLeafNode(fn);
  }

  eachDigestEntry(fn: (entry: DigestEntry) => void): void {
    const visit = (node: EntryNode, aboveEnabled: boolean): void => {
      const hasOwnEnabled = node.isEnabled() !== node.isFile();
      if (!aboveEnabled || hasOwnEnabled) {
        fn(toOwnDigestEntry(node));
      }
      const childAboveEnabled = aboveEnabled || hasOwnEnabled;
      const sorted = [...node.getChildNodes()].sort((a, b) =>
        a.getName().localeCompare(b.getName()),
      );
      for (const child of sorted) {
        visit(child, childAboveEnabled);
      }
    };
    visit(this.rootNode, false);
  }

  eachEntry(fn: (entry: TransformEntry) => void): void {
    this.rootNode.eachDescendant(fn);
  }

  // Digest methods

  loadDigest(digestSource: DigestSource): void {
    digestSource.eachDigestEntry((entry) => {
      if (entry.getPath() === "") {
        applyEntryDigest(this.rootNode, entry);
        return;
      }

      void this.setEntryDigest(entry);
    });
  }

  // Entry management methods

  getEntry(path: string): DigestEntry | undefined {
    return this.findEntryNode(path);
  }

  getRootEntry(): TransformEntry {
    return this.rootNode;
  }

  setEntryDigest(entry: DigestEntry): boolean {
    const node = this.findEntryNode(entry.getPath());
    if (node === undefined) {
      return false;
    }

    applyEntryDigest(node, entry);
    return true;
  }

  // Transform methods

  applyTransform(transform: Transform): void {
    const source: TransformSource = {
      eachTransformEntry: (fn: (entry: TransformEntry) => void) => {
        this.rootNode.eachDescendant(fn);
      },
      eachTransformModification: (fn: (entry: TransformEntry) => void) => {
        this.rootNode.eachDescendant((node) => {
          if (!node.isFile() && node.isEnabled()) return;
          if (node.isReadOnly() === true) return;
          const facade: TransformEntry = {
            getPath: () => node.getPath(),
            getName: () => node.getName(),
            getPackageName: () => node.getOwnPackageName(),
            getSampleType: () => node.getOwnSampleType(),
            getOwnPackageName: () => node.getOwnPackageName(),
            getOwnSampleType: () => node.getOwnSampleType(),
            isEnabled: () => node.isEnabled(),
            isReadOnly: () => node.isReadOnly(),
            isFile: () => node.isFile(),
            getParentNode: () => node.getParentNode(),
            getChildNodes: () => node.getChildNodes(),
            setName: (name) => {
              node.setName(name);
            },
            setPackageName: (name) => {
              node.setPackageName(name);
            },
            setSampleType: (type) => {
              node.setSampleType(type);
            },
            setEnabled: (value) => {
              node.setEnabled(value);
            },
            setReadOnly: (value) => {
              node.setReadOnly(value);
            },
          };
          fn(facade);
        });
      },
    };
    transform.transform(source);
  }

  // Transform entry management methods

  setName(name: string | undefined): boolean;
  setName(path: string, name: string | undefined): boolean;
  setName(
    ...args:
      | [name: string | undefined]
      | [path: string, name: string | undefined]
  ): boolean {
    if (args.length === 1) {
      this.rootNode.setName(args[0]);
      return true;
    }

    const [path, name] = args;
    const node = this.findEntryNode(path);
    if (node === undefined) {
      return false;
    }
    node.setName(name);
    return true;
  }

  setPackageName(name: string | undefined): boolean;
  setPackageName(path: string, name: string | undefined): boolean;
  setPackageName(
    ...args:
      | [name: string | undefined]
      | [path: string, name: string | undefined]
  ): boolean {
    if (args.length === 1) {
      this.rootNode.setPackageName(args[0]);
      return true;
    }

    const [path, name] = args;
    const node = this.findEntryNode(path);
    if (node === undefined) {
      return false;
    }
    node.setPackageName(name);
    return true;
  }

  setSampleType(type: string | undefined): boolean;
  setSampleType(path: string, type: string | undefined): boolean;
  setSampleType(
    ...args:
      | [type: string | undefined]
      | [path: string, type: string | undefined]
  ): boolean {
    if (args.length === 1) {
      this.rootNode.setSampleType(args[0]);
      return true;
    }

    const [path, type] = args;
    const node = this.findEntryNode(path);
    if (node === undefined) {
      return false;
    }
    node.setSampleType(type);
    return true;
  }

  setEnabled(value: boolean): boolean;
  setEnabled(path: string, value: boolean): boolean;
  setEnabled(
    ...args: [value: boolean] | [path: string, value: boolean]
  ): boolean {
    if (args.length === 1) {
      this.rootNode.setEnabled(args[0]);
      return true;
    }

    const [path, value] = args;
    const node = this.findEntryNode(path);
    if (node === undefined) {
      return false;
    }
    node.setEnabled(value);
    return true;
  }

  // Path strategy methods

  setPathStrategy(strategy: PathStrategy): void {
    this.pathStrategy = strategy;
  }

  // Post-processor methods

  addPostProcessor(processor: PostProcessor): void {
    this.postProcessors.push(processor);
  }

  // Validator methods

  addValidator(validate: Validate): void {
    this.validators.push(validate);
  }

  /**
   * Returns the destination path for a given entry path, using the current path strategy.
   */
  destinationPathFor(path: string): string | undefined {
    const node = this.findEntryNode(path);
    if (node === undefined || !node.isEnabled() || !isLeafNode(node)) {
      return undefined;
    }
    const result = this.pathStrategy.destinationPathFor(node);
    return result instanceof SkipResult ? undefined : result.path;
  }

  async exportToDirectory(
    dirPath: string | undefined,
    options: ExportOptions,
  ): Promise<void> {
    // Report skipped file nodes (files with enabled=false).
    if (options.onSkip !== undefined) {
      const { onSkip } = options;
      this.rootNode.eachLeafNode((node) => {
        if (!node.isEnabled()) {
          onSkip(node);
        }
      });
    }

    const promises: Array<Promise<void>> = [];
    const seenDestPaths = new Set<string>();
    this.rootNode.eachLeafNode((node) => {
      if (!node.isEnabled()) {
        return;
      }
      if (!isLeafNode(node)) {
        return;
      }
      const result = this.pathStrategy.destinationPathFor(node);
      if (result instanceof SkipResult) {
        options.onReject?.(node, result.reason);
        return;
      }
      const { path: destRelPath } = result;
      if (seenDestPaths.has(destRelPath)) {
        options.onReject?.(node, `duplicate destination: ${destRelPath}`);
        return;
      }
      seenDestPaths.add(destRelPath);
      const write = async (): Promise<void> => {
        for (const validate of this.validators) {
          const reason = validate(destRelPath, node);
          if (reason !== undefined) {
            options.onReject?.(node, reason);
            return;
          }
        }
        options.onBeforeWrite?.(node, destRelPath);
        if (dirPath !== undefined) {
          try {
            const destPath = join(dirPath, destRelPath);
            await node.copyToPath(destPath);
            await this.postProcessors.reduce<Promise<void>>(
              async (chain, processor) => {
                await chain;
                await processor.processFile(destPath, node);
              },
              Promise.resolve(),
            );
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            options.onAfterWrite?.(node, destRelPath, error);
            throw error;
          }
        }
        options.onAfterWrite?.(node, destRelPath);
      };
      promises.push(write());
    });
    const results = await Promise.allSettled(promises);
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) =>
        r.reason instanceof Error ? r.reason : new Error(String(r.reason)),
      );
    if (errors.length > 0) {
      throw new AggregateError(errors, "One or more entries failed to export");
    }
  }

  // Entry lookup methods

  private findEntryNode(path: string): EntryNode | undefined {
    let { rootNode: currentNode } = this;
    for (const part of splitPath(path)) {
      const nextNode = currentNode.getNode(part);
      if (nextNode === undefined) {
        return undefined;
      }
      currentNode = nextNode;
    }
    return currentNode;
  }

  // Debugging methods

  toString(verbose = false): string {
    return prettyPrint(this.rootNode, verbose);
  }
}
