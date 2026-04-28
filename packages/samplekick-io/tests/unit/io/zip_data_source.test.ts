import { ZipArchive } from "@shortercode/webzip";
import { mkdir, writeFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { ZipDataSource } from "../../../src";
import type { FileEntry } from "../../../src";

vi.mock("node:fs/promises", () => ({
  mkdir: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  writeFile: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

const buildDataSource = async (
  files: Record<string, string>,
): Promise<ZipDataSource> => {
  const archive = new ZipArchive();
  await Promise.all(
    Object.entries(files).map(
      async ([path, content]) => await archive.set(path, content),
    ),
  );
  return await ZipDataSource.fromBlob(archive.to_blob());
};

const collectConfigEntries = (dataSource: ZipDataSource): FileEntry[] => {
  const entries: FileEntry[] = [];
  dataSource.eachFileEntry((entry) => {
    entries.push(entry);
  });
  return entries;
};

describe("ZipDataSource", () => {
  it("yields one entry per file in the archive", async () => {
    const dataSource = await buildDataSource({
      "a/b.wav": "data",
      "c.wav": "data2",
    });

    const paths = collectConfigEntries(dataSource).map((e) => e.getPath());

    expect(paths).toEqual(["a/b.wav", "c.wav"]);
  });

  it("skips folder entries", async () => {
    const archive = new ZipArchive();
    archive.set_folder("my-folder");
    await archive.set("my-folder/track.wav", "data");
    const dataSource = await ZipDataSource.fromBlob(archive.to_blob());

    const paths = collectConfigEntries(dataSource).map((e) => e.getPath());

    expect(paths).toEqual(["my-folder/track.wav"]);
  });

  it("uses the path basename as the entry name", async () => {
    const dataSource = await buildDataSource({
      "jazz/bebop/track01.wav": "data",
    });

    const [entry] = collectConfigEntries(dataSource);

    expect(entry.getName()).toBe("track01.wav");
  });

  describe("copyToPath", () => {
    it("creates the destination directory and writes the file", async () => {
      const dataSource = await buildDataSource({
        "samples/kick.wav": "kick-data",
      });
      const [entry] = collectConfigEntries(dataSource);

      await entry.copyToPath("/output/kick.wav");

      expect(mkdir).toHaveBeenCalledWith("/output", { recursive: true });
      expect(writeFile).toHaveBeenCalledWith(
        "/output/kick.wav",
        expect.any(Uint8Array),
      );
    });

    it("creates nested directories for deeply nested destination paths", async () => {
      const dataSource = await buildDataSource({ "a.wav": "data" });
      const [entry] = collectConfigEntries(dataSource);

      await entry.copyToPath("/deep/nested/dir/a.wav");

      expect(mkdir).toHaveBeenCalledWith("/deep/nested/dir", {
        recursive: true,
      });
    });
  });
});
