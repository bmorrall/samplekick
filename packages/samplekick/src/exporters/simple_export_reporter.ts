import { extname } from "node:path";
import type { Writable } from "node:stream";
import type { DigestEntry, FileNode } from "samplekick-io";
import { AUDIO_EXTENSIONS } from "samplekick-io";
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

export class SimpleExportReporter implements ExportReporter {
  private readonly output: Writable;
  private readonly quiet: boolean;
  private readonly organised: boolean;
  private totalSampleCount = 0;
  private totalFileCount = 0;
  private errorCount = 0;
  private rejectedSampleCount = 0;
  private rejectedFileCount = 0;
  private skippedCount = 0;
  private readonly packageSummary = new Map<
    string,
    Map<string, { samples: number; files: number }>
  >();

  constructor(
    output: Writable,
    quiet = false,
    _packName = "",
    organised = false,
  ) {
    this.output = output;
    this.quiet = quiet;
    this.organised = organised;
  }

  private formatErrors(count: number): string {
    return pluralise(count, "error", "errors");
  }

  private formatRejectedCounts(sampleCount: number, fileCount: number): string {
    const samplePart = `${pluraliseSamples(sampleCount)} rejected`;
    if (fileCount === 0) return samplePart;
    const filePart = `${pluraliseFiles(fileCount)} rejected`;
    return `${samplePart}, ${filePart}`;
  }

  private formatSkipped(count: number): string {
    return `${pluralise(count, "entry", "entries")} skipped`;
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
          `  ${type}: ${pluraliseSamples(counts.samples)}${filePart}\n`,
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
      this.output.write(`${pkg}: ${pluraliseSamples(total)}${filePart}\n`);
      this.printPkgTypes(types);
    }
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

  private trackSummary(entry: DigestEntry, destRelPath: string): void {
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

  onAfterWrite(entry: DigestEntry, destRelPath: string, error?: Error): void {
    const isAudio = AUDIO_EXTENSIONS.has(extname(destRelPath).toLowerCase());
    if (isAudio) {
      this.totalSampleCount += 1;
    } else {
      this.totalFileCount += 1;
    }
    if (error !== undefined) {
      this.errorCount += 1;
      this.output.write(`failed: ${destRelPath}: ${error.message}\n`);
      return;
    }
    this.trackSummary(entry, destRelPath);
    if (!this.quiet) {
      this.output.write(`success: ${destRelPath}\n`);
    }
  }

  onReject(entry: DigestEntry, reason: string): void {
    const isAudio = AUDIO_EXTENSIONS.has(
      extname(entry.getPath()).toLowerCase(),
    );
    if (isAudio) {
      this.rejectedSampleCount += 1;
    } else {
      this.rejectedFileCount += 1;
    }
    this.output.write(`rejected: ${entry.getPath()}: ${reason}\n`);
  }

  onSkip(entry: FileNode): void {
    this.skippedCount += countLeafNodes(entry);
    const children = entry.getChildNodes();
    const count = children.length > 0 ? countLeafNodes(entry) : 0;
    const suffix = count > 0 ? ` (${pluraliseFiles(count)})` : "";
    this.output.write(`skipped: ${entry.getPath()}${suffix}\n`);
  }

  onComplete(dirPath: string): void {
    const totalPart = formatTotal(this.totalSampleCount, this.totalFileCount);
    const suffix = this.buildSuffix();
    this.printSummary();
    this.output.write(`Exported ${totalPart} to ${dirPath}${suffix}\n`);
  }

  onPreview(): void {
    const totalPart = formatTotal(this.totalSampleCount, this.totalFileCount);
    const suffix = this.buildSuffix();
    this.printSummary();
    this.output.write(`Would export ${totalPart}${suffix}\n`);
  }
}
