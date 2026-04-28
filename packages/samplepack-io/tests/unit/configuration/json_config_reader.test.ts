import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { JsonConfigReader } from "../../../src";
import type { ConfigEntry } from "../../../src";
import { collectConfigEntries } from "../../support";

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

describe("JsonConfigReader", () => {
  it("provides one entry per serialized object", () => {
    const reader = new JsonConfigReader(
      Readable.from([
        JSON.stringify([
          {
            path: "jazz/bebop/track01",
            name: "Alt Track 01",
            packageName: "jazz-pack",
            sampleType: "Bebop",
            isSkipped: true,
            isKeepStructure: true,
          },
          {
            path: "rock/track01",
            packageName: undefined,
            sampleType: undefined,
            isSkipped: false,
            isKeepStructure: false,
          },
        ]),
      ]),
    );

    const entries = collectConfigEntries(reader);
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

  it("does not call the callback when the serialized array is empty", () => {
    const reader = new JsonConfigReader(Readable.from(["[]"]));
    const fn = vi.fn<(entry: ConfigEntry) => void>();

    reader.eachConfigEntry(fn);

    expect(fn).not.toHaveBeenCalled();
  });

  it("throws when the JSON payload is not an array", () => {
    const reader = new JsonConfigReader(
      Readable.from(['{"path":"jazz/track01"}']),
    );
    const onEntry = vi.fn<(entry: ConfigEntry) => void>();
    const readEntries = (): void => {
      reader.eachConfigEntry(onEntry);
    };

    expect(readEntries).toThrow("Expected a JSON array of entries");
  });

  it("ignores invalid optional values when an entry has a valid path", () => {
    const reader = new JsonConfigReader(
      Readable.from([
        '[{"path":"jazz/track01","packageName":123,"sampleType":false,"isSkipped":"yes","isKeepStructure":1}]',
      ]),
    );

    const entries = collectConfigEntries(reader);
    const [entry] = entries;

    expect(entries).toHaveLength(1);
    expect(entry.getPath()).toBe("jazz/track01");
    expect(entry.getName()).toBe("track01");
    expect(entry.getPackageName()).toBeUndefined();
    expect(entry.getSampleType()).toBeUndefined();
    expect(entry.isSkipped()).toBeUndefined();
    expect(entry.isKeepStructure()).toBeUndefined();
  });

  it("accepts an entry that only contains a path", () => {
    const reader = new JsonConfigReader(
      Readable.from(['[{"path":"jazz/track01"}]']),
    );

    const entries = collectConfigEntries(reader);
    const [entry] = entries;

    expect(entries).toHaveLength(1);
    expect(entry.getPath()).toBe("jazz/track01");
    expect(entry.getName()).toBe("track01");
    expect(entry.getPackageName()).toBeUndefined();
    expect(entry.getSampleType()).toBeUndefined();
    expect(entry.isSkipped()).toBeUndefined();
    expect(entry.isKeepStructure()).toBeUndefined();
  });

  it("ignores an invalid name value and falls back to the path basename", () => {
    const reader = new JsonConfigReader(
      Readable.from(['[{"path":"jazz/track01","name":123}]']),
    );

    const entries = collectConfigEntries(reader);
    const [entry] = entries;

    expect(entries).toHaveLength(1);
    expect(entry.getName()).toBe("track01");
  });

  it("throws when an entry does not include a valid path", () => {
    const reader = new JsonConfigReader(
      Readable.from([
        '[{"path":123,"isSkipped":false,"isKeepStructure":false}]',
      ]),
    );
    const onEntry = vi.fn<(entry: ConfigEntry) => void>();
    const readEntries = (): void => {
      reader.eachConfigEntry(onEntry);
    };

    expect(readEntries).toThrow("Expected each JSON entry to include a path");
  });

  it("throws when one of the entries is an empty object", () => {
    const reader = new JsonConfigReader(
      Readable.from(['[{"path":"jazz/track01"},{}]']),
    );
    const onEntry = vi.fn<(entry: ConfigEntry) => void>();
    const readEntries = (): void => {
      reader.eachConfigEntry(onEntry);
    };

    expect(readEntries).toThrow("Expected each JSON entry to include a path");
  });

  it("throws when the stream yields a non-string chunk", () => {
    const reader = new JsonConfigReader(new NonStringReadable());
    const onEntry = vi.fn<(entry: ConfigEntry) => void>();
    const readEntries = (): void => {
      reader.eachConfigEntry(onEntry);
    };

    expect(readEntries).toThrow("Expected string chunk from stream");
  });
});
