import type { Transform } from "../types";

const SAMPLE_TYPE_VOCALS_ACAPELLAS = "Vocals - Acapellas";

const ACAPELLA_NAMES = new Set([
  "acapella",
  "acapellas",
  "acapellas and vocals",
  "acapellas & vocals",
  "vocals and acapellas",
  "vocals & acapellas",
]);

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (entry.getOwnSampleType() !== undefined) return;
      if (entry.getChildNodes().length === 0) return;
      if (!ACAPELLA_NAMES.has(entry.getName().toLowerCase())) return;
      entry.setSampleType(SAMPLE_TYPE_VOCALS_ACAPELLAS);
    });
  },
};

/**
 * AcapellaTransformer
 * Detects directories named "Acapella(s)" or "Acapellas and Vocals" (and
 * common variants) and sets their sampleType to "Vocals - Acapellas".
 * Case-insensitive. Does not overwrite an existing sampleType.
 */
export const createAcapellaTransformer = (): Transform => _singleton;
