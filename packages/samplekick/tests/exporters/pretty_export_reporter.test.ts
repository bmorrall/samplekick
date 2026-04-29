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
    it("writes source path, arrow and grey destination path", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("drums/kick.wav"), "loops/my-pack/kick.wav");
      const stripped = stripAnsi(getOutput());
      expect(stripped).toContain("drums/kick.wav → loops/my-pack/kick.wav");
    });

    it("applies grey color to the destination path", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      // gray produces an ANSI color escape followed by the text
      expect(getOutput()).toContain(`${ESC}[`);
      expect(getOutput()).toContain("kick.wav");
    });
  });

  describe("onAfterWrite (success)", () => {
    it("updates the line to show green destination path", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav");
      const raw = getOutput();
      // green is ANSI code 32
      expect(raw).toContain("\x1B[32m");
      expect(stripAnsi(raw)).toContain("kick.wav → kick.wav");
    });

    it("emits cursor-up and cursor-down when there are lines below", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("a.wav"), "a.wav");
      reporter.onBeforeWrite(createEntry("b.wav"), "b.wav");
      reporter.onBeforeWrite(createEntry("c.wav"), "c.wav");

      // Complete the first entry (2 lines below it)
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav");
      const raw = getOutput();

      // Should move up 3 rows (linesBelow=2, +1)
      expect(raw).toContain("\x1B[3A");
      // Should move back down 3 rows
      expect(raw).toContain("\x1B[3B");
    });

    it("emits cursor-up of 1 when the entry is the last line", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("a.wav"), "a.wav");
      reporter.onBeforeWrite(createEntry("b.wav"), "b.wav");

      reporter.onAfterWrite(createEntry("b.wav"), "b.wav");
      const raw = getOutput();

      expect(raw).toContain("\x1B[1A");
      expect(raw).toContain("\x1B[1B");
    });
  });

  describe("onAfterWrite (error)", () => {
    it("updates the line to show red destination path", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav", new Error("disk full"));
      const raw = getOutput();
      // red is ANSI code 31
      expect(raw).toContain("\x1B[31m");
      expect(stripAnsi(raw)).toContain("kick.wav → kick.wav");
    });

    it("writes an indented error message below the file line", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav", new Error("disk full"));
      expect(stripAnsi(getOutput())).toContain("  disk full");
    });

    it("rewrites lines below the error entry and shifts their indices", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("a.wav"), "a.wav");
      reporter.onBeforeWrite(createEntry("b.wav"), "b.wav");
      reporter.onBeforeWrite(createEntry("c.wav"), "c.wav");

      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));

      // After the error on a.wav, c.wav should have lineIndex=3 (shifted by 1 for error detail)
      // Completing c.wav should therefore emit cursor-up of 4 (linesBelow=0 for c.wav... wait)
      // Lines after error: [a_red, detail, b_pending, c_pending]
      // c.wav is now at index 3, linesBelow=0, so cursor-up should be 1
      reporter.onAfterWrite(createEntry("c.wav"), "c.wav");
      const raw = getOutput();
      expect(raw).toContain("\x1B[1A");
      expect(stripAnsi(raw)).toContain("c.wav → c.wav");
    });

    it("re-renders all pending lines below the error so they remain visible", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("a.wav"), "a.wav");
      reporter.onBeforeWrite(createEntry("b.wav"), "b.wav");
      reporter.onBeforeWrite(createEntry("c.wav"), "c.wav");

      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));

      const stripped = stripAnsi(getOutput());
      expect(stripped).toContain("b.wav → b.wav");
      expect(stripped).toContain("c.wav → c.wav");
    });
  });

  describe("onComplete", () => {
    it("writes 'Exported to <dirPath>' when there are no errors", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain("Exported to /output/dir");
    });

    it("includes singular error count in red when there is 1 error", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("a.wav"), "a.wav");
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
      reporter.onComplete("/output/dir");
      const raw = getOutput();
      expect(stripAnsi(raw)).toContain("(1 error)");
      expect(raw).toContain("\x1B[31m");
    });

    it("includes plural error count when there are multiple errors", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("a.wav"), "a.wav");
      reporter.onBeforeWrite(createEntry("b.wav"), "b.wav");
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav", new Error("fail"));
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain("(2 errors)");
    });
  });
});
