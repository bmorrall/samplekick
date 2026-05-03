import { basename, dirname } from "node:path";
import type { Writable } from "node:stream";
import type { ChalkInstance } from "chalk";
import chalk from "chalk";
import type { ConfigEntry } from "samplekick-io";
import type { ExportReporter } from "./export_reporter";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL_MS = 80;

export class PrettyExportReporter implements ExportReporter {
  private readonly output: Writable;
  private readonly chalk: ChalkInstance;
  private readonly quiet: boolean;
  private readonly isTTY: boolean;
  private readonly packName: string;
  private totalCount = 0;
  private errorCount = 0;
  private spinnerTimer: ReturnType<typeof setInterval> | undefined = undefined;
  private spinnerFrame = 0;

  constructor(output: Writable, chalkInstance: ChalkInstance = chalk, quiet = false, packName = "") {
    this.output = output;
    this.chalk = chalkInstance;
    this.quiet = quiet;
    this.isTTY = "isTTY" in output && (output as { isTTY: unknown }).isTTY === true;
    this.packName = packName;
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
        const dirSuffix = dir === "." ? "" : `  ${this.chalk.gray(`${dir}/`)}`;
        this.logLine(`${this.chalk.green("✓")} ${basename(destRelPath)}${dirSuffix}`);
      }
    } else {
      this.errorCount += 1;
      this.logLine(this.chalk.red(`✗ ${destRelPath}: ${error.message}`));
    }
  }

  onComplete(dirPath: string): void {
    this.stopSpinner();
    const filePlural = this.totalCount === 1 ? "file" : "files";
    const totalPart = `${this.totalCount} ${filePlural}`;
    if (this.errorCount > 0) {
      const errPlural = this.errorCount === 1 ? "error" : "errors";
      this.output.write(`Exported ${totalPart} to ${dirPath} ${this.chalk.red(`(${this.errorCount} ${errPlural})`)}\n`);
    } else {
      this.output.write(`Exported ${totalPart} to ${dirPath}\n`);
    }
  }
}
