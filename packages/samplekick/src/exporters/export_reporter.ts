import type { ExportOptions } from "samplekick-io";

export interface ExportReporter extends ExportOptions {
  onInfo: (message: string) => void;
  onDebug: (message: string) => void;
  onComplete: (dirPath: string) => void;
}
