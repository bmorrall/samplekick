import { basename, dirname } from "node:path";
import type { Writable } from "node:stream";
import type { ChalkInstance } from "chalk";
import chalk from "chalk";
import type { ConfigEntry, FileNode } from "samplekick-io";
import type { ExportReporter } from "./export_reporter";

const countLeafNodes = (entry: FileNode): number => {
  const children = entry.getChildNodes();
  if (children.length === 0) return 1;
  return children.reduce((sum, child) => sum + countLeafNodes(child), 0);
};

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL_MS = 80;

export interface PrettyExportReporterOptions {
  quiet?: boolean;
  packName?: string;
  organised?: boolean;
}

export class PrettyExportReporter implements ExportReporter {
  private readonly output: Writable;
  private readonly chalk: ChalkInstance;
  private readonly quiet: boolean;
  private readonly isTTY: boolean;
  private readonly packName: string;
  private readonly organised: boolean;
  private totalCount = 0;
  private errorCount = 0;
  private rejectedCount = 0;
  private spinnerTimer: ReturnType<typeof setInterval> | undefined = undefined;
  private spinnerFrame = 0;

  constructor(output: Writable, chalkInstance: ChalkInstance = chalk, options: PrettyExportReporterOptions = {}) {
    this.output = output;
    this.chalk = chalkInstance;
    this.quiet = options.quiet ?? false;
    this.isTTY = "isTTY" in output && (output as { isTTY: unknown }).isTTY === true;
    this.packName = options.packName ?? "";
    this.organised = options.organised ?? false;
  }

  private formatDir(dir: string): string {
    if (!this.organised) {
      return this.chalk.gray(dir);
    }
    const segments = dir.split("/");
    return segments.map((seg, i) => {
      if (i === 0) return this.chalk.cyan(seg);
      if (i === 1) return this.chalk.blue(seg);
      return this.chalk.gray(seg);
    }).join(this.chalk.gray("/"));
  }

  private drawSpinner(): void {
    const { spinnerFrame, packName } = this;
    const label = packName.length > 0 ? ` ${packName}` : "";
    this.output.write(`\x1b[2K\r  ${this.chalk.cyan(SPINNER_FRAMES[spinnerFrame % SPINNER_FRAMES.length])} Exporting${label}\u2026 (${this.totalCount} done)`);
  }

  private startSpinner(): void {
    if (!this.isTTY || this.spinnerTimer !== undefined) return;
    this.drawSpinner();
    const timer = setInterval(() => {
      this.spinnerFrame += 1;
      this.drawSpinner();
    }, SPINNER_INTERVAL_MS);
    timer.unref();
    this.spinnerTimer = timer;
  }

  private stopSpinner(): void {
    if (this.spinnerTimer !== undefined) {
      clearInterval(this.spinnerTimer);
      this.spinnerTimer = undefined;
    }
    if (this.isTTY) {
      this.output.write("\x1b[2K\r");
    }
  }

  private logLine(line: string): void {
    if (this.isTTY && this.spinnerTimer !== undefined) {
      this.output.write(`\x1b[2K\r  ${line}\n`);
      this.drawSpinner();
    } else {
      this.output.write(`  ${line}\n`);
    }
  }

  onInfo(message: string): void {
    if (this.isTTY && this.spinnerTimer !== undefined) {
      this.output.write(`\x1b[2K\r${this.chalk.dim(message)}\n`);
      this.drawSpinner();
    } else {
      this.output.write(`${this.chalk.dim(message)}\n`);
    }
  }

  onDebug(message: string): void {
    this.logLine(this.chalk.gray(`\u00b7 ${message}`));
  }

  onError(message: string): void {
    this.logLine(this.chalk.red(`! ${message}`));
  }

  onBeforeWrite(_entry: ConfigEntry, _destRelPath: string): void {
    this.startSpinner();
  }

  onAfterWrite(_entry: ConfigEntry, destRelPath: string, error?: Error): void {
    this.totalCount += 1;
    if (error === undefined) {
      if (this.quiet) {
        if (this.isTTY && this.spinnerTimer !== undefined) {
          this.drawSpinner();
        }
      } else {
        const dir = dirname(destRelPath);
        const dirSuffix = dir === "." ? "" : `  ${this.formatDir(dir)}${this.chalk.gray("/")}`;
        this.logLine(`${this.chalk.green("✓")} ${basename(destRelPath)}${dirSuffix}`);
      }
    } else {
      this.errorCount += 1;
      this.logLine(this.chalk.red(`✗ ${destRelPath}: ${error.message}`));
    }
  }

  onReject(entry: ConfigEntry, reason: string): void {
    this.rejectedCount += 1;
    if (!this.quiet) {
      this.logLine(`${this.chalk.magenta("?")} ${entry.getPath()}: ${this.chalk.gray(reason)}`);
    }
  }

  onSkip(entry: FileNode): void {
    if (!this.quiet) {
      const children = entry.getChildNodes();
      const count = children.length > 0 ? countLeafNodes(entry) : 0;
      const suffix = count > 0 ? ` (${count} ${count === 1 ? "file" : "files"})` : "";
      this.logLine(`${this.chalk.dim("-")} ${this.chalk.dim(`${entry.getPath()}${suffix}`)}`);
    }
  }

  onComplete(dirPath: string): void {
    this.stopSpinner();
    const filePlural = this.totalCount === 1 ? "file" : "files";
    const totalPart = `${this.totalCount} ${filePlural}`;
    const suffixParts: string[] = [];
    if (this.errorCount > 0) {
      const errPlural = this.errorCount === 1 ? "error" : "errors";
      suffixParts.push(this.chalk.red(`${this.errorCount} ${errPlural}`));
    }
    if (this.rejectedCount > 0) {
      suffixParts.push(this.chalk.dim(`${this.rejectedCount} rejected`));
    }
    const suffix = suffixParts.length > 0 ? ` (${suffixParts.join(", ")})` : "";
    this.output.write(`Exported ${totalPart} to ${dirPath}${suffix}\n`);
  }

  onPreview(successCount: number, rejectCount: number, skipCount: number): void {
    const filePlural = successCount === 1 ? "file" : "files";
    const totalPart = `${successCount} ${filePlural}`;
    const parts: string[] = [];
    if (rejectCount > 0) {
      parts.push(`${rejectCount} ${rejectCount === 1 ? "entry" : "entries"} rejected`);
    }
    if (skipCount > 0) {
      parts.push(`${skipCount} ${skipCount === 1 ? "record" : "records"} skipped`);
    }
    const suffix = parts.length > 0 ? ` (${this.chalk.dim(parts.join(", "))})` : "";
    this.output.write(`Would export ${totalPart}${suffix}\n`);
  }
}
