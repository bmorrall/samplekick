import { execSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { beforeAll, describe, expect, it } from "vitest";
import packageJson from "../package.json" with { type: "json" };
const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("samplekick CLI", () => {
  beforeAll(() => {
    execSync("pnpm build", {
      cwd: resolve(import.meta.dirname, ".."),
    });
  });

  describe("argument validation", () => {
    it("prints help and exits with code 0 when no arguments are supplied", () => {
      const result = spawnSync("node", [CLI_PATH], { encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(`samplekick/${packageJson.version}`);
      expect(result.stdout).toContain("Usage:");
    });

    it("exits with code 1 and prints an error when the zip-file argument is missing", () => {
      const result = spawnSync("node", [CLI_PATH, "-o", "/tmp/out"], { encoding: "utf8" });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("<zip-file>");
    });

    it("prints help and exits with code 0 when --help is passed", () => {
      const result = spawnSync("node", [CLI_PATH, "--help"], { encoding: "utf8" });
      expect(result.status).toBe(0);
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
          "                          (omit to dump JSON config to stdout)",
          "  -c, --config <path>     Load a JSON config file to apply to the pack",
          "  -w, --write <path>      Write the pack config as JSON to a file",
          "  -d, --device <name>     Apply a device preset",
          "      --allow-junk        Keep junk entries (e.g. __MACOSX, hidden files)",
          "      --debug             Print pack string representation to stdout",
          "                          without writing any files",
          "      --verbose           Show inherited tags on all nodes in debug output",
          "  -v, --version           Show version number",
          "  -h, --help              Show this help message",
          "",
          "Devices:",
          "  sp404mk2, sp404, 404    Roland SP-404MKII",
        ].join("\n"),
      );
    });

    it("prints help and exits with code 0 when -h is passed", () => {
      const result = spawnSync("node", [CLI_PATH, "-h"], { encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(`samplekick/${packageJson.version}`);
      expect(result.stdout).toContain("Usage:");
    });

    it("prints version and exits with code 0 when --version is passed", () => {
      const result = spawnSync("node", [CLI_PATH, "--version"], { encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout.trim()).toBe(packageJson.version);
    });

    it("prints version and exits with code 0 when -v is passed", () => {
      const result = spawnSync("node", [CLI_PATH, "-v"], { encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout.trim()).toBe(packageJson.version);
    });
  });

  describe("error handling", () => {
    it("exits with code 1 and prints an error when the zip file does not exist", async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
      const zipPath = join(tmpDir, "nonexistent.zip");

      try {
        const result = spawnSync("node", [CLI_PATH, zipPath], { encoding: "utf8" });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Error: file not found");
        expect(result.stderr).toContain("nonexistent.zip");
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
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Error: not a valid zip file");
        expect(result.stderr).toContain("invalid.zip");
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
          [CLI_PATH, zipPath, "--config", join(tmpDir, "nonexistent.json")],
          { encoding: "utf8" },
        );
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Error: config file not found");
        expect(result.stderr).toContain("nonexistent.json");
      } finally {
        await rm(tmpDir, { recursive: true });
      }
    });

    it("exits with code 1 and prints an error when the --config file is not valid JSON", async () => {
      const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
      const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
      const zipPath = join(tmpDir, "test-pack.zip");
      const configPath = join(tmpDir, "config.json");

      try {
        await writeFile(zipPath, zipped);
        await writeFile(configPath, "not valid json");

        const result = spawnSync("node", [CLI_PATH, zipPath, "--config", configPath], { encoding: "utf8" });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Error: config file is not valid JSON");
        expect(result.stderr).toContain("config.json");
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

        const result = spawnSync("node", [CLI_PATH, zipPath, "--write", writePath], { encoding: "utf8" });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Error: could not write to");
        expect(result.stderr).toContain("config.json");
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

        const result = spawnSync("node", [CLI_PATH, zipPath, "-o", outputPath], { encoding: "utf8" });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Error: could not export to");
        expect(result.stderr).toContain("output");
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
    const config = JSON.stringify([
      { path: "Drums/kick.wav", name: "kick_01.wav" },
    ]);

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.json");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--config", configPath, "--debug"], { encoding: "utf8" });
      expect(result.status).toBe(0);

      const expected = [
        "test-pack.zip",
        "├── Drums",
        "│   └── kick_01.wav [renamed]",
        "└── Loops",
        "    └── bass.wav",
      ].join("\n");
      expect(result.stdout.trim()).toBe(expected);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("prints registry tree with inherited tags when --debug --verbose is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });
    const config = JSON.stringify([
      { path: "Drums", packageName: "my-pack", sampleType: "Percussion" },
      { path: "Drums/kick.wav", name: "kick_01.wav" },
    ]);

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.json");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--config", configPath, "--debug", "--verbose"],
        { encoding: "utf8" },
      );
      expect(result.status).toBe(0);

      const expected = [
        "test-pack.zip",
        "├── Drums [pkg:my-pack, type:Percussion]",
        "│   └── kick_01.wav [renamed, pkg:my-pack, type:Percussion, orig:kick.wav]",
        "└── Loops",
        "    └── bass.wav",
      ].join("\n");
      expect(result.stdout.trim()).toBe(expected);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("dumps registry config as JSON to stdout when --output is omitted", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
      ".DS_Store": strToU8("junk"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath], { encoding: "utf8" });
      expect(result.status).toBe(0);

      const parsed: unknown = JSON.parse(result.stdout);
      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(4);
      expect(parsed).toContainEqual(expect.objectContaining({ path: "Drums/kick.wav" }));
      expect(parsed).toContainEqual(expect.objectContaining({ path: "Loops/bass.wav" }));
      expect(parsed).toContainEqual(expect.objectContaining({ path: ".DS_Store", isSkipped: true }));
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("writes registry config as JSON to a file when --write is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.json");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--write", configPath], { encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toBeInstanceOf(Array);

      const parsed: unknown = JSON.parse(await readFile(configPath, "utf8"));
      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toContainEqual(expect.objectContaining({ path: "Drums/kick.wav" }));
      expect(parsed).toContainEqual(expect.objectContaining({ path: "Loops/bass.wav" }));
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
    const configPath = join(tmpDir, "config.json");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "-w", configPath, "-o", outputDir], { encoding: "utf8" });
      expect(result.status).toBe(0);

      const parsed: unknown = JSON.parse(await readFile(configPath, "utf8"));
      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toContainEqual(expect.objectContaining({ path: "Drums/kick.wav" }));

      expect(await readFile(join(outputDir, "Drums/kick.wav"), "utf8")).toBe("kick-data");
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

      execSync(`node ${CLI_PATH} "${zipPath}" -o "${outputDir}"`);

      expect(await readFile(join(outputDir, "Drums/kick.wav"), "utf8")).toBe("kick-data");
      expect(await readFile(join(outputDir, "Drums/snare.wav"), "utf8")).toBe("snare-data");
      expect(await readFile(join(outputDir, "Loops/bass.wav"), "utf8")).toBe("bass-data");
      await expect(stat(join(outputDir, "__MACOSX/Drums/._kick.wav"))).rejects.toThrow();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("applies config from a JSON file when --config is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });

    const config = JSON.stringify([
      { path: "Drums/kick.wav", name: "My Kick.wav" },
      { path: "Loops/bass.wav", isSkipped: true },
    ]);

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.json");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--config", configPath, "-o", outputDir], { encoding: "utf8" });
      expect(result.status).toBe(0);

      expect(await readFile(join(outputDir, "Drums/My Kick.wav"), "utf8")).toBe("kick-data");
      await expect(stat(join(outputDir, "Drums/kick.wav"))).rejects.toThrow();
      await expect(stat(join(outputDir, "Loops/bass.wav"))).rejects.toThrow();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("applies config from a JSON file when -c is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
    });

    const config = JSON.stringify([
      { path: "Drums/kick.wav", packageName: "Percussion" },
    ]);

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.json");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      const result = spawnSync("node", [CLI_PATH, zipPath, "-c", configPath], { encoding: "utf8" });
      expect(result.status).toBe(0);

      const parsed: unknown = JSON.parse(result.stdout);
      expect(parsed).toContainEqual(expect.objectContaining({ path: "Drums/kick.wav", packageName: "Percussion" }));
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

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

      execSync(`node ${CLI_PATH} "${zipPath}" --allow-junk -o "${outputDir}"`);

      expect(await readFile(join(outputDir, "Drums/kick.wav"), "utf8")).toBe("kick-data");
      expect(await readFile(join(outputDir, "__MACOSX/Drums/._kick.wav"), "utf8")).toBe("junk");
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
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("unknown-device");
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

          const result = spawnSync("node", [CLI_PATH, zipPath, "--device", deviceAlias, "-o", outputDir], {
            encoding: "utf8",
          });
          expect(result.status).toBe(0);

          expect(await readFile(join(outputDir, "Drums/snare.wav"), "utf8")).toBe("snare-data");
          expect(await readFile(join(outputDir, "Loops/hi_hat.wav"), "utf8")).toBe("hihat-data");
        } finally {
          await rm(tmpDir, { recursive: true });
        }
      },
    );

    it("applies config using original paths after --device transforms", async () => {
      const zipped = zipSync({
        "Dr\u00fcms/kick.wav": strToU8("kick-data"),
      });

      const config = JSON.stringify([{ path: "Dr\u00fcms/kick.wav", name: "custom.wav" }]);

      const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
      const zipPath = join(tmpDir, "test-pack.zip");
      const configPath = join(tmpDir, "config.json");
      const outputDir = join(tmpDir, "output");

      try {
        await writeFile(zipPath, zipped);
        await writeFile(configPath, config);

        const result = spawnSync(
          "node",
          [CLI_PATH, zipPath, "--device", "sp404mk2", "--config", configPath, "-o", outputDir],
          { encoding: "utf8" },
        );
        expect(result.status).toBe(0);

        expect(await readFile(join(outputDir, "Drums/custom.wav"), "utf8")).toBe("kick-data");
      } finally {
        await rm(tmpDir, { recursive: true });
      }
    });

    it("shows Devices section in help text with aliases and full name", () => {
      const result = spawnSync("node", [CLI_PATH, "--help"], { encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Devices:");
      expect(result.stdout).toContain("Roland SP-404MKII");
      expect(result.stdout).toContain("sp404mk2");
      expect(result.stdout).toContain("sp404");
      expect(result.stdout).toContain("404");
    });
  });
});
