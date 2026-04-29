import type { ExportOptions } from "samplekick-io";

export interface ExportReporter extends ExportOptions {
  onComplete: (dirPath: string) => void;
}
