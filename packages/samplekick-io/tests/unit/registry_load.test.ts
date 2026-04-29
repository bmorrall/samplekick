import { describe, expect, it, vi } from "vitest";
import { Registry } from "../../src";
import type { FileSource, FileEntry } from "../../src";
import { createFileEntry, createFileSource } from "../support";

describe("Registry constructor", () => {
  it("calls eachFileEntry on the FileSource", () => {
    const fileSource: FileSource = {
      eachFileEntry: vi.fn<FileSource["eachFileEntry"]>(),
    };
    const _registry = new Registry("root", fileSource);
    expect(fileSource.eachFileEntry).toHaveBeenCalledOnce();
    expect(_registry).toBeDefined();
  });

  it("creates an entry for each entry provided by the FileSource", () => {
    const entries: FileEntry[] = [
      createFileEntry({ path: "a/b" }),
      createFileEntry({ path: "a/c" }),
    ];
    const registry = new Registry("root", createFileSource(entries));
    const paths: string[] = [];
    registry.eachFileEntry((e) => {
      void paths.push(e.getPath());
    });
    expect(paths).toEqual(["a/b", "a/c"]);
  });

  it("keeps a loaded entry addressable by path when its name differs from the path leaf", () => {
    const registry = new Registry("root", createFileSource([
      createFileEntry({ path: "a/b", name: "Renamed B" }),
    ]));

    expect(registry.getEntry("a/b")?.getName()).toBe("Renamed B");
  });

  it("throws when two entries share the same path", () => {
    const fileSource: FileSource = {
      eachFileEntry: (fn) => {
        fn(createFileEntry({ path: "a/b", name: "Original B" }));
        fn(createFileEntry({ path: "a/b", name: "renamed-b" }));
      },
    };
    expect(() => new Registry("root", fileSource)).toThrow('Node already exists at path "a/b"');
  });

  it("throws an error when the file source provides an entry with an empty path", () => {
    const fileSource = createFileSource([
      createFileEntry({ path: "" }),
    ]);
    expect(() => new Registry("root", fileSource)).toThrow(
      "Entry path must not be empty",
    );
  });
});
