import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { JsonConfigWriter, Registry } from "../../../src";
import { createConfigSource, createConfigEntry } from "../../support";
import type { ConfigSource } from "../../../src";

const captureOutput = (
  writer: JsonConfigWriter,
  configSource: ConfigSource,
  stream: PassThrough,
): string => {
  const chunks: string[] = [];

  stream.on("data", (chunk: string) => {
    chunks.push(chunk);
  });

  writer.writeConfig(configSource);

  return chunks.join("");
};

describe("JsonConfigWriter", () => {
  it("writes an empty JSON array when the data source has no entries", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new JsonConfigWriter(stream);

    expect(captureOutput(writer, createConfigSource([]), stream)).toBe("[]");
  });

  it("serializes each entry field to JSON", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new JsonConfigWriter(stream);
    const configSource = createConfigSource([
      createConfigEntry({
        path: "jazz/bebop/track01",
        name: "Alt Track 01",
        packageName: "jazz-pack",
        sampleType: "Bebop",
        skipped: true,
        keepStructure: true,
      }),
      createConfigEntry({
        path: "rock/track01",
      }),
    ]);

    const output = captureOutput(writer, configSource, stream);

    expect(JSON.parse(output)).toEqual([
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
        name: undefined,
        packageName: undefined,
        sampleType: undefined,
        isSkipped: undefined,
        isKeepStructure: undefined,
      },
    ]);
  });

  it("omits the name override when it matches the path basename", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new JsonConfigWriter(stream);
    const configSource = createConfigSource([
      createConfigEntry({ path: "jazz/bebop/track01", name: "track01" }),
    ]);

    const output = captureOutput(writer, configSource, stream);

    expect(JSON.parse(output)).toEqual([
      {
        path: "jazz/bebop/track01",
        name: undefined,
        packageName: undefined,
        sampleType: undefined,
        isSkipped: undefined,
        isKeepStructure: undefined,
      },
    ]);
  });

  it("serializes the root node for a registry even without overrides", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new JsonConfigWriter(stream);
    const registry = new Registry("library");

    const output = captureOutput(writer, registry, stream);

    expect(JSON.parse(output)).toEqual([
      {
        path: "",
        name: "library",
      },
    ]);
  });

  it("serializes root node changes when present on a registry", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new JsonConfigWriter(stream);
    const registry = new Registry("library");
    registry.setName("Renamed Library");
    registry.setPackageName("library-pack");

    const output = captureOutput(writer, registry, stream);

    expect(JSON.parse(output)).toEqual([
      {
        path: "",
        name: "Renamed Library",
        packageName: "library-pack"
      },
    ]);
  });
});
