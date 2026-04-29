import { execSync, spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { beforeAll, describe, expect, it } from "vitest";

const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");

describe("samplekick CLI --analyse flag", () => {
  beforeAll(() => {
    execSync("pnpm build", {
      cwd: resolve(import.meta.dirname, ".."),
    });
  });

  it.each([["--analyse"], ["-a"]])(
    "derives packageName from zip filename for the root entry when %s is passed",
    async (flag) => {
      const zipped = zipSync({ "kick.wav": strToU8("kick-data") });
      const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
      const zipPath = join(tmpDir, "test-pack.zip");

      try {
        await writeFile(zipPath, zipped);

        const result = spawnSync("node", [CLI_PATH, zipPath, flag], { encoding: "utf8" });
        expect(result.status).toBe(0);

        const parsed: unknown = JSON.parse(result.stdout);
        expect(parsed).toContainEqual(expect.objectContaining({ path: "", packageName: "test-pack" }));
      } finally {
        await rm(tmpDir, { recursive: true });
      }
    },
  );

  it("allows --config to override the derived packageName on the root entry", async () => {
    const zipped = zipSync({ "kick.wav": strToU8("kick-data") });
    const config = JSON.stringify([{ path: "", packageName: "my-custom-pack" }]);
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");
    const configPath = join(tmpDir, "config.json");

    try {
      await writeFile(zipPath, zipped);
      await writeFile(configPath, config);

      const result = spawnSync("node", [CLI_PATH, zipPath, "--analyse", "--config", configPath], { encoding: "utf8" });
      expect(result.status).toBe(0);

      const parsed: unknown = JSON.parse(result.stdout);
      expect(parsed).toContainEqual(expect.objectContaining({ path: "", packageName: "my-custom-pack" }));
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("does not set packageName on the root entry when --analyse is not passed", async () => {
    const zipped = zipSync({ "Drums/kick.wav": strToU8("kick-data") });
    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-cli-"));
    const zipPath = join(tmpDir, "test-pack.zip");

    try {
      await writeFile(zipPath, zipped);

      const result = spawnSync("node", [CLI_PATH, zipPath], { encoding: "utf8" });
      expect(result.status).toBe(0);

      const parsed: unknown = JSON.parse(result.stdout);
      expect(parsed).toContainEqual({ path: "", name: "test-pack.zip" });
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
