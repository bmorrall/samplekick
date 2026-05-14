import { describe, expect, test } from "vitest";
import * as api from "../../src";

describe("index exports", () => {
  test("exports Registry", () => {
    expect(api.Registry).toBeDefined();
  });

  test("exports JsonDigestWriter", () => {
    expect(api.JsonDigestWriter).toBeDefined();
  });

  test("exports JsonDigestReader", () => {
    expect(api.JsonDigestReader).toBeDefined();
  });

  test("exports createDefaultRootPackageNameTransformer", () => {
    expect(api.createDefaultRootPackageNameTransformer).toBeDefined();
  });

  test("exports createDefaultRootSampleTypeTransformer", () => {
    expect(api.createDefaultRootSampleTypeTransformer).toBeDefined();
  });

  test("exports createAbletonProjectTransformer", () => {
    expect(api.createAbletonProjectTransformer).toBeDefined();
  });

  test("exports createAcapellaTransformer", () => {
    expect(api.createAcapellaTransformer).toBeDefined();
  });

  test("exports createArchiveFileTransformer", () => {
    expect(api.createArchiveFileTransformer).toBeDefined();
  });

  test("exports createFLStudioProjectTransformer", () => {
    expect(api.createFLStudioProjectTransformer).toBeDefined();
  });

  test("exports createSP404Mk2ProjectTransformer", () => {
    expect(api.createSP404Mk2ProjectTransformer).toBeDefined();
  });

  test("exports createGhosthackNameTransformer", () => {
    expect(api.createGhosthackNameTransformer).toBeDefined();
  });

  test("exports createSquashNameTransformer", () => {
    expect(api.createSquashNameTransformer).toBeDefined();
  });

  test("exports createStripFormatHintsTransformer", () => {
    expect(api.createStripFormatHintsTransformer).toBeDefined();
  });

  test("exports createKeepParentsTransformer", () => {
    expect(api.createKeepParentsTransformer).toBeDefined();
  });

  test("exports createMultiPackNameTransformer", () => {
    expect(api.createMultiPackNameTransformer).toBeDefined();
  });

  test("exports createBrandPrefixTransformer", () => {
    expect(api.createBrandPrefixTransformer).toBeDefined();
  });

  test("exports createKnownFileTypeTransformer", () => {
    expect(api.createKnownFileTypeTransformer).toBeDefined();
  });

  test("exports createMidiFileTransformer", () => {
    expect(api.createMidiFileTransformer).toBeDefined();
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

  test("exports createReorderBpmKeyTransformer", () => {
    expect(api.createReorderBpmKeyTransformer).toBeDefined();
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

  test("exports createCymaticsNameTransformer", () => {
    expect(api.createCymaticsNameTransformer).toBeDefined();
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

  test("exports createNoPacksValidator", () => {
    expect(api.createNoPacksValidator).toBeDefined();
  });

  test("exports SAMPLE_TYPE_PACKS", () => {
    expect(api.SAMPLE_TYPE_PACKS).toBe("Packs");
  });

  test("exports SAMPLE_TYPE_LOOPS", () => {
    expect(api.SAMPLE_TYPE_LOOPS).toBe("Loops");
  });

  test("exports SAMPLE_TYPE_ONE_SHOTS", () => {
    expect(api.SAMPLE_TYPE_ONE_SHOTS).toBe("One Shots");
  });

  test("only exposes runtime exports from the public index", () => {
    expect(Object.keys(api)).toEqual([
      "Registry",
      "JsonDigestWriter",
      "JsonDigestReader",
      "CsvDigestWriter",
      "CsvDigestReader",
      "ZipDataSource",
      "createAbletonProjectTransformer",
      "createArchiveFileTransformer",
      "createDefaultRootPackageNameTransformer",
      "createDefaultRootSampleTypeTransformer",
      "createDirectoryChildNameTransformer",
      "createDirectorySampleTypeTransformer",
      "createAcapellaTransformer",
      "createDirectorySegmentSuffixTransformer",
      "createDirectorySubcategoryTransformer",
      "createDrumSubcategoryTransformer",
      "createExpandRootPackageNameTransformer",
      "createFLStudioProjectTransformer",
      "createSP404Mk2ProjectTransformer",
      "createKnownFileTypeTransformer",
      "createMidiFileTransformer",
      "createNormaliseBracketSpacingTransformer",
      "createNormaliseCommaSpacingTransformer",
      "createNormaliseHyphenSpacingTransformer",
      "createNormaliseDashesTransformer",
      "createNormaliseBpmTagTransformer",
      "createNormaliseKeyTagTransformer",
      "createReorderBpmKeyTransformer",
      "createNormaliseSpacesTransformer",
      "createSkipJunkTransformer",
      "createStripAccentsTransform",
      "createAllowedCharactersTransform",
      "createTrimNameTransformer",
      "createNormaliseQuotesTransformer",
      "createTruncateNameTransformer",
      "createFlatPackPrefixTransformer",
      "createCymaticsNameTransformer",
      "createGhosthackNameTransformer",
      "createSquashNameTransformer",
      "createStripFormatHintsTransformer",
      "createKeepParentsTransformer",
      "createMultiPackNameTransformer",
      "createBrandPrefixTransformer",
      "SourcePathStrategy",
      "OrganisedPathStrategy",
      "createPathLengthValidator",
      "createNoPacksValidator",
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
      "SAMPLE_TYPE_PACKS",
      "SAMPLE_TYPE_LOOPS",
      "SAMPLE_TYPE_ONE_SHOTS",
      "PathResult",
      "SkipResult",
    ]);
  });
});
