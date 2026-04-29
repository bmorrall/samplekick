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
  eachFileEntry: (fn: (entry: FileEntry) => void) => void;
}

// FileNode

export interface FileNode extends ConfigEntry {
  isFile: () => boolean;
  getParentNode: () => FileNode | undefined;
  getChildNodes: () => FileNode[];
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

// Validation

export interface Validator {
  validate: (configSource: ConfigSource) => ValidationResult;
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Device Preset

export interface DevicePreset {
  displayName: string;
  transforms: readonly Transform[];
}

// Path Strategy

export interface PathStrategy {
  /**
   * Given a leaf FileNode, returns the output path or undefined.
   */
  destinationPathFor: (node: FileNode) => string | undefined;
}
