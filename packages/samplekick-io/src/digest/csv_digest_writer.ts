import type { Writable } from "node:stream";
import type { DigestSource, DigestEntry, DigestWriter } from "../types";
import { getPathName } from "../path_utils";

export const CSV_HEADER = "path,name,packageName,sampleType,enabled";

const quoteCsvField = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
};

const serializeRow = (entry: DigestEntry, explicit: boolean): string => {
  const name = entry.getName();
  const path = entry.getPath();
  const nameField =
    !explicit && name === getPathName(path) ? "" : quoteCsvField(name);
  const packageName = entry.getPackageName() ?? "";
  const sampleType = entry.getSampleType() ?? "";
  const enabled = entry.isEnabled();

  return [
    quoteCsvField(path),
    nameField,
    quoteCsvField(packageName),
    quoteCsvField(sampleType),
    String(enabled),
  ].join(",");
};

export interface CsvDigestWriterOptions {
  /** When true, always writes the name column even if it matches the path basename. */
  explicit?: boolean;
}

export class CsvDigestWriter implements DigestWriter {
  private readonly stream: Writable;
  private readonly explicit: boolean;

  constructor(stream: Writable, options: CsvDigestWriterOptions = {}) {
    this.stream = stream;
    this.explicit = options.explicit ?? false;
  }

  writeDigest(digestSource: DigestSource): void {
    const rows: string[] = [CSV_HEADER];
    digestSource.eachDigestEntry((entry) => {
      rows.push(serializeRow(entry, this.explicit));
    });
    this.stream.end(rows.join("\n"));
  }
}
