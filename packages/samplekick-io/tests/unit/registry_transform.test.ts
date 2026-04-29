import { describe, expect, it } from "vitest";
import type { Transform, TransformEntry, TransformSource } from "../../src";
import { createFileEntry, createRegistry } from "../support";

const collectVisitedPaths =
  (visitedPaths: string[]): Transform =>
  (source: TransformSource) => {
    source.eachTransformEntry((entry: TransformEntry) => {
      visitedPaths.push(entry.getPath());
    });
  };

const collectVisitedPathsAndSetPackageName =
  (visitedPaths: string[], packageName: string): Transform =>
  (source: TransformSource) => {
    source.eachTransformEntry((entry: TransformEntry) => {
      visitedPaths.push(entry.getPath());
      entry.setPackageName(packageName);
    });
  };

const setSharedSampleTypeAtPath =
  (path: string, sampleType: string): Transform =>
  (source: TransformSource) => {
    source.eachTransformEntry((entry: TransformEntry) => {
      if (entry.getPath() === path) {
        entry.setSampleType(sampleType);
      }
    });
  };

const renameAndSkipAtPath =
  (path: string, name: string): Transform =>
  (source: TransformSource) => {
    source.eachTransformEntry((entry: TransformEntry) => {
      if (entry.getPath() === path) {
        entry.setName(name);
        entry.setSkipped(true);
      }
    });
  };

describe("Registry applyTransform", () => {
  it("provides correct name, path, parent and children via entry methods", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "a/b" }),
      createFileEntry({ path: "a/c" }),
      createFileEntry({ path: "d" }),
    ]);

    interface CallInfo {
      name: string;
      path: string;
      parent: string | undefined;
      children: string[];
    }
    const calls: CallInfo[] = [];
    const recordEntry = (entry: TransformEntry): void => {
      calls.push({
        name: entry.getName(),
        path: entry.getPath(),
        parent: entry.getParentNode()?.getPath(),
        children: entry.getChildNodes().map((c) => c.getPath()),
      });
    };
    const collectInfo: Transform = (source) => {
      source.eachTransformEntry(recordEntry);
    };

    registry.applyTransform(collectInfo);

    expect(calls).toEqual(expect.arrayContaining([
      { name: "root", path: "", parent: undefined, children: ["a", "d"] },
      { name: "a", path: "a", parent: "", children: ["a/b", "a/c"] },
      { name: "b", path: "a/b", parent: "a", children: [] },
      { name: "c", path: "a/c", parent: "a", children: [] },
      { name: "d", path: "d", parent: "", children: [] },
    ]));
  });

  it("vistis the root node", () => {
    const registry = createRegistry("root", []);

    const visitedPaths: string[] = [];

    registry.applyTransform(collectVisitedPaths(visitedPaths));

    expect(visitedPaths).toEqual([""]);
  });

  it("visits each node in a three-segment path", () => {
    const registry = createRegistry("root", [createFileEntry({ path: "a/b/c" })]);

    const visitedPaths: string[] = [];

    registry.applyTransform(collectVisitedPaths(visitedPaths));

    expect(visitedPaths).toEqual(["", "a", "a/b", "a/b/c"]);
  });

  it("applies the transform to the root and every descendant node", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "a/b" }),
      createFileEntry({ path: "a/c" }),
      createFileEntry({ path: "d/e" }),
    ]);

    const visitedPaths: string[] = [];

    registry.applyTransform(
      collectVisitedPathsAndSetPackageName(visitedPaths, "transformed-pack"),
    );

    expect(visitedPaths).toEqual(["", "a", "a/b", "a/c", "d", "d/e"]);
    expect(registry.getEntry("a/b")?.getPackageName()).toBe("transformed-pack");
    expect(registry.getEntry("a/c")?.getPackageName()).toBe("transformed-pack");
    expect(registry.getEntry("d/e")?.getPackageName()).toBe("transformed-pack");
  });

  it("allows ancestor changes to affect descendants during traversal", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "a/b" }),
      createFileEntry({ path: "a/c" }),
    ]);

    registry.applyTransform(setSharedSampleTypeAtPath("a", "shared-type"));

    expect(registry.getEntry("a/b")?.getSampleType()).toBe("shared-type");
    expect(registry.getEntry("a/c")?.getSampleType()).toBe("shared-type");
  });

  it("allows selective mutation of individual entries", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "a/b" }),
      createFileEntry({ path: "a/c" }),
    ]);

    registry.applyTransform(renameAndSkipAtPath("a/b", "renamed-b"));

    expect(registry.getEntry("a/b")?.getName()).toBe("renamed-b");
    expect(registry.getEntry("a/b")?.isSkipped()).toBe(true);
    expect(registry.getEntry("a/c")?.getName()).toBe("c");
    expect(registry.getEntry("a/c")?.isSkipped()).toBeUndefined();
  });
});
