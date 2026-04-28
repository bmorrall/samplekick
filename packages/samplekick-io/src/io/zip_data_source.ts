import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
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

  constructor(entries: Map<string, ZipEntry>) {
    this.entries = entries;
  }

  static async fromBlob(blob: Blob): Promise<ZipDataSource> {
    const { entries } = await unzip(blob);
    return new ZipDataSource(new Map(Object.entries(entries)));
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
