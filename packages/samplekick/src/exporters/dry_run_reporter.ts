import type { ConfigEntry, FileNode } from "samplekick-io";
import type { ExportReporter } from "./export_reporter";

interface SuccessItem {
  entry: ConfigEntry;
  destRelPath: string;
}

interface RejectionItem {
  entry: ConfigEntry;
  reason: string;
}

export class DryRunReporter {
  private readonly inner: ExportReporter;
  private readonly successes: SuccessItem[] = [];
  private readonly rejections: RejectionItem[] = [];
  private readonly configSkips: FileNode[] = [];

  constructor(inner: ExportReporter) {
    this.inner = inner;
  }

  // onBeforeWrite is intentionally a no-op — prevents the spinner from starting
  onBeforeWrite(_entry: ConfigEntry, _destRelPath: string): void {
    // no-op: this.inner.onBeforeWrite is not called, preventing the spinner from starting
    void this.inner;
  }

  onAfterWrite(entry: ConfigEntry, destRelPath: string, error?: Error): void {
    if (error === undefined) {
      this.successes.push({ entry, destRelPath });
    } else {
      this.inner.onError(`${destRelPath}: ${error.message}`);
    }
  }

  onReject(entry: ConfigEntry, reason: string): void {
    this.rejections.push({ entry, reason });
  }

  onSkip(entry: FileNode): void {
    this.configSkips.push(entry);
  }

  flush(): void {
    const sortedSuccesses = [...this.successes].sort((a, b) => a.destRelPath.localeCompare(b.destRelPath));
    const sortedRejections = [...this.rejections].sort((a, b) => a.entry.getPath().localeCompare(b.entry.getPath()));
    const sortedSkips = [...this.configSkips].sort((a, b) => a.getPath().localeCompare(b.getPath()));

    for (const entry of sortedSkips) {
      this.inner.onSkip(entry);
    }
    for (const { entry, destRelPath } of sortedSuccesses) {
      this.inner.onAfterWrite(entry, destRelPath);
    }
    for (const { entry, reason } of sortedRejections) {
      this.inner.onReject(entry, reason);
    }

    this.inner.onPreview(sortedSuccesses.length, sortedRejections.length, sortedSkips.length);
  }
}
