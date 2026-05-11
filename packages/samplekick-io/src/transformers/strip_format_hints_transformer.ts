import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const FORMAT_HINT_PATTERN = "WAV|AIFF-C|AIFF|MP3|FLAC|OGG|OPUS";
const BIT_DEPTH_HINT_PATTERN = "24-bit|16-bit|32-bit|24bit|16bit|32bit";
const SAMPLE_RATE_HINT_PATTERN = "44\\.1kHz|44100Hz|48kHz|48000Hz|96kHz|192kHz";
const ALL_HINT_PATTERN = `${FORMAT_HINT_PATTERN}|${BIT_DEPTH_HINT_PATTERN}|${SAMPLE_RATE_HINT_PATTERN}`;

// Matches a format/quality hint enclosed in (), [], or {} — e.g. "(WAV)", "[24bit]"
const BRACKETED_HINT_RE = new RegExp(
  `\\s*[\\(\\[\\{]\\s*(?:${ALL_HINT_PATTERN})\\s*[\\)\\]\\}]`,
  "giv",
);
// Matches a format/quality hint as a hyphen-separated suffix — e.g. " - 44.1kHz" at end of string
const HYPHEN_SUFFIX_RE = new RegExp(`\\s+-\\s+(?:${ALL_HINT_PATTERN})$`, "giv");

const stripFormatHints: StringTransformer = (name: string): string =>
  name
    .replaceAll(BRACKETED_HINT_RE, "")
    .replaceAll(HYPHEN_SUFFIX_RE, "")
    .trim();

const _singleton: Transform = createSanitiseNameTransformer(stripFormatHints);
export const createStripFormatHintsTransformer = (): Transform => _singleton;
