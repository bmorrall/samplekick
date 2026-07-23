const MIN_PREFIX_LENGTH = 2;

function isSeparatorChar(ch: string | undefined): boolean {
  return ch === " " || ch === "_" || ch === "-";
}

/** Space, underscore, and hyphen are treated as interchangeable word separators. */
function charsMatch(a: string, b: string): boolean {
  return a === b || (isSeparatorChar(a) && isSeparatorChar(b));
}

/**
 * Compares `a` and `b` position-by-position and returns the shared prefix,
 * normalising any matched separator position to a space.
 */
function matchAndNormalize(a: string, b: string): string {
  const maxLength = Math.min(a.length, b.length);
  let result = "";
  for (let i = 0; i < maxLength; i += 1) {
    const { [i]: charA = "" } = a;
    const { [i]: charB = "" } = b;
    if (!charsMatch(charA, charB)) break;
    result += isSeparatorChar(charA) && isSeparatorChar(charB) ? " " : charA;
  }
  return result;
}

/**
 * Returns the longest string prefix shared by every string in the array.
 * Space, underscore, and hyphen are treated as interchangeable separators: a
 * matched separator position is normalised to a space in the returned
 * prefix, e.g. "SH_Braam_Attention_F.wav" and "SH Braam Erratic Cry A.wav"
 * share the prefix "SH Braam ".
 */
export function longestCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return "";
  const [first, ...rest] = strings;
  let prefix = first;
  for (const s of rest) {
    prefix = matchAndNormalize(prefix, s);
    if (prefix.length === 0) return "";
  }
  return prefix;
}

/**
 * Checks whether `name` starts with `prefix`, treating space, underscore,
 * and hyphen as interchangeable at each position. Use this instead of
 * `startsWith` when stripping a prefix computed by `longestCommonPrefix`,
 * since the individual source string may use a different separator
 * character than the (possibly normalised) prefix at a given position.
 */
export function prefixMatches(name: string, prefix: string): boolean {
  if (name.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i += 1) {
    const { [i]: prefixChar = "" } = prefix;
    const { [i]: nameChar = "" } = name;
    if (!charsMatch(prefixChar, nameChar)) return false;
  }
  return true;
}

/**
 * Trims a prefix back to the last space, underscore, or hyphen so it doesn't
 * end mid-word. Returns undefined if no such boundary exists or the trimmed
 * prefix is shorter than `MIN_PREFIX_LENGTH`.
 */
export function trimToWordBoundary(prefix: string): string | undefined {
  for (let i = prefix.length - 1; i >= 0; i -= 1) {
    const { [i]: ch } = prefix;
    if (isSeparatorChar(ch)) {
      const trimmed = prefix.slice(0, i + 1);
      if (trimmed.length >= MIN_PREFIX_LENGTH) return trimmed;
      return undefined;
    }
  }
  return undefined;
}
