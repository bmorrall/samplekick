/* eslint-disable max-lines -- TODO: split this file to bring it under the max-lines limit */
import { PassThrough } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Chalk } from "chalk";
import type { FileNode } from "samplekick-io";
import { PrettyExportReporter } from "../../src/exporters/pretty_export_reporter";

// Force level 1 (ANSI 16 colors) so chalk always emits escape codes in tests
const chalk1 = new Chalk({ level: 1 });

const ESC = String.fromCharCode(0x1b);
const ANSI_RE = new RegExp(`${ESC}\\[[0-9;]*[A-Za-z]`, "gv");
const stripAnsi = (s: string): string => s.replace(ANSI_RE, "");

const createEntry = (path: string): FileNode => ({
  getPath: () => path,
  getName: () => path.split("/").pop() ?? path,
  getPackageName: () => undefined,
  getSampleType: () => undefined,
  isSkipped: () => undefined,
  isKeepStructure: () => undefined,
  isFile: () => true,
  getParentNode: () => undefined,
  getChildNodes: () => [],
});

const createReporter = (): {
  reporter: PrettyExportReporter;
  getOutput: () => string;
} => {
  const stream = new PassThrough();
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer) => {
    chunks.push(chunk.toString());
  });
  const reporter = new PrettyExportReporter(stream, chalk1);
  const getOutput = (): string => chunks.join("");
  return { reporter, getOutput };
};

const createTTYReporter = (): {
  reporter: PrettyExportReporter;
  getOutput: () => string;
} => {
  const stream = new PassThrough();
  Object.assign(stream, { isTTY: true });
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer) => {
    chunks.push(chunk.toString());
  });
  const reporter = new PrettyExportReporter(stream, chalk1, {
    displayName: "my-pack.zip",
  });
  const getOutput = (): string => chunks.join("");
  return { reporter, getOutput };
};

const createPackReporter = (): {
  reporter: PrettyExportReporter;
  getOutput: () => string;
} => {
  const stream = new PassThrough();
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer) => {
    chunks.push(chunk.toString());
  });
  const reporter = new PrettyExportReporter(stream, chalk1, {
    displayName: "my-pack.zip",
  });
  const getOutput = (): string => chunks.join("");
  return { reporter, getOutput };
};

const createQuietPackReporter = (): {
  reporter: PrettyExportReporter;
  getOutput: () => string;
} => {
  const stream = new PassThrough();
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer) => {
    chunks.push(chunk.toString());
  });
  const reporter = new PrettyExportReporter(stream, chalk1, {
    quiet: true,
    displayName: "my-pack.zip",
  });
  const getOutput = (): string => chunks.join("");
  return { reporter, getOutput };
};

describe("PrettyExportReporter", () => {
  describe("onInfo", () => {
    it("writes the message dimmed without dot or indent", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onInfo("Reading: /path/to/pack.zip");
      const raw = getOutput();
      expect(raw).toContain("\x1B[");
      expect(stripAnsi(raw)).toBe("Reading: /path/to/pack.zip\n");
    });
  });

  describe("onDebug", () => {
    it("writes the message in grey", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onDebug("Reading: /path/to/pack.zip");
      const raw = getOutput();
      expect(raw).toContain("\x1B[");
      expect(stripAnsi(raw)).toBe("  · Reading: /path/to/pack.zip\n");
    });
  });

  describe("onError", () => {
    it("writes '! {message}' in red with indent", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onError("Could not convert kick.wav: ffmpeg error");
      const raw = getOutput();
      expect(raw).toContain("\x1B[31m");
      expect(stripAnsi(raw)).toBe(
        "  ! Could not convert kick.wav: ffmpeg error\n",
      );
    });
  });

  describe("onStart", () => {
    it("writes 'filename:' when a pack name is set", () => {
      const { reporter, getOutput } = createPackReporter();
      reporter.onStart("my-pack.zip");
      expect(getOutput()).toBe("my-pack.zip:\n");
    });

    it("writes nothing when pack name is empty", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onStart("");
      expect(getOutput()).toBe("");
    });

    it("still writes 'filename:' in quiet mode", () => {
      const { reporter, getOutput } = createQuietPackReporter();
      reporter.onStart("my-pack.zip");
      expect(getOutput()).toBe("my-pack.zip:\n");
    });

    it("writes 'filename:' on TTY", () => {
      vi.useFakeTimers();
      const { reporter, getOutput } = createTTYReporter();
      reporter.onStart("my-pack.zip");
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain("my-pack.zip:\n");
      vi.useRealTimers();
    });
  });

  describe("onBeforeWrite", () => {
    it("writes nothing on non-TTY", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(
        createEntry("drums/kick.wav"),
        "loops/my-pack/kick.wav",
      );
      expect(getOutput()).toBe("");
    });
  });

  describe("onAfterWrite (success)", () => {
    it("writes '✓ {dir}/{filename}' with green symbol and dimmed directory", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(
        createEntry("loops/my-pack/kick.wav"),
        "loops/my-pack/kick.wav",
      );
      const raw = getOutput();
      expect(raw).toContain("\x1B[32m");
      expect(stripAnsi(raw)).toBe("  ✓ loops/my-pack/kick.wav\n");
    });

    it("omits directory prefix when file is at root of output dir", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav");
      expect(stripAnsi(getOutput())).toBe("  ✓ kick.wav\n");
    });

    it("shows destination path below source when they differ", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(
        createEntry("Drums/Kick 01.wav"),
        "loops/my-pack/kick.wav",
      );
      expect(stripAnsi(getOutput())).toBe(
        ["  ✓ Drums/Kick 01.wav", "    └── loops/my-pack/kick.wav", ""].join(
          "\n",
        ),
      );
    });

    it("omits source path when source and destination are identical", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(
        createEntry("loops/my-pack/kick.wav"),
        "loops/my-pack/kick.wav",
      );
      expect(stripAnsi(getOutput())).toBe("  ✓ loops/my-pack/kick.wav\n");
    });
  });

  describe("onAfterWrite (error)", () => {
    it("writes '✗ {destRelPath}: {message}' in red", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(
        createEntry("kick.wav"),
        "loops/my-pack/kick.wav",
        new Error("disk full"),
      );
      const raw = getOutput();
      expect(raw).toContain("\x1B[31m");
      expect(stripAnsi(raw)).toBe("  ✗ loops/my-pack/kick.wav: disk full\n");
    });
  });

  describe("onSkip", () => {
    it("writes '- {path}' with dim styling", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onSkip(createEntry("kick.wav"));
      const raw = getOutput();
      expect(stripAnsi(raw)).toBe("  - kick.wav\n");
    });
  });

  describe("onReject", () => {
    it("writes '? {path}: {reason}' with magenta symbol", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onReject(createEntry("kick.wav"), "Missing sampleType");
      const raw = getOutput();
      expect(raw).toContain("\x1B[35m");
      expect(stripAnsi(raw)).toBe("  ? kick.wav\n    └── Missing sampleType\n");
    });

    it("does not increment totalCount", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onReject(createEntry("a.wav"), "Missing packageName");
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav");
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain(
        "Exported 1 sample to /output/dir",
      );
    });
  });

  describe("onComplete", () => {
    it("writes 'Exported 0 samples to <dirPath>' when there are no errors", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toBe(
        "Exported 0 samples to /output/dir\n",
      );
    });

    it("includes singular error count in red when there is 1 error", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
      reporter.onComplete("/output/dir");
      const raw = getOutput();
      expect(stripAnsi(raw)).toContain(
        "Exported 1 sample to /output/dir (1 error)\n",
      );
      expect(raw).toContain("\x1B[31m");
    });

    it("includes plural error count when there are multiple errors", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav", new Error("fail"));
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain(
        "Exported 2 samples to /output/dir (2 errors)\n",
      );
    });

    it("includes reject count when entries were rejected", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onReject(createEntry("a.wav"), "Missing sampleType");
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav");
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain(
        "Exported 1 sample to /output/dir (1 sample rejected)\n",
      );
    });

    it("includes both error and reject counts when both occur", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
      reporter.onReject(createEntry("b.wav"), "Missing packageName");
      reporter.onAfterWrite(createEntry("c.wav"), "c.wav");
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain(
        "Exported 2 samples to /output/dir (1 error, 1 sample rejected)\n",
      );
    });

    it("includes singular entry count when one entry is skipped", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onSkip(createEntry("kick.wav"));
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain(
        "Exported 0 samples to /output/dir (1 entry skipped)\n",
      );
    });

    it("includes plural entry count when multiple entries are skipped", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onSkip(createEntry("kick.wav"));
      reporter.onSkip(createEntry("cover.jpg"));
      reporter.onSkip(createEntry("notes.txt"));
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain(
        "Exported 0 samples to /output/dir (3 entries skipped)\n",
      );
    });
  });

  describe("quiet mode", () => {
    const createQuietReporter = (): {
      reporter: PrettyExportReporter;
      getOutput: () => string;
    } => {
      const stream = new PassThrough();
      const chunks: string[] = [];
      stream.on("data", (chunk: Buffer) => {
        chunks.push(chunk.toString());
      });
      const reporter = new PrettyExportReporter(stream, chalk1, {
        quiet: true,
      });
      const getOutput = (): string => chunks.join("");
      return { reporter, getOutput };
    };

    it("suppresses onBeforeWrite", () => {
      const { reporter, getOutput } = createQuietReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      expect(getOutput()).toBe("");
    });

    it("suppresses success lines in onAfterWrite", () => {
      const { reporter, getOutput } = createQuietReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav");
      expect(getOutput()).toBe("");
    });

    it("suppresses reject lines in onReject", () => {
      const { reporter, getOutput } = createQuietReporter();
      reporter.onReject(createEntry("kick.wav"), "Missing sampleType");
      expect(getOutput()).toBe("");
    });

    it("suppresses skip lines in onSkip", () => {
      const { reporter, getOutput } = createQuietReporter();
      reporter.onSkip(createEntry("kick.wav"));
      expect(getOutput()).toBe("");
    });

    it("still writes error lines", () => {
      const { reporter, getOutput } = createQuietReporter();
      reporter.onAfterWrite(
        createEntry("kick.wav"),
        "kick.wav",
        new Error("disk full"),
      );
      expect(stripAnsi(getOutput())).toBe("  ✗ kick.wav: disk full\n");
    });

    it("still writes complete line", () => {
      const { reporter, getOutput } = createQuietReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav");
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toBe("Exported 1 sample to /output/dir\n");
    });
  });

  describe("organised path colouring", () => {
    const createOrganisedReporter = (): {
      reporter: PrettyExportReporter;
      getOutput: () => string;
    } => {
      const stream = new PassThrough();
      const chunks: string[] = [];
      stream.on("data", (chunk: Buffer) => {
        chunks.push(chunk.toString());
      });
      const reporter = new PrettyExportReporter(stream, chalk1, {
        organised: true,
      });
      const getOutput = (): string => chunks.join("");
      return { reporter, getOutput };
    };

    it("colours sampleType (folder 1) with greenBright and packageName (folder 2) with cyan", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "loops/my-pack/kick.wav");
      const raw = getOutput();
      expect(stripAnsi(raw)).toBe(
        "  ✓ kick.wav\n    └── loops/my-pack/kick.wav\n",
      );
      expect(raw).toContain("\x1B[36m"); // cyan — sampleType
      expect(raw).toContain("\x1B[92m"); // greenBright — packageName
    });

    it("colours extra subfolder segments gray", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(
        createEntry("kick.wav"),
        "loops/my-pack/sub/kick.wav",
      );
      const raw = getOutput();
      expect(stripAnsi(raw)).toBe(
        ["  ✓ kick.wav", "    └── loops/my-pack/sub/kick.wav", ""].join("\n"),
      );
      expect(raw).toContain("\x1B[36m"); // cyan — sampleType
      expect(raw).toContain("\x1B[92m"); // greenBright — packageName
    });

    it("does not apply organised colouring when organised is false", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(
        createEntry("loops/my-pack/kick.wav"),
        "loops/my-pack/kick.wav",
      );
      const raw = getOutput();
      expect(raw).not.toContain("\x1B[36m"); // no cyan
      expect(raw).not.toContain("\x1B[34m"); // no blue
    });
  });

  describe("TTY mode", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("draws 'Analysing' spinner on onStart", () => {
      vi.useFakeTimers();
      const { reporter, getOutput } = createTTYReporter();
      reporter.onStart("my-pack.zip");
      reporter.onComplete("/output/dir");
      const raw = getOutput();
      expect(raw).toContain("\x1b[2K\r");
      expect(stripAnsi(raw)).toContain("Analysing my-pack.zip\u2026");
    });

    it("draws 'Exporting' spinner after first write", () => {
      vi.useFakeTimers();
      const { reporter, getOutput } = createTTYReporter();
      reporter.onStart("my-pack.zip");
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav");
      reporter.onComplete("/output/dir");
      const raw = getOutput();
      expect(raw).toContain("\x1b[2K\r");
      expect(stripAnsi(raw)).toContain("Exporting my-pack.zip\u2026 (1 done)");
    });

    it("clears spinner and logs above it on onDebug", () => {
      vi.useFakeTimers();
      const { reporter, getOutput } = createTTYReporter();
      reporter.onStart("my-pack.zip");
      const { length: afterSpinner } = getOutput();
      reporter.onDebug("debug message");
      const debugOutput = getOutput().slice(afterSpinner);
      expect(debugOutput.startsWith("\x1b[2K\r")).toBe(true);
      expect(stripAnsi(debugOutput)).toContain("· debug message\n");
      expect(stripAnsi(debugOutput)).toContain("Analysing my-pack.zip\u2026");
      reporter.onComplete("/output/dir");
    });

    it("clears spinner and logs above it on onAfterWrite success", () => {
      vi.useFakeTimers();
      const { reporter, getOutput } = createTTYReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      const { length: afterSpinner } = getOutput();
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav");
      const writeOutput = getOutput().slice(afterSpinner);
      expect(writeOutput.startsWith("\x1b[2K\r")).toBe(true);
      expect(stripAnsi(writeOutput)).toContain("  \u2713 kick.wav\n");
      reporter.onComplete("/output/dir");
    });

    it("clears spinner and logs above it on onAfterWrite error", () => {
      vi.useFakeTimers();
      const { reporter, getOutput } = createTTYReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      const { length: afterSpinner } = getOutput();
      reporter.onAfterWrite(
        createEntry("kick.wav"),
        "kick.wav",
        new Error("disk full"),
      );
      const writeOutput = getOutput().slice(afterSpinner);
      expect(writeOutput.startsWith("\x1b[2K\r")).toBe(true);
      expect(stripAnsi(writeOutput)).toContain("\u2717 kick.wav: disk full\n");
      reporter.onComplete("/output/dir");
    });

    it("clears spinner line on onComplete", () => {
      vi.useFakeTimers();
      const { reporter, getOutput } = createTTYReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain(
        "Exported 0 samples to /output/dir\n",
      );
    });

    it("clears spinner line on onPreview", () => {
      vi.useFakeTimers();
      const { reporter, getOutput } = createTTYReporter();
      reporter.onStart("my-pack.zip");
      reporter.onPreview();
      expect(stripAnsi(getOutput())).toContain("Would export 0 samples\n");
    });
  });

  describe("onPreview", () => {
    it("writes 'Would export 0 samples' with no suffix when nothing was written", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onPreview();
      expect(stripAnsi(getOutput())).toBe("Would export 0 samples\n");
    });

    it("uses singular 'sample' when count is 1", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav");
      reporter.onPreview();
      expect(stripAnsi(getOutput())).toContain("Would export 1 sample\n");
    });

    it("includes reject count when rejections > 0", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav");
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav");
      reporter.onReject(createEntry("kick.wav"), "Missing sampleType");
      reporter.onPreview();
      expect(stripAnsi(getOutput())).toContain(
        "Would export 2 samples (1 sample rejected)\n",
      );
    });

    it("uses plural 'samples' when reject count > 1", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav");
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav");
      reporter.onReject(createEntry("kick.wav"), "Missing sampleType");
      reporter.onReject(createEntry("snare.wav"), "Missing sampleType");
      reporter.onReject(createEntry("hat.wav"), "Missing sampleType");
      reporter.onPreview();
      expect(stripAnsi(getOutput())).toContain(
        "Would export 2 samples (3 samples rejected)\n",
      );
    });

    it("includes skip count when skips > 0", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav");
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav");
      reporter.onSkip(createEntry("kick.wav"));
      reporter.onPreview();
      expect(stripAnsi(getOutput())).toContain(
        "Would export 2 samples (1 entry skipped)\n",
      );
    });

    it("uses plural 'entries' when skip count > 1", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav");
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav");
      reporter.onSkip(createEntry("kick.wav"));
      reporter.onSkip(createEntry("snare.wav"));
      reporter.onSkip(createEntry("hat.wav"));
      reporter.onPreview();
      expect(stripAnsi(getOutput())).toContain(
        "Would export 2 samples (3 entries skipped)\n",
      );
    });

    it("includes both reject and skip counts", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav");
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav");
      reporter.onReject(createEntry("kick.wav"), "Missing sampleType");
      reporter.onSkip(createEntry("snare.wav"));
      reporter.onSkip(createEntry("hat.wav"));
      reporter.onPreview();
      expect(stripAnsi(getOutput())).toContain(
        "Would export 2 samples (1 sample rejected, 2 entries skipped)\n",
      );
    });
  });
});
