import { PassThrough, Readable } from "node:stream";
import { describe, it, expect } from "vitest";
import { CsvConfigReader, CsvConfigWriter } from "../../../src";
import { collectConfigEntries, createFileEntry, createRegistry } from "../../support";

const collectOutput = (fn: (stream: PassThrough) => void): string => {
  const stream = new PassThrough({ encoding: "utf8" });
  const chunks: string[] = [];
  stream.on("data", (chunk: string) => {
    chunks.push(chunk);
  });
  fn(stream);
  return chunks.join("");
};

describe("CSV I/O", () => {
  it("writes a header-only CSV when the FileSource has no entries", () => {
    const output = collectOutput((stream) => {
      const writer = new CsvConfigWriter(stream);
      writer.writeConfig({
        eachConfigEntry: () => {
          /* no entries */
        },
      });
    });
    const reader = new CsvConfigReader(Readable.from([output]));

    const result = collectConfigEntries(reader);

    expect(result).toEqual([]);
  });

  it("closes the stream after writing", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    stream.resume();

    const writer = new CsvConfigWriter(stream);
    writer.writeConfig(createRegistry("library", []));

    expect(stream.writableEnded).toBe(true);
  });

  it("writes all nodes sorted by path", () => {
    const registry = createRegistry("library", [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/bebop/track02" }),
      createFileEntry({ path: "rock/track01" }),
    ]);
    registry.setPackageName("rock/track01", "rock-pack");

    const output = collectOutput((stream) => {
      const writer = new CsvConfigWriter(stream);
      writer.writeConfig(registry);
    });
    const reader = new CsvConfigReader(Readable.from([output]));

    const result = collectConfigEntries(reader);

    expect(result).toHaveLength(7);
    expect(result.map((e) => e.getPath())).toEqual([
      "",
      "jazz",
      "jazz/bebop",
      "jazz/bebop/track01",
      "jazz/bebop/track02",
      "rock",
      "rock/track01",
    ]);
  });

  it("writes path, packageName, sampleType, isSkipped, and isKeepStructure for each entry", () => {
    const registry = createRegistry("library", [createFileEntry({ path: "jazz/bebop/track01" })]);
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz/bebop", "Melodic Loops - Bebop");

    const output = collectOutput((stream) => {
      const writer = new CsvConfigWriter(stream);
      writer.writeConfig(registry);
    });
    const reader = new CsvConfigReader(Readable.from([output]));

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
    const registry = createRegistry("library", [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/swing/track01" }),
    ]);
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz", "Melodic Loops - Jazz");

    const output = collectOutput((stream) => {
      const writer = new CsvConfigWriter(stream);
      writer.writeConfig(registry);
    });
    const reader = new CsvConfigReader(Readable.from([output]));

    const result = collectConfigEntries(reader);

    expect(result).toHaveLength(6);
    expect(result.map((e) => e.getPath())).toEqual([
      "",
      "jazz",
      "jazz/bebop",
      "jazz/bebop/track01",
      "jazz/swing",
      "jazz/swing/track01",
    ]);
    expect(result.map((e) => e.getPackageName())).toEqual([
      undefined,
      "jazz-pack",
      "jazz-pack",
      "jazz-pack",
      "jazz-pack",
      "jazz-pack",
    ]);
    expect(result.map((e) => e.getSampleType())).toEqual([
      undefined,
      "Melodic Loops - Jazz",
      "Melodic Loops - Jazz",
      "Melodic Loops - Jazz",
      "Melodic Loops - Jazz",
      "Melodic Loops - Jazz",
    ]);
  });

  it("reflects isSkipped and isKeepStructure when set", () => {
    const registry = createRegistry("library", [createFileEntry({ path: "jazz/track01" })]);
    registry.setSkipped("jazz", true);
    registry.setKeepStructure("jazz", true);

    const output = collectOutput((stream) => {
      const writer = new CsvConfigWriter(stream);
      writer.writeConfig(registry);
    });
    const reader = new CsvConfigReader(Readable.from([output]));

    const result = collectConfigEntries(reader);

    const [, entry] = result;
    expect(entry.isSkipped()).toBe(true);
    expect(entry.isKeepStructure()).toBe(true);
  });

  it("round-trips renamed entries through CSV", () => {
    const registry = createRegistry("library", [createFileEntry({ path: "jazz/bebop/track01" })]);
    registry.setName("jazz/bebop/track01", "Alt Track 01");

    const output = collectOutput((stream) => {
      const writer = new CsvConfigWriter(stream);
      writer.writeConfig(registry);
    });

    const restoredRegistry = createRegistry("library", [
      createFileEntry({ path: "jazz/bebop/track01" }),
    ]);
    restoredRegistry.loadConfig(
      new CsvConfigReader(Readable.from([output])),
    );

    expect(restoredRegistry.getEntry("jazz/bebop/track01")?.getName()).toBe(
      "Alt Track 01",
    );
  });

  it("round-trips root node changes through CSV", () => {
    const registry = createRegistry("library", []);
    registry.setName("Renamed Library");
    registry.setPackageName("library-pack");

    const output = collectOutput((stream) => {
      const writer = new CsvConfigWriter(stream);
      writer.writeConfig(registry);
    });

    const restoredEmptyRegistry = createRegistry("library", []);
    restoredEmptyRegistry.loadConfig(
      new CsvConfigReader(Readable.from([output])),
    );
    expect(restoredEmptyRegistry.toString()).toBe(
      "Renamed Library [pkg:library-pack]\n",
    );

    const restoredRegistryWithFiles = createRegistry("library", [createFileEntry({ path: "jazz/track01" })]);
    restoredRegistryWithFiles.loadConfig(
      new CsvConfigReader(Readable.from([output])),
    );
    expect(restoredRegistryWithFiles.getEntry("jazz/track01")?.getPackageName()).toBe(
      "library-pack",
    );
  });
});
