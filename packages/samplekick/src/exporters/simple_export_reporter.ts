import type { Writable } from "node:stream";
import type { ConfigEntry } from "samplekick-io";
import type { ExportReporter } from "./export_reporter";

export class SimpleExportReporter implements ExportReporter {
  private readonly output: Writable;
  private readonly quiet: boolean;
  private readonly packName: string;
  private totalCount = 0;
  private errorCount = 0;
  private started = false;

  constructor(output: Writable, quiet = false, packName = "") {
    this.output = output;
    this.quiet = quiet;
    this.packName = packName;
  }

  onInfo(message: string): void {
    this.output.write(`${message}\n`);
  }

  onDebug(message: string): void {
    this.output.write(`${message}\n`);
  }

  onError(message: string): void {
    this.output.write(`error: ${message}\n`);
  }

  onBeforeWrite(_entry: ConfigEntry, _destRelPath: string): void {
    if (!this.started) {
      this.started = true;
      const label = this.packName.length > 0 ? ` ${this.packName}` : "";
      this.output.write(`Exporting${label}\u2026\n`);
    }
  }

  onAfterWrite(_entry: ConfigEntry, destRelPath: string, error?: Error): void {
    this.totalCount += 1;
    if (error === undefined) {
      if (!this.quiet) {
        this.output.write(`success: ${destRelPath}\n`);
      }
    } else {
      this.errorCount += 1;
      this.output.write(`failed: ${destRelPath}: ${error.message}\n`);
    }
  }

  onReject(entry: ConfigEntry, reason: string): void {
    this.output.write(`rejected: ${entry.getPath()}: ${reason}\n`);
  }

  onComplete(dirPath: string): void {
    const filePlural = this.totalCount === 1 ? "file" : "files";
    const totalPart = `${this.totalCount} ${filePlural}`;
    if (this.errorCount > 0) {
      const errPlural = this.errorCount === 1 ? "error" : "errors";
      this.output.write(`Exported ${totalPart} to ${dirPath} (${this.errorCount} ${errPlural})\n`);
    } else {
      this.output.write(`Exported ${totalPart} to ${dirPath}\n`);
    }
  }

  onPreview(successCount: number, rejectCount: number): void {
    const filePlural = successCount === 1 ? "file" : "files";
    const totalPart = `${successCount} ${filePlural}`;
    if (rejectCount > 0) {
      const rejectPlural = rejectCount === 1 ? "entry" : "entries";
      this.output.write(`Would export ${totalPart} (${rejectCount} ${rejectPlural} rejected)\n`);
    } else {
      this.output.write(`Would export ${totalPart}\n`);
    }
  }
}
