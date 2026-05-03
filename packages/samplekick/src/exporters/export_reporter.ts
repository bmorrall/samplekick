import type { ConfigEntry, ExportOptions } from "samplekick-io";

export interface ExportReporter extends ExportOptions {
  onInfo: (message: string) => void;
  onDebug: (message: string) => void;
  onError: (message: string) => void;
  onSkip: (entry: ConfigEntry, reason: string) => void;
  onComplete: (dirPath: string) => void;
}
