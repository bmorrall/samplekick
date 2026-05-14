import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { CsvDigestReader } from "../../../src";
import type { DigestEntry } from "../../../src";
import { collectDigestEntries } from "../../support";

class NonStringReadable extends Readable {
  private hasReturnedValue = false;

  _read(): void {
    void this.hasReturnedValue;
  }

  override setEncoding(): this {
    return this;
  }

  override read(): unknown {
    if (this.hasReturnedValue) return null;
    this.hasReturnedValue = true;
    return 123;
  }
}

describe("CsvDigestReader", () => {
  it("provides one entry per data row", () => {
    const reader = new CsvDigestReader(
      Readable.from([
        [
          "path,keepPath,name,packageName,sampleType,skip",
          "jazz/bebop/track01,true,Alt Track 01,jazz-pack,Bebop,true",
          "rock/track01,false,,,,false",
        ].join("\n"),
      ]),
    );

    const entries = collectDigestEntries(reader);
    expect(entries).toHaveLength(2);

    const [firstEntry, secondEntry] = entries;
    expect(firstEntry.getPath()).toBe("jazz/bebop/track01");
    expect(firstEntry.getName()).toBe("Alt Track 01");
    expect(firstEntry.getPackageName()).toBe("jazz-pack");
    expect(firstEntry.getSampleType()).toBe("Bebop");
    expect(firstEntry.isSkipped()).toBe(true);
    expect(firstEntry.isKeepStructure()).toBe(true);
    expect(secondEntry.getPath()).toBe("rock/track01");
    expect(secondEntry.getName()).toBe("track01");
    expect(secondEntry.getPackageName()).toBeUndefined();
    expect(secondEntry.getSampleType()).toBeUndefined();
    expect(secondEntry.isSkipped()).toBe(false);
    expect(secondEntry.isKeepStructure()).toBe(false);
  });

  it("does not call the callback when there are no data rows", () => {
    const reader = new CsvDigestReader(
      Readable.from(["path,keepPath,name,packageName,sampleType,skip"]),
    );
    const fn = vi.fn<(entry: DigestEntry) => void>();

    reader.eachDigestEntry(fn);

    expect(fn).not.toHaveBeenCalled();
  });

  it("does not call the callback when the file is blank", () => {
    for (const blank of ["", "   ", "\n", "\n\n"]) {
      const reader = new CsvDigestReader(Readable.from([blank]));
      const fn = vi.fn<(entry: DigestEntry) => void>();
      reader.eachDigestEntry(fn);
      expect(fn).not.toHaveBeenCalled();
    }
  });

  it("accepts an entry that only contains a path", () => {
    const reader = new CsvDigestReader(
      Readable.from([
        [
          "path,keepPath,name,packageName,sampleType,skip",
          "jazz/track01,,,,,",
        ].join("\n"),
      ]),
    );

    const entries = collectDigestEntries(reader);
    const [entry] = entries;

    expect(entries).toHaveLength(1);
    expect(entry.getPath()).toBe("jazz/track01");
    expect(entry.getName()).toBe("track01");
    expect(entry.getPackageName()).toBeUndefined();
    expect(entry.getSampleType()).toBeUndefined();
    expect(entry.isSkipped()).toBeUndefined();
    expect(entry.isKeepStructure()).toBeUndefined();
  });

  it("uses the path basename as name when the name field is empty", () => {
    const reader = new CsvDigestReader(
      Readable.from([
        [
          "path,keepPath,name,packageName,sampleType,skip",
          "jazz/track01,,,,,",
        ].join("\n"),
      ]),
    );

    const entries = collectDigestEntries(reader);
    const [entry] = entries;

    expect(entry.getName()).toBe("track01");
  });

  it("reads the name field when it differs from the path basename", () => {
    const reader = new CsvDigestReader(
      Readable.from([
        [
          "path,keepPath,name,packageName,sampleType,skip",
          "jazz/track01,,Custom Name,,,",
        ].join("\n"),
      ]),
    );

    const entries = collectDigestEntries(reader);
    const [entry] = entries;

    expect(entry.getName()).toBe("Custom Name");
  });

  it("handles quoted fields containing commas", () => {
    const reader = new CsvDigestReader(
      Readable.from([
        [
          "path,keepPath,name,packageName,sampleType,skip",
          'jazz/track01,,"Jazz, Bebop",,,',
        ].join("\n"),
      ]),
    );

    const entries = collectDigestEntries(reader);
    const [entry] = entries;

    expect(entry.getName()).toBe("Jazz, Bebop");
  });

  it("handles quoted fields containing escaped double quotes", () => {
    const reader = new CsvDigestReader(
      Readable.from([
        [
          "path,keepPath,name,packageName,sampleType,skip",
          'jazz/track01,,"Jazz ""Bebop"" Track",,,',
        ].join("\n"),
      ]),
    );

    const entries = collectDigestEntries(reader);
    const [entry] = entries;

    expect(entry.getName()).toBe('Jazz "Bebop" Track');
  });

  it("ignores unrecognised boolean values for skipped and keep", () => {
    const reader = new CsvDigestReader(
      Readable.from([
        [
          "path,keepPath,name,packageName,sampleType,skip",
          "jazz/track01,yes,,,,,",
        ].join("\n"),
      ]),
    );

    const entries = collectDigestEntries(reader);
    const [entry] = entries;

    expect(entry.isSkipped()).toBeUndefined();
    expect(entry.isKeepStructure()).toBeUndefined();
  });

  it("accepts t/f as boolean aliases", () => {
    const reader = new CsvDigestReader(
      Readable.from([
        [
          "path,keepPath,name,packageName,sampleType,skip",
          "jazz/track01,f,,,,t",
        ].join("\n"),
      ]),
    );

    const entries = collectDigestEntries(reader);
    const [entry] = entries;

    expect(entry.isSkipped()).toBe(true);
    expect(entry.isKeepStructure()).toBe(false);
  });

  it("accepts 1/0 as boolean aliases", () => {
    const reader = new CsvDigestReader(
      Readable.from([
        [
          "path,keepPath,name,packageName,sampleType,skip",
          "jazz/track01,0,,,,1",
        ].join("\n"),
      ]),
    );

    const entries = collectDigestEntries(reader);
    const [entry] = entries;

    expect(entry.isSkipped()).toBe(true);
    expect(entry.isKeepStructure()).toBe(false);
  });

  it("throws when the stream yields a non-string chunk", () => {
    const reader = new CsvDigestReader(new NonStringReadable());
    const onEntry = vi.fn<(entry: DigestEntry) => void>();
    const readEntries = (): void => {
      reader.eachDigestEntry(onEntry);
    };

    expect(readEntries).toThrow("Expected string chunk from stream");
  });
});
