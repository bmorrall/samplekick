import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

// Matches key tags of the form "<root>[_ ]?<quality>", e.g.:
//   "C Major", "C_major", "Cmajor", "C maj", "F# Minor", "Db_min", "Gsus2", "G_sus4", "gsus2add4", "cdim7"
// Root: A–G with optional sharp (#) or flat (b) accidental.
// Quality: major, minor, maj, min, sus2/sus4 (optionally followed by add\d+), dim (optionally followed by \d) (case-insensitive).
// Lookbehind (?<![a-zA-Z]) prevents matching note letters inside words (e.g. "grab min").
// Lookahead (?![a-zA-Z]) prevents partial-word matches (e.g. "Cmajority").
const KEY_RE =
  /(?<![a-zA-Z])(?<root>[A-G][#b]?)[_ ]?(?<quality>major|minor|maj|min|sus[24](?:[_ ]?add\d+)?|dim\d*)(?![a-zA-Z])/giv;

function keyTagReplacer(_match: string, root: string, quality: string): string {
  const normRoot = root[0].toUpperCase() + root.slice(1);
  const q = quality.toLowerCase().replace(/[_ ]/gv, "");
  let normQuality: string = q;
  if (q.startsWith("maj")) {
    normQuality = "maj";
  } else if (q.startsWith("min")) {
    normQuality = "min";
  }
  return `${normRoot}${normQuality}`;
}

const normaliseKeyTag: StringTransformer = (name: string): string =>
  name.replace(KEY_RE, keyTagReplacer);

const _singleton: Transform = createSanitiseNameTransformer(normaliseKeyTag);
export const createNormaliseKeyTagTransformer = (): Transform => _singleton;
