import type { Transform, TransformEntry } from '../types';
import { lookupPrefix, lookupStandalone, ONE_SHOT_LABELS, isKnownTypeFolderName } from './folder_lookup';

// e.g. "Drum Loops & MIDI" → "Drum Loops", "Drum Loops & Stems" → "Drum Loops".
const STRIP_SUFFIX_RE = / (?:&|and) (?:midi|stems?)$/v;
// e.g. "Drum Loops Collection" → "Drum Loops", "Hihat Bundle" → "Hihat".
const STRIP_NOISE_SUFFIX_RE = /\s+(?:collection|bundle|pack|set|library)s?$/iv;
const stripIgnoredSuffix = (nameLower: string): string =>
  nameLower.replace(STRIP_SUFFIX_RE, '').replace(STRIP_NOISE_SUFFIX_RE, '');

// Keys that prefer a subcategory type over their standalone type when under a known-type parent.
// e.g. "808s" under "Drums" → "Drums - 808s" rather than the bare "808s".
const SUBCATEGORY_PREFERRED_KEYS = new Set(['808', '808s', '909', '909s']);
const DASH_SEP = ' - ';

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

function findAncestorLoopsContext(entry: TransformEntry): 'loops' | 'one shots' | undefined {
  let ancestor = entry.getParentNode();
  while (ancestor !== undefined) {
    const ancestorName = ancestor.getName().toLowerCase();
    if (ancestorName === 'loops') return 'loops';
    if (isOneShotLabel(ancestorName)) return 'one shots';
    ancestor = ancestor.getParentNode();
  }
  return undefined;
}

function setFromPrefixedName(entry: TransformEntry, nameLower: string): boolean {
  if (nameLower.endsWith(' loops')) {
    const prefix = lookupPrefix(nameLower.slice(0, -' loops'.length));
    if (prefix !== undefined) { entry.setSampleType(`${prefix} Loops`); return true; }
  }
  const suffix = ONE_SHOT_LABELS.map((l) => ` ${l}`).find((s) => nameLower.endsWith(s));
  if (suffix !== undefined) {
    const prefix = lookupPrefix(nameLower.slice(0, -suffix.length));
    if (prefix !== undefined) { entry.setSampleType(`${prefix} One Shots`); return true; }
  }
  return false;
}

function setFromAncestorContext(entry: TransformEntry, nameLower: string): boolean {
  const isLoops = nameLower === 'loops';
  const isOneShot = !isLoops && isOneShotLabel(nameLower);
  if (isLoops || isOneShot) {
    const label = isLoops ? 'Loops' : 'One Shots';
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
    if (parentSampleType !== undefined && isKnownTypeFolderName(parentSampleType)) return false;
  }
  const context = findAncestorLoopsContext(entry);
  if (context !== undefined) {
    const prefix = lookupPrefix(nameLower);
    if (prefix !== undefined) {
      entry.setSampleType(`${prefix} ${context === 'loops' ? 'Loops' : 'One Shots'}`);
      return true;
    }
  }
  entry.setSampleType(sampleType);
  return true;
}

function resolveStandaloneType(nameLower: string): string | undefined {
  const standalone = lookupStandalone(nameLower);
  if (standalone !== undefined) return standalone;
  if (nameLower.endsWith(' loops')) {
    const prefix = lookupPrefix(nameLower.slice(0, -' loops'.length));
    if (prefix !== undefined) return `${prefix} Loops`;
  }
  const suffix = ONE_SHOT_LABELS.map((l) => ` ${l}`).find((s) => nameLower.endsWith(s));
  if (suffix !== undefined) {
    const prefix = lookupPrefix(nameLower.slice(0, -suffix.length));
    if (prefix !== undefined) return `${prefix} One Shots`;
  }
  return undefined;
}

function setFromDashSeparatedName(entry: TransformEntry, nameLower: string): boolean {
  if (!nameLower.includes(DASH_SEP)) return false;
  const sepIdx = nameLower.indexOf(DASH_SEP);
  const prefixType = resolveStandaloneType(nameLower.slice(0, sepIdx));
  if (prefixType === undefined) return false;
  const suffix = entry.getName().slice(sepIdx + DASH_SEP.length);
  entry.setSampleType(`${prefixType} - ${suffix}`);
  return true;
}

function setFromCompound(entry: TransformEntry, nameLower: string): void {
  const sep = nameLower.includes(' and ') ? ' and ' : nameLower.includes(' & ') ? ' & ' : undefined;
  if (sep === undefined) return;
  const resolved = nameLower.split(sep).map(lookupStandalone);
  if (resolved.every((r): r is string => r !== undefined)) {
    entry.setSampleType(resolved.join(' and '));
  }
}

/**
 * DirectorySampleTypeTransformer
 * Detects directories whose names match a known sampleType keyword
 * (case-insensitive) and sets the sampleType on that directory.
 * Accepts both singular and plural forms (e.g. "Drum" and "Drums" both map to "Drums").
 */
export const createDirectorySampleTypeTransformer: Transform = (source) => {
  source.eachTransformEntry((entry) => {
    if (entry.getOwnSampleType() !== undefined) return;
    if (entry.getChildNodes().length === 0) return;

    const nameLower = stripIgnoredSuffix(entry.getName().toLowerCase());
    if (setFromPrefixedName(entry, nameLower)) return;
    if (setFromDashSeparatedName(entry, nameLower)) return;
    if (setFromAncestorContext(entry, nameLower)) return;
    if (setFromStandalone(entry, nameLower)) return;
    setFromCompound(entry, nameLower);
  });
};
