import { PassThrough, Readable } from "node:stream";
import { describe, it, expect } from "vitest";
import { JsonDigestReader, JsonDigestWriter } from "../../../src";
import {
  collectDigestEntries,
  createFileEntry,
  createRegistry,
} from "../../support";

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
      const writer = new JsonDigestWriter(stream);
      writer.writeDigest({
        eachDigestEntry: () => {
          /* no entries */
        },
      });
    });
    const reader = new JsonDigestReader(Readable.from([output]));

    const result = collectDigestEntries(reader);

    expect(result).toEqual([]);
  });

  it("writes all nodes sorted by path", () => {
    const registry = createRegistry("library", [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/bebop/track02" }),
      createFileEntry({ path: "rock/track01" }),
    ]);
    registry.setPackageName("rock/track01", "rock-pack");

    const output = collectOutput((stream) => {
      const writer = new JsonDigestWriter(stream);
      writer.writeDigest(registry);
    });
    const reader = new JsonDigestReader(Readable.from([output]));

    const result = collectDigestEntries(reader);

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
    const registry = createRegistry("library", [
      createFileEntry({ path: "jazz/bebop/track01" }),
    ]);
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz/bebop", "Melodic Loops - Bebop");

    const output = collectOutput((stream) => {
      const writer = new JsonDigestWriter(stream);
      writer.writeDigest(registry);
    });
    const reader = new JsonDigestReader(Readable.from([output]));

    const result = collectDigestEntries(reader);

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
      undefined,
      undefined,
    ]);
    expect(result.map((e) => e.getSampleType())).toEqual([
      undefined,
      undefined,
      "Melodic Loops - Bebop",
      undefined,
    ]);
    expect(result.map((e) => e.isEnabled())).toEqual([
      false,
      false,
      false,
      true,
    ]);
    expect(result.map((e) => e.isEnabled())).toEqual([
      false,
      false,
      false,
      true,
    ]);
  });

  it("only writes own tags per node", () => {
    const registry = createRegistry("library", [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/swing/track01" }),
    ]);
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz", "Melodic Loops - Jazz");

    const output = collectOutput((stream) => {
      const writer = new JsonDigestWriter(stream);
      writer.writeDigest(registry);
    });
    const reader = new JsonDigestReader(Readable.from([output]));

    const result = collectDigestEntries(reader);

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
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(result.map((e) => e.getSampleType())).toEqual([
      undefined,
      "Melodic Loops - Jazz",
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("reflects isSkipped and isKeepStructure when set", () => {
    const registry = createRegistry("library", [
      createFileEntry({ path: "jazz/track01" }),
    ]);
    registry.setEnabled("jazz", false);
    registry.setEnabled("jazz", true);

    const output = collectOutput((stream) => {
      const writer = new JsonDigestWriter(stream);
      writer.writeDigest(registry);
    });
    const reader = new JsonDigestReader(Readable.from([output]));

    const result = collectDigestEntries(reader);

    const [, entry] = result;
    expect(entry.isEnabled()).toBe(true);
    expect(entry.isEnabled()).toBe(true);
  });

  it("round-trips renamed entries through JSON", () => {
    const registry = createRegistry("library", [
      createFileEntry({ path: "jazz/bebop/track01" }),
    ]);
    registry.setName("jazz/bebop/track01", "Alt Track 01");

    const output = collectOutput((stream) => {
      const writer = new JsonDigestWriter(stream);
      writer.writeDigest(registry);
    });

    const restoredRegistry = createRegistry("library", [
      createFileEntry({ path: "jazz/bebop/track01" }),
    ]);
    restoredRegistry.loadDigest(new JsonDigestReader(Readable.from([output])));

    expect(restoredRegistry.getEntry("jazz/bebop/track01")?.getName()).toBe(
      "Alt Track 01",
    );
  });

  it("round-trips root node changes through JSON", () => {
    const registry = createRegistry("library", []);
    registry.setName("Renamed Library");
    registry.setPackageName("library-pack");

    const output = collectOutput((stream) => {
      const writer = new JsonDigestWriter(stream);
      writer.writeDigest(registry);
    });

    const restoredEmptyRegistry = createRegistry("library", []);
    restoredEmptyRegistry.loadDigest(
      new JsonDigestReader(Readable.from([output])),
    );
    expect(restoredEmptyRegistry.toString()).toBe(
      "Renamed Library [pkg:library-pack, skipped]\n",
    );

    const restoredRegistryWithFiles = createRegistry("library", [
      createFileEntry({ path: "jazz/track01" }),
    ]);
    restoredRegistryWithFiles.loadDigest(
      new JsonDigestReader(Readable.from([output])),
    );
    expect(
      restoredRegistryWithFiles.getEntry("jazz/track01")?.getPackageName(),
    ).toBe("library-pack");
  });

  it("each writeDigest call writes a separate JSON array to the stream", () => {
    const registry1 = createRegistry("library1", [
      createFileEntry({ path: "jazz/track01" }),
    ]);
    registry1.setPackageName("jazz/track01", "jazz-pack");

    const registry2 = createRegistry("library2", [
      createFileEntry({ path: "rock/track01" }),
    ]);
    registry2.setPackageName("rock/track01", "rock-pack");

    const output = collectOutput((stream) => {
      const writer = new JsonDigestWriter(stream);
      writer.writeDigest(registry1);
      writer.writeDigest(registry2);
    });
    const splitIndex = output.indexOf("][") + 1;
    const firstReader = new JsonDigestReader(
      Readable.from([output.slice(0, splitIndex)]),
    );
    const secondReader = new JsonDigestReader(
      Readable.from([output.slice(splitIndex)]),
    );
    const first = collectDigestEntries(firstReader);
    const second = collectDigestEntries(secondReader);
    expect(first.map((e) => e.getPath())).toEqual(["", "jazz", "jazz/track01"]);
    expect(second.map((e) => e.getPath())).toEqual([
      "",
      "rock",
      "rock/track01",
    ]);
  });
});
