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
          "path,name,packageName,sampleType,enabled",
          "jazz/bebop/track01,Alt Track 01,jazz-pack,Bebop,false",
          "rock/track01,,,,true",
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
    expect(firstEntry.isEnabled()).toBe(false);
    expect(secondEntry.getPath()).toBe("rock/track01");
    expect(secondEntry.getName()).toBe("track01");
    expect(secondEntry.getPackageName()).toBeUndefined();
    expect(secondEntry.getSampleType()).toBeUndefined();
    expect(secondEntry.isEnabled()).toBe(true);
  });

  it("does not call the callback when there are no data rows", () => {
    const reader = new CsvDigestReader(
      Readable.from(["path,name,packageName,sampleType,enabled"]),
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
        ["path,name,packageName,sampleType,enabled", "jazz/track01,,,,"].join(
          "\n",
        ),
      ]),
    );

    const entries = collectDigestEntries(reader);
    const [entry] = entries;

    expect(entries).toHaveLength(1);
    expect(entry.getPath()).toBe("jazz/track01");
    expect(entry.getName()).toBe("track01");
    expect(entry.getPackageName()).toBeUndefined();
    expect(entry.getSampleType()).toBeUndefined();
    expect(entry.isEnabled()).toBe(false);
  });

  it("uses the path basename as name when the name field is empty", () => {
    const reader = new CsvDigestReader(
      Readable.from([
        ["path,name,packageName,sampleType,enabled", "jazz/track01,,,,"].join(
          "\n",
        ),
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
          "path,name,packageName,sampleType,enabled",
          "jazz/track01,Custom Name,,,",
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
          "path,name,packageName,sampleType,enabled",
          'jazz/track01,"Jazz, Bebop",,,',
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
          "path,name,packageName,sampleType,enabled",
          'jazz/track01,"Jazz ""Bebop"" Track",,,',
        ].join("\n"),
      ]),
    );

    const entries = collectDigestEntries(reader);
    const [entry] = entries;

    expect(entry.getName()).toBe('Jazz "Bebop" Track');
  });

  it("returns false for unrecognised boolean values for enabled", () => {
    const reader = new CsvDigestReader(
      Readable.from([
        [
          "path,name,packageName,sampleType,enabled",
          "jazz/track01,yes,,,",
        ].join("\n"),
      ]),
    );

    const entries = collectDigestEntries(reader);
    const [entry] = entries;

    expect(entry.isEnabled()).toBe(false);
  });

  it("accepts t/f as boolean aliases", () => {
    const reader = new CsvDigestReader(
      Readable.from([
        ["path,name,packageName,sampleType,enabled", "jazz/track01,,,,t"].join(
          "\n",
        ),
      ]),
    );

    const entries = collectDigestEntries(reader);
    const [entry] = entries;

    expect(entry.isEnabled()).toBe(true);
  });

  it("accepts 1/0 as boolean aliases", () => {
    const reader = new CsvDigestReader(
      Readable.from([
        ["path,name,packageName,sampleType,enabled", "jazz/track01,,,,0"].join(
          "\n",
        ),
      ]),
    );

    const entries = collectDigestEntries(reader);
    const [entry] = entries;

    expect(entry.isEnabled()).toBe(false);
  });

  it("throws when the stream yields a non-string chunk", () => {
    const reader = new CsvDigestReader(new NonStringReadable());
    const onEntry = vi.fn<(entry: DigestEntry) => void>();
    const readEntries = (): void => {
      reader.eachDigestEntry(onEntry);
    };

    expect(readEntries).toThrow("Expected string chunk from stream");
  });

  it("throws for unrecognised CSV headers", () => {
    const reader = new CsvDigestReader(
      Readable.from(["path,name,packageName,sampleType"]),
    );

    expect(() => {
      reader.eachDigestEntry(() => {
        // noop
      });
    }).toThrow("Unrecognised CSV header");
  });

  it("skips blank rows between data rows", () => {
    const reader = new CsvDigestReader(
      Readable.from([
        [
          "path,name,packageName,sampleType,enabled",
          "pack/one.wav,,,,true",
          "",
          "pack/two.wav,,,,false",
        ].join("\n"),
      ]),
    );

    const entries = collectDigestEntries(reader);

    expect(entries).toHaveLength(2);
    expect(entries[0]?.getPath()).toBe("pack/one.wav");
    expect(entries[1]?.getPath()).toBe("pack/two.wav");
  });
});
