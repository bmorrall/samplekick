import type {
  ConfigSource,
  ValidationError,
  ValidationResult,
  Validator,
} from "./types";

export class SimpleValidator implements Validator {
  validate(configSource: ConfigSource): ValidationResult {
    const errors: ValidationError[] = [];
    configSource.eachConfigEntry((entry) => {
      if (entry.getPath() === "") {
        return; // skip root entry
      }

      if (entry.getPackageName() === undefined) {
        errors.push({ path: entry.getPath(), message: "Missing packageName" });
      }
      if (entry.getSampleType() === undefined) {
        errors.push({ path: entry.getPath(), message: "Missing sampleType" });
      }
    });
    const valid = errors.length === 0;
    return { valid, errors };
  }
}
