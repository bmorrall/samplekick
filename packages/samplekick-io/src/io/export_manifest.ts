import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

/** Hidden directory (in the export destination) that holds one manifest file per source archive. */
export const EXPORT_MANIFEST_DIR = ".samplekick";
const MANIFEST_HEADER = "originalPath,outputPath";
const MANIFEST_COLUMN_COUNT = 2;
const ESCAPED_QUOTE_LEN = 2;
const NOT_FOUND = -1;

const quoteCsvField = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
};

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

const isEnoentError = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  err.code === "ENOENT";

/**
 * Tracks, for a single source archive (keyed by its fingerprint), the mapping from
 * each originally-exported entry's source path to the relative path it was last
 * written to. Persisted as a CSV file under a hidden ".samplekick" directory in the
 * export destination, so re-exporting the same archive to the same directory can
 * detect and clean up stale output files left behind by earlier exports.
 */
export class ExportManifest {
  private readonly entries: Map<string, string>;

  private constructor(entries: Map<string, string>) {
    this.entries = entries;
  }

  static async load(manifestPath: string): Promise<ExportManifest> {
    const contents = await readFile(manifestPath, "utf8").catch(
      (err: unknown) => {
        if (isEnoentError(err)) return undefined;
        throw err;
      },
    );
    if (contents === undefined) {
      return new ExportManifest(new Map());
    }

    const [, ...rows] = contents.split("\n").filter((line) => line !== "");
    const entries = new Map<string, string>();
    for (const row of rows) {
      const fields = parseCsvRow(row);
      if (fields.length < MANIFEST_COLUMN_COUNT) continue;
      const [originalPath, outputPath] = fields;
      entries.set(originalPath, outputPath);
    }
    return new ExportManifest(entries);
  }

  get(originalPath: string): string | undefined {
    return this.entries.get(originalPath);
  }

  get size(): number {
    return this.entries.size;
  }

  set(originalPath: string, outputPath: string): void {
    this.entries.set(originalPath, outputPath);
  }

  delete(originalPath: string): void {
    this.entries.delete(originalPath);
  }

  async save(manifestPath: string): Promise<void> {
    const rows = [...this.entries.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([originalPath, outputPath]) =>
          `${quoteCsvField(originalPath)},${quoteCsvField(outputPath)}`,
      );
    await mkdir(dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, [MANIFEST_HEADER, ...rows].join("\n"));
  }
}
