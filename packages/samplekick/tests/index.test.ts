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
      const result = spawnSync("node", [CLI_PATH, "-o", "/tmp/out"], { encoding: "utf8" });

      expect(result.stderr).toContain("<zip-file>");

      expect(result.status).toBe(1);
    });

    it("prints help and exits with code 0 when --help is passed", () => {
      const result = spawnSync("node", [CLI_PATH, "--help"], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      expect(result.stdout.trim()).toBe(
        [
          `samplekick/${packageJson.version}`,
          "",
          "Usage: samplekick <zip-file> [-o <output-dir>]",
          "",
          "Arguments:",
          "  <zip-file>              Path to the input ZIP file",
          "",
          "Options:",
          "  -o, --output <path>     Export samples to a directory",
          "                          (omit to dump CSV config to stdout)",
          "  -c, --config <path>     Load a CSV config file to apply to the pack",
          "  -w, --write <path>      Write the pack config as CSV to a file",
          "  -d, --device <name>     Apply a device preset",
          "      --convert           Convert audio files to 16-bit 48 kHz WAV",
          "      --allow-junk        Keep junk entries (e.g. __MACOSX, hidden files)",
          "      --debug             Print pack string representation to stdout",
          "                          without writing any files",
          "      --edit              Open the auto-config file in $VISUAL/$EDITOR",
          "      --verbose           Show inherited tags on all nodes in debug output",
          "      --quiet             Only show errors (suppress per-file success lines)",
          "  -v, --version           Show version number",
          "  -h, --help              Show this help message",
          "",
          "Devices:",
          "  sp404mk2, sp404, 404    Roland SP-404MKII",
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
      const result = spawnSync("node", [CLI_PATH, "--version"], { encoding: "utf8" });

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

  describe("error handling", () => {
    it("exits with code 1 and prints an error when the zip file does not exist", async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
      const zipPath = join(tmpDir, "nonexistent.zip");

      try {
        const result = spawnSync("node", [CLI_PATH, zipPath], { encoding: "utf8" });

        expect(result.stderr).toContain("Error: file not found");
        expect(result.stderr).toContain("nonexistent.zip");

        expect(result.status).toBe(1);
      } finally {
        await rm(tmpDir, { recursive: true });
      }
    });

    it("exits with code 1 and prints an error when the zip file is not a valid zip", async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
      const zipPath = join(tmpDir, "invalid.zip");

      try {
        await writeFile(zipPath, "not a zip file");

        const result = spawnSync("node", [CLI_PATH, zipPath], { encoding: "utf8" });

        expect(result.stderr).toContain("Error: not a valid zip file");
        expect(result.stderr).toContain("invalid.zip");

        expect(result.status).toBe(1);
      } finally {
        await rm(tmpDir, { recursive: true });
      }
    });

    it("exits with code 1 and prints an error when the --config file does not exist", async () => {
      const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
      const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
      const zipPath = join(tmpDir, "test-pack.zip");

      try {
        await writeFile(zipPath, zipped);

        const result = spawnSync(
          "node",
          [CLI_PATH, zipPath, "--config", join(tmpDir, "nonexistent.csv")],
          { encoding: "utf8" },
        );

        expect(result.stderr).toContain("Error: config file not found");
        expect(result.stderr).toContain("nonexistent.csv");

        expect(result.status).toBe(1);
      } finally {
        await rm(tmpDir, { recursive: true });
      }
    });

    it("exits with code 1 and prints an error when the --write path is not writable", async () => {
      const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
      const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
      const zipPath = join(tmpDir, "test-pack.zip");
      const writePath = join(tmpDir, "nonexistent-subdir", "config.json");

      try {
        await writeFile(zipPath, zipped);

        const result = spawnSync("node", [CLI_PATH, zipPath, "--write", writePath], {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
        });

        expect(result.stderr).toContain("Error: could not write to");
        expect(result.stderr).toContain("config.json");

        expect(result.status).toBe(1);
      } finally {
        await rm(tmpDir, { recursive: true });
      }
    });

    it("exits with code 1 and prints an error when the --output path is not writable", async () => {
      const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
      const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
      const zipPath = join(tmpDir, "test-pack.zip");
      // Create a file at the output path so mkdir inside it fails with ENOTDIR
      const outputPath = join(tmpDir, "output");

      try {
        await writeFile(zipPath, zipped);
        await writeFile(outputPath, "not a directory");

        const result = spawnSync("node", [CLI_PATH, zipPath, "-o", outputPath], {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
        });

        expect(result.stderr).toContain("Error: could not export to");
        expect(result.stderr).toContain("output");

        expect(result.status).toBe(1);
      } finally {
        await rm(tmpDir, { recursive: true });
      }
    });
  });

  it("prints registry tree to stdout and exits with code 0 when --debug is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });
    const config = [
      "path,name,packageName,sampleType,skip,keepPath",
      "Drums/kick.wav,kick_01.wav,,,,",
    ].join("\n");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--config", configPath, "--debug"], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      const expected = [
        "test-pack.zip",
        "├── Drums",
        "│   └── kick_01.wav [renamed]",
        "└── Loops",
        "    └── bass.wav",
      ].join("\n");
      expect(result.stdout.trim()).toBe(expected);

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("prints registry tree with inherited tags when --debug --verbose is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });
    const config = [
      "path,name,packageName,sampleType,skip,keepPath",
      "Drums,,my-pack,Percussion,,",
      "Drums/kick.wav,kick_01.wav,,,,",
    ].join("\n");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");

    try {
      await writeFile(zipPath, zipped);

      await writeFile(configPath, config);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--config", configPath, "--debug", "--verbose"],
        { encoding: "utf8" },
      );

      expect(result.stderr).toBe("");
      const expected = [
        "test-pack.zip",
        "├── Drums [pkg:my-pack, type:Percussion]",
        "│   └── kick_01.wav [renamed, pkg:my-pack, type:Percussion, orig:kick.wav]",
        "└── Loops",
        "    └── bass.wav",
      ].join("\n");
      expect(result.stdout.trim()).toBe(expected);

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("dumps registry config as CSV to stdout when --output is omitted", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
      ".DS_Store": strToU8("junk"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      const lines = result.stdout.trim().split("\n");
      expect(lines[0]).toBe("path,name,packageName,sampleType,skip,keepPath");
      expect(lines).toHaveLength(5);
      expect(result.stdout).toContain("Drums/kick.wav");
      expect(result.stdout).toContain("Loops/bass.wav");
      expect(result.stdout).toContain(".DS_Store");
      expect(result.stdout).toContain("true");

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("writes registry config as CSV to a file when --write is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--write", configPath], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("path,name,packageName,sampleType,skip,keepPath");

      const fileContent = await readFile(configPath, "utf8");
      expect(fileContent).toContain("path,name,packageName,sampleType,skip,keepPath");
      expect(fileContent).toContain("Drums/kick.wav");
      expect(fileContent).toContain("Loops/bass.wav");

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("writes registry config to a file and exports samples when both -w and -o are passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "-w", configPath, "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      const fileContent = await readFile(configPath, "utf8");
      expect(fileContent).toContain("path,name,packageName,sampleType,skip,keepPath");
      expect(fileContent).toContain("Drums/kick.wav");

      expect(await readFile(join(outputDir, "Drums/kick.wav"), "utf8")).toBe("kick-data");

      expect(result.stdout).toContain("Drums/kick.wav");
      expect(result.stdout).toContain(`Exported 1 file to ${outputDir}`);

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

      const result = spawnSync("node", [CLI_PATH, zipPath, "-o", outputDir], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");
      expect(await readFile(join(outputDir, "Drums/kick.wav"), "utf8")).toBe("kick-data");
      expect(await readFile(join(outputDir, "Drums/snare.wav"), "utf8")).toBe("snare-data");
      expect(await readFile(join(outputDir, "Loops/bass.wav"), "utf8")).toBe("bass-data");
      await expect(stat(join(outputDir, "__MACOSX/Drums/._kick.wav"))).rejects.toThrow();

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("applies config from a CSV file when --config is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });

    const config = [
      "path,name,packageName,sampleType,skip,keepPath",
      "Drums/kick.wav,My Kick.wav,,,,",
      "Loops/bass.wav,,,,true,",
    ].join("\n");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--config", configPath, "-o", outputDir], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      expect(await readFile(join(outputDir, "Drums/My Kick.wav"), "utf8")).toBe("kick-data");
      await expect(stat(join(outputDir, "Drums/kick.wav"))).rejects.toThrow();
      await expect(stat(join(outputDir, "Loops/bass.wav"))).rejects.toThrow();

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("applies config from a CSV file when -c is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
    });

    const config = [
      "path,name,packageName,sampleType,skip,keepPath",
      "Drums/kick.wav,,Percussion,,,",
    ].join("\n");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      const result = spawnSync("node", [CLI_PATH, zipPath, "-c", configPath], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("Drums/kick.wav");
      expect(result.stdout).toContain("Percussion");

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
