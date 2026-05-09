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

  test("exports createDefaultRootPackageNameTransformer", () => {
    expect(api.createDefaultRootPackageNameTransformer).toBeDefined();
  });

  test("exports createAbletonProjectTransformer", () => {
    expect(api.createAbletonProjectTransformer).toBeDefined();
  });

  test("exports createFLStudioProjectTransformer", () => {
    expect(api.createFLStudioProjectTransformer).toBeDefined();
  });

  test("exports createGhosthackNameTransformer", () => {
    expect(api.createGhosthackNameTransformer).toBeDefined();
  });

  test("exports createSquashNameTransformer", () => {
    expect(api.createSquashNameTransformer).toBeDefined();
  });

  test("exports createKnownFileTypeTransformer", () => {
    expect(api.createKnownFileTypeTransformer).toBeDefined();
  });

  test("exports createNormaliseBracketSpacingTransformer", () => {
    expect(api.createNormaliseBracketSpacingTransformer).toBeDefined();
  });

  test("exports createNormaliseCommaSpacingTransformer", () => {
    expect(api.createNormaliseCommaSpacingTransformer).toBeDefined();
  });

  test("exports createExpandRootPackageNameTransformer", () => {
    expect(api.createExpandRootPackageNameTransformer).toBeDefined();
  });

  test("exports createNormaliseHyphenSpacingTransformer", () => {
    expect(api.createNormaliseHyphenSpacingTransformer).toBeDefined();
  });

  test("exports createNormaliseDashesTransformer", () => {
    expect(api.createNormaliseDashesTransformer).toBeDefined();
  });

  test("exports createNormaliseBpmTagTransformer", () => {
    expect(api.createNormaliseBpmTagTransformer).toBeDefined();
  });

  test("exports createNormaliseKeyTagTransformer", () => {
    expect(api.createNormaliseKeyTagTransformer).toBeDefined();
  });

  test("exports createNormaliseSpacesTransformer", () => {
    expect(api.createNormaliseSpacesTransformer).toBeDefined();
  });

  test("exports createTrimNameTransformer", () => {
    expect(api.createTrimNameTransformer).toBeDefined();
  });

  test("exports createNormaliseQuotesTransformer", () => {
    expect(api.createNormaliseQuotesTransformer).toBeDefined();
  });

  test("exports createTruncateNameTransformer", () => {
    expect(api.createTruncateNameTransformer).toBeDefined();
  });

  test("exports createStripAccentsTransform", () => {
    expect(api.createStripAccentsTransform).toBeDefined();
  });

  test("exports createAllowedCharactersTransform", () => {
    expect(api.createAllowedCharactersTransform).toBeDefined();
  });

  test("exports createDirectoryChildNameTransformer", () => {
    expect(api.createDirectoryChildNameTransformer).toBeDefined();
  });

  test("exports createDirectorySampleTypeTransformer", () => {
    expect(api.createDirectorySampleTypeTransformer).toBeDefined();
  });

  test("exports createDirectorySegmentSuffixTransformer", () => {
    expect(api.createDirectorySegmentSuffixTransformer).toBeDefined();
  });

  test("exports createDirectorySubcategoryTransformer", () => {
    expect(api.createDirectorySubcategoryTransformer).toBeDefined();
  });

  test("exports createDrumSubcategoryTransformer", () => {
    expect(api.createDrumSubcategoryTransformer).toBeDefined();
  });

  test("exports createFlatPackPrefixTransformer", () => {
    expect(api.createFlatPackPrefixTransformer).toBeDefined();
  });

  test("exports createSkipJunkTransformer", () => {
    expect(api.createSkipJunkTransformer).toBeDefined();
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

  test("exports createPathLengthValidator", () => {
    expect(api.createPathLengthValidator).toBeDefined();
  });

  test("only exposes runtime exports from the public index", () => {
    expect(Object.keys(api)).toEqual([
      "Registry",
      "JsonConfigWriter",
      "JsonConfigReader",
      "CsvConfigWriter",
      "CsvConfigReader",
      "ZipDataSource",
      "createAbletonProjectTransformer",
      "createDefaultRootPackageNameTransformer",
      "createDirectoryChildNameTransformer",
      "createDirectorySampleTypeTransformer",
      "createDirectorySegmentSuffixTransformer",
      "createDirectorySubcategoryTransformer",
      "createDrumSubcategoryTransformer",
      "createExpandRootPackageNameTransformer",
      "createFLStudioProjectTransformer",
      "createKnownFileTypeTransformer",
      "createNormaliseBracketSpacingTransformer",
      "createNormaliseCommaSpacingTransformer",
      "createNormaliseHyphenSpacingTransformer",
      "createNormaliseDashesTransformer",
      "createNormaliseBpmTagTransformer",
      "createNormaliseKeyTagTransformer",
      "createNormaliseSpacesTransformer",
      "createSkipJunkTransformer",
      "createStripAccentsTransform",
      "createAllowedCharactersTransform",
      "createTrimNameTransformer",
      "createNormaliseQuotesTransformer",
      "createTruncateNameTransformer",
      "createFlatPackPrefixTransformer",
      "createGhosthackNameTransformer",
      "createSquashNameTransformer",
      "SourcePathStrategy",
      "OrganisedPathStrategy",
      "createPathLengthValidator",
      "SP404Mk2Preset",
      "DirtywaveM8Preset",
      "BIT_DEPTH_16",
      "BIT_DEPTH_24",
      "BIT_DEPTH_32",
      "SAMPLE_RATE_44100",
      "SAMPLE_RATE_48000",
      "SAMPLE_RATE_96000",
      "formatSampleRate",
      "formatBitDepth",
      "AUDIO_EXTENSIONS",
      "PathResult",
      "SkipResult",
    ]);
  });
});
