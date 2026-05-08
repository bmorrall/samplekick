import type { ConfigEntry, Validator } from "../types";

export class PathLengthValidator implements Validator {
  constructor(private readonly maxLength: number) {}

  validate(destRelPath: string, _entry: ConfigEntry): string | undefined {
    if (destRelPath.length <= this.maxLength) {
      return undefined;
    }
    return `path too long: ${destRelPath.length} characters (max ${this.maxLength})`;
  }
}
