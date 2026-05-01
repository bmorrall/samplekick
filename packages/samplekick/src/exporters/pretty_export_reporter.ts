import type { Writable } from "node:stream";
import type { ChalkInstance } from "chalk";
import chalk from "chalk";
import type { ConfigEntry } from "samplekick-io";
import type { ExportReporter } from "./export_reporter";

export class PrettyExportReporter implements ExportReporter {
  private readonly output: Writable;
  private readonly chalk: ChalkInstance;
  private totalCount = 0;
  private errorCount = 0;

  constructor(output: Writable = process.stdout, chalkInstance: ChalkInstance = chalk) {
    this.output = output;
    this.chalk = chalkInstance;
  }

  onDebug(message: string): void {
    this.output.write(`${this.chalk.gray(message)}\n`);
  }

  onBeforeWrite(entry: ConfigEntry, _destRelPath: string): void {
    this.output.write(`extracting ${entry.getName()}\n`);
  }

  onAfterWrite(_entry: ConfigEntry, destRelPath: string, error?: Error): void {
    this.totalCount += 1;
    if (error === undefined) {
      this.output.write(`${this.chalk.green("success:")} ${this.chalk.gray(destRelPath)}\n`);
    } else {
      this.errorCount += 1;
      this.output.write(`${this.chalk.red(`failed: ${destRelPath}: ${error.message}`)}\n`);
    }
  }

  onComplete(dirPath: string): void {
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
