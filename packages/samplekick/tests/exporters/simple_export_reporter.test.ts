import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import type { ConfigEntry } from "samplekick-io";
import { SimpleExportReporter } from "../../src/exporters/simple_export_reporter";

const createEntry = (path: string): ConfigEntry => ({
  getPath: () => path,
  getName: () => path.split("/").pop() ?? path,
  getPackageName: () => undefined,
  getSampleType: () => undefined,
  isSkipped: () => undefined,
  isKeepStructure: () => undefined,
});

const createReporter = (): { reporter: SimpleExportReporter; getOutput: () => string } => {
  const stream = new PassThrough();
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer) => { chunks.push(chunk.toString()); });
  const reporter = new SimpleExportReporter(stream);
  const getOutput = (): string => chunks.join("");
  return { reporter, getOutput };
};

describe("SimpleExportReporter", () => {
  describe("onAfterWrite", () => {
    it("writes the destination path on success", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("drums/kick.wav"), "loops/my-pack/kick.wav");
      expect(getOutput()).toBe("loops/my-pack/kick.wav\n");
    });

    it("writes a failed message with the error on failure", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("drums/kick.wav"), "loops/my-pack/kick.wav", new Error("disk full"));
      expect(getOutput()).toBe("failed: loops/my-pack/kick.wav: disk full\n");
    });
  });

  describe("onComplete", () => {
    it("writes 'Exported to <dirPath>' when there are no errors", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onComplete("/output/dir");
      expect(getOutput()).toBe("Exported to /output/dir\n");
    });

    it("includes singular error count when there is 1 error", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
      reporter.onComplete("/output/dir");
      expect(getOutput()).toContain("Exported to /output/dir (1 error)\n");
    });

    it("includes plural error count when there are multiple errors", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav", new Error("fail"));
      reporter.onComplete("/output/dir");
      expect(getOutput()).toContain("Exported to /output/dir (2 errors)\n");
    });
  });
});
