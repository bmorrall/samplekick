import { PassThrough, Readable } from "node:stream";
import { describe, it, expect } from "vitest";
import {
  JsonConfigReader,
  JsonConfigWriter,
  Registry,
} from "../../../src";
import { collectConfigEntries, createFileEntry, loadRegistry } from "../../support";

const collectOutput = (fn: (stream: PassThrough) => void): string => {
  const stream = new PassThrough({ encoding: "utf8" });
  const chunks: string[] = [];
  stream.on("data", (chunk: string) => {
    chunks.push(chunk);
  });
  fn(stream);
  return chunks.join("");
};

describe("JSON I/O", () => {
  it("writes an empty array when the FileSource has no entries", () => {
    const output = collectOutput((stream) => {
      const writer = new JsonConfigWriter(stream);
      writer.writeConfig({
        eachConfigEntry: () => {
          /* no entries */
        },
      });
    });
    const reader = new JsonConfigReader(Readable.from([output]));

    const result = collectConfigEntries(reader);

    expect(result).toEqual([]);
  });

  it("writes all leaf entries plus mutated folder nodes", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/bebop/track02" }),
      createFileEntry({ path: "rock/track01" }),
    ]);
    registry.setPackageName("rock/track01", "rock-pack");

    const output = collectOutput((stream) => {
      const writer = new JsonConfigWriter(stream);
      writer.writeConfig(registry);
    });
    const reader = new JsonConfigReader(Readable.from([output]));

    const result = collectConfigEntries(reader);

    expect(result).toHaveLength(4);
    expect(result.map((e) => e.getPath())).toEqual([
      "",
      "jazz/bebop/track01",
      "jazz/bebop/track02",
      "rock/track01",
    ]);
  });

  it("writes path, packageName, sampleType, isSkipped, and isKeepStructure for each entry", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [createFileEntry({ path: "jazz/bebop/track01" })]);
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz/bebop", "Melodic Loops - Bebop");

    const output = collectOutput((stream) => {
      const writer = new JsonConfigWriter(stream);
      writer.writeConfig(registry);
    });
    const reader = new JsonConfigReader(Readable.from([output]));

    const result = collectConfigEntries(reader);

    expect(result).toHaveLength(4);
    expect(result.map((e) => e.getPath())).toEqual([
      "",
      "jazz",
      "jazz/bebop",
      "jazz/bebop/track01",
    ]);
    expect(result.map((e) => e.getPackageName())).toEqual([
      undefined,
      "jazz-pack",
      "jazz-pack",
      "jazz-pack",
    ]);
    expect(result.map((e) => e.getSampleType())).toEqual([
      undefined,
      undefined,
      "Melodic Loops - Bebop",
      "Melodic Loops - Bebop",
    ]);
    expect(result.map((e) => e.isSkipped())).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(result.map((e) => e.isKeepStructure())).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("reflects inherited tags on entries", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/swing/track01" }),
    ]);
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz", "Melodic Loops - Jazz");

    const output = collectOutput((stream) => {
      const writer = new JsonConfigWriter(stream);
      writer.writeConfig(registry);
    });
    const reader = new JsonConfigReader(Readable.from([output]));

    const result = collectConfigEntries(reader);

    expect(result).toHaveLength(4);
    expect(result.map((e) => e.getPath())).toEqual([
      "",
      "jazz",
      "jazz/bebop/track01",
      "jazz/swing/track01",
    ]);
    expect(result.map((e) => e.getPackageName())).toEqual([
      undefined,
      "jazz-pack",
      "jazz-pack",
      "jazz-pack",
    ]);
    expect(result.map((e) => e.getSampleType())).toEqual([
      undefined,
      "Melodic Loops - Jazz",
      "Melodic Loops - Jazz",
      "Melodic Loops - Jazz",
    ]);
    expect(result.map((e) => e.isSkipped())).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(result.map((e) => e.isKeepStructure())).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("reflects isSkipped and isKeepStructure when set", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [createFileEntry({ path: "jazz/track01" })]);
    registry.setSkipped("jazz", true);
    registry.setKeepStructure("jazz", true);

    const output = collectOutput((stream) => {
      const writer = new JsonConfigWriter(stream);
      writer.writeConfig(registry);
    });
    const reader = new JsonConfigReader(Readable.from([output]));

    const result = collectConfigEntries(reader);

    const [, entry] = result;
    expect(entry.isSkipped()).toBe(true);
    expect(entry.isKeepStructure()).toBe(true);
  });

  it("round-trips renamed entries through JSON", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [createFileEntry({ path: "jazz/bebop/track01" })]);
    registry.setName("jazz/bebop/track01", "Alt Track 01");

    const output = collectOutput((stream) => {
      const writer = new JsonConfigWriter(stream);
      writer.writeConfig(registry);
    });

    const restoredRegistry = new Registry("library");
    loadRegistry(restoredRegistry, [
      createFileEntry({ path: "jazz/bebop/track01" }),
    ]);
    restoredRegistry.loadConfig(
      new JsonConfigReader(Readable.from([output])),
    );

    expect(restoredRegistry.getEntry("jazz/bebop/track01")?.getName()).toBe(
      "Alt Track 01",
    );
  });

  it("round-trips root node changes through JSON", () => {
    const registry = new Registry("library");
    registry.setName("Renamed Library");
    registry.setPackageName("library-pack");

    const output = collectOutput((stream) => {
      const writer = new JsonConfigWriter(stream);
      writer.writeConfig(registry);
    });

    const restoredRegistry = new Registry("library");
    restoredRegistry.loadConfig(
      new JsonConfigReader(Readable.from([output])),
    );

    expect(restoredRegistry.toString()).toBe(
      "Renamed Library [pkg:library-pack]\n",
    );
    loadRegistry(restoredRegistry, [createFileEntry({ path: "jazz/track01" })]);
    expect(restoredRegistry.getEntry("jazz/track01")?.getPackageName()).toBe(
      "library-pack",
    );
  });

  it("each writeConfig call writes a separate JSON array to the stream", () => {
    const registry1 = new Registry("library1");
    loadRegistry(registry1, [createFileEntry({ path: "jazz/track01" })]);
    registry1.setPackageName("jazz/track01", "jazz-pack");

    const registry2 = new Registry("library2");
    loadRegistry(registry2, [createFileEntry({ path: "rock/track01" })]);
    registry2.setPackageName("rock/track01", "rock-pack");

    const output = collectOutput((stream) => {
      const writer = new JsonConfigWriter(stream);
      writer.writeConfig(registry1);
      writer.writeConfig(registry2);
    });
    const splitIndex = output.indexOf("][") + 1;
    const firstReader = new JsonConfigReader(
      Readable.from([output.slice(0, splitIndex)]),
    );
    const secondReader = new JsonConfigReader(
      Readable.from([output.slice(splitIndex)]),
    );
    const first = collectConfigEntries(firstReader);
    const second = collectConfigEntries(secondReader);
    expect(first.map((e) => e.getPath())).toEqual(["", "jazz/track01"]);
    expect(second.map((e) => e.getPath())).toEqual(["", "rock/track01"]);
  });
});
