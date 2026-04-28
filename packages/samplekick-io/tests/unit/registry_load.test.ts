import { describe, expect, it, vi } from "vitest";
import { Registry } from "../../src";
import type { FileSource, FileEntry } from "../../src";
import { createFileEntry, createFileSource, collectFileEntries } from "../support";

describe("Registry.load", () => {
  it("calls eachFileEntry on the FileSource", () => {
    const registry = new Registry("root");
    const fileSource: FileSource = {
      eachFileEntry: vi.fn<FileSource["eachFileEntry"]>(),
    };
    registry.load(fileSource);
    expect(fileSource.eachFileEntry).toHaveBeenCalledOnce();
  });

  it("creates an entry for each entry provided by the FileSource", () => {
    const registry = new Registry("root");
    const entries: FileEntry[] = [
      createFileEntry({ path: "a/b" }),
      createFileEntry({ path: "a/c" }),
    ];
    const fileSource = createFileSource(entries);

    registry.load(fileSource);
    const paths: string[] = [];
    registry.eachFileEntry((e) => {
      void paths.push(e.getPath());
    });
    expect(paths).toEqual(["a/b", "a/c"]);
  });

  it("keeps a loaded entry addressable by path when its name differs from the path leaf", () => {
    const registry = new Registry("root");
    const fileSource = createFileSource([
      createFileEntry({ path: "a/b", name: "Renamed B" }),
    ]);

    registry.load(fileSource);

    expect(registry.getEntry("a/b")?.getName()).toBe("Renamed B");
  });

  it("updates an existing entry when one already exists at the path", async () => {
    const registry = new Registry("root");
    const originalCopyToPath = vi.fn<(path: string) => Promise<void>>();
    const replacementCopyToPath = vi.fn<(path: string) => Promise<void>>();

    const originalFileSource = createFileSource([
      {
        ...createFileEntry({ path: "a/b", name: "Original B" }),
        copyToPath: originalCopyToPath,
      },
    ]);
    registry.load(originalFileSource);

    const newFileSource = createFileSource([
      {
        ...createFileEntry({ path: "a/b", name: "renamed-b" }),
        copyToPath: replacementCopyToPath,
      },
    ]);
    registry.load(newFileSource);

    const loadedEntries = collectFileEntries(registry);
    const [loadedEntry] = loadedEntries;
    expect(loadedEntry).toBeDefined();

    await loadedEntry.copyToPath("dest");

    expect(loadedEntry.getName()).toBe("renamed-b");
    expect(loadedEntry.getPath()).toBe("a/b");
    expect(originalCopyToPath).not.toHaveBeenCalled();
    expect(replacementCopyToPath).toHaveBeenCalledWith("dest");
  });

  it ("throws an error when the file source does not have a path", () => {
    const registry = new Registry("root");
    const fileSource = createFileSource([
      createFileEntry({ path: "" }),
    ]);
    expect(() => { registry.load(fileSource); }).toThrow(
      "Entry path must not be empty",
    );
  });
});
