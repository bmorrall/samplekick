import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { CsvConfigWriter } from "../../../src";
import {
  createConfigSource,
  createConfigEntry,
  createRegistry,
} from "../../support";
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
      "path,keepPath,name,packageName,sampleType,skip",
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
    expect(lines[0]).toBe("path,keepPath,name,packageName,sampleType,skip");
    expect(lines[1]).toBe(
      "jazz/bebop/track01,true,Alt Track 01,jazz-pack,Bebop,true",
    );
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

    expect(lines[1]).toBe('jazz/track01,,"Jazz, Bebop",,,');
  });

  it("quotes fields that contain double quotes", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new CsvConfigWriter(stream);
    const configSource = createConfigSource([
      createConfigEntry({ path: "jazz/track01", name: 'Jazz "Bebop" Track' }),
    ]);

    const output = captureOutput(writer, configSource, stream);
    const lines = output.split("\n");

    expect(lines[1]).toBe('jazz/track01,,"Jazz ""Bebop"" Track",,,');
  });

  it("serializes the root node for a registry even without overrides", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new CsvConfigWriter(stream);
    const registry = createRegistry("library", []);

    const output = captureOutput(writer, registry, stream);
    const lines = output.split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(",,library,,,");
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
    expect(lines[1]).toBe(",,Renamed Library,library-pack,,");
  });
});

describe("CsvConfigWriter { explicit: true }", () => {
  it("writes all fields explicitly, including name matching basename and false for unset booleans", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new CsvConfigWriter(stream, { explicit: true });
    const configSource = createConfigSource([
      createConfigEntry({ path: "jazz/bebop/track01", name: "track01" }),
      createConfigEntry({
        path: "jazz/bebop/track02",
        name: "Alt Track",
        packageName: "jazz-pack",
        sampleType: "Bebop",
      }),
    ]);

    const output = captureOutput(writer, configSource, stream);
    const lines = output.split("\n");

    expect(lines[1]).toBe("jazz/bebop/track01,false,track01,,,false");
    expect(lines[2]).toBe(
      "jazz/bebop/track02,false,Alt Track,jazz-pack,Bebop,false",
    );
  });

  it("still omits the name column and boolean defaults when not in explicit mode", () => {
    const stream = new PassThrough({ encoding: "utf8" });
    const writer = new CsvConfigWriter(stream);
    const configSource = createConfigSource([
      createConfigEntry({ path: "jazz/bebop/track01", name: "track01" }),
    ]);

    const output = captureOutput(writer, configSource, stream);
    const lines = output.split("\n");

    expect(lines[1]).toBe("jazz/bebop/track01,,,,,");
  });
});
