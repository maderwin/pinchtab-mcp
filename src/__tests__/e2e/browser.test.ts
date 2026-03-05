import { beforeAll, describe, expect, it } from "vitest";
import { pinch } from "../../pinchtab/client.js";
import { ensurePinchtabRunning, isPinchtabRunning } from "../../pinchtab/process.js";

/**
 * E2E tests — require PinchTab to be running.
 * Run with: PINCHTAB_E2E=1 npm run test:e2e
 * Skipped by default in CI.
 */
const SKIP = !process.env.PINCHTAB_E2E;

describe.skipIf(SKIP)("e2e: browser automation", () => {
  beforeAll(async () => {
    await ensurePinchtabRunning();
    await expect(isPinchtabRunning()).resolves.toBeTruthy();
  });

  it("lists tabs", async () => {
    const result = (await pinch("GET", "/tabs")) as { tabs: unknown[] };
    expect(result.tabs).toBeDefined();
    expect(Array.isArray(result.tabs)).toBeTruthy();
    expect(result.tabs.length).toBeGreaterThan(0);
  });

  it("navigates to a URL", async () => {
    const result = (await pinch("POST", "/navigate", {
      url: "https://example.com",
    })) as { title: string; url: string };
    expect(result).toBeTruthy();
    expect(result.url).toContain("example.com");
  });

  it("waits for page load", async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    expect(true).toBeTruthy();
  });

  it("gets page text", async () => {
    const result = (await pinch("GET", "/text")) as { text: string; title: string };
    expect(result.text).toContain("Example Domain");
    expect(result.title).toBe("Example Domain");
  });

  it("takes a snapshot", async () => {
    const result = (await pinch("GET", "/snapshot")) as {
      count: number;
      nodes: unknown[];
    };
    expect(result.nodes).toBeDefined();
    expect(Array.isArray(result.nodes)).toBeTruthy();
    expect(result.count).toBeGreaterThan(0);
  });

  it("takes a snapshot with interactive filter", async () => {
    const result = (await pinch("GET", "/snapshot?interactive")) as {
      count: number;
      nodes: unknown[];
    };
    expect(result.nodes).toBeDefined();
    expect(Array.isArray(result.nodes)).toBeTruthy();
  });

  it("takes a screenshot", async () => {
    const result = (await pinch("GET", "/screenshot")) as { base64: string };
    expect(result.base64).toBeTruthy();
    expect(result.base64.length).toBeGreaterThan(100);
  });

  it("evaluates JavaScript", async () => {
    const result = (await pinch("POST", "/evaluate", {
      expression: "document.title",
    })) as { result: string };
    expect(result.result).toBe("Example Domain");
  });

  it("performs a click action", async () => {
    // First get a snapshot to find a clickable element
    const snapshot = (await pinch("GET", "/snapshot")) as {
      nodes: { ref: string; role: string; name: string }[];
    };
    const link = snapshot.nodes.find((n) => n.role === "link");
    expect(link).toBeDefined();

    const result = await pinch("POST", "/action", {
      kind: "click",
      ref: link!.ref,
    });
    expect(result).toBeTruthy();
  });

  it("navigates back after click", async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const result = (await pinch("POST", "/navigate", {
      url: "https://example.com",
    })) as { title: string };
    expect(result.title).toBe("Example Domain");
  });

  it("performs a scroll action", async () => {
    const result = await pinch("POST", "/action", {
      amount: 100,
      direction: "down",
      kind: "scroll",
    });
    expect(result).toBeTruthy();
  });

  it("exports a PDF", async () => {
    const result = await pinch("GET", "/pdf");
    expect(result).toBeTruthy();
  });

  it("checks server health", async () => {
    const res = await fetch("http://127.0.0.1:9867/health");
    expect(res.ok).toBeTruthy();
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("ok");
  });
});
