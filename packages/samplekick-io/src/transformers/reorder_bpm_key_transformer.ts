import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

// Reorders canonical BPM-before-key sequences to key-before-BPM, e.g.:
//   "120bpm_Amin"  → "Amin_120bpm"
//   "120bpm Cmaj7" → "Cmaj7 120bpm"
//   "99bpmF#min"   → "F#min99bpm"
//
// Only matches already-normalised tokens: NNNbpm (produced by NormaliseBpmTagTransformer)
// followed by a canonical key token (produced by NormaliseKeyTagTransformer). This transformer
// must therefore run after both of those transforms in the pipeline.
//
// A separator ([_ ] — space or underscore) is required between the two tokens and is preserved.
//
// Quality alternation order: minMaj must precede min to prevent "min" consuming the prefix of "minMaj7".
const REORDER_RE =
  /(?<!\d)(?<bpm>\d{2,3}bpm)(?<sep>[_ ])(?<key>[A-G][#b]?(?:maj\d*(?:\+\d+)*|minMaj\d*|min\d*(?:\+\d+)*|sus[24](?:add\d+)?|hdim\d*|dim\d*|aug\d*|add\d+))(?![a-zA-Z\d])/gv;

function reorderReplacer(
  _match: string,
  bpm: string,
  sep: string,
  key: string,
): string {
  return `${key}${sep}${bpm}`;
}

const reorderBpmKey: StringTransformer = (name: string): string =>
  name.replace(REORDER_RE, reorderReplacer);

const _singleton: Transform = createSanitiseNameTransformer(reorderBpmKey);
export const createReorderBpmKeyTransformer = (): Transform => _singleton;
