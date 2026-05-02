import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { CsvConfigWriter } from "../../../src";
import { createConfigSource, createConfigEntry, createRegistry } from "../../support";
import type { ConfigSource } from "../../../src";

const captureOutput = (
  writer: CsvConfigWriter,
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

describe("CsvConfigWriter", () => {
  it("writes a header-only CSV when the data source has no entries", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new CsvConfigWriter(stream);

    expect(captureOutput(writer, createConfigSource([]), stream)).toBe(
      "path,name,packageName,sampleType,skip,keepPath",
    );
  });

  it("serializes each entry field to CSV", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new CsvConfigWriter(stream);
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
    const lines = output.split("\n");

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("path,name,packageName,sampleType,skip,keepPath");
    expect(lines[1]).toBe("jazz/bebop/track01,Alt Track 01,jazz-pack,Bebop,true,true");
    expect(lines[2]).toBe("rock/track01,,,,,");
  });

  it("omits the name override when it matches the path basename", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new CsvConfigWriter(stream);
    const configSource = createConfigSource([
      createConfigEntry({ path: "jazz/bebop/track01", name: "track01" }),
    ]);

    const output = captureOutput(writer, configSource, stream);
    const lines = output.split("\n");

    expect(lines[1]).toBe("jazz/bebop/track01,,,,,");
  });

  it("quotes fields that contain commas", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new CsvConfigWriter(stream);
    const configSource = createConfigSource([
      createConfigEntry({ path: "jazz/track01", name: "Jazz, Bebop" }),
    ]);

    const output = captureOutput(writer, configSource, stream);
    const lines = output.split("\n");

    expect(lines[1]).toBe('jazz/track01,"Jazz, Bebop",,,,');
  });

  it("quotes fields that contain double quotes", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new CsvConfigWriter(stream);
    const configSource = createConfigSource([
      createConfigEntry({ path: "jazz/track01", name: 'Jazz "Bebop" Track' }),
    ]);

    const output = captureOutput(writer, configSource, stream);
    const lines = output.split("\n");

    expect(lines[1]).toBe('jazz/track01,"Jazz ""Bebop"" Track",,,,');
  });

  it("serializes the root node for a registry even without overrides", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new CsvConfigWriter(stream);
    const registry = createRegistry("library", []);

    const output = captureOutput(writer, registry, stream);
    const lines = output.split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(",library,,,,");
  });

  it("serializes root node changes when present on a registry", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new CsvConfigWriter(stream);
    const registry = createRegistry("library", []);
    registry.setName("Renamed Library");
    registry.setPackageName("library-pack");

    const output = captureOutput(writer, registry, stream);
    const lines = output.split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(",Renamed Library,library-pack,,,");
  });
});
