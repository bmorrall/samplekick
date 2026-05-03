import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("samplekick CLI flags", () => {
  it("outputs junk entries when --allow-junk is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "__MACOSX/Drums/._kick.wav": strToU8("junk"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--allow-junk", "--preserve-paths", "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      expect(await readFile(join(outputDir, "Drums/kick.wav"), "utf8")).toBe("kick-data");
      expect(await readFile(join(outputDir, "__MACOSX/Drums/._kick.wav"), "utf8")).toBe("junk");

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  describe("--device flag", () => {
    it("exits with code 1 and prints an error when an unknown device is passed", async () => {
      const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
      const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
      const zipPath = join(tmpDir, "test-pack.zip");

      try {
        await writeFile(zipPath, zipped);

        const result = spawnSync("node", [CLI_PATH, zipPath, "--device", "unknown-device"], { encoding: "utf8" });

        expect(result.stderr).toContain("unknown-device");

        expect(result.status).toBe(1);
      } finally {
        await rm(tmpDir, { recursive: true });
      }
    });

    it.each([["sp404mk2"], ["sp404"], ["404"]])(
      "sanitizes filenames for the SP-404MKII when --device %s is passed",
      async (deviceAlias) => {
        const zipped = zipSync({
          "Dr\u00fcms/sn\u00e2re.wav": strToU8("snare-data"),
          "Loops/hi-hat.wav": strToU8("hihat-data"),
        });

        const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
        const zipPath = join(tmpDir, "test-pack.zip");
        const outputDir = join(tmpDir, "output");

        try {
          await writeFile(zipPath, zipped);

          const result = spawnSync("node", [CLI_PATH, zipPath, "--device", deviceAlias, "--preserve-paths", "-o", outputDir], {
            encoding: "utf8",
            env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
          });

          expect(result.stderr).toBe("");
          expect(await readFile(join(outputDir, "Drums/snare.wav"), "utf8")).toBe("snare-data");
          expect(await readFile(join(outputDir, "Loops/hi-hat.wav"), "utf8")).toBe("hihat-data");

          expect(result.status).toBe(0);
        } finally {
          await rm(tmpDir, { recursive: true });
        }
      },
    );

    it("applies config using original paths after --device transforms", async () => {
      const zipped = zipSync({
        "Dr\u00fcms/kick.wav": strToU8("kick-data"),
      });

      const config = [
        "path,name,packageName,sampleType,skip,keepPath",
        "Dr\u00fcms/kick.wav,custom.wav,,,,",
      ].join("\n");

      const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
      const zipPath = join(tmpDir, "test-pack.zip");
      const configPath = join(tmpDir, "config.csv");
      const outputDir = join(tmpDir, "output");

      try {
        await writeFile(zipPath, zipped);
        await writeFile(configPath, config);

        const result = spawnSync(
          "node",
          [CLI_PATH, zipPath, "--device", "sp404mk2", "--config", configPath, "--preserve-paths", "-o", outputDir],
          { encoding: "utf8" },
        );

        expect(result.stderr).toBe("");
        expect(await readFile(join(outputDir, "Drums/custom.wav"), "utf8")).toBe("kick-data");

        expect(result.status).toBe(0);
      } finally {
        await rm(tmpDir, { recursive: true });
      }
    });

    it("shows Devices section in help text with aliases and full name", () => {
      const result = spawnSync("node", [CLI_PATH, "--help"], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("Devices:");
      expect(result.stdout).toContain("Roland SP-404MKII");
      expect(result.stdout).toContain("sp404mk2");
      expect(result.stdout).toContain("sp404");
      expect(result.stdout).toContain("404");

      expect(result.status).toBe(0);
    });
  });
});
