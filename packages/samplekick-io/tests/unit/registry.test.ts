import { describe, it, expect, vi } from "vitest";
import type { FileEntry, FileSource, PathStrategy } from "../../src";
import { PathResult } from "../../src";
import { createConfigEntry, createFileEntry, createConfigSource, createRegistry, collectFileEntries } from "../support";

type EachFileEntryCallback = (entry: FileEntry) => void;

const collectFilePaths = (fileRepository: FileSource): string[] => collectFileEntries(fileRepository).map((entry) => entry.getPath());

describe("Registry", () => {
  describe("getRootEntry", () => {
    it("isFile is false on the root node", () => {
      const registry = createRegistry("root", []);
      expect(registry.getRootEntry().isFile()).toBe(false);
    });
  });

  describe("getFingerprint", () => {
    it("returns the fingerprint from the file source", () => {
      const registry = createRegistry("root", [], "test-fingerprint");

      expect(registry.getFingerprint()).toBe("test-fingerprint");
    });
  });

  describe("setName", () => {
    it("sets the name for the entry at the given path", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);

      expect(registry.setName("a/b", "renamed-b")).toBe(true);

      expect(registry.getEntry("a/b")?.getName()).toBe("renamed-b");
      expect(registry.getEntry("a/b")?.getPath()).toBe("a/b");
    });

    it("returns false when the entry does not exist", () => {
      const registry = createRegistry("root", []);

      expect(registry.setName("a/b", "renamed-b")).toBe(false);
    });

    it("sets the name on the root node when called with only a value", () => {
      const registry = createRegistry("root", []);

      expect(registry.setName("library")).toBe(true);

      expect(registry.toString()).toBe("library [?]\n");
    });

    it("clears the renamed entry name when undefined is passed as the second argument", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);
      expect(registry.setName("a/b", "renamed-b")).toBe(true);

      expect(registry.setName("a/b", undefined)).toBe(true);

      expect(registry.getEntry("a/b")?.getName()).toBe("b");
    });
  });

  describe("setPackageName", () => {
    it("sets the package name for the entry at the given path", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);

      expect(registry.setPackageName("a/b", "my-pack")).toBe(true);

      expect(registry.getEntry("a/b")?.getPackageName()).toBe("my-pack");
    });

    it("returns false when the entry does not exist", () => {
      const registry = createRegistry("root", []);
      expect(registry.setPackageName("a/b", "my-pack")).toBe(false);

      const fn = vi.fn<EachFileEntryCallback>();
      registry.eachFileEntry(fn);
      expect(fn).not.toHaveBeenCalled();
    });

    it("sets the package name on the root node when called with only a value", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);

      expect(registry.setPackageName("my-pack")).toBe(true);

      expect(registry.getEntry("a/b")?.getPackageName()).toBe("my-pack");
    });

    it("applies the root package name to entries across multiple branches", () => {
      const registry = createRegistry("root", [
        createFileEntry({ path: "a/b" }),
        createFileEntry({ path: "c/d" }),
      ]);

      expect(registry.setPackageName("my-pack")).toBe(true);

      expect(registry.getEntry("a/b")?.getPackageName()).toBe("my-pack");
      expect(registry.getEntry("c/d")?.getPackageName()).toBe("my-pack");
    });

    it("clears the package name for a specific path when undefined is passed as the second argument", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);
      expect(registry.setPackageName("a/b", "my-pack")).toBe(true);

      expect(registry.setPackageName("a/b", undefined)).toBe(true);

      expect(registry.getEntry("a/b")?.getPackageName()).toBeUndefined();
    });
  });

  describe("setSampleType", () => {
    it("sets the sample type for the entry at the given path", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);

      expect(registry.setSampleType("a/b", "drums")).toBe(true);

      expect(registry.getEntry("a/b")?.getSampleType()).toBe("drums");
    });

    it("returns false when the entry does not exist", () => {
      const registry = createRegistry("root", []);

      expect(registry.setSampleType("a/b", "drums")).toBe(false);
    });

    it("sets the sample type on the root node when called with only a value", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);

      expect(registry.setSampleType("drums")).toBe(true);

      expect(registry.getEntry("a/b")?.getSampleType()).toBe("drums");
    });

    it("applies the root sample type to entries across multiple branches", () => {
      const registry = createRegistry("root", [
        createFileEntry({ path: "a/b" }),
        createFileEntry({ path: "c/d" }),
      ]);

      expect(registry.setSampleType("drums")).toBe(true);

      expect(registry.getEntry("a/b")?.getSampleType()).toBe("drums");
      expect(registry.getEntry("c/d")?.getSampleType()).toBe("drums");
    });

    it("clears the sample type for a specific path when undefined is passed as the second argument", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);
      expect(registry.setSampleType("a/b", "drums")).toBe(true);

      expect(registry.setSampleType("a/b", undefined)).toBe(true);

      expect(registry.getEntry("a/b")?.getSampleType()).toBeUndefined();
    });
  });

  describe("setSkipped", () => {
    it("sets skipped to true for the entry at the given path", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);

      expect(registry.setSkipped("a/b", true)).toBe(true);

      expect(registry.getEntry("a/b")?.isSkipped()).toBe(true);
    });

    it("sets skipped to false for the entry at the given path", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);

      expect(registry.setSkipped("a/b", true)).toBe(true);
      expect(registry.setSkipped("a/b", false)).toBe(true);

      expect(registry.getEntry("a/b")?.isSkipped()).toBe(false);
    });

    it("returns false when the entry does not exist", () => {
      const registry = createRegistry("root", []);

      expect(registry.setSkipped("a/b", true)).toBe(false);
    });

    it("sets skipped on the root node when called with only a value", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);

      expect(registry.setSkipped(true)).toBe(true);

      expect(registry.getEntry("a/b")?.isSkipped()).toBe(true);
    });
  });

  describe("setKeepStructure", () => {
    it("sets keepStructure for the entry at the given path", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);

      expect(registry.setKeepStructure("a/b", true)).toBe(true);

      expect(registry.getEntry("a/b")?.isKeepStructure()).toBe(true);
    });

    it("returns false when the entry does not exist", () => {
      const registry = createRegistry("root", []);

      expect(registry.setKeepStructure("a/b", true)).toBe(false);
    });

    it("sets keepStructure on the root node when called with only a value", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);

      expect(registry.setKeepStructure(true)).toBe(true);

      expect(registry.getEntry("a/b")?.isKeepStructure()).toBe(true);
    });
  });

  describe("getEntry", () => {
    it("returns an entry for a single-part path", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "file" })]);
      const entry = registry.getEntry("file");
      expect(entry?.getPath()).toBe("file");
    });

    it("returns an entry for a multi-part path", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b/c" })]);
      const entry = registry.getEntry("a/b/c");
      expect(entry?.getPath()).toBe("a/b/c");
    });

    it("returns the same node for the same path", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);
      const entry1 = registry.getEntry("a/b");
      const entry2 = registry.getEntry("a/b");
      expect(entry1).toBe(entry2);
    });

    it("shares metadata through intermediate paths", () => {
      const registry = createRegistry("root", [
        createFileEntry({ path: "a/b" }),
        createFileEntry({ path: "a/c" }),
      ]);
      expect(registry.setPackageName("a", "shared-pack")).toBe(true);

      expect(registry.getEntry("a/b")?.getPackageName()).toBe("shared-pack");
      expect(registry.getEntry("a/c")?.getPackageName()).toBe("shared-pack");
    });
  });

  describe("setEntryConfig", () => {
    it("updates an existing entry at the given path", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);

      expect(
        registry.setEntryConfig(
          createConfigEntry({
            path: "a/b",
            name: "renamed-b",
            packageName: "my-pack",
            sampleType: "drums",
            skipped: true,
            keepStructure: true,
          }),
        ),
      ).toBe(true);

      const entry = registry.getEntry("a/b");
      expect(entry?.getName()).toBe("renamed-b");
      expect(entry?.getPackageName()).toBe("my-pack");
      expect(entry?.getSampleType()).toBe("drums");
      expect(entry?.isSkipped()).toBe(true);
      expect(entry?.isKeepStructure()).toBe(true);
    });

    it("returns false when the entry path does not exist", () => {
      const registry = createRegistry("root", []);

      expect(
        registry.setEntryConfig(
          createConfigEntry({ path: "a/b", packageName: "my-pack" }),
        ),
      ).toBe(false);
    });

    it("returns false when given an empty path", () => {
      const registry = createRegistry("root", []);

      expect(
        registry.setEntryConfig(createConfigEntry({ path: "", name: "renamed-root" })),
      ).toBe(false);
    });
  });

  describe("loadConfig", () => {
    it("does not overwrite a transformer-set name when the config has no name override", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);
      registry.setName("a/b", "Transformer Name");

      const configSource = createConfigSource([
        createConfigEntry({ path: "a/b", packageName: "my-pack" })
      ]);
      registry.loadConfig(configSource);

      expect(registry.getEntry("a/b")?.getName()).toBe("Transformer Name");
    });

    it("updates an existing entry when one exists at the path", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);
      const configSource = createConfigSource([
        createConfigEntry({
          path: "a/b",
          packageName: "my-pack",
          sampleType: "drums",
          skipped: true,
          keepStructure: true,
        })
      ])

      registry.loadConfig(configSource);

      const entry = registry.getEntry("a/b");
      expect(entry?.getPackageName()).toBe("my-pack");
      expect(entry?.getSampleType()).toBe("drums");
      expect(entry?.isSkipped()).toBe(true);
      expect(entry?.isKeepStructure()).toBe(true);
    });

    it("does not set packageName or sampleType when the entry provides neither", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);

      const configSource = createConfigSource([
        createConfigEntry({ path: "a/b", skipped: true })
      ]);
      registry.loadConfig(configSource);

      const entry = registry.getEntry("a/b");
      expect(entry?.getPackageName()).toBeUndefined();
      expect(entry?.getSampleType()).toBeUndefined();
      expect(entry?.isSkipped()).toBe(true);
    });

    it("does not create an entry when the path does not exist", () => {
      const registry = createRegistry("root", []);

      const configSource = createConfigSource([
        createConfigEntry({ path: "a/b", packageName: "my-pack" })
      ])
      registry.loadConfig(configSource);

      const fn = vi.fn<EachFileEntryCallback>();
      registry.eachFileEntry(fn);
      expect(fn).not.toHaveBeenCalled();
    });

    it("updates the root entry directly when the config entry path is empty", () => {
      const registry = createRegistry("root", []);
      const configSource = createConfigSource([
        createConfigEntry({
          path: "",
          name: "renamed-root",
          packageName: "root-pack",
        })
      ]);

      registry.loadConfig(configSource);

      expect(registry.getRootEntry().getName()).toBe("renamed-root");
      expect(registry.getRootEntry().getPackageName()).toBe("root-pack");
    });
  });

  describe("eachFileEntry", () => {
    it("does not call the function when there are no entries", () => {
      const registry = createRegistry("root", []);
      const fn = vi.fn<EachFileEntryCallback>();
      registry.eachFileEntry(fn);
      expect(fn).not.toHaveBeenCalled();
    });

    it("calls the function for each leaf node at single-level paths", () => {
      const registry = createRegistry("root", [
        createFileEntry({ path: "a" }),
        createFileEntry({ path: "b" }),
      ]);

      const paths = collectFilePaths(registry);
      expect(paths).toEqual(["a", "b"]);
    });

    it("calls the function once for each leaf entry in nested paths", () => {
      const registry = createRegistry("root", [
        createFileEntry({ path: "a/b" }),
        createFileEntry({ path: "a/c" }),
      ]);
      const fn = vi.fn<EachFileEntryCallback>();
      registry.eachFileEntry(fn);
      const expectedCallCount = 2;
      expect(fn).toHaveBeenCalledTimes(expectedCallCount);
    });

    it("calls the function for leaf nodes across multiple branches", () => {
      const registry = createRegistry("root", [
        createFileEntry({ path: "jazz/track01" }),
        createFileEntry({ path: "rock/track01" }),
      ]);

      const paths = collectFilePaths(registry);
      expect(paths).toEqual(["jazz/track01", "rock/track01"]);
    });

    it("provides entries with the correct path", () => {
      const registry = createRegistry("root", [
        createFileEntry({ path: "a/b" }),
        createFileEntry({ path: "a/c" }),
      ]);
      const paths = collectFilePaths(registry);
      expect(paths).toEqual(["a/b", "a/c"]);
    });
  });

  describe("destinationPathFor", () => {
    it("returns undefined when no entry exists at the path", () => {
      const registry = createRegistry("root", []);
      expect(registry.destinationPathFor("a/b")).toBeUndefined();
    });

    it("delegates to the path strategy with the entry node", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);

      const strategy: PathStrategy = {
        destinationPathFor: vi.fn().mockReturnValue(new PathResult("out/b")),
      };
      registry.setPathStrategy(strategy);

      expect(registry.destinationPathFor("a/b")).toBe("out/b");
      expect(strategy.destinationPathFor).toHaveBeenCalledOnce();
    });

    it("uses the default SourcePathStrategy when no strategy is set", () => {
      const registry = createRegistry("root", [createFileEntry({ path: "a/b" })]);
      expect(registry.destinationPathFor("a/b")).toBe("a/b");
    });
  });
});
