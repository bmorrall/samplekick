import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";
import packageJson from "../package.json" with { type: "json" };
const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("samplekick CLI", () => {
  describe("argument validation", () => {
    it("prints help and exits with code 0 when no arguments are supplied", () => {
      const result = spawnSync("node", [CLI_PATH], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      expect(result.stdout).toContain(`samplekick/${packageJson.version}`);
      expect(result.stdout).toContain("Usage:");

      expect(result.status).toBe(0);
    });

    it("exits with code 1 and prints an error when the zip-file argument is missing", () => {
      const result = spawnSync("node", [CLI_PATH, "-o", "/tmp/out"], {
        encoding: "utf8",
      });

      expect(result.stderr).toContain("<zip-file>");

      expect(result.status).toBe(1);
    });

    it("prints help and exits with code 0 when --help is passed", () => {
      const result = spawnSync("node", [CLI_PATH, "--help"], {
        encoding: "utf8",
      });

      expect(result.stderr).toBe("");
      expect(result.stdout.trim()).toBe(
        [
          `samplekick/${packageJson.version}`,
          "",
          "Usage: samplekick <zip-file> [zip-file...] [-o <output-dir>]",
          "",
          "Arguments:",
          "  <zip-file> [zip-file...]  One or more input ZIP files",
          "",
          "Options:",
          "  -o, --output <path>     Export samples to a directory",
          "                          Omit to preview changes without writing files",
          "  -a, --analyse           Analyse pack and save to the auto-config",
          "  -s, --sanitise          Normalise entry names (trim, spacing, dashes, tags)",
          "  -d, --device <name>     Apply device-specific transforms to sample names",
          "  -c, --convert           Convert audio files to device format",
          "      --allow-junk        Keep junk entries (e.g. __MACOSX, hidden files)",
          "      --keep-parents      Preserve parent folders for all directories with files",
          "      --preserve-paths    Export to original source paths (skip organising)",
          "      --squash            Convert names to camelCase after device transforms",
          "      --debug             Print the pack structure to stdout for inspection",
          "      --edit              Open the active config file in $VISUAL/$EDITOR",
          "      --config <path>     Load a CSV config file to apply to the pack",
          "      --write-config <path>",
          "                          Write the pack config as CSV to a file",
          "      --dump-config       Print the pack config as CSV to stdout, with device",
          "                          and squash transforms applied",
          "      --bake              Save the transformed config as the auto-config so",
          "                          transforms are applied automatically on the next run",
          "      --rebuild           Ignore the auto-config and analyse from scratch",
          '      --no-packs          Reject files tagged as Packs (sampleType = "Packs")',
          "      --verbose           Show skipped files, config paths, and inherited tags",
          "      --quiet             Only show errors (suppress per-file success lines)",
          "  -v, --version           Show version number",
          "  -h, --help              Show this help message",
          "",
          "Devices:",
          "  dirtywavem8             Dirtywave M8 (converts to 16-bit 44.1 kHz)",
          "    dirtywave, m8",
          "  sp404mk2                Roland SP-404MKII (converts to 16-bit 48 kHz)",
          "    sp404, 404",
        ].join("\n"),
      );

      expect(result.status).toBe(0);
    });

    it("prints help and exits with code 0 when -h is passed", () => {
      const result = spawnSync("node", [CLI_PATH, "-h"], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      expect(result.stdout).toContain(`samplekick/${packageJson.version}`);
      expect(result.stdout).toContain("Usage:");

      expect(result.status).toBe(0);
    });

    it("prints version and exits with code 0 when --version is passed", () => {
      const result = spawnSync("node", [CLI_PATH, "--version"], {
        encoding: "utf8",
      });

      expect(result.stderr).toBe("");
      expect(result.stdout.trim()).toBe(packageJson.version);

      expect(result.status).toBe(0);
    });

    it("prints version and exits with code 0 when -v is passed", () => {
      const result = spawnSync("node", [CLI_PATH, "-v"], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      expect(result.stdout.trim()).toBe(packageJson.version);

      expect(result.status).toBe(0);
    });
  });

  it("dumps registry config as CSV to stdout when --dump-config is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
      ".DS_Store": strToU8("junk"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--dump-config"], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      const lines = result.stdout.trim().split("\n");
      expect(lines).toHaveLength(7);
      expect(lines[1]).toBe(",,test-pack.zip,,,");
      expect(lines[2]).toBe(".DS_Store,,,,,true");
      expect(lines[3]).toBe("Drums,,,,,");
      expect(lines[4]).toBe("Drums/kick.wav,,,,,");
      expect(lines[5]).toBe("Loops,,,,,");
      expect(lines[6]).toBe("Loops/bass.wav,,,,,");

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("processes a zip file and outputs files to the target directory", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Drums/snare.wav": strToU8("snare-data"),
      "Loops/bass.wav": strToU8("bass-data"),
      "__MACOSX/Drums/._kick.wav": strToU8("junk"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--preserve-paths", "-o", outputDir],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
        },
      );

      expect(result.stderr).toBe("");
      expect(await readFile(join(outputDir, "Drums/kick.wav"), "utf8")).toBe(
        "kick-data",
      );
      expect(await readFile(join(outputDir, "Drums/snare.wav"), "utf8")).toBe(
        "snare-data",
      );
      expect(await readFile(join(outputDir, "Loops/bass.wav"), "utf8")).toBe(
        "bass-data",
      );
      await expect(
        stat(join(outputDir, "__MACOSX/Drums/._kick.wav")),
      ).rejects.toThrow();
      expect(result.stdout).not.toContain("skipped:");

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("logs skipped junk entries when --verbose is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Drums/.DS_Store": strToU8("junk"),
      "__MACOSX/Drums/._kick.wav": strToU8("junk"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--verbose", "--preserve-paths", "-o", outputDir],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
        },
      );

      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("skipped: Drums/.DS_Store");
      expect(result.stdout).toContain("skipped: __MACOSX (1 file)");
      expect(result.stdout).not.toContain("skipped: __MACOSX/Drums/._kick.wav");
      await expect(
        stat(join(outputDir, "__MACOSX/Drums/._kick.wav")),
      ).rejects.toThrow();

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
