import { describe, it, expect } from "vitest";
import { createFileEntry, createRegistry } from "../support";

describe("Registry.toString", () => {
  it("renders a simple tree", () => {
    const registry = createRegistry("library", [
      createFileEntry({ path: "jazz" }),
      createFileEntry({ path: "rock" }),
    ]);

    expect(registry.toString()).toBe(
      "library\n" +
      "├── jazz\n" +
      "└── rock\n"
    );
  });

  it("renders a nested tree with correct connectors", () => {
    const registry = createRegistry("library", [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/bebop/track02" }),
      createFileEntry({ path: "jazz/swing/track01" }),
    ]);

    expect(registry.toString()).toBe(
      "library\n" +
        "└── jazz\n" +
        "    ├── bebop\n" +
        "    │   ├── track01\n" +
        "    │   └── track02\n" +
        "    └── swing\n" +
        "        └── track01\n",
    );
  });

  it("renders tags on nodes that have them", () => {
    const registry = createRegistry("library", [createFileEntry({ path: "jazz/track01" })]);
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz", "Melodic Loops - Jazz");

    expect(registry.toString()).toBe(
      "library\n" +
        "└── jazz [pkg:jazz-pack, type:Melodic Loops - Jazz]\n" +
        "    └── track01\n",
    );
  });
});
