import type { Transform, TransformEntry } from '../types';

const AMBIENCE_KEYS = ['ambience', 'ambiences', 'ambient'] as const;
const HIHAT_KEYS = ['hat', 'hats', 'hi hat', 'hi hats', 'hihat', 'hihats', 'hi-hat', 'hi-hats'] as const;
const KEYBOARD_KEYS = ['key', 'keys', 'keyboard', 'keyboards'] as const;
const PERCUSSION_KEYS = ['percussion', 'percussions', 'perc', 'percs'] as const;

interface FolderEntry { prefix: string; standalone: string }

const FOLDER_LOOKUP = new Map<string, FolderEntry>([
  ['808',       { prefix: '808',        standalone: '808s'       }],
  ['808s',      { prefix: '808',        standalone: '808s'       }],
  ['909',       { prefix: '909',        standalone: '909s'       }],
  ['909s',      { prefix: '909',        standalone: '909s'       }],
  ['acapella',  { prefix: 'Acapella',   standalone: 'Acapellas'  }],
  ['acapellas', { prefix: 'Acapella',   standalone: 'Acapellas'  }],
  ...AMBIENCE_KEYS.map((k): [string, FolderEntry] => [k, { prefix: 'Ambient',    standalone: 'Ambience'   }]),
  ['bass',      { prefix: 'Bass',       standalone: 'Bass'       }],
  ['basses',    { prefix: 'Bass',       standalone: 'Bass'       }],
  ['clap',      { prefix: 'Clap',       standalone: 'Claps'      }],
  ['claps',     { prefix: 'Clap',       standalone: 'Claps'      }],
  ['cymbal',    { prefix: 'Cymbal',     standalone: 'Cymbals'    }],
  ['cymbals',   { prefix: 'Cymbal',     standalone: 'Cymbals'    }],
  ['drum',      { prefix: 'Drum',       standalone: 'Drums'      }],
  ['drums',     { prefix: 'Drum',       standalone: 'Drums'      }],
  ['e-piano',   { prefix: 'E-Piano',    standalone: 'E-Piano'    }],
  ...HIHAT_KEYS.map((k): [string, FolderEntry] => [k, { prefix: 'Hihat',      standalone: 'Hihats'     }]),
  ['harp',      { prefix: 'Harp',       standalone: 'Harp'       }],
  ['harps',     { prefix: 'Harp',       standalone: 'Harp'       }],
  ['kick',      { prefix: 'Kick',       standalone: 'Kicks'      }],
  ['kicks',     { prefix: 'Kick',       standalone: 'Kicks'      }],
  ...KEYBOARD_KEYS.map((k): [string, FolderEntry] => [k, { prefix: 'Keys',       standalone: 'Keys'       }]),
  ['melody',    { prefix: 'Melody',     standalone: 'Melodies'   }],
  ['melodies',  { prefix: 'Melody',     standalone: 'Melodies'   }],
  ['melodic',   { prefix: 'Melodic',    standalone: 'Melodic'    }],
  ['melodics',  { prefix: 'Melodic',    standalone: 'Melodic'    }],
  ...PERCUSSION_KEYS.map((k): [string, FolderEntry] => [k, { prefix: 'Percussion', standalone: 'Percussion' }]),
  ['rimshot',   { prefix: 'Rimshot',    standalone: 'Rimshots'   }],
  ['rimshots',  { prefix: 'Rimshot',    standalone: 'Rimshots'   }],
  ['ride',      { prefix: 'Ride',       standalone: 'Rides'      }],
  ['rides',     { prefix: 'Ride',       standalone: 'Rides'      }],
  ['snare',     { prefix: 'Snare',      standalone: 'Snares'     }],
  ['snares',    { prefix: 'Snare',      standalone: 'Snares'     }],
  ['sound fx',  { prefix: 'Sound FX',   standalone: 'Sound FX'   }],
  ['fx',        { prefix: 'Sound FX',   standalone: 'Sound FX'   }],
  ['foley',     { prefix: 'Foley',      standalone: 'Foley'      }],
  ['foleys',    { prefix: 'Foley',      standalone: 'Foley'      }],
  ['flute',     { prefix: 'Flute',      standalone: 'Flute'      }],
  ['flutes',    { prefix: 'Flute',      standalone: 'Flute'      }],
  ['guitar',    { prefix: 'Guitar',     standalone: 'Guitar'     }],
  ['guitars',   { prefix: 'Guitar',     standalone: 'Guitar'     }],
  ['piano',     { prefix: 'Piano',      standalone: 'Piano'      }],
  ['pianos',    { prefix: 'Piano',      standalone: 'Piano'      }],
  ['pad',       { prefix: 'Pad',        standalone: 'Pads'       }],
  ['pads',      { prefix: 'Pad',        standalone: 'Pads'       }],
  ['synth',     { prefix: 'Synth',      standalone: 'Synths'     }],
  ['synths',    { prefix: 'Synth',      standalone: 'Synths'     }],
  ['texture',   { prefix: 'Texture',    standalone: 'Textures'   }],
  ['textures',  { prefix: 'Texture',    standalone: 'Textures'   }],
  ['vocal',     { prefix: 'Vocal',      standalone: 'Vocals'     }],
  ['vocals',    { prefix: 'Vocal',      standalone: 'Vocals'     }],
]);

const ONE_SHOT_LABELS = ['one shots', 'one-shots', 'oneshots'] as const;
// Suffixes to strip from folder names before type matching.
// e.g. "Drum Loops & MIDI" → "Drum Loops", "Drum Loops & Stems" → "Drum Loops".
const STRIP_SUFFIX_RE = / (?:&|and) (?:midi|stems?)$/;
const stripIgnoredSuffix = (nameLower: string): string => nameLower.replace(STRIP_SUFFIX_RE, '');

// Keys that prefer a subcategory type over their standalone type when under a known-type parent.
// e.g. "808s" under "Drums" → "Drums - 808s" rather than the bare "808s".
const SUBCATEGORY_PREFERRED_KEYS = new Set(['808', '808s', '909', '909s']);

// Folder names ending with these suffixes should never be treated as a subcategory.
// e.g. "Latin Stems" or "Loop Steps" under a known-type parent are excluded.
const SUBCATEGORY_EXCLUDED_SUFFIX_RE = /(^| )(stems?|steps?)$/i;

const lookupPrefix = (key: string): string | undefined => FOLDER_LOOKUP.get(key)?.prefix;
const lookupStandalone = (key: string): string | undefined => FOLDER_LOOKUP.get(key)?.standalone;

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
  if (!isLoops && !isOneShot) return false;
  const label = isLoops ? 'Loops' : 'One Shots';
  const prefix = findAncestorPrefix(entry);
  entry.setSampleType(prefix !== undefined ? `${prefix} ${label}` : label);
  return true;
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
  const sepIdx = nameLower.indexOf(' - ');
  if (sepIdx === -1) return false;
  const prefixType = resolveStandaloneType(nameLower.slice(0, sepIdx));
  if (prefixType === undefined) return false;
  const suffix = entry.getName().slice(sepIdx + 3);
  entry.setSampleType(`${prefixType} - ${suffix}`);
  return true;
}

function isKnownTypeFolderName(name: string): boolean {
  const lower = name.toLowerCase();
  if (FOLDER_LOOKUP.has(lower)) return true;
  if (lower.endsWith(' loops')) return FOLDER_LOOKUP.has(lower.slice(0, -' loops'.length));
  const suffix = ONE_SHOT_LABELS.map((l) => ` ${l}`).find((s) => lower.endsWith(s));
  if (suffix !== undefined) return FOLDER_LOOKUP.has(lower.slice(0, -suffix.length));
  return false;
}

function setFromSubcategoryName(entry: TransformEntry): boolean {
  const parent = entry.getParentNode();
  if (parent === undefined) return false;
  const parentSampleType = parent.getSampleType();
  if (parentSampleType === undefined) return false;
  if (!isKnownTypeFolderName(parentSampleType)) return false;
  const displayName = entry.getName().replace(/ (?:&|and) (?:midi|stems?)$/i, '');
  if (SUBCATEGORY_EXCLUDED_SUFFIX_RE.test(displayName)) return false;
  if (displayName.includes(' - ')) return false;
  entry.setSampleType(`${parentSampleType} - ${displayName}`);
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
export const DirectorySampleTypeTransformer: Transform = (source) => {
  source.eachTransformEntry((entry) => {
    if (entry.getOwnSampleType() !== undefined) return;
    if (entry.getChildNodes().length === 0) return;

    const nameLower = stripIgnoredSuffix(entry.getName().toLowerCase());
    if (setFromPrefixedName(entry, nameLower)) return;
    if (setFromDashSeparatedName(entry, nameLower)) return;
    if (setFromAncestorContext(entry, nameLower)) return;
    if (setFromStandalone(entry, nameLower)) return;
    setFromCompound(entry, nameLower);
    if (entry.getOwnSampleType() !== undefined) return;
    setFromSubcategoryName(entry);
  });
};
