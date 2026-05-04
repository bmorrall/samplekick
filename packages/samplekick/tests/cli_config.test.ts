import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";
const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("samplekick CLI", () => {
  it("writes registry config as CSV to a file when --write-config is passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--write-config", configPath], {
        encoding: "utf8",
        env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
      });

      expect(result.stderr).toBe("");

      const fileContent = await readFile(configPath, "utf8");
      expect(fileContent).toContain("path,name,packageName,sampleType,skip,keepPath");
      expect(fileContent).toContain("Drums/kick.wav");
      expect(fileContent).toContain("Loops/bass.wav");

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("writes registry config to a file and exports samples when both --write-config and -o are passed", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--write-config", configPath, "--preserve-paths", "-o", outputDir], {
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

      const result = spawnSync("node", [CLI_PATH, zipPath, "--config", configPath, "--preserve-paths", "-o", outputDir], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      expect(await readFile(join(outputDir, "Drums/My Kick.wav"), "utf8")).toBe("kick-data");
      await expect(stat(join(outputDir, "Drums/kick.wav"))).rejects.toThrow();
      await expect(stat(join(outputDir, "Loops/bass.wav"))).rejects.toThrow();

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("inherits skip from a folder row when exporting", async () => {
    const zipped = zipSync({
      "Drums/kick.wav": strToU8("kick-data"),
      "Loops/bass.wav": strToU8("bass-data"),
      "Loops/synth.wav": strToU8("synth-data"),
    });

    const config = [
      "path,name,packageName,sampleType,skip,keepPath",
      "Loops,,,,true,",
    ].join("\n");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.csv");
    const outputDir = join(tmpDir, "output");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--config", configPath, "--preserve-paths", "-o", outputDir], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      expect(await readFile(join(outputDir, "Drums/kick.wav"), "utf8")).toBe("kick-data");
      await expect(stat(join(outputDir, "Loops/bass.wav"))).rejects.toThrow();
      await expect(stat(join(outputDir, "Loops/synth.wav"))).rejects.toThrow();

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("outputs CSV to stdout when --dump-config is passed", async () => {
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

      const result = spawnSync("node", [CLI_PATH, zipPath, "--config", configPath, "--dump-config"], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("Drums/kick.wav");
      expect(result.stdout).toContain("Percussion");

      expect(result.status).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("excludes children of __MACOSX from the --dump-config CSV output", async () => {
    const zipped = zipSync({
      "__MACOSX/._kick.wav": strToU8("macosx-data"),
      "Drums/kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--dump-config"], { encoding: "utf8" });

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      const rows = result.stdout.trim().split("\n");
      const paths = rows.slice(1).map((row) => row.split(",")[0]);

      expect(paths).toContain("__MACOSX");
      expect(paths).not.toContain("__MACOSX/._kick.wav");
      expect(paths).toContain("Drums/kick.wav");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("excludes children of __MACOSX from the auto-config CSV saved by --analyse", async () => {
    const zipped = zipSync({
      "__MACOSX/._kick.wav": strToU8("macosx-data"),
      "Drums/kick.wav": strToU8("kick-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--analyse"],
        { encoding: "utf8", env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir } },
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      const rows = csv.trim().split("\n");
      const paths = rows.slice(1).map((row) => row.split(",")[0]);

      expect(paths).toContain("__MACOSX");
      expect(paths).not.toContain("__MACOSX/._kick.wav");
      expect(paths).toContain("Drums/kick.wav");

      const macosxRow = rows.find((row) => row.startsWith("__MACOSX,"));
      expect(macosxRow?.split(",")[4]).toBe("true");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("excludes children of a keepStructure directory from the auto-config CSV", async () => {
    const zipped = zipSync({
      "My Project/My Project.als": strToU8("als-data"),
      "My Project/samples/kick.wav": strToU8("kick-data"),
      "Drums/snare.wav": strToU8("snare-data"),
    });

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const dataDir = join(tmpDir, "data");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--analyse"],
        { encoding: "utf8", env: { ...process.env, SAMPLEKICK_DATA_DIR: dataDir } },
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);

      const [configFile] = await readdir(dataDir);
      const csv = await readFile(join(dataDir, configFile), "utf8");
      const rows = csv.trim().split("\n");
      const paths = rows.slice(1).map((row) => row.split(",")[0]);

      expect(paths).toContain("My Project");
      expect(paths).not.toContain("My Project/My Project.als");
      expect(paths).not.toContain("My Project/samples");
      expect(paths).not.toContain("My Project/samples/kick.wav");
      expect(paths).toContain("Drums/snare.wav");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
