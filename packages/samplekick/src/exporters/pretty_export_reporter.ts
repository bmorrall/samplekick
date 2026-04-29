import type { Writable } from "node:stream";
import type { ChalkInstance } from "chalk";
import chalk from "chalk";
import type { ConfigEntry } from "samplekick-io";
import type { ExportReporter } from "./export_reporter";

export class PrettyExportReporter implements ExportReporter {
  private readonly output: Writable;
  private readonly chalk: ChalkInstance;
  private readonly lines: string[] = [];
  private readonly lineMap = new Map<string, number>(); // sourcePath → line index
  private totalCount = 0;
  private errorCount = 0;

  constructor(output: Writable = process.stdout, chalkInstance: ChalkInstance = chalk) {
    this.output = output;
    this.chalk = chalkInstance;
  }

  onBeforeWrite(entry: ConfigEntry, destRelPath: string): void {
    const sourceLine = entry.getPath();
    const arrowLine = `  → ${this.chalk.gray(destRelPath)}`;
    this.lines.push(sourceLine);
    this.lineMap.set(entry.getPath(), this.lines.push(arrowLine) - 1);
    this.output.write(`${sourceLine}\n${arrowLine}\n`);
  }

  onAfterWrite(entry: ConfigEntry, destRelPath: string, error?: Error): void {
    this.totalCount += 1;
    const lineIndex = this.lineMap.get(entry.getPath());
    /* v8 ignore next */
    if (lineIndex === undefined) return;

    const linesBelow = this.lines.length - lineIndex - 1;

    // Move cursor up to arrow line and clear it
    this.output.write(`\x1B[${linesBelow + 1}A\x1B[2K\r`);

    if (error === undefined) {
      const updatedLine = `  → ${this.chalk.green(destRelPath)}`;
      this.output.write(updatedLine);
      this.lines[lineIndex] = updatedLine;
    } else {
      this.errorCount += 1;
      const updatedLine = `  → ${this.chalk.red(error.message)}`;
      this.output.write(updatedLine);
      this.lines[lineIndex] = updatedLine;
    }

    // Move cursor back down to the blank row below all content, reset to col 0
    this.output.write(`\x1B[${linesBelow + 1}B\r`);
  }

  onComplete(dirPath: string): void {
    const filePlural = this.totalCount === 1 ? "file" : "files";
    const totalPart = `${this.totalCount} ${filePlural}`;
    if (this.errorCount > 0) {
      const errPlural = this.errorCount === 1 ? "error" : "errors";
      this.output.write(`Exported ${totalPart} to ${dirPath} ${this.chalk.red(`(${this.errorCount} ${errPlural})`)}\n`);
    } else {
      this.output.write(`Exported to ${dirPath}\n`);
    }
  }
}
