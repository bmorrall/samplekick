import type { ExportOptions } from "samplekick-io";

export interface ExportReporter extends ExportOptions {
  onDebug: (message: string) => void;
  onComplete: (dirPath: string) => void;
}
