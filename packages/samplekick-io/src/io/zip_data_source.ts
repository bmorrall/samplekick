import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { unzip } from "unzipit";
import type { ZipEntry } from "unzipit";
import type { FileSource, FileEntry } from "../types";
import { getPathName } from "../path_utils";

const createFileEntryForZip = (
  path: string,
  zipEntry: ZipEntry,
): FileEntry => ({
  getPath: () => path,
  getName: () => getPathName(path),
  copyToPath: async (destPath: string): Promise<void> => {
    const buffer = await zipEntry.arrayBuffer();
    await mkdir(dirname(destPath), { recursive: true });
    await writeFile(destPath, new Uint8Array(buffer));
  },
});

export class ZipDataSource implements FileSource {
  private readonly entries: Map<string, ZipEntry>;
  private readonly name: string;

  constructor(entries: Map<string, ZipEntry>, name: string) {
    this.entries = entries;
    this.name = name;
  }

  static async fromBlob(blob: Blob, name: string): Promise<ZipDataSource> {
    const { entries } = await unzip(blob);
    return new ZipDataSource(new Map(Object.entries(entries)), name);
  }

  static async fromFile(filePath: string): Promise<ZipDataSource> {
    const buffer = await readFile(filePath);
    const blob = new Blob([buffer]);
    return await ZipDataSource.fromBlob(blob, basename(filePath));
  }

  getName(): string {
    return this.name;
  }

  eachFileEntry(fn: (entry: FileEntry) => void): void {
    for (const [path, zipEntry] of this.entries) {
      if (path.endsWith("/")) {
        continue;
      }
      fn(createFileEntryForZip(path, zipEntry));
    }
  }
}
