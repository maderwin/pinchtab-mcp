import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { spawn } from "node:child_process";
import {
  cleanup,
  ensurePinchtabRunning,
  findPinchtabBin,
  isPinchtabRunning,
} from "../pinchtab/process.js";

vi.mock("../config.js", () => ({
  PINCHTAB_BIN: "/fake/pinchtab",
  PINCHTAB_TOKEN: "",
  PINCHTAB_URL: "http://127.0.0.1:9867",
}));

vi.mock("node:child_process", () => ({
  execSync: vi.fn().mockReturnValue(""),
  spawn: vi.fn().mockReturnValue({
    kill: vi.fn(),
    on: vi.fn(),
    stderr: { on: vi.fn() },
    unref: vi.fn(),
  }),
}));

vi.mock("node:fs", () => ({
  existsSync: vi.fn().mockReturnValue(false),
}));

describe("isPinchtabRunning", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when /health responds ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    await expect(isPinchtabRunning()).resolves.toBeTruthy();
  });

  it("returns false when /health responds not-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(isPinchtabRunning()).resolves.toBeFalsy();
  });

  it("returns false when fetch throws (connection refused)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));
    await expect(isPinchtabRunning()).resolves.toBeFalsy();
  });
});

describe("findPinchtabBin", () => {
  it("returns PINCHTAB_BIN when explicitly set in config", () => {
    // PINCHTAB_BIN is mocked as "/fake/pinchtab"
    expect(findPinchtabBin()).toBe("/fake/pinchtab");
  });

  it("falls back to local bin when PINCHTAB_BIN is empty and local exists", async () => {
    vi.resetModules();
    vi.doMock("../config.js", () => ({
      PINCHTAB_BIN: "",
      PINCHTAB_TOKEN: "",
      PINCHTAB_URL: "http://127.0.0.1:9867",
    }));
    vi.doMock("node:fs", () => ({
      existsSync: vi.fn().mockReturnValue(true),
    }));
    vi.doMock("node:child_process", () => ({
      execSync: vi.fn(),
      spawn: vi.fn(),
    }));

    const { findPinchtabBin: find } = await import("../pinchtab/process.js");
    const result = find();

    expect(result).toContain("pinchtab");
  });

  it("falls back to PATH when local bin not found", async () => {
    vi.resetModules();
    vi.doMock("../config.js", () => ({
      PINCHTAB_BIN: "",
      PINCHTAB_TOKEN: "",
      PINCHTAB_URL: "http://127.0.0.1:9867",
    }));
    vi.doMock("node:fs", () => ({
      existsSync: vi.fn().mockReturnValue(false),
    }));
    vi.doMock("node:child_process", () => ({
      execSync: vi.fn().mockReturnValue("/usr/local/bin/pinchtab\n"),
      spawn: vi.fn(),
    }));

    const { findPinchtabBin: find } = await import("../pinchtab/process.js");
    const result = find();

    expect(result).toBe("/usr/local/bin/pinchtab");
  });

  it("returns undefined when binary not found anywhere", async () => {
    vi.resetModules();
    vi.doMock("../config.js", () => ({
      PINCHTAB_BIN: "",
      PINCHTAB_TOKEN: "",
      PINCHTAB_URL: "http://127.0.0.1:9867",
    }));
    vi.doMock("node:fs", () => ({
      existsSync: vi.fn().mockReturnValue(false),
    }));
    vi.doMock("node:child_process", () => ({
      execSync: vi.fn().mockImplementation(() => {
        throw new Error("not found");
      }),
      spawn: vi.fn(),
    }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { findPinchtabBin: find } = await import("../pinchtab/process.js");
    const result = find();

    expect(result).toBeUndefined();
    vi.restoreAllMocks();
  });
});

describe("ensurePinchtabRunning", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));
    vi.spyOn(console, "error").mockImplementation(() => {});
    // Reset spawn mock each test; include kill so cleanup() is always safe
    vi.mocked(spawn).mockReturnValue({
      kill: vi.fn(),
      on: vi.fn(),
      stderr: { on: vi.fn() },
      unref: vi.fn(),
    } as never);
  });

  afterEach(() => {
    // Reset module-level pinchtabProcess to prevent cross-test state bleed
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns early when PinchTab is already running", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    await expect(ensurePinchtabRunning()).resolves.toBeUndefined();
    expect(vi.mocked(spawn)).not.toHaveBeenCalled();
  });

  it("throws when PinchTab does not become ready within 15s", async () => {
    // expect.assertions satisfies the expect-expect lint rule.
    // Promise.all attaches the rejection handler synchronously (before timers
    // fire) and is recognized by valid-expect as an awaited assertion.
    expect.assertions(1);
    const promise = ensurePinchtabRunning();

    await Promise.all([
      expect(promise).rejects.toThrow("PinchTab started but did not become ready within 15s"),
      vi.advanceTimersByTimeAsync(16_000),
    ]);
  });

  it("resolves when PinchTab becomes ready after a few polls", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        calls++;
        // calls=1: initial isPinchtabRunning() → not running → spawn
        // calls=2,3: poll iterations → not ready
        // calls=4: 3rd poll → ready
        if (calls >= 4) return { ok: true };
        throw new Error("not ready yet");
      }),
    );

    const promise = ensurePinchtabRunning();
    // Exponential backoff: 250 + 500 + 1000 = 1750ms for 3 polls
    await vi.advanceTimersByTimeAsync(2000);
    await expect(promise).resolves.toBeUndefined();
  });

  it("deduplicates concurrent startup calls", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        calls++;
        if (calls >= 3) return { ok: true };
        throw new Error("not ready yet");
      }),
    );

    const p1 = ensurePinchtabRunning();
    const p2 = ensurePinchtabRunning();
    await vi.advanceTimersByTimeAsync(2000);
    await Promise.all([p1, p2]);

    // spawn should only be called once despite two concurrent calls
    expect(vi.mocked(spawn)).toHaveBeenCalledTimes(1);
  });
});

describe("cleanup", () => {
  it("is a no-op when no process was started", () => {
    expect(() => cleanup()).not.toThrow();
  });

  it("kills the spawned process when called after a start", async () => {
    const mockKill = vi.fn();
    vi.mocked(spawn).mockReturnValueOnce({
      kill: mockKill,
      on: vi.fn(),
      stderr: { on: vi.fn() },
      unref: vi.fn(),
    } as never);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers();

    // First call: not running; first poll call: running — so ensurePinchtabRunning resolves
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        calls++;
        if (calls >= 2) return { ok: true };
        return { ok: false };
      }),
    );

    const promise = ensurePinchtabRunning();
    await vi.advanceTimersByTimeAsync(250); // first poll iteration (250ms with backoff)
    await promise;

    cleanup();
    expect(mockKill).toHaveBeenCalledWith("SIGTERM");

    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});
