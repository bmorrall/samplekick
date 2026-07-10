import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { finished } from "node:stream/promises";
import {
  CsvDigestWriter,
  createAbletonProjectTransformer,
  createAcapellaTransformer,
  createArchiveFileTransformer,
  createBrandPrefixTransformer,
  createCymaticsNameTransformer,
  createDefaultRootPackageNameTransformer,
  createDefaultRootSampleTypeTransformer,
  createConstructionKitTransformer,
  createDirectoryChildNameTransformer,
  createDirectorySampleTypeTransformer,
  createDirectorySegmentSuffixTransformer,
  createDirectorySubcategoryTransformer,
  createDrumSubcategoryTransformer,
  createExpandRootPackageNameTransformer,
  createFlatPackPrefixTransformer,
  createFLStudioProjectTransformer,
  createGhosthackNameTransformer,
  createInfoFileTransformer,
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

/** Saves the current registry digest to the auto-config CSV path in dataDir. */
export async function saveDigest(
  registry: Registry,
  dataDir: string,
): Promise<void> {
  const savePath = join(dataDir, `${registry.getFingerprint()}.csv`);
  await mkdir(dirname(savePath), { recursive: true });
  const stream = createWriteStream(savePath);
  new CsvDigestWriter(stream).writeDigest(registry);
  await finished(stream);
}

export interface AnalysisPipelineOptions {
  /** Skip OS metadata and hidden files. Default: false (junk is filtered by default). */
  allowJunk?: boolean;
  /** Tag ancestor directories as package names using the ' - ' heuristic. Default: false */
  multiPack?: boolean;
}

/** Applies the full analysis transform pipeline to a Registry. */
export function applyAnalysisPipeline(
  registry: Registry,
  options: AnalysisPipelineOptions = {},
): void {
  const { allowJunk = false, multiPack = false } = options;

  if (!allowJunk) {
    registry.applyTransform(createSkipJunkTransformer());
  }

  if (multiPack) {
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
  registry.applyTransform(createConstructionKitTransformer());
  registry.applyTransform(createFlatPackPrefixTransformer());

  registry.applyTransform(createMidiFileTransformer());

  // Info file transforms: disable documentation files not needed in exports
  registry.applyTransform(createInfoFileTransformer());

  registry.applyTransform(createDefaultRootSampleTypeTransformer());
}
