import type { Readable } from "node:stream";
import type { ConfigSource, ConfigEntry } from "../types";
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
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

class CsvConfigEntry implements ConfigEntry {
  private readonly pathField: string;
  private readonly nameField: string;
  private readonly packageNameField: string;
  private readonly sampleTypeField: string;
  private readonly skippedField: string;
  private readonly keepStructureField: string;

  constructor(fields: string[]) {
    const [
      pathField = "",
      nameField = "",
      packageNameField = "",
      sampleTypeField = "",
      skippedField = "",
      keepStructureField = "",
    ] = fields;
    this.pathField = pathField;
    this.nameField = nameField;
    this.packageNameField = packageNameField;
    this.sampleTypeField = sampleTypeField;
    this.skippedField = skippedField;
    this.keepStructureField = keepStructureField;
  }

  getPath(): string {
    return this.pathField;
  }

  getName(): string {
    return this.nameField === "" ? getPathName(this.pathField) : this.nameField;
  }

  getPackageName(): string | undefined {
    return optionalString(this.packageNameField);
  }

  getSampleType(): string | undefined {
    return optionalString(this.sampleTypeField);
  }

  isSkipped(): boolean | undefined {
    return optionalBoolean(this.skippedField);
  }

  isKeepStructure(): boolean | undefined {
    return optionalBoolean(this.keepStructureField);
  }
}

export class CsvConfigReader implements ConfigSource {
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

    const lines = chunks.join("").split("\n");
    // skip header
    const dataLines = lines.slice(1);

    for (const line of dataLines) {
      if (line === "") continue;
      fn(new CsvConfigEntry(parseCsvRow(line)));
    }
  }
}
