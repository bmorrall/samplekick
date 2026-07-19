import { describe, it, expect } from "vitest";
import {
  createConstructionKitTransformer,
  createDirectorySampleTypeTransformer,
} from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("ConstructionKitTransformer integration", () => {
  it("enables matched kit subtrees under a kits parent", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({
        path: "Construction Kits/Construction Kit 1 - Nightcall - Dm 95BPM/Drums/kick.wav",
      }),
      createFileEntry({
        path: "Construction Kits/Construction Kit 2 - Spaceship - Fm 115BPM/Bass/bass.wav",
      }),
      createFileEntry({ path: "Construction Kits/Bonus Loops/loop.wav" }),
    ]);

    registry.applyTransform(createDirectorySampleTypeTransformer());
    registry.applyTransform(createConstructionKitTransformer());

    expect(registry.toString()).toBe(
      [
        "Pack.zip [skipped]",
        "└── Construction Kits [skipped]",
        "    ┣━━ Construction Kit 1 - Nightcall - Dm 95BPM",
        "    ┃   ┗━━ Drums",
        "    ┃       └── kick.wav [?]",
        "    ┣━━ Construction Kit 2 - Spaceship - Fm 115BPM",
        "    ┃   ┗━━ Bass",
        "    ┃       └── bass.wav [?]",
        "    └── Bonus Loops [type:Loops, skipped]",
        "        └── loop.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("strips the common prefix from audio files within kit subdirectories", () => {
    const registry = createRegistry("OSS.zip", [
      // Single file directly under the kit root (e.g. full-mix preview)
      createFileEntry({
        path: "Melody Kits/Kit Aftershock/Ghosthack - OSS Kit Aftershock Full Mix Gmin 140bpm.wav",
      }),
      // Single-file Demo subdirectory
      createFileEntry({
        path: "Melody Kits/Kit Aftershock/Demo/Ghosthack - OSS Kit Aftershock Demo Gmin 140bpm.wav",
      }),
      // Multi-file Stems subdirectory
      createFileEntry({
        path: "Melody Kits/Kit Aftershock/Stems/Ghosthack - OSS Kit Aftershock Bass Loop Gmin 140bpm.wav",
      }),
      createFileEntry({
        path: "Melody Kits/Kit Aftershock/Stems/Ghosthack - OSS Kit Aftershock Chords Loop Gmin 140bpm.wav",
      }),
      // MIDI subdirectory
      createFileEntry({
        path: "Melody Kits/Kit Aftershock/MIDI/Ghosthack - OSS Kit Aftershock Bass Loop Gmin 140bpm.mid",
      }),
      createFileEntry({
        path: "Melody Kits/Kit Aftershock/MIDI/Ghosthack - OSS Kit Aftershock Chords Loop Gmin 140bpm.mid",
      }),
    ]);

    registry.applyTransform(createConstructionKitTransformer());

    expect(registry.toString()).toBe(
      [
        "OSS.zip [skipped]",
        "└── Melody Kits [skipped]",
        "    ┗━━ Kit Aftershock",
        "        ├── Full Mix.wav [?] [renamed]",
        "        ┣━━ Demo",
        "        ┃   └── Demo.wav [?] [renamed]",
        "        ┣━━ Stems",
        "        ┃   ├── Bass Loop.wav [?] [renamed]",
        "        ┃   └── Chords Loop.wav [?] [renamed]",
        "        ┗━━ MIDI",
        "            ├── Bass Loop.mid [?] [renamed]",
        "            └── Chords Loop.mid [?] [renamed]",
        "",
      ].join("\n"),
    );
  });

  it("strips per-directory prefix after the kit-wide prefix is removed", () => {
    // Simulates a Nightcall-style kit: kit-wide \"OSS \", then per-dir \"Kit 1 \",
    // then key/BPM tags stripped from each file.
    const registry = createRegistry("Pack.zip", [
      createFileEntry({
        path: "Construction Kits/Kit 1 - Nightcall/Demo/OSS Construction Kit 1 Nightcall Dmin 95bpm.wav",
      }),
      createFileEntry({
        path: "Construction Kits/Kit 1 - Nightcall/Dry/OSS Kit 1 Arp Dmin 95bpm Dry.wav",
      }),
      createFileEntry({
        path: "Construction Kits/Kit 1 - Nightcall/Dry/OSS Kit 1 Bass Dmin 95bpm Dry.wav",
      }),
      createFileEntry({
        path: "Construction Kits/Kit 1 - Nightcall/Wet/OSS Kit 1 Arp Dmin 95bpm Wet.wav",
      }),
      createFileEntry({
        path: "Construction Kits/Kit 1 - Nightcall/Wet/OSS Kit 1 Bass Dmin 95bpm Wet.wav",
      }),
    ]);

    registry.applyTransform(createConstructionKitTransformer());

    expect(registry.toString()).toBe(
      [
        "Pack.zip [skipped]",
        "└── Construction Kits [skipped]",
        "    ┗━━ Kit 1 - Nightcall",
        "        ┣━━ Demo",
        "        ┃   └── Construction Kit 1 Nightcall.wav [?] [renamed]",
        "        ┣━━ Dry",
        "        ┃   ├── Arp Dry.wav [?] [renamed]",
        "        ┃   └── Bass Dry.wav [?] [renamed]",
        "        ┗━━ Wet",
        "            ├── Arp Wet.wav [?] [renamed]",
        "            └── Bass Wet.wav [?] [renamed]",
        "",
      ].join("\n"),
    );
  });
});
