import type { Validate } from "../types";

export const createPathLengthValidator = (maxLength: number): Validate =>
  (destRelPath) => {
    if (destRelPath.length <= maxLength) {
      return undefined;
    }
    return `path too long: ${destRelPath.length} characters (max ${maxLength})`;
  };
