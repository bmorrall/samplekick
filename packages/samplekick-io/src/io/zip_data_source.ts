import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { ZipArchive, ZipEntry } from "@shortercode/webzip";
import type { FileSource, FileEntry } from "../types";
import { getPathName } from "../path_utils";

const createFileEntryForZip = (
  path: string,
  zipEntry: ZipEntry,
): FileEntry => ({
  getPath: () => path,
  getName: () => getPathName(path),
  copyToPath: async (destPath: string): Promise<void> => {
    const buffer = await zipEntry.get_array_buffer();
    await mkdir(dirname(destPath), { recursive: true });
    await writeFile(destPath, new Uint8Array(buffer));
  },
});

export class ZipDataSource implements FileSource {
  private readonly archive: ZipArchive;

  constructor(archive: ZipArchive) {
    this.archive = archive;
  }

  static async fromBlob(blob: Blob): Promise<ZipDataSource> {
    const archive = await ZipArchive.from_blob(blob);
    return new ZipDataSource(archive);
  }

  eachFileEntry(fn: (entry: FileEntry) => void): void {
    const files = this.archive.files();

    while (true) {
      const nextFile = files.next();
      if (nextFile.done === true) {
        break;
      }

      const file: unknown = nextFile.value;
      // istanbul ignore next
      if (!Array.isArray(file)) {
        continue;
      }

      const path: unknown = file[0];
      // istanbul ignore next
      if (typeof path !== "string") {
        continue;
      }

      if (path.endsWith("/")) {
        continue;
      }

      const zipEntry: unknown = file[1];
      // istanbul ignore next
      if (!(zipEntry instanceof ZipEntry)) {
        continue;
      }

      fn(createFileEntryForZip(path, zipEntry));
    }
  }
}
