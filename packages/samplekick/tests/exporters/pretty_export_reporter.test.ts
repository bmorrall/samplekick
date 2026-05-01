import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { Chalk } from "chalk";
import type { ConfigEntry } from "samplekick-io";
import { PrettyExportReporter } from "../../src/exporters/pretty_export_reporter";

// Force level 1 (ANSI 16 colors) so chalk always emits escape codes in tests
const chalk1 = new Chalk({ level: 1 });

const ESC = String.fromCharCode(0x1B);
const ANSI_RE = new RegExp(`${ESC}\\[[0-9;]*[A-Za-z]`, "gv");
const stripAnsi = (s: string): string => s.replace(ANSI_RE, "");

const createEntry = (path: string): ConfigEntry => ({
  getPath: () => path,
  getName: () => path.split("/").pop() ?? path,
  getPackageName: () => undefined,
  getSampleType: () => undefined,
  isSkipped: () => undefined,
  isKeepStructure: () => undefined,
});

const createReporter = (): { reporter: PrettyExportReporter; getOutput: () => string } => {
  const stream = new PassThrough();
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer) => { chunks.push(chunk.toString()); });
  const reporter = new PrettyExportReporter(stream, chalk1);
  const getOutput = (): string => chunks.join("");
  return { reporter, getOutput };
};

describe("PrettyExportReporter", () => {
  describe("onBeforeWrite", () => {
    it("writes 'extracting {baseName}'", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("drums/kick.wav"), "loops/my-pack/kick.wav");
      expect(stripAnsi(getOutput())).toBe("extracting kick.wav\n");
    });
  });

  describe("onAfterWrite (success)", () => {
    it("writes 'success: {destRelPath}' with green label and grey path", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "loops/my-pack/kick.wav");
      const raw = getOutput();
      expect(raw).toContain("\x1B[32m");
      expect(stripAnsi(raw)).toBe("success: loops/my-pack/kick.wav\n");
    });
  });

  describe("onAfterWrite (error)", () => {
    it("writes 'failed: {destRelPath}: {message}' in red", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "loops/my-pack/kick.wav", new Error("disk full"));
      const raw = getOutput();
      expect(raw).toContain("\x1B[31m");
      expect(stripAnsi(raw)).toBe("failed: loops/my-pack/kick.wav: disk full\n");
    });
  });

  describe("onComplete", () => {
    it("writes 'Exported 0 files to <dirPath>' when there are no errors", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toBe("Exported 0 files to /output/dir\n");
    });

    it("includes singular error count in red when there is 1 error", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
      reporter.onComplete("/output/dir");
      const raw = getOutput();
      expect(stripAnsi(raw)).toContain("Exported 1 file to /output/dir (1 error)\n");
      expect(raw).toContain("\x1B[31m");
    });

    it("includes plural error count when there are multiple errors", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav", new Error("fail"));
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain("Exported 2 files to /output/dir (2 errors)\n");
    });
  });
});
