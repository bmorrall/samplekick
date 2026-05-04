import { createHash } from "node:crypto";
import { mkdir, open, stat, writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { unzip } from "unzipit";
import type { Reader, ZipEntry } from "unzipit";
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

class NodeFileReader implements Reader {
  constructor(private readonly filePath: string) {}

  async getLength(): Promise<number> {
    const { size } = await stat(this.filePath);
    return size;
  }

  async read(offset: number, length: number): Promise<Uint8Array<ArrayBuffer>> {
    const handle = await open(this.filePath, "r");
    try {
      const buf = new Uint8Array(new ArrayBuffer(length));
      const { bytesRead } = await handle.read(Buffer.from(buf.buffer), 0, length, offset);
      return bytesRead === length ? buf : new Uint8Array(buf.buffer, 0, bytesRead);
    } finally {
      await handle.close();
    }
  }
}

const computeFileFingerprint = async (filePath: string): Promise<string> => {
  const hash = createHash("sha256");
  const handle = await open(filePath, "r");
  try {
    for await (const chunk of handle.createReadStream()) {
      if (!Buffer.isBuffer(chunk)) {
        throw new TypeError(`unexpected chunk type: ${typeof chunk}`);
      }
      hash.update(chunk);
    }
  } finally {
    await handle.close();
  }
  return hash.digest("hex");
};

export class ZipDataSource implements FileSource {
  private readonly entries: Map<string, ZipEntry>;
  private readonly name: string;
  private readonly fingerprint: string;

  constructor(entries: Map<string, ZipEntry>, name: string, fingerprint: string = createHash("sha256").update(name).digest("hex")) {
    this.entries = entries;
    this.name = name;
    this.fingerprint = fingerprint;
  }

  static async fromBlob(blob: Blob, name: string, fingerprint: string = createHash("sha256").update(name).digest("hex")): Promise<ZipDataSource> {
    const { entries } = await unzip(blob);
    return new ZipDataSource(new Map(Object.entries(entries)), name, fingerprint);
  }

  static async fromFile(filePath: string): Promise<ZipDataSource> {
    const [fingerprint, { entries }] = await Promise.all([
      computeFileFingerprint(filePath),
      unzip(new NodeFileReader(filePath)),
    ]);
    return new ZipDataSource(new Map(Object.entries(entries)), basename(filePath), fingerprint);
  }

  getName(): string {
    return this.name;
  }

  getFingerprint(): string {
    return this.fingerprint;
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
