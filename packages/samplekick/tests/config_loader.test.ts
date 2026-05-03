import { homedir, tmpdir } from "node:os";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { zipSync, strToU8 } from "fflate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Registry, ZipDataSource } from "samplekick-io";
import { getDataDir, loadConfig, openConfigInEditor } from "../src/config_loader";

vi.mock("node:child_process", () => ({
  spawnSync: vi.fn(),
}));

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
    const registry = await createRegistry({ "Drums/kick.wav": "data" });
    const dataDir = join(tmpDir, "data");

    const result = await loadConfig(registry, undefined, dataDir);

    expect(result).toBe(join(dataDir, `${registry.getFingerprint()}.csv`));
  });

  it("auto-persist: does not load any config when no auto-saved file exists", async () => {
    const registry = await createRegistry({ "Drums/kick.wav": "data" });
    const loadConfigSpy = vi.spyOn(registry, "loadConfig");

    await loadConfig(registry, undefined, join(tmpDir, "data"));

    expect(loadConfigSpy).not.toHaveBeenCalled();
  });

  it("auto-persist: loads config from the auto-saved file when it exists", async () => {
    const dataDir = join(tmpDir, "data");
    const registry = await createRegistry({ "Drums/kick.wav": "data" });
    await mkdir(dataDir, { recursive: true });
    await writeFile(
      join(dataDir, `${registry.getFingerprint()}.csv`),
      [
        "path,name,packageName,sampleType,skip,keepPath",
        "Drums/kick.wav,custom.wav,,,,,",
      ].join("\n"),
    );

    await loadConfig(registry, undefined, dataDir);

    const entries: string[] = [];
    registry.eachConfigEntry((e) => { entries.push(e.getName()); });
    expect(entries).toContain("custom.wav");
  });

  it("auto-persist: throws when the auto-saved file is corrupt", async () => {
    const dataDir = join(tmpDir, "data");
    const registry = await createRegistry({ "Drums/kick.wav": "data" });
    await mkdir(dataDir, { recursive: true });
    await writeFile(join(dataDir, `${registry.getFingerprint()}.csv`), "not valid csv");

    await expect(loadConfig(registry, undefined, dataDir)).rejects.toThrow("auto-config could not be loaded");
  });

  // Explicit config mode (configPath provided)

  it("explicit config: returns undefined", async () => {
    const registry = await createRegistry({ "Drums/kick.wav": "data" });
    const configPath = join(tmpDir, "config.csv");
    await writeFile(configPath, [
      "path,name,packageName,sampleType,skip,keepPath",
      "Drums/kick.wav,explicit.wav,,,,",
    ].join("\n"));

    const result = await loadConfig(registry, configPath, tmpDir);

    expect(result).toBeUndefined();
  });

  it("explicit config: loads config from the provided file", async () => {
    const registry = await createRegistry({ "Drums/kick.wav": "data" });
    const configPath = join(tmpDir, "config.csv");
    await writeFile(configPath, [
      "path,name,packageName,sampleType,skip,keepPath",
      "Drums/kick.wav,explicit.wav,,,,",
    ].join("\n"));

    await loadConfig(registry, configPath, tmpDir);

    const entries: string[] = [];
    registry.eachConfigEntry((e) => { entries.push(e.getName()); });
    expect(entries).toContain("explicit.wav");
  });

  it("explicit config: throws when the file does not exist", async () => {
    const registry = await createRegistry({ "Drums/kick.wav": "data" });

    await expect(loadConfig(registry, join(tmpDir, "nonexistent.csv"), tmpDir)).rejects.toThrow("config file not found");
  });
});

describe("getDataDir", () => {
  const home = homedir();

  it("returns XDG_DATA_HOME/<appName> on linux when XDG_DATA_HOME is set", () => {
    expect(getDataDir("myapp", "linux", { XDG_DATA_HOME: "/custom/data" })).toBe("/custom/data/myapp");
  });

  it("returns ~/.local/share/<appName> on linux when XDG_DATA_HOME is not set", () => {
    expect(getDataDir("myapp", "linux", {})).toBe(join(home, ".local", "share", "myapp"));
  });

  it("returns APPDATA/<appName> on win32 when APPDATA is set", () => {
    expect(getDataDir("myapp", "win32", { APPDATA: "C:\\Users\\User\\AppData\\Roaming" })).toBe(join("C:\\Users\\User\\AppData\\Roaming", "myapp"));
  });

  it("returns ~/AppData/Roaming/<appName> on win32 when APPDATA is not set", () => {
    expect(getDataDir("myapp", "win32", {})).toBe(join(home, "AppData", "Roaming", "myapp"));
  });

  it("returns ~/Library/Application Support/<appName> on macOS", () => {
    expect(getDataDir("myapp", "darwin", {})).toBe(join(home, "Library", "Application Support", "myapp"));
  });
});

describe("openConfigInEditor", () => {
  afterEach(() => {
    vi.mocked(spawnSync).mockReset();
  });

  it("uses $VISUAL when set", () => {
    openConfigInEditor("/path/to/config.json", "darwin", { VISUAL: "nvim", EDITOR: "nano" });
    expect(spawnSync).toHaveBeenCalledWith("nvim", ["/path/to/config.json"], { stdio: "inherit" });
  });

  it("falls back to $EDITOR when $VISUAL is not set", () => {
    openConfigInEditor("/path/to/config.json", "darwin", { EDITOR: "nano" });
    expect(spawnSync).toHaveBeenCalledWith("nano", ["/path/to/config.json"], { stdio: "inherit" });
  });

  it("uses 'open -W' on macOS when no editor env var is set", () => {
    openConfigInEditor("/path/to/config.json", "darwin", {});
    expect(spawnSync).toHaveBeenCalledWith("open", ["-W", "/path/to/config.json"], { stdio: "inherit" });
  });

  it("uses 'xdg-open' on linux when no editor env var is set", () => {
    openConfigInEditor("/path/to/config.json", "linux", {});
    expect(spawnSync).toHaveBeenCalledWith("xdg-open", ["/path/to/config.json"], { stdio: "inherit" });
  });

  it("uses 'cmd /c start' on win32 when no editor env var is set", () => {
    openConfigInEditor("/path/to/config.json", "win32", {});
    expect(spawnSync).toHaveBeenCalledWith("cmd", ["/c", "start", "", "/path/to/config.json"], { stdio: "inherit" });
  });
});
