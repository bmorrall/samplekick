import type { Writable } from "node:stream";
import type { ConfigEntry } from "samplekick-io";
import type { ExportReporter } from "./export_reporter";

export class SimpleExportReporter implements ExportReporter {
  private readonly output: Writable;
  private errorCount = 0;

  constructor(output: Writable = process.stdout) {
    this.output = output;
  }

  onBeforeWrite(_entry: ConfigEntry, _destRelPath: string): void {
    // no-op by default; override or extend to add pre-write output
  }

  onAfterWrite(_entry: ConfigEntry, destRelPath: string, error?: Error): void {
    if (error === undefined) {
      this.output.write(`${destRelPath}\n`);
    } else {
      this.errorCount += 1;
      this.output.write(`failed: ${destRelPath}: ${error.message}\n`);
    }
  }

  onComplete(dirPath: string): void {
    if (this.errorCount > 0) {
      const plural = this.errorCount === 1 ? "error" : "errors";
      this.output.write(`Exported to ${dirPath} (${this.errorCount} ${plural})\n`);
    } else {
      this.output.write(`Exported to ${dirPath}\n`);
    }
  }
}
