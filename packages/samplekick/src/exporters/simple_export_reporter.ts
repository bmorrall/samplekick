import type { Writable } from "node:stream";
import type { ConfigEntry, FileNode } from "samplekick-io";
import type { ExportReporter } from "./export_reporter";

const countLeafNodes = (entry: FileNode): number => {
  const children = entry.getChildNodes();
  if (children.length === 0) return 1;
  return children.reduce((sum, child) => sum + countLeafNodes(child), 0);
};

export class SimpleExportReporter implements ExportReporter {
  private readonly output: Writable;
  private readonly quiet: boolean;
  private totalCount = 0;
  private errorCount = 0;
  private rejectedCount = 0;
  private skippedCount = 0;

  constructor(output: Writable, quiet = false, _packName = "") {
    this.output = output;
    this.quiet = quiet;
  }

  private formatErrors(count: number): string {
    return `${count} ${count === 1 ? "error" : "errors"}`;
  }

  private formatRejected(count: number): string {
    return `${count} ${count === 1 ? "entry" : "entries"} rejected`;
  }

  private formatSkipped(count: number): string {
    return `${count} ${count === 1 ? "entry" : "entries"} skipped`;
  }

  onStart(packName: string): void {
    if (packName.length > 0) {
      this.output.write(`${packName}:\n`);
    }
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
    this.rejectedCount += 1;
    this.output.write(`rejected: ${entry.getPath()}: ${reason}\n`);
  }

  onSkip(entry: FileNode): void {
    this.skippedCount += 1;
    const children = entry.getChildNodes();
    const count = children.length > 0 ? countLeafNodes(entry) : 0;
    const suffix = count > 0 ? ` (${count} ${count === 1 ? "file" : "files"})` : "";
    this.output.write(`skipped: ${entry.getPath()}${suffix}\n`);
  }

  onComplete(dirPath: string): void {
    const filePlural = this.totalCount === 1 ? "file" : "files";
    const totalPart = `${this.totalCount} ${filePlural}`;
    const suffixParts: string[] = [];
    if (this.errorCount > 0) {
      suffixParts.push(this.formatErrors(this.errorCount));
    }
    if (this.rejectedCount > 0) {
      suffixParts.push(this.formatRejected(this.rejectedCount));
    }
    if (this.skippedCount > 0) {
      suffixParts.push(this.formatSkipped(this.skippedCount));
    }
    const suffix = suffixParts.length > 0 ? ` (${suffixParts.join(", ")})` : "";
    this.output.write(`Exported ${totalPart} to ${dirPath}${suffix}\n`);
  }

  onPreview(successCount: number, rejectCount: number, skipCount: number): void {
    const filePlural = successCount === 1 ? "file" : "files";
    const totalPart = `${successCount} ${filePlural}`;
    const parts: string[] = [];
    if (rejectCount > 0) {
      parts.push(this.formatRejected(rejectCount));
    }
    if (skipCount > 0) {
      parts.push(this.formatSkipped(skipCount));
    }
    const suffix = parts.length > 0 ? ` (${parts.join(", ")})` : "";
    this.output.write(`Would export ${totalPart}${suffix}\n`);
  }
}
