import type { Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const notFoundIndex = -1;

const truncateName = (name: string, maxLength: number): string => {
  if (name.length <= maxLength) {
    return name;
  }

  const finalDotIndex = name.lastIndexOf(".");
  if (finalDotIndex === notFoundIndex) {
    return name.slice(0, maxLength);
  }

  const extension = name.slice(finalDotIndex);
  if (extension.length >= maxLength) {
    return name.slice(0, maxLength);
  }

  const basenameMaxLength = maxLength - extension.length;
  return `${name.slice(0, basenameMaxLength)}${extension}`;
};

export const createTruncateNameTransformer = (maxLength: number): Transform =>
  createSanitiseNameTransformer((name) => truncateName(name, maxLength));
