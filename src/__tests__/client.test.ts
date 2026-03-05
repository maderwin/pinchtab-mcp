import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockIsPinchtabRunning = vi.fn();
const mockEnsurePinchtabRunning = vi.fn();

vi.mock("../pinchtab/process.js", () => ({
  ensurePinchtabRunning: () => mockEnsurePinchtabRunning(),
  isPinchtabRunning: () => mockIsPinchtabRunning(),
}));

vi.mock("../config.js", () => ({
  PINCHTAB_TOKEN: "",
  PINCHTAB_URL: "http://127.0.0.1:9999",
}));

describe("pinch", () => {
  beforeEach(() => {
    mockIsPinchtabRunning.mockReset();
    mockEnsurePinchtabRunning.mockReset();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns JSON when content-type is application/json", async () => {
    mockIsPinchtabRunning.mockResolvedValue(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ data: "test" }),
        ok: true,
      }),
    );

    const { pinch } = await import("../pinchtab/client.js");
    const result = await pinch("GET", "/text");
    expect(result).toStrictEqual({ data: "test" });
  });

  it("returns text when content-type is not JSON", async () => {
    mockIsPinchtabRunning.mockResolvedValue(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        headers: new Headers({ "content-type": "text/plain" }),
        ok: true,
        text: async () => "plain text",
      }),
    );

    const { pinch } = await import("../pinchtab/client.js");
    const result = await pinch("GET", "/text");
    expect(result).toBe("plain text");
  });

  it("throws on non-ok response", async () => {
    mockIsPinchtabRunning.mockResolvedValue(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => "Not Found",
      }),
    );

    const { pinch } = await import("../pinchtab/client.js");
    await expect(pinch("GET", "/missing")).rejects.toThrow(
      "PinchTab GET /missing → 404: Not Found",
    );
  });

  it("starts PinchTab if not running", async () => {
    mockIsPinchtabRunning.mockResolvedValue(false);
    mockEnsurePinchtabRunning.mockResolvedValue(undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
        ok: true,
      }),
    );

    const { pinch } = await import("../pinchtab/client.js");
    await pinch("GET", "/tabs");
    expect(mockEnsurePinchtabRunning).toHaveBeenCalledOnce();
  });

  it("sends body as JSON for POST requests", async () => {
    mockIsPinchtabRunning.mockResolvedValue(true);
    const mockFetch = vi.fn().mockResolvedValue({
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ ok: true }),
      ok: true,
    });
    vi.stubGlobal("fetch", mockFetch);

    const { pinch } = await import("../pinchtab/client.js");
    await pinch("POST", "/navigate", { url: "https://example.com" });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:9999/navigate",
      expect.objectContaining({
        body: JSON.stringify({ url: "https://example.com" }),
        method: "POST",
      }),
    );
  });

  it("returns JSON when content-type has charset suffix", async () => {
    mockIsPinchtabRunning.mockResolvedValue(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        headers: new Headers({
          "content-type": "application/json; charset=utf-8",
        }),
        json: async () => ({ ok: true }),
        ok: true,
      }),
    );

    const { pinch } = await import("../pinchtab/client.js");
    const result = await pinch("GET", "/health");
    expect(result).toStrictEqual({ ok: true });
  });

  it("wraps timeout errors with readable message", async () => {
    mockIsPinchtabRunning.mockResolvedValue(true);
    const timeoutError = new DOMException(
      "The operation was aborted due to timeout",
      "TimeoutError",
    );
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError));

    const { pinch } = await import("../pinchtab/client.js");
    await expect(pinch("GET", "/snapshot")).rejects.toThrow(
      "PinchTab GET /snapshot timed out after 30s",
    );
  });

  it("re-throws non-timeout fetch errors", async () => {
    mockIsPinchtabRunning.mockResolvedValue(true);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const { pinch } = await import("../pinchtab/client.js");
    await expect(pinch("GET", "/text")).rejects.toThrow("fetch failed");
  });

  it("adds authorization header when token is set", async () => {
    vi.resetModules();
    vi.doMock("../config.js", () => ({
      PINCHTAB_TOKEN: "secret-token",
      PINCHTAB_URL: "http://127.0.0.1:9999",
    }));
    vi.doMock("../pinchtab/process.js", () => ({
      ensurePinchtabRunning: async () => {},
      isPinchtabRunning: async () => true,
    }));
    const mockFetch = vi.fn().mockResolvedValue({
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({}),
      ok: true,
    });
    vi.stubGlobal("fetch", mockFetch);

    const { pinch } = await import("../pinchtab/client.js");
    await pinch("GET", "/tabs");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:9999/tabs",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer secret-token",
        }),
      }),
    );
  });

  it("does not send body for GET requests without body", async () => {
    mockIsPinchtabRunning.mockResolvedValue(true);
    const mockFetch = vi.fn().mockResolvedValue({
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => [],
      ok: true,
    });
    vi.stubGlobal("fetch", mockFetch);

    const { pinch } = await import("../pinchtab/client.js");
    await pinch("GET", "/tabs");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:9999/tabs",
      expect.objectContaining({
        body: undefined,
        method: "GET",
      }),
    );
  });
});
