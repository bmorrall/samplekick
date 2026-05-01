import { homedir, tmpdir } from "node:os";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Registry, ZipDataSource } from "samplekick-io";
import { getDataDir, loadConfig } from "../src/config_loader";

const createRegistry = async (files: Record<string, string>): Promise<Registry> => {
  const entries = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)]));
  const dataSource = await ZipDataSource.fromBlob(new Blob([Buffer.from(zipSync(entries))]), "test.zip");
  return new Registry(dataSource);
};

describe("loadConfig", () => {
  let tmpDir = "";

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "samplekick-config-loader-"));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tmpDir, { recursive: true });
  });

  // Auto-persist mode (configPath === undefined)

  it("auto-persist: returns the auto config path based on the fingerprint", async () => {
    process.env.SAMPLEKICK_DATA_DIR = join(tmpDir, "data");
    const registry = await createRegistry({ "Drums/kick.wav": "data" });

    const result = await loadConfig(registry, undefined);

    delete process.env.SAMPLEKICK_DATA_DIR;
    expect(result).toBe(join(tmpDir, "data", `${registry.getFingerprint()}.json`));
  });

  it("auto-persist: does not load any config when no auto-saved file exists", async () => {
    process.env.SAMPLEKICK_DATA_DIR = join(tmpDir, "data");
    const registry = await createRegistry({ "Drums/kick.wav": "data" });
    const loadConfigSpy = vi.spyOn(registry, "loadConfig");

    await loadConfig(registry, undefined);

    delete process.env.SAMPLEKICK_DATA_DIR;
    expect(loadConfigSpy).not.toHaveBeenCalled();
  });

  it("auto-persist: loads config from the auto-saved file when it exists", async () => {
    const dataDir = join(tmpDir, "data");
    process.env.SAMPLEKICK_DATA_DIR = dataDir;
    const registry = await createRegistry({ "Drums/kick.wav": "data" });
    await mkdir(dataDir, { recursive: true });
    await writeFile(
      join(dataDir, `${registry.getFingerprint()}.json`),
      JSON.stringify([{ path: "Drums/kick.wav", name: "custom.wav" }]),
    );

    await loadConfig(registry, undefined);

    delete process.env.SAMPLEKICK_DATA_DIR;
    const entries: string[] = [];
    registry.eachConfigEntry((e) => { entries.push(e.getName()); });
    expect(entries).toContain("custom.wav");
  });

  it("auto-persist: silently ignores a corrupt auto-saved file (SyntaxError)", async () => {
    const dataDir = join(tmpDir, "data");
    process.env.SAMPLEKICK_DATA_DIR = dataDir;
    const registry = await createRegistry({ "Drums/kick.wav": "data" });
    await mkdir(dataDir, { recursive: true });
    await writeFile(join(dataDir, `${registry.getFingerprint()}.json`), "not valid json");

    await expect(loadConfig(registry, undefined)).resolves.not.toThrow();

    delete process.env.SAMPLEKICK_DATA_DIR;
  });

  // Explicit config mode (configPath provided)

  it("explicit config: returns undefined", async () => {
    const registry = await createRegistry({ "Drums/kick.wav": "data" });
    const configPath = join(tmpDir, "config.json");
    await writeFile(configPath, JSON.stringify([{ path: "Drums/kick.wav", name: "explicit.wav" }]));

    const result = await loadConfig(registry, configPath);

    expect(result).toBeUndefined();
  });

  it("explicit config: loads config from the provided file", async () => {
    const registry = await createRegistry({ "Drums/kick.wav": "data" });
    const configPath = join(tmpDir, "config.json");
    await writeFile(configPath, JSON.stringify([{ path: "Drums/kick.wav", name: "explicit.wav" }]));

    await loadConfig(registry, configPath);

    const entries: string[] = [];
    registry.eachConfigEntry((e) => { entries.push(e.getName()); });
    expect(entries).toContain("explicit.wav");
  });

  it("explicit config: calls process.exit(1) when the file does not exist", async () => {
    const registry = await createRegistry({ "Drums/kick.wav": "data" });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("process.exit"); });

    await expect(loadConfig(registry, join(tmpDir, "nonexistent.json"))).rejects.toThrow("process.exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("explicit config: calls process.exit(1) when the file is not valid JSON", async () => {
    const registry = await createRegistry({ "Drums/kick.wav": "data" });
    const configPath = join(tmpDir, "config.json");
    await writeFile(configPath, "not valid json");
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("process.exit"); });

    await expect(loadConfig(registry, configPath)).rejects.toThrow("process.exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe("getDataDir", () => {
  const home = homedir();

  it("returns XDG_DATA_HOME/<appName> on linux when XDG_DATA_HOME is set", () => {
    vi.stubEnv("XDG_DATA_HOME", "/custom/data");
    Object.defineProperty(process, "platform", { value: "linux", configurable: true });
    expect(getDataDir("myapp")).toBe("/custom/data/myapp");
    vi.unstubAllEnvs();
    Object.defineProperty(process, "platform", { value: process.platform, configurable: true });
  });

  it("returns ~/.local/share/<appName> on linux when XDG_DATA_HOME is not set", () => {
    vi.stubEnv("XDG_DATA_HOME", undefined);
    Object.defineProperty(process, "platform", { value: "linux", configurable: true });
    expect(getDataDir("myapp")).toBe(join(home, ".local", "share", "myapp"));
    vi.unstubAllEnvs();
    Object.defineProperty(process, "platform", { value: process.platform, configurable: true });
  });

  it("returns APPDATA/<appName> on win32 when APPDATA is set", () => {
    vi.stubEnv("APPDATA", "C:\\Users\\User\\AppData\\Roaming");
    Object.defineProperty(process, "platform", { value: "win32", configurable: true });
    expect(getDataDir("myapp")).toBe(join("C:\\Users\\User\\AppData\\Roaming", "myapp"));
    vi.unstubAllEnvs();
    Object.defineProperty(process, "platform", { value: process.platform, configurable: true });
  });

  it("returns ~/AppData/Roaming/<appName> on win32 when APPDATA is not set", () => {
    vi.stubEnv("APPDATA", undefined);
    Object.defineProperty(process, "platform", { value: "win32", configurable: true });
    expect(getDataDir("myapp")).toBe(join(home, "AppData", "Roaming", "myapp"));
    vi.unstubAllEnvs();
    Object.defineProperty(process, "platform", { value: process.platform, configurable: true });
  });

  it("returns ~/Library/Application Support/<appName> on macOS", () => {
    Object.defineProperty(process, "platform", { value: "darwin", configurable: true });
    expect(getDataDir("myapp")).toBe(join(home, "Library", "Application Support", "myapp"));
    Object.defineProperty(process, "platform", { value: process.platform, configurable: true });
  });
});
