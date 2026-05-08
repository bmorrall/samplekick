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

const sp404Mk2StringTransformer: StringTransformer = (name: string): string => {
  const finalDotIndex = name.lastIndexOf(".");
  let sanitizedName = "";

  let index = 0;
  for (const character of name) {
    const isFinalDot = index === finalDotIndex;
    sanitizedName +=
      isFinalDot || isAllowedCharacter(character) ? character : "_";
    index += 1;
  }

  return sanitizedName;
};

export const createAllowedCharactersTransform : Transform = createSanitiseNameTransformer(sp404Mk2StringTransformer);
