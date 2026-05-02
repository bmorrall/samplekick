import type { Writable } from "node:stream";
import type { ConfigSource, ConfigEntry, ConfigWriter } from "../types";
import { getPathName } from "../path_utils";

export const CSV_HEADER = "path,name,packageName,sampleType,skip,keepPath";

const quoteCsvField = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
};

const serializeRow = (entry: ConfigEntry): string => {
  const name = entry.getName();
  const path = entry.getPath();
  const nameField = name === getPathName(path) ? "" : quoteCsvField(name);
  const packageName = entry.getPackageName() ?? "";
  const sampleType = entry.getSampleType() ?? "";
  const skipped = entry.isSkipped();
  const keepStructure = entry.isKeepStructure();

  return [
    quoteCsvField(path),
    nameField,
    quoteCsvField(packageName),
    quoteCsvField(sampleType),
    skipped === undefined ? "" : String(skipped),
    keepStructure === undefined ? "" : String(keepStructure),
  ].join(",");
};

export class CsvConfigWriter implements ConfigWriter {
  private readonly stream: Writable;

  constructor(stream: Writable) {
    this.stream = stream;
  }

  writeConfig(configSource: ConfigSource): void {
    const rows: string[] = [CSV_HEADER];
    configSource.eachConfigEntry((entry) => {
      rows.push(serializeRow(entry));
    });
    this.stream.end(rows.join("\n"));
  }
}
