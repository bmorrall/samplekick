import type { Validate } from "../types";

interface PathLengthValidatorOptions {
  pathPrefix?: string;
}

export const createPathLengthValidator =
  (maxLength: number, options?: PathLengthValidatorOptions): Validate =>
  (destRelPath) => {
    const prefix = options?.pathPrefix ?? "";
    const totalLength = prefix.length + destRelPath.length;
    if (totalLength <= maxLength) {
      return undefined;
    }
    if (prefix.length > 0) {
      return `path too long: ${prefix.length} + ${destRelPath.length} = ${totalLength} characters (max ${maxLength})`;
    }
    return `path too long: ${destRelPath.length} characters (max ${maxLength})`;
  };
