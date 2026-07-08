import {
  createAbletonProjectTransformer,
  createAcapellaTransformer,
  createArchiveFileTransformer,
  createBrandPrefixTransformer,
  createCymaticsNameTransformer,
  createDefaultRootPackageNameTransformer,
  createDefaultRootSampleTypeTransformer,
  createDirectoryChildNameTransformer,
  createDirectorySampleTypeTransformer,
  createDirectorySegmentSuffixTransformer,
  createDirectorySubcategoryTransformer,
  createDrumSubcategoryTransformer,
  createExpandRootPackageNameTransformer,
  createFlatPackPrefixTransformer,
  createFLStudioProjectTransformer,
  createGhosthackNameTransformer,
  createKnownFileTypeTransformer,
  createMidiFileTransformer,
  createMultiPackNameTransformer,
  createNormaliseBpmTagTransformer,
  createNormaliseBracketSpacingTransformer,
  createNormaliseCommaSpacingTransformer,
  createNormaliseDashesTransformer,
  createNormaliseHyphenSpacingTransformer,
  createNormaliseKeyTagTransformer,
  createNormaliseQuotesTransformer,
  createNormaliseSpacesTransformer,
  createReorderBpmKeyTransformer,
  createSkipJunkTransformer,
  createSP404Mk2ProjectTransformer,
  createStripFormatHintsTransformer,
  createTrimNameTransformer,
} from "samplekick-io";
import type { Registry } from "samplekick-io";

export { loadDigest, getDataDir } from "./digest_loader.js";

export interface AnalysisPipelineOptions {
  multiPack: boolean;
}

/** Applies the full analysis transform pipeline to a Registry. */
export function applyAnalysisPipeline(
  registry: Registry,
  options: AnalysisPipelineOptions,
): void {
  registry.applyTransform(createSkipJunkTransformer());

  if (options.multiPack) {
    registry.applyTransform(createMultiPackNameTransformer());
    registry.applyTransform(createBrandPrefixTransformer());
  }

  registry.applyTransform(createDefaultRootPackageNameTransformer());
  registry.applyTransform(createExpandRootPackageNameTransformer());

  registry.applyTransform(createTrimNameTransformer());
  registry.applyTransform(createNormaliseQuotesTransformer());
  registry.applyTransform(createNormaliseDashesTransformer());

  registry.applyTransform(
    createKnownFileTypeTransformer({ tagSampleType: true }),
  );
  registry.applyTransform(
    createArchiveFileTransformer({ tagSampleType: true }),
  );
  registry.applyTransform(
    createAbletonProjectTransformer({ tagSampleType: true }),
  );
  registry.applyTransform(
    createFLStudioProjectTransformer({ tagSampleType: true }),
  );
  registry.applyTransform(
    createSP404Mk2ProjectTransformer({ tagSampleType: true }),
  );

  registry.applyTransform(createGhosthackNameTransformer());
  registry.applyTransform(createCymaticsNameTransformer());
  registry.applyTransform(createNormaliseSpacesTransformer());
  registry.applyTransform(createNormaliseBracketSpacingTransformer());
  registry.applyTransform(createNormaliseCommaSpacingTransformer());
  registry.applyTransform(createNormaliseHyphenSpacingTransformer());
  registry.applyTransform(createStripFormatHintsTransformer());

  registry.applyTransform(createNormaliseBpmTagTransformer());
  registry.applyTransform(createNormaliseKeyTagTransformer());
  registry.applyTransform(createReorderBpmKeyTransformer());

  registry.applyTransform(createDrumSubcategoryTransformer());
  registry.applyTransform(createDirectorySampleTypeTransformer());
  registry.applyTransform(createAcapellaTransformer());
  registry.applyTransform(createDirectoryChildNameTransformer());
  registry.applyTransform(createDirectorySubcategoryTransformer());
  registry.applyTransform(createDirectorySegmentSuffixTransformer());
  registry.applyTransform(createFlatPackPrefixTransformer());

  registry.applyTransform(createMidiFileTransformer());

  registry.applyTransform(createDefaultRootSampleTypeTransformer());
}
