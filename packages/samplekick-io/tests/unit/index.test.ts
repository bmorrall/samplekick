import { describe, expect, test } from "vitest";
import * as api from "../../src";

describe("index exports", () => {
  test("exports Registry", () => {
    expect(api.Registry).toBeDefined();
  });

  test("exports JsonConfigWriter", () => {
    expect(api.JsonConfigWriter).toBeDefined();
  });

  test("exports JsonConfigReader", () => {
    expect(api.JsonConfigReader).toBeDefined();
  });

  test("exports DefaultPackageNameTransformer", () => {
    expect(api.DefaultPackageNameTransformer).toBeDefined();
  });

  test("exports AbletonProjectTransformer", () => {
    expect(api.AbletonProjectTransformer).toBeDefined();
  });

  test("exports KnownFileTypeTransformer", () => {
    expect(api.KnownFileTypeTransformer).toBeDefined();
  });

  test("exports SP404Mk2NameTransformer", () => {
    expect(api.SP404Mk2NameTransformer).toBeDefined();
  });

  test("exports SkipJunkTransformer", () => {
    expect(api.SkipJunkTransformer).toBeDefined();
  });

  test("exports ZipDataSource", () => {
    expect(api.ZipDataSource).toBeDefined();
  });

  test("exports SourcePathStrategy", () => {
    expect(api.SourcePathStrategy).toBeDefined();
  });

  test("exports OrganisedPathStrategy", () => {
    expect(api.OrganisedPathStrategy).toBeDefined();
  });

  test("only exposes runtime exports from the public index", () => {
    expect(Object.keys(api)).toEqual([
      "Registry",
      "JsonConfigWriter",
      "JsonConfigReader",
      "CsvConfigWriter",
      "CsvConfigReader",
      "ZipDataSource",
      "AbletonProjectTransformer",
      "DefaultPackageNameTransformer",
      "KnownFileTypeTransformer",
      "SkipJunkTransformer",
      "SP404Mk2NameTransformer",
      "SourcePathStrategy",
      "OrganisedPathStrategy",
      "SP404Mk2Preset",
      "BIT_DEPTH_16",
      "BIT_DEPTH_24",
      "BIT_DEPTH_32",
      "SAMPLE_RATE_44100",
      "SAMPLE_RATE_48000",
      "SAMPLE_RATE_96000",
      "formatSampleRate",
      "formatBitDepth",
      "PathResult",
      "SkipResult",
    ]);
  });
});
