import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

// Reorders canonical BPM-before-key sequences to key-before-BPM, e.g.:
//   "120bpm_Amin"       → "Amin_120bpm"
//   "120bpm Cmaj7"      → "Cmaj7 120bpm"
//   "150bpm - D#min"    → "D#min 150bpm"  (' - ' collapses to a space)
//   "150bpm_-_D#min"   → "D#min_150bpm"  ('_-_' collapses to an underscore)
//
// A second pass strips hyphen separators from already-correct key-before-BPM sequences:
//   "Cmaj - 120bpm"     → "Cmaj 120bpm"
//   "Amin_-_120bpm"     → "Amin_120bpm"
//
// Only matches already-normalised tokens: NNNbpm (produced by NormaliseBpmTagTransformer)
// followed/preceded by a canonical key token (produced by NormaliseKeyTagTransformer). This
// transformer must therefore run after both of those transforms in the pipeline.
//
// A separator is required between the two tokens. Space and underscore are preserved as-is.
// " - " and "_-_" (hyphen-spaced forms produced by NormaliseHyphenSpacingTransformer) are
// normalised to a single space or underscore respectively.
// Both hyphen forms are listed first in the alternation so they take precedence over the
// single-character branches.
//
// Quality alternation order: minMaj must precede min to prevent "min" consuming the prefix of "minMaj7".
const REORDER_RE =
  /(?<!\d)(?<bpm>\d{2,3}bpm)(?<sep> - |_-_|[_ ])(?<key>[A-G][#b]?(?:maj\d*(?:\+\d+)*|minMaj\d*|min\d*(?:\+\d+)*|sus[24](?:add\d+)?|hdim\d*|dim\d*|aug\d*|add\d+))(?![a-zA-Z\d])/gv;

const HYPHEN_SEP = " - ";
const HYPHEN_USCORE_SEP = "_-_";

function reorderReplacer(
  _match: string,
  bpm: string,
  sep: string,
  key: string,
): string {
  const outSep =
    sep === HYPHEN_SEP ? " " : sep === HYPHEN_USCORE_SEP ? "_" : sep;
  return `${key}${outSep}${bpm}`;
}

const reorderBpmKey: StringTransformer = (name: string): string =>
  name.replace(REORDER_RE, reorderReplacer);

// Second pass: strip hyphen separator when key already precedes BPM.
// Matches the same canonical key and BPM tokens as REORDER_RE, but in the correct order,
// with only the hyphen separators ( - , _-_) as targets — plain space/underscore are fine as-is.
const STRIP_HYPHEN_SEP_RE =
  /(?<![a-zA-Z\d])(?<key>[A-G][#b]?(?:maj\d*(?:\+\d+)*|minMaj\d*|min\d*(?:\+\d+)*|sus[24](?:add\d+)?|hdim\d*|dim\d*|aug\d*|add\d+))(?<sep> - |_-_)(?<bpm>\d{2,3}bpm)(?!\d)/gv;

function stripHyphenSepReplacer(
  _match: string,
  key: string,
  sep: string,
  bpm: string,
): string {
  const outSep = sep === HYPHEN_USCORE_SEP ? "_" : " ";
  return `${key}${outSep}${bpm}`;
}

const stripHyphenSep: StringTransformer = (name: string): string =>
  name.replace(STRIP_HYPHEN_SEP_RE, stripHyphenSepReplacer);

const _singleton: Transform = createSanitiseNameTransformer((name) =>
  stripHyphenSep(reorderBpmKey(name)),
);
export const createReorderBpmKeyTransformer = (): Transform => _singleton;
