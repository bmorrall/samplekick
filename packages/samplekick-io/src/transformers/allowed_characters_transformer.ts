import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const digitZeroCodePoint = 48;
const digitNineCodePoint = 57;
const uppercaseACodePoint = 65;
const uppercaseZCodePoint = 90;
const lowercaseACodePoint = 97;
const lowercaseZCodePoint = 122;

const isAllowedCharacter = (
  character: string,
  punctuation: Set<string>,
): boolean => {
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
    punctuation.has(character)
  );
};

const createAllowedCharactersStringTransformer =
  (punctuation: Set<string>): StringTransformer =>
  (name: string): string => {
    const finalDotIndex = name.lastIndexOf(".");
    let sanitizedName = "";

    let index = 0;
    for (const character of name) {
      const isFinalDot = index === finalDotIndex;
      sanitizedName +=
        isFinalDot || isAllowedCharacter(character, punctuation)
          ? character
          : "_";
      index += 1;
    }

    return sanitizedName;
  };

export const createAllowedCharactersTransform = (
  punctuation: Set<string>,
): Transform =>
  createSanitiseNameTransformer(
    createAllowedCharactersStringTransformer(punctuation),
  );
