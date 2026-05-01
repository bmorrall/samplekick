import { describe, it, expect } from "vitest";
import { OrganisedPathStrategy, Registry } from "../../src";
import type { FileSource, ConfigEntry, FileEntry } from "../../src";
import { createFileEntry, createRegistry } from "../support";

describe("Registry load", () => {
  it("raises an error for duplicate entry paths", () => {
    const fileSource: FileSource = {
      getName: () => "library",
      getFingerprint: () => "",
      eachFileEntry: (fn) => {
        fn(createFileEntry({ path: "jazz/track01" }));
        fn(createFileEntry({ path: "jazz/track01" }));
      },
    };
    expect(() => new Registry(fileSource)).toThrow(
      'Node already exists at path "jazz/track01"',
    );
  });

  it("populates the registry from a FileSource", () => {
    const entries: FileEntry[] = [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/bebop/track02" }),
      createFileEntry({ path: "rock/track01" }),
    ];
    const fileSource: FileSource = {
      getName: () => "library",
      getFingerprint: () => "",
      eachFileEntry: (fn) => {
        entries.forEach(fn);
      },
    };
    const registry = new Registry(fileSource);
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
    const fileSource: FileSource = {
      getName: () => "library",
      getFingerprint: () => "",
      eachFileEntry: (fn) => {
        fn(createFileEntry({ path: "jazz/bebop/track01" }));
        fn(createFileEntry({ path: "jazz/swing/track01" }));
      },
    };
    const registry = new Registry(fileSource);
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
    const registry = createRegistry("library", [
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

  it("can feed one registry into another via constructor", () => {
    const source = createRegistry("source", [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "rock/track01" }),
    ]);

    const target = new Registry(source);

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
    const registry = createRegistry("library", [
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

  it("can feed one registry into another via constructor", () => {
    const source = createRegistry("source", [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "rock/track01" }),
    ]);
    source.setPackageName("jazz/bebop/track01", "jazz-pack");
    source.setSampleType("jazz/bebop/track01", "Melodic Loops - Jazz");
    source.setPackageName("rock/track01", "rock-pack");
    source.setSampleType("rock/track01", "Melodic Loops - Rock");

    const target = new Registry(source);
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
    const registry = createRegistry("library", [createFileEntry({ path: "jazz/bebop/track01" })]);
    registry.setPackageName("jazz", "jazz-pack");

    const deep = registry.getEntry("jazz/bebop/track01");
    expect(deep?.getPackageName()).toBe("jazz-pack");
  });

  it("child package name overrides parent", () => {
    const registry = new Registry({
      getName: () => "library",
      getFingerprint: () => "",
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
    const registry = createRegistry("library", [
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
    const registry = createRegistry("library", [createFileEntry({ path: "a/b/c" })]);
    registry.setPackageName("my-pack");
    registry.setSampleType("loops");
    registry.setKeepStructure("a", true);
    registry.setPathStrategy(OrganisedPathStrategy);

    expect(registry.destinationPathFor("a/b/c")).toBe("loops/my-pack/a/b/c");
  });
});

describe("Registry eachFileEntry enumeration", () => {
  it("visits all leaf nodes across a nested tree in order", () => {
    const registry = createRegistry("library", [
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
    const registry = createRegistry("library", [
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
    const registry = createRegistry("library", [createFileEntry({ path: "jazz/track01" })]);
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
