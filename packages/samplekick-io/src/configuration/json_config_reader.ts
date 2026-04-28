import type { Readable } from "node:stream";
import type { ConfigSource, ConfigEntry } from "../types";
import type { DataSourceEntryJSON } from "./json_config_writer";
import { getPathName } from "../path_utils";

class JsonDataSourceEntry implements ConfigEntry {
  private readonly data: DataSourceEntryJSON;

  constructor(data: DataSourceEntryJSON) {
    this.data = data;
  }

  getPath(): string {
    return this.data.path;
  }
  getName(): string {
    return this.data.name ?? getPathName(this.data.path);
  }
  getPackageName(): string | undefined {
    return this.data.packageName;
  }
  getSampleType(): string | undefined {
    return this.data.sampleType;
  }
  isSkipped(): boolean | undefined {
    return this.data.isSkipped;
  }
  isKeepStructure(): boolean | undefined {
    return this.data.isKeepStructure;
  }
}

const isEntryArray = (value: unknown): value is DataSourceEntryJSON[] =>
  Array.isArray(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getOptionalString = (
  value: Record<string, unknown>,
  key: string,
): string | undefined =>
  typeof value[key] === "string" ? value[key] : undefined;

const getOptionalBoolean = (
  value: Record<string, unknown>,
  key: string,
): boolean | undefined =>
  typeof value[key] === "boolean" ? value[key] : undefined;

const parseEntry = (value: unknown): DataSourceEntryJSON => {
  if (!isRecord(value) || typeof value.path !== "string") {
    throw new Error("Expected each JSON entry to include a path");
  }

  return {
    path: value.path,
    name: getOptionalString(value, "name"),
    packageName: getOptionalString(value, "packageName"),
    sampleType: getOptionalString(value, "sampleType"),
    isSkipped: getOptionalBoolean(value, "isSkipped"),
    isKeepStructure: getOptionalBoolean(value, "isKeepStructure"),
  };
};

export class JsonConfigReader implements ConfigSource {
  private readonly stream: Readable;

  constructor(stream: Readable) {
    this.stream = stream;
  }

  eachConfigEntry(fn: (entry: ConfigEntry) => void): void {
    this.stream.setEncoding("utf8");
    const chunks: string[] = [];
    const readChunk = (): string | null => {
      const value: unknown = this.stream.read();
      if (value === null || value === undefined) return null;
      if (typeof value === "string") return value;
      throw new Error("Expected string chunk from stream");
    };
    let chunk = readChunk();
    while (chunk !== null) {
      chunks.push(chunk);
      chunk = readChunk();
    }

    const parsed: unknown = JSON.parse(chunks.join(""));
    if (!isEntryArray(parsed)) {
      throw new Error("Expected a JSON array of entries");
    }

    for (const data of parsed) {
      fn(new JsonDataSourceEntry(parseEntry(data)));
    }
  }
}
