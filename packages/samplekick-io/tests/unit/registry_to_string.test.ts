import { describe, it, expect } from "vitest";
import { createFileEntry, createRegistry } from "../support";

describe("Registry.toString", () => {
  it("renders a simple tree", () => {
    const registry = createRegistry("library", [
      createFileEntry({ path: "jazz" }),
      createFileEntry({ path: "rock" }),
    ]);

    expect(registry.toString()).toBe(
      [
        "library",
        "├── jazz [?]",
        "└── rock [?]",
        "",
      ].join("\n"),
    );
  });

  it("renders a nested tree with correct connectors", () => {
    const registry = createRegistry("library", [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/bebop/track02" }),
      createFileEntry({ path: "jazz/swing/track01" }),
    ]);

    expect(registry.toString()).toBe(
      [
        "library",
        "└── jazz",
        "    ├── bebop",
        "    │   ├── track01 [?]",
        "    │   └── track02 [?]",
        "    └── swing",
        "        └── track01 [?]",
        "",
      ].join("\n"),
    );
  });

  it("renders tags on nodes whose name has changed", () => {
    const registry = createRegistry("library", [createFileEntry({ path: "jazz/track01" })]);
    registry.setName("jazz", "Jazz Loops");
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz", "Melodic Loops - Jazz");

    expect(registry.toString()).toBe(
      [
        "library",
        "└── Jazz Loops [renamed, pkg:jazz-pack, type:Melodic Loops - Jazz]",
        "    └── track01",
        "",
      ].join("\n"),
    );
  });

  it("renders pkg/type tags even when name has not changed", () => {
    const registry = createRegistry("library", [createFileEntry({ path: "jazz/track01" })]);
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz", "Melodic Loops - Jazz");

    expect(registry.toString()).toBe(
      [
        "library",
        "└── jazz [pkg:jazz-pack, type:Melodic Loops - Jazz]",
        "    └── track01",
        "",
      ].join("\n"),
    );
  });
});
