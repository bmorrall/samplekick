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
  private errorCount = 0;

  constructor(output: Writable = process.stdout, chalkInstance: ChalkInstance = chalk) {
    this.output = output;
    this.chalk = chalkInstance;
  }

  onBeforeWrite(entry: ConfigEntry, destRelPath: string): void {
    const line = `${entry.getPath()} → ${this.chalk.gray(destRelPath)}`;
    this.lineMap.set(entry.getPath(), this.lines.push(line) - 1);
    this.output.write(`${line}\n`);
  }

  onAfterWrite(entry: ConfigEntry, destRelPath: string, error?: Error): void {
    const lineIndex = this.lineMap.get(entry.getPath());
    /* v8 ignore next */
    if (lineIndex === undefined) return;

    const linesBelow = this.lines.length - lineIndex - 1;

    // Move cursor up to target line and clear it
    this.output.write(`\x1B[${linesBelow + 1}A\x1B[2K\r`);

    if (error === undefined) {
      const updatedLine = `${entry.getPath()} → ${this.chalk.green(destRelPath)}`;
      this.output.write(updatedLine);
      this.lines[lineIndex] = updatedLine;

      // Move cursor back down to the blank row below all content
      this.output.write(`\x1B[${linesBelow + 1}B`);
    } else {
      this.errorCount += 1;

      const updatedLine = `${entry.getPath()} → ${this.chalk.red(destRelPath)}`;
      this.output.write(updatedLine);
      this.lines[lineIndex] = updatedLine;

      const detailLine = `  ${this.chalk.red(error.message)}`;
      this.output.write(`\n\x1B[2K${detailLine}`);

      // Rewrite all lines below the error line
      for (const lineContent of this.lines.slice(lineIndex + 1)) {
        this.output.write(`\n\x1B[2K${lineContent}`);
      }

      // Splice detail into tracking state and shift subsequent line indices
      this.lines.splice(lineIndex + 1, 0, detailLine);
      for (const [key, idx] of this.lineMap) {
        if (idx > lineIndex) {
          this.lineMap.set(key, idx + 1);
        }
      }

      // Position cursor at new blank row below all content
      this.output.write("\n");
    }
  }

  onComplete(dirPath: string): void {
    if (this.errorCount > 0) {
      const plural = this.errorCount === 1 ? "error" : "errors";
      this.output.write(`Exported to ${dirPath} ${this.chalk.red(`(${this.errorCount} ${plural})`)}\n`);
    } else {
      this.output.write(`Exported to ${dirPath}\n`);
    }
  }
}
