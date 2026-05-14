import type { Transform, TransformEntry } from "../types";

const BRAND_NAMES = ["Ghosthack", "Cymatics"] as const;

function getParentBrandName(entry: TransformEntry): string | undefined {
  const parentPackageName = entry.getParentNode()?.getPackageName();
  if (parentPackageName === undefined) return undefined;
  return BRAND_NAMES.find((brand) => parentPackageName.startsWith(brand));
}

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (entry.getChildNodes().length === 0) return;

      const brand = getParentBrandName(entry);
      if (brand === undefined) return;

      const ownPackageName = entry.getOwnPackageName();
      if (ownPackageName !== undefined && !ownPackageName.startsWith(brand)) {
        entry.setPackageName(`${brand} - ${ownPackageName}`);
      }
    });
  },
};

/**
 * BrandPrefixTransformer
 * When a parent directory has a packageName starting with "Ghosthack -" or "Cymatics -",
 * this transformer prefixes child directories' packageNames with that brand prefix.
 * This ensures multi-pack hierarchies preserve brand attribution through the tree.
 */
export const createBrandPrefixTransformer = (): Transform => _singleton;
