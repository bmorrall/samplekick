import type { ConfigEntry, ExportOptions, FileNode } from "samplekick-io";

export interface ExportReporter extends ExportOptions {
  onStart: (packName: string) => void;
  onInfo: (message: string) => void;
  onDebug: (message: string) => void;
  onError: (message: string) => void;
  onAfterWrite: (
    entry: ConfigEntry,
    destRelPath: string,
    error?: Error,
  ) => void;
  onSkip: (entry: FileNode) => void;
  onReject: (entry: ConfigEntry, reason: string) => void;
  onComplete: (dirPath: string) => void;
  onPreview: () => void;
}
