import type { Transform } from "../types";

const digitZeroCodePoint = 48;
const digitNineCodePoint = 57;
const uppercaseACodePoint = 65;
const uppercaseZCodePoint = 90;
const lowercaseACodePoint = 97;
const lowercaseZCodePoint = 122;
const maxNameLength = 80;
const notFoundIndex = -1;

const allowedPunctuation = new Set([
  " ",
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

const truncateSP404Mk2Name = (name: string): string => {
  if (name.length <= maxNameLength) {
    return name;
  }

  const finalDotIndex = name.lastIndexOf(".");
  if (finalDotIndex === notFoundIndex) {
    return name.slice(0, maxNameLength);
  }

  const extension = name.slice(finalDotIndex);
  if (extension.length >= maxNameLength) {
    return name.slice(0, maxNameLength);
  }

  const basenameMaxLength = maxNameLength - extension.length;
  return `${name.slice(0, basenameMaxLength)}${extension}`;
};

const sanitizeSP404Mk2Name = (name: string): string => {
  const normalizedName = normalizeAccents(name);
  const finalDotIndex = normalizedName.lastIndexOf(".");
  let sanitizedName = "";

  let index = 0;
  for (const character of normalizedName) {
    const isFinalDot = index === finalDotIndex;
    sanitizedName +=
      isFinalDot || isAllowedCharacter(character) ? character : "_";
    index += 1;
  }

  return truncateSP404Mk2Name(sanitizedName);
};

export const SP404Mk2NameTransformer: Transform = (source) => {
  source.eachTransformEntry((entry) => {
    entry.setName(sanitizeSP404Mk2Name(entry.getName()));
  });
};
