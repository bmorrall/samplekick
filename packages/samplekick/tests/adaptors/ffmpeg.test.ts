import { describe, expect, it, vi } from "vitest";
import { getFfmpegVersion } from "../../src/adaptors/ffmpeg";

describe("getFfmpegVersion", () => {
  it("returns the first line from the version runner", async () => {
    const runner = vi.fn().mockResolvedValue("ffmpeg version 7.1 Copyright (c) 2000-2024 the FFmpeg developers");

    const result = await getFfmpegVersion(runner);

    expect(result).toBe("ffmpeg version 7.1 Copyright (c) 2000-2024 the FFmpeg developers");
    expect(runner).toHaveBeenCalledOnce();
  });

  it("propagates errors from the version runner", async () => {
    const err = Object.assign(new Error("spawn ffmpeg ENOENT"), { code: "ENOENT" });
    const runner = vi.fn().mockRejectedValue(err);

    await expect(getFfmpegVersion(runner)).rejects.toThrow("spawn ffmpeg ENOENT");
  });
});
