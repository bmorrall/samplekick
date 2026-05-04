import type { ConfigEntry, ExportOptions } from "samplekick-io";

export interface ExportReporter extends ExportOptions {
  onInfo: (message: string) => void;
  onDebug: (message: string) => void;
  onError: (message: string) => void;
  onAfterWrite: (entry: ConfigEntry, destRelPath: string, error?: Error) => void;
  onSkip: (entry: ConfigEntry, reason: string) => void;
  onComplete: (dirPath: string) => void;
  onPreview: (successCount: number, skipCount: number) => void;
}
