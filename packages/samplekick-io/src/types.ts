// Digest

export interface DigestEntry {
  getPath: () => string;
  getName: () => string;
  getPackageName: () => string | undefined;
  getSampleType: () => string | undefined;
  isEnabled: () => boolean;
  isReadOnly?: () => boolean | undefined;
}

export interface DigestSource {
  eachDigestEntry: (fn: (entry: DigestEntry) => void) => void;
}

export interface DigestWriter {
  writeDigest: (digestSource: DigestSource) => void;
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

export interface FileNode extends DigestEntry {
  isFile: () => boolean;
  getParentNode: () => FileNode | undefined;
  getChildNodes: () => FileNode[];
}

export interface LeafNode extends FileNode {
  getParentNode: () => FileNode;
}

// Transform

export type StringTransformer = (value: string) => string;

export interface TransformEntry extends FileNode {
  getOwnPackageName: () => string | undefined;
  getOwnSampleType: () => string | undefined;
  setName: (name: string | undefined) => void;
  setPackageName: (name: string | undefined) => void;
  setSampleType: (type: string | undefined) => void;
  setEnabled: (value: boolean) => void;
  setReadOnly: (value: boolean) => void;
  isReadOnly: () => boolean | undefined;
}

export interface TransformSource {
  eachTransformEntry: (fn: (entry: TransformEntry) => void) => void;
  eachTransformModification: (fn: (entry: TransformEntry) => void) => void;
}

export interface Transform {
  transform: (source: TransformSource) => void;
}

// Device Preset

export type Validate = (
  destRelPath: string,
  entry: DigestEntry,
) => string | undefined;

export interface DevicePreset {
  displayName: string;
  transforms: readonly Transform[];
  validators: readonly Validate[];
  targetBitDepth?: number;
  targetSampleRate?: number;
}

// Export

export interface PostProcessor {
  /**
   * Processes the file at destPath. If the file was moved/renamed (e.g. converted
   * to a different extension), return the new absolute path so callers can track
   * the true final location; return undefined if the path is unchanged.
   */
  processFile: (
    destPath: string,
    entry: DigestEntry,
  ) => Promise<string | undefined> | string | undefined;
}

export interface ExportOptions {
  onSkip?: (entry: FileNode) => void;
  onBeforeWrite?: (entry: DigestEntry, destRelPath: string) => void;
  onAfterWrite?: (
    entry: DigestEntry,
    destRelPath: string,
    error?: Error,
  ) => void;
  onReject?: (entry: DigestEntry, reason: string) => void;
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
