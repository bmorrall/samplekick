import { join } from "node:path";
import { EntryNode } from "./registry/entry_node";
import { SimpleValidator } from "./simple_validator";
import { prettyPrint } from "./registry/pretty_print";
import { getPathName, splitPath } from "./path_utils";
import { SourcePathStrategy } from "./path_strategies/source_path_strategy";
import type {
  PathStrategy,
  ConfigSource,
  FileSource,
  ConfigEntry,
  FileEntry,
  Transform,
  TransformEntry,
  TransformSource,
  ValidationResult,
  ExportOptions,
  PostProcessor,
} from "./types";

const buildRootNodeFromFileSource = (fileSource: FileSource): EntryNode => {
  const rootNode = EntryNode.buildRootNode(fileSource.getName());
  fileSource.eachFileEntry((entry) => {
    if (entry.getPath() === "") {
      throw new Error("Entry path must not be empty");
    }
    let currentNode: EntryNode = rootNode;
    const [, ...parentPartsReversed] = [...splitPath(entry.getPath())].reverse();
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

const applyEntryConfig = (node: EntryNode, entry: ConfigEntry): void => {
  const name = entry.getName();
  const packageName = entry.getPackageName();
  const sampleType = entry.getSampleType();
  const skipped = entry.isSkipped();
  const keepStructure = entry.isKeepStructure();
  node.setName(name === getPathName(entry.getPath()) ? undefined : name);
  if (packageName !== undefined) {
    node.setPackageName(packageName);
  }
  if (sampleType !== undefined) {
    node.setSampleType(sampleType);
  }
  if (skipped !== undefined) {
    node.setSkipped(skipped);
  }
  if (keepStructure !== undefined) {
    node.setKeepStructure(keepStructure);
  }
};

export class Registry implements FileSource, ConfigSource {
  private readonly rootNode: EntryNode;
  private pathStrategy: PathStrategy = SourcePathStrategy;
  private readonly postProcessors: PostProcessor[] = [];
  private readonly validator: SimpleValidator;
  private readonly fingerprint: string;

  constructor(fileSource: FileSource) {
    this.rootNode = buildRootNodeFromFileSource(fileSource);
    this.validator = new SimpleValidator();
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

  eachConfigEntry(fn: (entry: ConfigEntry) => void): void {
    this.rootNode.eachDescendant(fn);
  }

  // Config methods

  loadConfig(configSource: ConfigSource): void {
    configSource.eachConfigEntry((entry) => {
      if (entry.getPath() === "") {
        applyEntryConfig(this.rootNode, entry);
        return;
      }

      void this.setEntryConfig(entry);
    });
  }

  // Entry management methods

  getEntry(path: string): ConfigEntry | undefined {
    return this.findEntryNode(path);
  }

  getRootEntry(): TransformEntry {
    return this.rootNode;
  }

  setEntryConfig(entry: ConfigEntry): boolean {
    const node = this.findEntryNode(entry.getPath());
    if (node === undefined) {
      return false;
    }

    applyEntryConfig(node, entry);
    return true;
  }

  // Transform methods

  applyTransform(transform: Transform): void {
    const source: TransformSource = {
      eachTransformEntry: (fn: (entry: TransformEntry) => void) => {
        this.rootNode.eachDescendant(fn);
      },
    };
    transform(source);
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

  setSkipped(skipped: boolean): boolean;
  setSkipped(path: string, skipped: boolean): boolean;
  setSkipped(
    ...args: [skipped: boolean] | [path: string, skipped: boolean]
  ): boolean {
    if (args.length === 1) {
      this.rootNode.setSkipped(args[0]);
      return true;
    }

    const [path, skipped] = args;
    const node = this.findEntryNode(path);
    if (node === undefined) {
      return false;
    }
    node.setSkipped(skipped);
    return true;
  }

  setKeepStructure(value: boolean): boolean;
  setKeepStructure(path: string, value: boolean): boolean;
  setKeepStructure(
    ...args: [value: boolean] | [path: string, value: boolean]
  ): boolean {
    if (args.length === 1) {
      this.rootNode.setKeepStructure(args[0]);
      return true;
    }

    const [path, value] = args;
    const node = this.findEntryNode(path);
    if (node === undefined) {
      return false;
    }
    node.setKeepStructure(value);
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

  /**
   * Returns the destination path for a given entry path, using the current path strategy.
   */
  destinationPathFor(path: string): string | undefined {
    const node = this.findEntryNode(path);
    if (node === undefined || node.isSkipped() === true) {
      return undefined;
    }
    return this.pathStrategy.destinationPathFor(node);
  }

  async exportToDirectory(dirPath: string, options?: ExportOptions): Promise<void> {
    const promises: Array<Promise<void>> = [];
    this.rootNode.eachLeafNode((node) => {
      const destRelPath = this.destinationPathFor(node.getPath());
      if (destRelPath === undefined) {
        /* v8 ignore next */
        return;
      }
      const write = async (): Promise<void> => {
        options?.onBeforeWrite?.(node, destRelPath);
        try {
          const destPath = join(dirPath, destRelPath);
          await node.copyToPath(destPath);
          await this.postProcessors.reduce<Promise<void>>(
            async (chain, processor) => { await chain; await processor.processFile(destPath, node); },
            Promise.resolve(),
          );
          options?.onAfterWrite?.(node, destRelPath);
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          options?.onAfterWrite?.(node, destRelPath, error);
          throw error;
        }
      };
      promises.push(write());
    });
    const results = await Promise.allSettled(promises);
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => (r.reason instanceof Error ? r.reason : new Error(String(r.reason))));
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

  // Validation methods

  validate(): ValidationResult {
    return this.validator.validate({
      eachConfigEntry: (fn) => { this.rootNode.eachLeafNode(fn); },
    });
  }

  validateEntry(path: string): ValidationResult {
    const node = this.findEntryNode(path);
    if (node === undefined) {
      return {
        valid: true,
        errors: [],
      };
    }
    return this.validator.validate({
      eachConfigEntry: (fn) => { node.eachLeafNode(fn); },
    });
  }

  // Debugging methods

  toString(verbose = false): string {
    return prettyPrint(this.rootNode, verbose);
  }
}
