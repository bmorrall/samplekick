import type { DigestEntry, ExportOptions, FileNode } from "samplekick-io";

export interface ExportReporter extends ExportOptions {
  onStart: (packName: string) => void;
  onInfo: (message: string) => void;
  onDebug: (message: string) => void;
  onError: (message: string) => void;
  onAfterWrite: (
    entry: DigestEntry,
    destRelPath: string,
    error?: Error,
  ) => void;
  onSkip: (entry: FileNode) => void;
  onReject: (entry: DigestEntry, reason: string) => void;
  onComplete: (dirPath: string) => void;
  onPreview: () => void;
}
