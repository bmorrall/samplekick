import type { Writable } from "node:stream";
import type { ConfigSource, ConfigEntry, ConfigWriter } from "../types";
import { getPathName } from "../path_utils";

export const CSV_HEADER = "path,keepPath,name,packageName,sampleType,skip";

const quoteCsvField = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
};

const serializeRow = (entry: ConfigEntry, explicit: boolean): string => {
  const name = entry.getName();
  const path = entry.getPath();
  const nameField =
    !explicit && name === getPathName(path) ? "" : quoteCsvField(name);
  const packageName = entry.getPackageName() ?? "";
  const sampleType = entry.getSampleType() ?? "";
  const skipped = entry.isSkipped();
  const keepStructure = entry.isKeepStructure();

  return [
    quoteCsvField(path),
    keepStructure === undefined
      ? explicit
        ? "false"
        : ""
      : String(keepStructure),
    nameField,
    quoteCsvField(packageName),
    quoteCsvField(sampleType),
    skipped === undefined ? (explicit ? "false" : "") : String(skipped),
  ].join(",");
};

export interface CsvConfigWriterOptions {
  /** When true, always writes the name column even if it matches the path basename. */
  explicit?: boolean;
}

export class CsvConfigWriter implements ConfigWriter {
  private readonly stream: Writable;
  private readonly explicit: boolean;

  constructor(stream: Writable, options: CsvConfigWriterOptions = {}) {
    this.stream = stream;
    this.explicit = options.explicit ?? false;
  }

  writeConfig(configSource: ConfigSource): void {
    const rows: string[] = [CSV_HEADER];
    configSource.eachConfigEntry((entry) => {
      rows.push(serializeRow(entry, this.explicit));
    });
    this.stream.end(rows.join("\n"));
  }
}
