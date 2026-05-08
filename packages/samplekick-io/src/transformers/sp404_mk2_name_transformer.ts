import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const digitZeroCodePoint = 48;
const digitNineCodePoint = 57;
const uppercaseACodePoint = 65;
const uppercaseZCodePoint = 90;
const lowercaseACodePoint = 97;
const lowercaseZCodePoint = 122;

const allowedPunctuation = new Set([
  " ",
  "-",
  "_",
  "!",
  "&",
  "(",
  ")",
  "+",
  ",",
  "=",
  "@",
  "[",
  "]",
  "{",
  "}",
  "'",
]);

const isAllowedCharacter = (character: string): boolean => {
  const codePoint = character.codePointAt(0);
  /* v8 ignore next 3 */
  if (codePoint === undefined) {
    return false;
  }

  const isDigit =
    codePoint >= digitZeroCodePoint && codePoint <= digitNineCodePoint;
  const isUppercaseLetter =
    codePoint >= uppercaseACodePoint && codePoint <= uppercaseZCodePoint;
  const isLowercaseLetter =
    codePoint >= lowercaseACodePoint && codePoint <= lowercaseZCodePoint;

  return (
    isDigit ||
    isUppercaseLetter ||
    isLowercaseLetter ||
    allowedPunctuation.has(character)
  );
};

const normalizeAccents = (name: string): string =>
  name.normalize("NFD").replaceAll(/[\u0300-\u036f]/gv, "");

const normalizeQuotes = (name: string): string =>
  name
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'")
    .replaceAll("\u201C", '"')
    .replaceAll("\u201D", '"');

const sp404Mk2StringTransformer: StringTransformer = (name: string): string => {
  const normalizedName = normalizeQuotes(normalizeAccents(name));
  const finalDotIndex = normalizedName.lastIndexOf(".");
  let sanitizedName = "";

  let index = 0;
  for (const character of normalizedName) {
    const isFinalDot = index === finalDotIndex;
    sanitizedName +=
      isFinalDot || isAllowedCharacter(character) ? character : "_";
    index += 1;
  }

  return sanitizedName;
};

export const SP404Mk2NameTransformer: Transform = createSanitiseNameTransformer(sp404Mk2StringTransformer);
