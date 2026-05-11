import type { Validate } from "../types";
import { SAMPLE_TYPE_PACKS } from "../sample_types";

const _noPacksValidator: Validate = (_destRelPath, entry) => {
  if (entry.getSampleType() === SAMPLE_TYPE_PACKS) {
    return `entry is categorised as '${SAMPLE_TYPE_PACKS}'`;
  }
  return undefined;
};

export const createNoPacksValidator = (): Validate => _noPacksValidator;
