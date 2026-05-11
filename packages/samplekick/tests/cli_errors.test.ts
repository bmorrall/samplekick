import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("samplekick CLI error handling", () => {
  it("exits with code 1 and prints an error when the zip file does not exist", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "nonexistent.zip");

    try {
      const result = spawnSync("node", [CLI_PATH, zipPath], {
        encoding: "utf8",
      });

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

      const result = spawnSync("node", [CLI_PATH, zipPath], {
        encoding: "utf8",
      });

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

  it("exits with code 1 and prints an error when the --write-config path is not writable", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const writePath = join(tmpDir, "nonexistent-subdir", "config.json");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--write-config", writePath],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
        },
      );

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

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath, "--preserve-paths", "-o", outputPath],
        {
          encoding: "utf8",
          env: { ...process.env, SAMPLEKICK_DATA_DIR: join(tmpDir, "data") },
        },
      );

      expect(result.stderr).toContain("Error: could not export to");
      expect(result.stderr).toContain("output");

      expect(result.status).toBe(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exits with code 1 and prints an error when --config is used with multiple input files", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath1 = join(tmpDir, "pack1.zip");
    const zipPath2 = join(tmpDir, "pack2.zip");

    try {
      await writeFile(zipPath1, zipped);
      await writeFile(zipPath2, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath1, zipPath2, "--config", join(tmpDir, "config.csv")],
        { encoding: "utf8" },
      );

      expect(result.stderr).toContain(
        "Error: --config cannot be used with multiple input files",
      );
      expect(result.status).toBe(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exits with code 1 and prints an error when --write-config is used with multiple input files", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath1 = join(tmpDir, "pack1.zip");
    const zipPath2 = join(tmpDir, "pack2.zip");

    try {
      await writeFile(zipPath1, zipped);
      await writeFile(zipPath2, zipped);

      const result = spawnSync(
        "node",
        [
          CLI_PATH,
          zipPath1,
          zipPath2,
          "--write-config",
          join(tmpDir, "config.csv"),
        ],
        { encoding: "utf8" },
      );

      expect(result.stderr).toContain(
        "Error: --write-config cannot be used with multiple input files",
      );
      expect(result.status).toBe(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exits with code 1 and prints an error when --dump-config is used with multiple input files", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath1 = join(tmpDir, "pack1.zip");
    const zipPath2 = join(tmpDir, "pack2.zip");

    try {
      await writeFile(zipPath1, zipped);
      await writeFile(zipPath2, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath1, zipPath2, "--dump-config"],
        { encoding: "utf8" },
      );

      expect(result.stderr).toContain(
        "Error: --dump-config cannot be used with multiple input files",
      );
      expect(result.status).toBe(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exits with code 1 and prints an error when --edit is used with multiple input files", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath1 = join(tmpDir, "pack1.zip");
    const zipPath2 = join(tmpDir, "pack2.zip");

    try {
      await writeFile(zipPath1, zipped);
      await writeFile(zipPath2, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath1, zipPath2, "--edit"],
        { encoding: "utf8" },
      );

      expect(result.stderr).toContain(
        "Error: --edit cannot be used with multiple input files",
      );
      expect(result.status).toBe(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exits with code 1 and prints an error when --debug is used with multiple input files", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath1 = join(tmpDir, "pack1.zip");
    const zipPath2 = join(tmpDir, "pack2.zip");

    try {
      await writeFile(zipPath1, zipped);
      await writeFile(zipPath2, zipped);

      const result = spawnSync(
        "node",
        [CLI_PATH, zipPath1, zipPath2, "--debug"],
        { encoding: "utf8" },
      );

      expect(result.stderr).toContain(
        "Error: --debug cannot be used with multiple input files",
      );
      expect(result.status).toBe(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("exits with code 1 and prints a clean error when an unknown flag is passed", () => {
    const result = spawnSync("node", [CLI_PATH, "--unknown-flag"], {
      encoding: "utf8",
    });

    expect(result.stderr).toMatch(/^Error: /v);
    expect(result.stderr).toContain("--unknown-flag");
    expect(result.stderr).not.toContain("\n    at "); // no stack trace
    expect(result.status).toBe(1);
  });
});
