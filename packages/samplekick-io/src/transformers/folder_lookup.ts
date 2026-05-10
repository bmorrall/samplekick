export interface FolderEntry { prefix: string | undefined; standalone: string }

const AMBIENCE_KEYS = ['ambience', 'ambiences', 'ambient'] as const;
const DRUM_AND_BASS_KEYS = ['drum and bass', 'drum n bass', 'drum & bass', 'dnb', 'd&b'] as const;
const HIHAT_KEYS = ['hat', 'hats', 'hi hat', 'hi hats', 'hihat', 'hihats', 'hi-hat', 'hi-hats'] as const;
const KEYBOARD_KEYS = ['key', 'keys', 'keyboard', 'keyboards'] as const;
export const ONE_SHOT_LABELS = ['one shot', 'one shots', 'one-shot', 'one-shots', 'oneshots'] as const;
const PERCUSSION_KEYS = ['percussion', 'percussions', 'perc', 'percs'] as const;

export const FOLDER_LOOKUP = new Map<string, FolderEntry>([
  ['808',       { prefix: '808',        standalone: '808s'       }],
  ['808s',      { prefix: '808',        standalone: '808s'       }],
  ['909',       { prefix: '909',        standalone: '909s'       }],
  ['909s',      { prefix: '909',        standalone: '909s'       }],
  ['acapella',  { prefix: 'Acapella',   standalone: 'Acapellas'  }],
  ['acapellas', { prefix: 'Acapella',   standalone: 'Acapellas'  }],
  ...AMBIENCE_KEYS.map((k): [string, FolderEntry] => [k, { prefix: 'Ambient',    standalone: 'Ambience'   }]),
  ['bass',      { prefix: 'Bass',       standalone: 'Bass'       }],
  ['basses',    { prefix: 'Bass',       standalone: 'Bass'       }],
  ['cinematic', { prefix: 'Cinematic',  standalone: 'Cinematic'  }],
  ['cinematics',{ prefix: 'Cinematic',  standalone: 'Cinematic'  }],
  ['drone',     { prefix: 'Drone',      standalone: 'Drones'     }],
  ['drones',    { prefix: 'Drone',      standalone: 'Drones'     }],
  ['clap',      { prefix: 'Clap',       standalone: 'Claps'      }],
  ['claps',     { prefix: 'Clap',       standalone: 'Claps'      }],
  ['cymbal',    { prefix: 'Cymbal',     standalone: 'Cymbals'    }],
  ['cymbals',   { prefix: 'Cymbal',     standalone: 'Cymbals'    }],
  ['drum',      { prefix: 'Drum',       standalone: 'Drums'      }],
  ['drums',     { prefix: 'Drum',       standalone: 'Drums'      }],
  ...DRUM_AND_BASS_KEYS.map((k): [string, FolderEntry] => [k, { prefix: 'Drum and Bass', standalone: 'Drum and Bass' }]),
  ['e-piano',   { prefix: 'E-Piano',    standalone: 'E-Piano'    }],
  ...HIHAT_KEYS.map((k): [string, FolderEntry] => [k, { prefix: 'Hihat',      standalone: 'Hihats'     }]),
  ['harp',      { prefix: 'Harp',       standalone: 'Harp'       }],
  ['harps',     { prefix: 'Harp',       standalone: 'Harp'       }],
  ['kick',      { prefix: 'Kick',       standalone: 'Kicks'      }],
  ['kicks',     { prefix: 'Kick',       standalone: 'Kicks'      }],
  ...KEYBOARD_KEYS.map((k): [string, FolderEntry] => [k, { prefix: 'Keys',       standalone: 'Keys'       }]),
  ['loops',     { prefix: undefined,    standalone: 'Loops'      }],
  ['melody',    { prefix: 'Melody',     standalone: 'Melodies'   }],
  ['melodies',  { prefix: 'Melody',     standalone: 'Melodies'   }],
  ['melodic',   { prefix: 'Melodic',    standalone: 'Melodic'    }],
  ['melodics',  { prefix: 'Melodic',    standalone: 'Melodic'    }],
  ...ONE_SHOT_LABELS.map((k): [string, FolderEntry] => [k, { prefix: undefined, standalone: 'One Shots' }]),
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

export const lookupPrefix = (key: string): string | undefined => FOLDER_LOOKUP.get(key)?.prefix;
export const lookupStandalone = (key: string): string | undefined => FOLDER_LOOKUP.get(key)?.standalone;

// e.g. "Drum Loops & MIDI" → "Drum Loops", "Drum Loops & Stems" → "Drum Loops".
const STRIP_SUFFIX_RE = / (?:&|and) (?:midi|stems?)$/v;
// e.g. "Drum Loops Collection" → "Drum Loops", "Hihat Bundle" → "Hihat".
const STRIP_NOISE_SUFFIX_RE = /\s+(?:collection|bundle|pack|set|library)s?$/iv;
export const stripIgnoredSuffix = (nameLower: string): string =>
  nameLower.replace(STRIP_SUFFIX_RE, '').replace(STRIP_NOISE_SUFFIX_RE, '');

export function isKnownTypeFolderName(name: string): boolean {
  const lower = name.toLowerCase();
  if (FOLDER_LOOKUP.has(lower)) return true;
  if (lower.endsWith(' loops')) return lookupPrefix(lower.slice(0, -' loops'.length)) !== undefined;
  const suffix = ONE_SHOT_LABELS.map((l) => ` ${l}`).find((s) => lower.endsWith(s));
  if (suffix !== undefined) return lookupPrefix(lower.slice(0, -suffix.length)) !== undefined;
  return false;
}
