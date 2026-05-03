// Configuration

export interface ConfigEntry {
  getPath: () => string;
  getName: () => string;
  getPackageName: () => string | undefined;
  getSampleType: () => string | undefined;
  isSkipped: () => boolean | undefined;
  isKeepStructure: () => boolean | undefined;
}

export interface ConfigSource {
  eachConfigEntry: (fn: (entry: ConfigEntry) => void) => void;
}

export interface ConfigWriter {
  writeConfig: (configSource: ConfigSource) => void;
}

// Files

export interface FileEntry {
  getName: () => string;
  getPath: () => string;
  copyToPath: (path: string) => Promise<void>;
}

export interface FileSource {
  getName: () => string;
  getFingerprint: () => string;
  eachFileEntry: (fn: (entry: FileEntry) => void) => void;
}

// FileNode

export interface FileNode extends ConfigEntry {
  isFile: () => boolean;
  getParentNode: () => FileNode | undefined;
  getChildNodes: () => FileNode[];
}

export interface LeafNode extends FileNode {
  getParentNode: () => FileNode;
}

// Transform

export interface TransformEntry extends FileNode {
  setName: (name: string | undefined) => void;
  setPackageName: (name: string | undefined) => void;
  setSampleType: (type: string | undefined) => void;
  setSkipped: (skipped: boolean) => void;
  setKeepStructure: (value: boolean) => void;
}

export interface TransformSource {
  eachTransformEntry: (fn: (entry: TransformEntry) => void) => void;
}

export type Transform = (source: TransformSource) => void;

// Device Preset

export interface DevicePreset {
  displayName: string;
  transforms: readonly Transform[];
  targetBitDepth?: number;
  targetSampleRate?: number;
}

// Export

export interface PostProcessor {
  processFile: (destPath: string, entry: ConfigEntry) => Promise<void> | void;
}

export interface ExportOptions {
  onDebug?: (message: string) => void;
  onBeforeWrite?: (entry: ConfigEntry, destRelPath: string) => void;
  onAfterWrite?: (entry: ConfigEntry, destRelPath: string, error?: Error) => void;
  onSkip?: (entry: ConfigEntry, reason: string) => void;
}

// Path Strategy

export class PathResult {
  constructor(readonly path: string) {}
}

export class SkipResult {
  constructor(readonly reason: string) {}
}

export interface PathStrategy {
  /**
   * Given a LeafNode (non-root), returns a PathResult with the output path, or a SkipResult with the reason it should be skipped.
   */
  destinationPathFor: (node: LeafNode) => PathResult | SkipResult;
}
