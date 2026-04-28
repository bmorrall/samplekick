import { describe, it, expect } from "vitest";
import { OrganisedPathStrategy, Registry } from "../../src";
import type { FileSource, ConfigEntry, FileEntry } from "../../src";
import { createFileEntry, loadRegistry } from "../support";

describe("Registry load", () => {
  it("populates the registry from a FileSource", () => {
    const registry = new Registry("library");
    const entries: FileEntry[] = [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/bebop/track02" }),
      createFileEntry({ path: "rock/track01" }),
    ];
    const fileSource: FileSource = {
      eachFileEntry: (fn) => {
        entries.forEach(fn);
      },
    };
    registry.load(fileSource);
    const paths: string[] = [];
    registry.eachFileEntry((e) => {
      void paths.push(e.getPath());
    });
    expect(paths).toEqual([
      "jazz/bebop/track01",
      "jazz/bebop/track02",
      "rock/track01",
    ]);
  });

  it("allows metadata to be set on entries after loading", () => {
    const registry = new Registry("library");
    const fileSource: FileSource = {
      eachFileEntry: (fn) => {
        fn(createFileEntry({ path: "jazz/bebop/track01" }));
        fn(createFileEntry({ path: "jazz/swing/track01" }));
      },
    };
    registry.load(fileSource);
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz", "Melodic Loops - Jazz");

    const entries: ConfigEntry[] = [];
    registry.eachConfigEntry((e) => {
      void entries.push(e);
    });
    expect(entries.map((e) => e.getPath())).toEqual([
      "",
      "jazz",
      "jazz/bebop/track01",
      "jazz/swing/track01",
    ]);
    expect(entries.map((e) => e.getName())).toEqual([
      "library",
      "jazz",
      "track01",
      "track01",
    ]);
    expect(entries.map((e) => e.getPackageName())).toEqual([
      undefined,
      "jazz-pack",
      "jazz-pack",
      "jazz-pack",
    ]);
    expect(entries.map((e) => e.getSampleType())).toEqual([
      undefined,
      "Melodic Loops - Jazz",
      "Melodic Loops - Jazz",
      "Melodic Loops - Jazz",
    ]);
  });
});

describe("Registry eachFileEntry", () => {
  it("exposes loaded entries as a FileSource", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/swing/track01" }),
      createFileEntry({ path: "rock/track01" }),
    ]);
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz/bebop", "Melodic Loops - Bebop");
    registry.setSampleType("jazz/swing", "Melodic Loops - Swing");
    registry.setPackageName("rock/track01", "rock-pack");
    registry.setSampleType("rock/track01", "Melodic Loops - Rock");

    const fileEntries: FileEntry[] = [];
    registry.eachFileEntry((entry) => {
      fileEntries.push(entry);
    });

    expect(fileEntries.map((e) => e.getPath())).toEqual([
      "jazz/bebop/track01",
      "jazz/swing/track01",
      "rock/track01",
    ]);
    expect(fileEntries.map((e) => e.getName())).toEqual([
      "track01",
      "track01",
      "track01",
    ]);
  });

  it("can feed one registry into another via load", () => {
    const source = new Registry("source");
    loadRegistry(source, [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "rock/track01" }),
    ]);

    const target = new Registry("target");
    target.load(source);

    const fileEntries: FileEntry[] = [];
    target.eachFileEntry((e) => {
      void fileEntries.push(e);
    });
    expect(fileEntries.map((e) => e.getPath())).toEqual([
      "jazz/bebop/track01",
      "rock/track01",
    ]);
  });
});

describe("Registry eachConfigEntry", () => {
  it("exposes loaded entries as a ConfigSource", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/swing/track01" }),
      createFileEntry({ path: "rock/track01" }),
    ]);
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz/bebop", "Melodic Loops - Bebop");
    registry.setSampleType("jazz/swing", "Melodic Loops - Swing");
    registry.setPackageName("rock/track01", "rock-pack");
    registry.setSampleType("rock/track01", "Melodic Loops - Rock");

    const configEntries: ConfigEntry[] = [];
    registry.eachConfigEntry((entry) => {
      configEntries.push(entry);
    });

    expect(configEntries.map((e) => e.getPath())).toEqual([
      "",
      "jazz",
      "jazz/bebop",
      "jazz/bebop/track01",
      "jazz/swing",
      "jazz/swing/track01",
      "rock/track01",
    ]);
    expect(configEntries.map((e) => e.getName())).toEqual([
      "library",
      "jazz",
      "bebop",
      "track01",
      "swing",
      "track01",
      "track01",
    ]);
  });

  it("can feed one registry into another via load", () => {
    const source = new Registry("source");
    loadRegistry(source, [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "rock/track01" }),
    ]);
    source.setPackageName("jazz/bebop/track01", "jazz-pack");
    source.setSampleType("jazz/bebop/track01", "Melodic Loops - Jazz");
    source.setPackageName("rock/track01", "rock-pack");
    source.setSampleType("rock/track01", "Melodic Loops - Rock");

    const target = new Registry("target");
    target.load(source);
    target.loadConfig(source);

    const targetEntries: ConfigEntry[] = [];
    target.eachConfigEntry((e) => {
      void targetEntries.push(e);
    });

    expect(targetEntries.map((e) => e.getPath())).toEqual([
      "",
      "jazz/bebop/track01",
      "rock/track01",
    ]);
    expect(targetEntries.map((e) => e.getPackageName())).toEqual([
      undefined,
      "jazz-pack",
      "rock-pack",
    ]);
    expect(targetEntries.map((e) => e.getSampleType())).toEqual([
      undefined,
      "Melodic Loops - Jazz",
      "Melodic Loops - Rock",
    ]);
  });
});

describe("Registry", () => {
  it("inherits package name down a full path", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [createFileEntry({ path: "jazz/bebop/track01" })]);
    registry.setPackageName("jazz", "jazz-pack");

    const deep = registry.getEntry("jazz/bebop/track01");
    expect(deep?.getPackageName()).toBe("jazz-pack");
  });

  it("child package name overrides parent", () => {
    const registry = new Registry("library");
    registry.load({
      eachFileEntry: (fn) => {
        fn(createFileEntry({ path: "jazz/bebop/track01" }));
        fn(createFileEntry({ path: "jazz/swing/track01" }));
      },
    });
    registry.setPackageName("jazz", "jazz-pack");
    registry.setPackageName("jazz/bebop", "bebop-pack");

    expect(registry.getEntry("jazz/bebop/track01")?.getPackageName()).toBe(
      "bebop-pack",
    );
    expect(registry.getEntry("jazz/swing/track01")?.getPackageName()).toBe(
      "jazz-pack",
    );
  });

  it("builds a full node tree from multiple paths", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/bebop/track02" }),
      createFileEntry({ path: "jazz/swing/track01" }),
    ]);

    expect(registry.getEntry("jazz")?.getPath()).toBe("jazz");
    expect(registry.getEntry("jazz/bebop")?.getPath()).toBe("jazz/bebop");
    expect(registry.getEntry("jazz/bebop/track01")?.getPath()).toBe(
      "jazz/bebop/track01",
    );
  });

  it("computes destination paths through OrganisedPathStrategy", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [createFileEntry({ path: "a/b/c" })]);
    registry.setPackageName("my-pack");
    registry.setSampleType("loops");
    registry.setKeepStructure("a", true);
    registry.setPathStrategy(OrganisedPathStrategy);

    expect(registry.destinationPathFor("a/b/c")).toBe("loops/my-pack/a/b/c");
  });
});

describe("Registry eachFileEntry enumeration", () => {
  it("visits all leaf nodes across a nested tree in order", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/bebop/track02" }),
      createFileEntry({ path: "jazz/swing/track01" }),
    ]);

    const paths: string[] = [];
    registry.eachFileEntry((e) => {
      void paths.push(e.getPath());
    });
    expect(paths).toEqual([
      "jazz/bebop/track01",
      "jazz/bebop/track02",
      "jazz/swing/track01",
    ]);
  });

  it("provides paths relative to the registry root", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "rock/track01" }),
    ]);

    const paths: string[] = [];
    registry.eachFileEntry((e) => {
      void paths.push(e.getPath());
    });
    expect(paths).toEqual(["jazz/bebop/track01", "rock/track01"]);
  });

  it("provided entries inherit tags from ancestors", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [createFileEntry({ path: "jazz/track01" })]);
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz", "Melodic Loops - Jazz");

    const entries: ConfigEntry[] = [];
    registry.eachConfigEntry((e) => {
      void entries.push(e);
    });

    expect(entries).toHaveLength(3);
    expect(entries.map((e) => e.getPath())).toEqual([
      "", "jazz", "jazz/track01"
    ]);
    expect(entries.map((e) => e.getName())).toEqual([
      "library", "jazz", "track01"
    ]);
    expect(entries.map((e) => e.getPackageName())).toEqual([
      undefined, "jazz-pack", "jazz-pack"
    ]);
    expect(entries.map((e) => e.getSampleType())).toEqual([
      undefined, "Melodic Loops - Jazz", "Melodic Loops - Jazz"
    ]);
  });
});
