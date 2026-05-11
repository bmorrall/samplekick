import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

// Matches key tags of the form "<root>[_ ]?<quality>", e.g.:
//   "C Major", "C_major", "Cmajor", "C maj", "F# Minor", "Db_min", "Gsus2", "G_sus4", "gsus2add4", "cdim7", "Fmaj_7"
//   "D min 7 + 9", "Bmin 7+4", "Caug", "G aug7", "Cadd9", "G add11"
// Root: A–G with optional sharp (#) or flat (b) accidental.
// Quality: major/minor/maj/min (optionally followed by [_ ]?\d+ and zero or more [_ ]?+[_ ]?\d+ extensions),
//          sus2/sus4 (optionally followed by add\d+), dim (optionally followed by \d),
//          aug/augmented (optionally followed by \d+), add\d+ (bare, no quality prefix) (case-insensitive).
// Lookbehind (?<![a-zA-Z]) prevents matching note letters inside words (e.g. "grab min").
// Lookahead (?![a-zA-Z]) prevents partial-word matches (e.g. "Cmajority").
const KEY_RE =
  /(?<![a-zA-Z])(?<root>[A-G][#b]?)[_ ]?(?<quality>(?:major|minor|maj|min)(?:[_ ]?\d+)?(?:[_ ]?\+[_ ]?\d+)*|sus[24](?:[_ ]?add\d+)?|dim\d*|augmented\d*|aug\d*|add\d+)(?![a-zA-Z])/giv;

function keyTagReplacer(_match: string, root: string, quality: string): string {
  const normRoot = root[0].toUpperCase() + root.slice(1);
  const q = quality.toLowerCase().replace(/[_ ]/gv, "");
  const normQuality = q
    .replace(/^major/v, "maj")
    .replace(/^minor/v, "min")
    .replace(/^augmented/v, "aug");
  return `${normRoot}${normQuality}`;
}

const normaliseKeyTag: StringTransformer = (name: string): string =>
  name.replace(KEY_RE, keyTagReplacer);

// Matches short minor+number forms with no spaces, e.g. "Cm7", "F#m9", "Bbm11".
// Requires a digit — bare "Cm" is intentionally excluded to avoid false positives.
// Separate regex to keep the match explicit and avoid ambiguity with KEY_RE.
const SHORT_MINOR_RE =
  /(?<![a-zA-Z])(?<root>[A-G][#b]?)m(?<num>\d+)(?![a-zA-Z])/giv;

function shortMinorReplacer(_match: string, root: string, num: string): string {
  return `${root[0].toUpperCase()}${root.slice(1)}min${num}`;
}

const normaliseShortMinor: StringTransformer = (name: string): string =>
  name.replace(SHORT_MINOR_RE, shortMinorReplacer);

// Matches minor-major chords, e.g. "CmMaj7", "F#mMaj", "cmMaj9" (case-insensitive).
// Separate from KEY_RE to keep the "mMaj" pattern explicit.
const MINOR_MAJ_RE =
  /(?<![a-zA-Z])(?<root>[A-G][#b]?)mMaj(?<num>\d*)(?![a-zA-Z])/giv;

function minorMajReplacer(_match: string, root: string, num: string): string {
  return `${root[0].toUpperCase()}${root.slice(1)}minMaj${num}`;
}

const normaliseMinorMaj: StringTransformer = (name: string): string =>
  name.replace(MINOR_MAJ_RE, minorMajReplacer);

// Matches degree symbol ° (diminished) and ø (half-diminished) directly attached to a root
// note, e.g. "C°", "C°7", "Cø", "Cø7". Separate from KEY_RE to keep unicode symbol matching
// explicit and avoid widening the main regex character classes.
const SYMBOL_CHORD_RE =
  /(?<![a-zA-Z])(?<root>[A-G][#b]?)(?<quality>[°ø]\d*)(?![a-zA-Z])/giv;

function symbolChordReplacer(
  _match: string,
  root: string,
  quality: string,
): string {
  const normRoot = root[0].toUpperCase() + root.slice(1);
  const num = quality.slice(1);
  const suffix = quality.startsWith("°") ? "dim" : "hdim";
  return `${normRoot}${suffix}${num}`;
}

const normaliseSymbolChord: StringTransformer = (name: string): string =>
  name.replace(SYMBOL_CHORD_RE, symbolChordReplacer);

const _singleton: Transform = createSanitiseNameTransformer((name) =>
  normaliseMinorMaj(
    normaliseSymbolChord(normaliseShortMinor(normaliseKeyTag(name))),
  ),
);
// NOT supported (intentional omissions):
//   - Bare dominant/number chords: "C7", "Bb9", "F#13" — root + number only, no quality word; too
//     ambiguous (could be a version number, BPM, etc.) and would require its own dedicated regex.
//   - Short-minor without a number: "Cm" — excluded to avoid false positives on words ending in "m".
//     Short-minor WITH a number ("Cm7", "F#m9") is handled via a dedicated SHORT_MINOR_RE pass.
//   - "C+" (aug plus notation) — uncommon and clashes with other uses of + in file names.
//   - "Co" (text diminished shorthand) — "co" is a common substring.
//   - Altered extensions: "C7#11", "C7b9", "C7#5" — sharps/flats on extensions clash with the root
//     accidental syntax and would require a more complex parser.
//   - Power chords: "C5" — indistinguishable from a bare number without wider context.
export const createNormaliseKeyTagTransformer = (): Transform => _singleton;
