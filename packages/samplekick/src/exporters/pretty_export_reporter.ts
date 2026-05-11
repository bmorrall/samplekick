import { basename, dirname, extname } from "node:path";
import type { Writable } from "node:stream";
import type { ChalkInstance } from "chalk";
import chalk from "chalk";
import type { ConfigEntry, FileNode } from "samplekick-io";
import { AUDIO_EXTENSIONS, SAMPLE_TYPE_PACKS } from "samplekick-io";
import type { ExportReporter } from "./export_reporter";

const countLeafNodes = (entry: FileNode): number => {
  const children = entry.getChildNodes();
  if (children.length === 0) return 1;
  return children.reduce((sum, child) => sum + countLeafNodes(child), 0);
};

const pluralise = (count: number, singular: string, plural: string): string =>
  `${count} ${count === 1 ? singular : plural}`;
const pluraliseFiles = (count: number): string =>
  pluralise(count, "file", "files");
const pluraliseSamples = (count: number): string =>
  pluralise(count, "sample", "samples");
const formatTotal = (sampleCount: number, fileCount: number): string => {
  const samplePart = pluraliseSamples(sampleCount);
  return fileCount > 0
    ? `${samplePart}, ${pluraliseFiles(fileCount)}`
    : samplePart;
};

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL_MS = 80;

export interface PrettyExportReporterOptions {
  quiet?: boolean;
  displayName?: string;
  organised?: boolean;
}

export class PrettyExportReporter implements ExportReporter {
  private readonly output: Writable;
  private readonly chalk: ChalkInstance;
  private readonly quiet: boolean;
  private readonly isTTY: boolean;
  private readonly displayName: string;
  private readonly organised: boolean;
  private totalSampleCount = 0;
  private totalFileCount = 0;
  private errorCount = 0;
  private rejectedSampleCount = 0;
  private rejectedFileCount = 0;
  private skippedCount = 0;
  private spinnerTimer: ReturnType<typeof setInterval> | undefined = undefined;
  private spinnerFrame = 0;
  private readonly packageSummary = new Map<
    string,
    Map<string, { samples: number; files: number }>
  >();

  constructor(
    output: Writable,
    chalkInstance: ChalkInstance = chalk,
    options: PrettyExportReporterOptions = {},
  ) {
    this.output = output;
    this.chalk = chalkInstance;
    this.quiet = options.quiet ?? false;
    this.isTTY =
      "isTTY" in output && (output as { isTTY: unknown }).isTTY === true;
    this.displayName = options.displayName ?? "";
    this.organised = options.organised ?? false;
  }

  private formatErrors(count: number): string {
    return this.chalk.red(pluralise(count, "error", "errors"));
  }

  private formatRejectedCounts(sampleCount: number, fileCount: number): string {
    const samplePart = `${pluraliseSamples(sampleCount)} rejected`;
    if (fileCount === 0) return this.chalk.magenta(samplePart);
    const filePart = `${pluraliseFiles(fileCount)} rejected`;
    return this.chalk.magenta(`${samplePart}, ${filePart}`);
  }

  private formatSkipped(count: number): string {
    return this.chalk.dim(`${pluralise(count, "entry", "entries")} skipped`);
  }

  private buildSuffix(): string {
    const parts: string[] = [];
    if (this.errorCount > 0) parts.push(this.formatErrors(this.errorCount));
    if (this.rejectedSampleCount > 0 || this.rejectedFileCount > 0) {
      parts.push(
        this.formatRejectedCounts(
          this.rejectedSampleCount,
          this.rejectedFileCount,
        ),
      );
    }
    if (this.skippedCount > 0) {
      parts.push(this.formatSkipped(this.skippedCount));
    }
    return parts.length > 0 ? ` (${parts.join(", ")})` : "";
  }

  private formatSampleType(type: string): string {
    return type === SAMPLE_TYPE_PACKS
      ? this.chalk.magentaBright(type)
      : this.chalk.cyan(type);
  }

  private formatPackageName(name: string): string {
    return this.chalk.greenBright(name);
  }

  private formatDir(dir: string): string {
    if (!this.organised) {
      return this.chalk.gray(dir);
    }
    const segments = dir.split("/");
    return segments
      .map((seg, i) => {
        if (i === 0) return this.formatSampleType(seg);
        if (i === 1) return this.formatPackageName(seg);
        return this.chalk.gray(seg);
      })
      .join(this.chalk.gray("/"));
  }

  private drawSpinner(): void {
    const { spinnerFrame, displayName: packName } = this;
    const label = packName.length > 0 ? ` ${packName}` : "";
    const done = this.totalSampleCount + this.totalFileCount;
    const verb = done === 0 ? "Analysing" : "Exporting";
    this.output.write(
      `\x1b[2K\r  ${this.chalk.cyan(SPINNER_FRAMES[spinnerFrame % SPINNER_FRAMES.length])} ${verb}${label}\u2026${done === 0 ? "" : ` (${done} done)`}`,
    );
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

  private pkgSampleTotal(
    types: Map<string, { samples: number; files: number }>,
  ): number {
    return [...types.values()].reduce((a, b) => a + b.samples, 0);
  }

  private pkgFileTotal(
    types: Map<string, { samples: number; files: number }>,
  ): number {
    return [...types.values()].reduce((a, b) => a + b.files, 0);
  }

  private printPkgTypes(
    types: Map<string, { samples: number; files: number }>,
  ): void {
    for (const [type, counts] of [...types].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      if (type.length > 0) {
        const filePart =
          counts.files > 0 ? `, ${pluraliseFiles(counts.files)}` : "";
        this.output.write(
          `  ${this.formatSampleType(type)}: ${pluraliseSamples(counts.samples)}${filePart}\n`,
        );
      }
    }
  }

  private printSummary(): void {
    if (!this.organised || this.packageSummary.size === 0) return;
    this.output.write("\n");
    for (const [pkg, types] of [...this.packageSummary].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const total = this.pkgSampleTotal(types);
      const fileTotal = this.pkgFileTotal(types);
      const filePart = fileTotal > 0 ? `, ${pluraliseFiles(fileTotal)}` : "";
      this.output.write(
        `${this.formatPackageName(pkg)}: ${pluraliseSamples(total)}${filePart}\n`,
      );
      this.printPkgTypes(types);
    }
  }

  onStart(packName: string): void {
    if (packName.length > 0) {
      this.output.write(`${packName}:\n`);
    }
    this.startSpinner();
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

  private trackSummary(entry: ConfigEntry, destRelPath: string): void {
    if (!this.organised) return;
    const pkg = entry.getPackageName();
    if (pkg === undefined || pkg.length === 0) return;

    const types =
      this.packageSummary.get(pkg) ??
      new Map<string, { samples: number; files: number }>();
    const type = entry.getSampleType() ?? "";
    const current = types.get(type) ?? { samples: 0, files: 0 };
    if (AUDIO_EXTENSIONS.has(extname(destRelPath).toLowerCase())) {
      types.set(type, { ...current, samples: current.samples + 1 });
    } else {
      types.set(type, { ...current, files: current.files + 1 });
    }
    this.packageSummary.set(pkg, types);
  }

  onAfterWrite(entry: ConfigEntry, destRelPath: string, error?: Error): void {
    const isAudio = AUDIO_EXTENSIONS.has(extname(destRelPath).toLowerCase());
    if (isAudio) {
      this.totalSampleCount += 1;
    } else {
      this.totalFileCount += 1;
    }
    if (error === undefined) {
      this.trackSummary(entry, destRelPath);
      if (this.quiet) {
        if (this.isTTY && this.spinnerTimer !== undefined) {
          this.drawSpinner();
        }
      } else {
        const sourcePath = entry.getPath();
        const dir = dirname(destRelPath);
        const formattedDest =
          dir === "."
            ? basename(destRelPath)
            : `${this.formatDir(dir)}${this.chalk.gray("/")}${basename(destRelPath)}`;
        const isDifferent = sourcePath !== destRelPath;
        const destSuffix = isDifferent
          ? `\n    ${this.chalk.gray("└── ")}${formattedDest}`
          : "";
        const label = isDifferent ? this.chalk.gray(sourcePath) : formattedDest;
        this.logLine(`${this.chalk.green("✓")} ${label}${destSuffix}`);
      }
    } else {
      this.errorCount += 1;
      this.logLine(this.chalk.red(`✗ ${destRelPath}: ${error.message}`));
    }
  }

  onReject(entry: ConfigEntry, reason: string): void {
    const isAudio = AUDIO_EXTENSIONS.has(
      extname(entry.getPath()).toLowerCase(),
    );
    if (isAudio) {
      this.rejectedSampleCount += 1;
    } else {
      this.rejectedFileCount += 1;
    }
    if (!this.quiet) {
      this.logLine(
        `${this.chalk.magenta("?")} ${entry.getPath()}\n    ${this.chalk.gray(`└── ${reason}`)}`,
      );
    }
  }

  onSkip(entry: FileNode): void {
    this.skippedCount += countLeafNodes(entry);
    if (!this.quiet) {
      const children = entry.getChildNodes();
      const count = children.length > 0 ? countLeafNodes(entry) : 0;
      const suffix = count > 0 ? ` (${pluraliseFiles(count)})` : "";
      this.logLine(
        `${this.chalk.dim("-")} ${this.chalk.dim(`${entry.getPath()}${suffix}`)}`,
      );
    }
  }

  onComplete(dirPath: string): void {
    this.stopSpinner();
    const totalPart = formatTotal(this.totalSampleCount, this.totalFileCount);
    const suffix = this.buildSuffix();
    this.printSummary();
    this.output.write(`Exported ${totalPart} to ${dirPath}${suffix}\n`);
  }

  onPreview(): void {
    this.stopSpinner();
    const totalPart = formatTotal(this.totalSampleCount, this.totalFileCount);
    const suffix = this.buildSuffix();
    this.printSummary();
    this.output.write(`Would export ${totalPart}${suffix}\n`);
  }
}
