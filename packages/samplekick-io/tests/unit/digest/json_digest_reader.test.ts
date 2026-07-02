import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { JsonDigestReader } from "../../../src";
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

describe("JsonDigestReader", () => {
  it("provides one entry per serialized object", () => {
    const reader = new JsonDigestReader(
      Readable.from([
        JSON.stringify([
          {
            path: "jazz/bebop/track01",
            name: "Alt Track 01",
            packageName: "jazz-pack",
            sampleType: "Bebop",
            enabled: false,
          },
          {
            path: "rock/track01",
            packageName: undefined,
            sampleType: undefined,
            enabled: true,
          },
        ]),
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

  it("does not call the callback when the serialized array is empty", () => {
    const reader = new JsonDigestReader(Readable.from(["[]"]));
    const fn = vi.fn<(entry: DigestEntry) => void>();

    reader.eachDigestEntry(fn);

    expect(fn).not.toHaveBeenCalled();
  });

  it("throws when the JSON payload is not an array", () => {
    const reader = new JsonDigestReader(
      Readable.from(['{"path":"jazz/track01"}']),
    );
    const onEntry = vi.fn<(entry: DigestEntry) => void>();
    const readEntries = (): void => {
      reader.eachDigestEntry(onEntry);
    };

    expect(readEntries).toThrow("Expected a JSON array of entries");
  });

  it("ignores invalid optional values when an entry has a valid path", () => {
    const reader = new JsonDigestReader(
      Readable.from([
        '[{"path":"jazz/track01","packageName":123,"sampleType":false,"enabled":"yes"}]',
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

  it("accepts an entry that only contains a path", () => {
    const reader = new JsonDigestReader(
      Readable.from(['[{"path":"jazz/track01"}]']),
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

  it("ignores an invalid name value and falls back to the path basename", () => {
    const reader = new JsonDigestReader(
      Readable.from(['[{"path":"jazz/track01","name":123}]']),
    );

    const entries = collectDigestEntries(reader);
    const [entry] = entries;

    expect(entries).toHaveLength(1);
    expect(entry.getName()).toBe("track01");
  });

  it("throws when an entry does not include a valid path", () => {
    const reader = new JsonDigestReader(
      Readable.from([
        '[{"path":123,"isSkipped":false,"isKeepStructure":false}]',
      ]),
    );
    const onEntry = vi.fn<(entry: DigestEntry) => void>();
    const readEntries = (): void => {
      reader.eachDigestEntry(onEntry);
    };

    expect(readEntries).toThrow("Expected each JSON entry to include a path");
  });

  it("throws when one of the entries is an empty object", () => {
    const reader = new JsonDigestReader(
      Readable.from(['[{"path":"jazz/track01"},{}]']),
    );
    const onEntry = vi.fn<(entry: DigestEntry) => void>();
    const readEntries = (): void => {
      reader.eachDigestEntry(onEntry);
    };

    expect(readEntries).toThrow("Expected each JSON entry to include a path");
  });

  it("throws when the stream yields a non-string chunk", () => {
    const reader = new JsonDigestReader(new NonStringReadable());
    const onEntry = vi.fn<(entry: DigestEntry) => void>();
    const readEntries = (): void => {
      reader.eachDigestEntry(onEntry);
    };

    expect(readEntries).toThrow("Expected string chunk from stream");
  });
});
