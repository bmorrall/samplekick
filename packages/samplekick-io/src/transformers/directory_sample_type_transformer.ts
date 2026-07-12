import type { Transform, TransformEntry } from "../types";
import {
  lookupPrefix,
  lookupStandalone,
  LOOP_LABELS,
  ONE_SHOT_LABELS,
  SHOT_LABELS,
  isKnownTypeFolderName,
  stripIgnoredSuffix,
} from "./folder_lookup";

// Keys that prefer a subcategory type over their standalone type when under a known-type parent.
// e.g. "808s" under "Drums" → "Drums - 808s" rather than the bare "808s".
const SUBCATEGORY_PREFERRED_KEYS = new Set(["808", "808s", "909", "909s"]);
const DASH_SEP = " - ";

const isLoopLabel = (name: string): boolean =>
  (LOOP_LABELS as readonly string[]).includes(name);
const isOneShotLabel = (name: string): boolean =>
  (ONE_SHOT_LABELS as readonly string[]).includes(name);

function findAncestorPrefix(entry: TransformEntry): string | undefined {
  let ancestor = entry.getParentNode();
  while (ancestor !== undefined) {
    const prefix = lookupPrefix(ancestor.getName().toLowerCase());
    if (prefix !== undefined) return prefix;
    ancestor = ancestor.getParentNode();
  }
  return undefined;
}

function findAncestorLoopsContext(
  entry: TransformEntry,
): "loops" | "one shots" | undefined {
  let ancestor = entry.getParentNode();
  while (ancestor !== undefined) {
    const ancestorName = ancestor.getName().toLowerCase();
    if (isLoopLabel(ancestorName)) return "loops";
    if (isOneShotLabel(ancestorName)) return "one shots";
    ancestor = ancestor.getParentNode();
  }
  return undefined;
}

function setFromPrefixedName(
  entry: TransformEntry,
  nameLower: string,
): boolean {
  const loopSuffix = LOOP_LABELS.map((l) => ` ${l}`).find((s) =>
    nameLower.endsWith(s),
  );
  if (loopSuffix !== undefined) {
    const prefix = lookupPrefix(nameLower.slice(0, -loopSuffix.length));
    if (prefix !== undefined) {
      entry.setSampleType(`${prefix} Loops`);
      return true;
    }
    if (!hasKnownAncestorType(entry) && !nameLower.includes(DASH_SEP)) {
      entry.setSampleType("Loops");
      return true;
    }
  }
  const suffix = ONE_SHOT_LABELS.map((l) => ` ${l}`).find((s) =>
    nameLower.endsWith(s),
  );
  if (suffix !== undefined) {
    const prefix = lookupPrefix(nameLower.slice(0, -suffix.length));
    if (prefix !== undefined) {
      entry.setSampleType(`${prefix} One Shots`);
      return true;
    }
    if (!hasKnownAncestorType(entry) && !nameLower.includes(DASH_SEP)) {
      entry.setSampleType("One Shots");
      return true;
    }
  }
  const shotSuffix = SHOT_LABELS.map((l) => ` ${l}`).find((s) =>
    nameLower.endsWith(s),
  );
  if (shotSuffix !== undefined) {
    const standalone = lookupStandalone(nameLower.slice(0, -shotSuffix.length));
    if (standalone !== undefined) {
      entry.setSampleType(standalone);
      return true;
    }
  }
  return false;
}

function setFromAncestorContext(
  entry: TransformEntry,
  nameLower: string,
): boolean {
  const isLoops = isLoopLabel(nameLower);
  const isOneShot = !isLoops && isOneShotLabel(nameLower);
  if (isLoops || isOneShot) {
    const label = isLoops ? "Loops" : "One Shots";
    const prefix = findAncestorPrefix(entry);
    entry.setSampleType(prefix === undefined ? label : `${prefix} ${label}`);
    return true;
  }
  return false;
}

function setFromStandalone(entry: TransformEntry, nameLower: string): boolean {
  const sampleType = lookupStandalone(nameLower);
  if (sampleType === undefined) return false;
  if (SUBCATEGORY_PREFERRED_KEYS.has(nameLower)) {
    const parentSampleType = entry.getParentNode()?.getSampleType();
    if (
      parentSampleType !== undefined &&
      isKnownTypeFolderName(parentSampleType)
    ) {
      return false;
    }
  }
  const context = findAncestorLoopsContext(entry);
  if (context !== undefined) {
    const prefix = lookupPrefix(nameLower);
    if (prefix !== undefined) {
      entry.setSampleType(
        `${prefix} ${context === "loops" ? "Loops" : "One Shots"}`,
      );
      return true;
    }
  }
  entry.setSampleType(sampleType);
  return true;
}

// Compound-tail fallback: when a " & "/" and "-joined name has only its last segment as a
// known standalone type (and no preceding segment is also known), return that type.
// e.g. "Sci-Fi Horror FX & Foley" → "Foley" (preceding "sci-fi horror fx" is not in the lookup).
// Avoids simplifying when multiple parts are known, e.g. "FX & Foley" has "fx" → "Sound FX" as well.
function resolveCompoundTailType(nameLower: string): string | undefined {
  const compoundSep = nameLower.includes(" & ")
    ? " & "
    : nameLower.includes(" and ")
      ? " and "
      : undefined;
  if (compoundSep === undefined) return undefined;
  const parts = nameLower.split(compoundSep);
  const lastPart = parts.pop();
  if (lastPart === undefined) return undefined;
  const lastType = lookupStandalone(lastPart);
  if (
    lastType !== undefined &&
    parts.every((p) => lookupStandalone(p) === undefined)
  ) {
    return lastType;
  }
  return undefined;
}

function resolveStandaloneType(nameLower: string): string | undefined {
  const standalone = lookupStandalone(nameLower);
  if (standalone !== undefined) return standalone;
  const loopSuffix = LOOP_LABELS.map((l) => ` ${l}`).find((s) =>
    nameLower.endsWith(s),
  );
  if (loopSuffix !== undefined) {
    const prefix = lookupPrefix(nameLower.slice(0, -loopSuffix.length));
    if (prefix !== undefined) return `${prefix} Loops`;
  }
  const suffix = ONE_SHOT_LABELS.map((l) => ` ${l}`).find((s) =>
    nameLower.endsWith(s),
  );
  if (suffix !== undefined) {
    const prefix = lookupPrefix(nameLower.slice(0, -suffix.length));
    if (prefix !== undefined) return `${prefix} One Shots`;
  }
  return resolveCompoundTailType(nameLower);
}

function setFromDashSeparatedName(
  entry: TransformEntry,
  nameLower: string,
): boolean {
  if (!nameLower.includes(DASH_SEP)) return false;
  const sepIdx = nameLower.indexOf(DASH_SEP);
  const prefixType = resolveStandaloneType(nameLower.slice(0, sepIdx));
  if (prefixType === undefined) return false;
  const suffixLower = nameLower.slice(sepIdx + DASH_SEP.length);
  const resolvedSuffix = resolveStandaloneType(suffixLower);
  const rawSuffix = entry.getName().slice(sepIdx + DASH_SEP.length);
  const suffix = resolvedSuffix ?? rawSuffix.slice(0, suffixLower.length);
  entry.setSampleType(`${prefixType} - ${suffix}`);
  return true;
}

function setFromCompound(entry: TransformEntry, nameLower: string): boolean {
  const sep = nameLower.includes(" and ")
    ? " and "
    : nameLower.includes(" & ")
      ? " & "
      : undefined;
  if (sep === undefined) return false;
  const resolved = nameLower.split(sep).map(lookupStandalone);
  if (resolved.every((r): r is string => r !== undefined)) {
    entry.setSampleType(resolved.join(" and "));
    return true;
  }
  return false;
}

// Final fallback: split by ' - ' and set sampleType if exactly one segment matches
// a known folder type. Handles brand-prefixed directories, e.g. "Brand - Drums" → "Drums".
function hasKnownAncestorType(entry: TransformEntry): boolean {
  return entry.getParentNode()?.getSampleType() !== undefined;
}

function setFromUniqueDashSegment(
  entry: TransformEntry,
  nameLower: string,
): void {
  if (!nameLower.includes(DASH_SEP)) return;
  const parts = nameLower.split(DASH_SEP);
  const matches = parts
    .map(resolveStandaloneType)
    .filter((t): t is string => t !== undefined);
  if (matches.length !== 1) return;
  const [sampleType] = matches;
  entry.setSampleType(sampleType);
}

// If stripping changed the name to a pure loop/one-shot label (e.g. "Loop Stems & MIDI" → "loop"),
// only tag as Loops/One Shots when no ancestor already has a known sampleType.
function setFromStrippedLoopLabel(
  entry: TransformEntry,
  originalNameLower: string,
  nameLower: string,
): boolean {
  if (nameLower === originalNameLower) return false;
  const isLoop = isLoopLabel(nameLower);
  if (!isLoop && !isOneShotLabel(nameLower)) return false;
  if (!hasKnownAncestorType(entry)) {
    entry.setSampleType(isLoop ? "Loops" : "One Shots");
  }
  return true;
}

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (entry.getOwnSampleType() !== undefined) return;
      if (entry.getChildNodes().length === 0) return;

      const originalNameLower = entry.getName().toLowerCase();
      const nameLower = stripIgnoredSuffix(originalNameLower);
      if (setFromPrefixedName(entry, nameLower)) return;
      if (setFromDashSeparatedName(entry, nameLower)) return;
      if (setFromStrippedLoopLabel(entry, originalNameLower, nameLower)) return;
      if (setFromAncestorContext(entry, nameLower)) return;
      if (setFromStandalone(entry, nameLower)) return;
      if (setFromCompound(entry, nameLower)) return;
      setFromUniqueDashSegment(entry, nameLower);
    });
  },
};
/**
 * DirectorySampleTypeTransformer
 * Detects directories whose names match a known sampleType keyword
 * (case-insensitive) and sets the sampleType on that directory.
 * Accepts both singular and plural forms (e.g. "Drum" and "Drums" both map to "Drums").
 */
export const createDirectorySampleTypeTransformer = (): Transform => _singleton;
