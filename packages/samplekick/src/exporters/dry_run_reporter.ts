import type { DigestEntry, FileNode } from "samplekick-io";
import type { ExportReporter } from "./export_reporter";

interface SuccessItem {
  entry: DigestEntry;
  destRelPath: string;
}

interface RejectionItem {
  entry: DigestEntry;
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

  onAfterWrite(entry: DigestEntry, destRelPath: string, error?: Error): void {
    if (error === undefined) {
      this.successes.push({ entry, destRelPath });
    } else {
      this.inner.onError(`${destRelPath}: ${error.message}`);
    }
  }

  onReject(entry: DigestEntry, reason: string): void {
    this.rejections.push({ entry, reason });
  }

  onSkip(entry: FileNode): void {
    this.configSkips.push(entry);
  }

  flush(): void {
    const sortedSuccesses = [...this.successes].sort((a, b) =>
      a.destRelPath.localeCompare(b.destRelPath),
    );
    const sortedRejections = [...this.rejections].sort((a, b) =>
      a.entry.getPath().localeCompare(b.entry.getPath()),
    );
    const sortedSkips = [...this.configSkips].sort((a, b) =>
      a.getPath().localeCompare(b.getPath()),
    );

    for (const entry of sortedSkips) {
      this.inner.onSkip(entry);
    }
    for (const { entry, destRelPath } of sortedSuccesses) {
      this.inner.onAfterWrite(entry, destRelPath);
    }
    for (const { entry, reason } of sortedRejections) {
      this.inner.onReject(entry, reason);
    }

    this.inner.onPreview();
  }
}
