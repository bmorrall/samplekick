import type { Writable } from "node:stream";
import type { ConfigEntry } from "samplekick-io";
import type { ExportReporter } from "./export_reporter";

export class SimpleExportReporter implements ExportReporter {
  private readonly output: Writable;

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
      this.output.write(`failed: ${destRelPath}: ${error.message}\n`);
    }
  }

  onComplete(dirPath: string): void {
    this.output.write(`Exported to ${dirPath}\n`);
  }
}
