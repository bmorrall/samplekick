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
    it("writes source path on one line and arrow with grey destination on the next", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("drums/kick.wav"), "loops/my-pack/kick.wav");
      const stripped = stripAnsi(getOutput());
      expect(stripped).toContain("drums/kick.wav");
      expect(stripped).toContain("  → loops/my-pack/kick.wav");
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
      expect(stripAnsi(raw)).toContain("  → kick.wav");
    });

    it("emits cursor-up and cursor-down when there are lines below", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("a.wav"), "a.wav");
      reporter.onBeforeWrite(createEntry("b.wav"), "b.wav");
      reporter.onBeforeWrite(createEntry("c.wav"), "c.wav");

      // Complete the first entry (2 lines below it)
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav");
      const raw = getOutput();

      // Each entry is 2 lines; a_arrow is at index 1, linesBelow=4, so cursor moves 5 rows
      expect(raw).toContain("\x1B[5A");
      expect(raw).toContain("\x1B[5B");
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
      expect(stripAnsi(raw)).toContain("  → disk full");
    });

    it("shows error message on the arrow line instead of destination path", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav", new Error("disk full"));
      expect(stripAnsi(getOutput())).toContain("  → disk full");
    });

    it("completes a later entry correctly after a prior entry errored", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("a.wav"), "a.wav");
      reporter.onBeforeWrite(createEntry("b.wav"), "b.wav");
      reporter.onBeforeWrite(createEntry("c.wav"), "c.wav");

      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));

      // c_arrow is at index 5, linesBelow=0, so cursor-up should be 1
      reporter.onAfterWrite(createEntry("c.wav"), "c.wav");
      const raw = getOutput();
      expect(raw).toContain("\x1B[1A");
      expect(stripAnsi(raw)).toContain("  → c.wav");
    });

    it("pending lines below remain visible in the output after an error", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("a.wav"), "a.wav");
      reporter.onBeforeWrite(createEntry("b.wav"), "b.wav");
      reporter.onBeforeWrite(createEntry("c.wav"), "c.wav");

      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));

      const stripped = stripAnsi(getOutput());
      expect(stripped).toContain("b.wav");
      expect(stripped).toContain("  → b.wav");
      expect(stripped).toContain("c.wav");
      expect(stripped).toContain("  → c.wav");
    });
  });

  describe("onComplete", () => {
    it("writes 'Exported to <dirPath>' on its own line after entries", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("a.wav"), "a.wav");
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav");
      reporter.onComplete("/output/dir");
      // The \r before onComplete ensures we're at col 0; message must start after a \r or \n
      const raw = getOutput();
      expect(raw).toMatch(/[\r\n]Exported to \/output\/dir/v);
      expect(stripAnsi(raw)).toContain("Exported to /output/dir");
    });

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
      expect(stripAnsi(raw)).toContain("Exported 1 file to /output/dir (1 error)");
      expect(raw).toContain("\x1B[31m");
    });

    it("includes plural error count when there are multiple errors", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("a.wav"), "a.wav");
      reporter.onBeforeWrite(createEntry("b.wav"), "b.wav");
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav", new Error("fail"));
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain("Exported 2 files to /output/dir (2 errors)");
    });
  });
});
