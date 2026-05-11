import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

// Matches BPM tags in either order: "120 BPM", "120BPM", "120_BPM",
// "BPM 120", "BPM120", "BPM_120", "Bpm120", etc.
// [_ ]? allows an optional single space or underscore between number and label.
// {2,3} restricts to 2–3 digit values (10–999). Lookbehind/lookahead prevent
// matching digits that are part of a longer number (e.g. 44100BPM).
const BPM_RE =
  /(?<!\d)(?<numBefore>\d{2,3})[_ ]?bpm|bpm[_ ]?(?<numAfter>\d{2,3})(?!\d)/giv;

function bpmReplacer(
  _match: string,
  numBefore: string | undefined,
  numAfter: string | undefined,
): string {
  const raw = numBefore ?? numAfter ?? "0";
  const num = parseInt(raw, 10).toString();
  return `${num}bpm`;
}

const normaliseBpmTag: StringTransformer = (name: string): string =>
  name.replace(BPM_RE, bpmReplacer);

const _singleton: Transform = createSanitiseNameTransformer(normaliseBpmTag);
export const createNormaliseBpmTagTransformer = (): Transform => _singleton;
