import { extname } from "node:path";
import type { Writable } from "node:stream";
import type { ConfigEntry, FileNode } from "samplekick-io";
import { AUDIO_EXTENSIONS } from "samplekick-io";
import type { ExportReporter } from "./export_reporter";

const countLeafNodes = (entry: FileNode): number => {
  const children = entry.getChildNodes();
  if (children.length === 0) return 1;
  return children.reduce((sum, child) => sum + countLeafNodes(child), 0);
};

const pluralise = (count: number, singular: string, plural: string): string => `${count} ${count === 1 ? singular : plural}`;
const pluraliseFiles = (count: number): string => pluralise(count, "file", "files");
const pluraliseSamples = (count: number): string => pluralise(count, "sample", "samples");

export class SimpleExportReporter implements ExportReporter {
  private readonly output: Writable;
  private readonly quiet: boolean;
  private readonly organised: boolean;
  private totalCount = 0;
  private errorCount = 0;
  private rejectedSampleCount = 0;
  private rejectedFileCount = 0;
  private skippedCount = 0;
  private readonly packageSummary = new Map<string, Map<string, number>>();
  private readonly packageNonSampleCount = new Map<string, number>();
  private readonly packageTypeNonSampleCount = new Map<string, Map<string, number>>();

  constructor(output: Writable, quiet = false, _packName = "", organised = false) {
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

  private buildSuffix(errorCount: number, _rejectCount: number): string {
    const parts: string[] = [];
    if (errorCount > 0) parts.push(this.formatErrors(errorCount));
    if (this.rejectedSampleCount > 0 || this.rejectedFileCount > 0) {
      parts.push(this.formatRejectedCounts(this.rejectedSampleCount, this.rejectedFileCount));
    }
    if (this.skippedCount > 0) parts.push(this.formatSkipped(this.skippedCount));
    return parts.length > 0 ? ` (${parts.join(", ")})` : "";
  }

  private pkgTotal(types: Map<string, number> | undefined): number {
    return types === undefined ? 0 : [...types.values()].reduce((a, b) => a + b, 0);
  }

  private printPkgTypes(types: Map<string, number>, typeNonSamples: Map<string, number> | undefined): void {
    for (const [type, count] of [...types].sort(([a], [b]) => a.localeCompare(b))) {
      if (type.length > 0) {
        const fileCount = typeNonSamples?.get(type) ?? 0;
        const filePart = fileCount > 0 ? `, ${pluraliseFiles(fileCount)}` : "";
        this.output.write(`  ${type}: ${pluraliseSamples(count)}${filePart}\n`);
      }
    }
  }

  private printSummary(): void {
    const allPkgs = new Set([...this.packageSummary.keys(), ...this.packageNonSampleCount.keys()]);
    if (!this.organised || allPkgs.size === 0) return;
    this.output.write('\n');
    for (const pkg of [...allPkgs].sort((a, b) => a.localeCompare(b))) {
      const types = this.packageSummary.get(pkg);
      const otherCount = this.packageNonSampleCount.get(pkg) ?? 0;
      const total = this.pkgTotal(types);
      const filePart = otherCount > 0 ? `, ${pluraliseFiles(otherCount)}` : "";
      this.output.write(`${pkg}: ${pluraliseSamples(total)}${filePart}\n`);
      if (types === undefined) continue;
      this.printPkgTypes(types, this.packageTypeNonSampleCount.get(pkg));
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

  private trackSummary(entry: ConfigEntry, destRelPath: string): void {
    if (!this.organised) return;
    const pkg = entry.getPackageName();
    if (pkg === undefined || pkg.length === 0) return;

    const types = this.packageSummary.get(pkg) ?? new Map<string, number>();
    const type = entry.getSampleType() ?? "";
    if (AUDIO_EXTENSIONS.has(extname(destRelPath).toLowerCase())) {
      types.set(type, (types.get(type) ?? 0) + 1);
    } else {
      types.set(type, types.get(type) ?? 0);
      this.packageNonSampleCount.set(pkg, (this.packageNonSampleCount.get(pkg) ?? 0) + 1);
      const typeNonSamples = this.packageTypeNonSampleCount.get(pkg) ?? new Map<string, number>();
      typeNonSamples.set(type, (typeNonSamples.get(type) ?? 0) + 1);
      this.packageTypeNonSampleCount.set(pkg, typeNonSamples);
    }
    this.packageSummary.set(pkg, types);
  }

  onAfterWrite(entry: ConfigEntry, destRelPath: string, error?: Error): void {
    this.totalCount += 1;
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

  onReject(entry: ConfigEntry, reason: string): void {
    const isAudio = AUDIO_EXTENSIONS.has(extname(entry.getPath()).toLowerCase());
    if (isAudio) { this.rejectedSampleCount += 1; } else { this.rejectedFileCount += 1; }
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
    const totalPart = pluraliseFiles(this.totalCount);
    const suffix = this.buildSuffix(this.errorCount, 0);
    this.printSummary();
    this.output.write(`Exported ${totalPart} to ${dirPath}${suffix}\n`);
  }

  onPreview(successCount: number, rejectCount: number, _skipCount: number): void {
    const totalPart = pluraliseFiles(successCount);
    const suffix = this.buildSuffix(0, 0);
    this.printSummary();
    this.output.write(`Would export ${totalPart}${suffix}\n`);
  }
}
