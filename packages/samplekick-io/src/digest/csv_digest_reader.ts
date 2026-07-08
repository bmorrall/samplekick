import type { Readable } from "node:stream";
import type { DigestSource, DigestEntry } from "../types";
import { getPathName } from "../path_utils";

const NOT_FOUND = -1;
const ESCAPED_QUOTE_LEN = 2;

const parseCsvRow = (line: string): string[] => {
  const fields: string[] = [];
  let i = 0;

  while (i <= line.length) {
    if (line[i] === '"') {
      let field = "";
      i += 1; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          field += '"';
          i += ESCAPED_QUOTE_LEN;
        } else if (line[i] === '"') {
          i += 1; // skip closing quote
          break;
        } else {
          field += line[i];
          i += 1;
        }
      }
      fields.push(field);
      i += 1; // skip comma
    } else {
      const end = line.indexOf(",", i);
      if (end === NOT_FOUND) {
        fields.push(line.slice(i));
        break;
      }
      fields.push(line.slice(i, end));
      i = end + 1;
    }
  }

  return fields;
};

const optionalString = (value: string): string | undefined =>
  value === "" ? undefined : value;

const optionalBoolean = (value: string): boolean | undefined => {
  if (value === "true" || value === "t" || value === "1") return true;
  if (value === "false" || value === "f" || value === "0") return false;
  return undefined;
};

interface ColumnIndices {
  path: number;
  name: number;
  packageName: number;
  sampleType: number;
  enabled: number;
}

const parseColumnIndices = (header: string): ColumnIndices => {
  const columns = header.trimEnd().split(",");
  const idx = (col: string): number => {
    const i = columns.indexOf(col);
    if (i === NOT_FOUND) {
      throw new Error(`Unrecognised CSV header: ${header}`);
    }
    return i;
  };
  return {
    path: idx("path"),
    name: idx("name"),
    packageName: idx("packageName"),
    sampleType: idx("sampleType"),
    enabled: idx("enabled"),
  };
};

class CsvDigestEntry implements DigestEntry {
  private readonly fields: string[];
  private readonly indices: ColumnIndices;

  constructor(fields: string[], indices: ColumnIndices) {
    this.fields = fields;
    this.indices = indices;
  }

  getPath(): string {
    return this.fields[this.indices.path] ?? "";
  }

  getName(): string {
    const name = this.fields[this.indices.name] ?? "";
    return name === "" ? getPathName(this.getPath()) : name;
  }

  getPackageName(): string | undefined {
    return optionalString(this.fields[this.indices.packageName] ?? "");
  }

  getSampleType(): string | undefined {
    return optionalString(this.fields[this.indices.sampleType] ?? "");
  }

  rawEnabled(): boolean | undefined {
    return optionalBoolean(this.fields[this.indices.enabled] ?? "");
  }

  isEnabled(): boolean {
    return this.rawEnabled() ?? false;
  }
}

export class CsvDigestReader implements DigestSource {
  private readonly stream: Readable;

  constructor(stream: Readable) {
    this.stream = stream;
  }

  eachDigestEntry(fn: (entry: DigestEntry) => void): void {
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

    const content = chunks.join("");
    if (content.trim() === "") return;

    const lines = content.split("\n");
    // validate header and build column index map
    const [header, ...dataLines] = lines;
    const indices = parseColumnIndices(header);

    for (const line of dataLines) {
      if (line === "") continue;
      fn(new CsvDigestEntry(parseCsvRow(line), indices));
    }
  }
}
