import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerNavigationTools } from "../tools/navigation.js";

const mockPinch = vi.fn();

vi.mock("../pinchtab/client.js", () => ({
  pinch: (...args: unknown[]) => mockPinch(...args),
}));

interface NavResult {
  content: { text?: string; type: string }[];
  isError?: boolean;
}

type ToolHandler = (args: Record<string, unknown>) => Promise<NavResult>;

function getToolHandler(server: McpServer, name: string): ToolHandler {
  const tools = (
    server as unknown as {
      _registeredTools: Record<string, { handler: ToolHandler }>;
    }
  )._registeredTools;
  const tool = tools[name];
  if (!tool) throw new Error(`Tool "${name}" not registered`);
  return tool.handler;
}

describe("pinchtab_wait", () => {
  let server: McpServer;

  beforeEach(() => {
    vi.useFakeTimers();
    mockPinch.mockReset();
    server = new McpServer({ name: "test", version: "0.0.0" });
    registerNavigationTools(server);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("defaults to 3 seconds when no arg", async () => {
    const handler = getToolHandler(server, "pinchtab_wait");
    const promise = handler({});
    await vi.advanceTimersByTimeAsync(3000);
    const result = await promise;
    expect(result.content[0].text).toContain('"waited": 3');
  });

  it("clamps 0 to minimum 1 second", async () => {
    const handler = getToolHandler(server, "pinchtab_wait");
    const promise = handler({ seconds: 0 });
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;
    expect(result.content[0].text).toContain('"waited": 1');
  });

  it("clamps 100 to maximum 30 seconds", async () => {
    const handler = getToolHandler(server, "pinchtab_wait");
    const promise = handler({ seconds: 100 });
    await vi.advanceTimersByTimeAsync(30_000);
    const result = await promise;
    expect(result.content[0].text).toContain('"waited": 30');
  });

  it("passes through valid seconds", async () => {
    const handler = getToolHandler(server, "pinchtab_wait");
    const promise = handler({ seconds: 5 });
    await vi.advanceTimersByTimeAsync(5000);
    const result = await promise;
    expect(result.content[0].text).toContain('"waited": 5');
  });

  it("clamps negative to 1 second", async () => {
    const handler = getToolHandler(server, "pinchtab_wait");
    const promise = handler({ seconds: -10 });
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;
    expect(result.content[0].text).toContain('"waited": 1');
  });
});

describe("pinchtab_navigate", () => {
  let server: McpServer;

  beforeEach(() => {
    mockPinch.mockReset();
    server = new McpServer({ name: "test", version: "0.0.0" });
    registerNavigationTools(server);
  });

  it("calls POST /navigate with url", async () => {
    mockPinch.mockResolvedValueOnce({ title: "Example", url: "https://example.com/" });

    const handler = getToolHandler(server, "pinchtab_navigate");
    const result = await handler({ url: "https://example.com" });

    expect(mockPinch).toHaveBeenCalledWith("POST", "/navigate", { url: "https://example.com" });
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Example");
  });

  it("returns isError on failure", async () => {
    mockPinch.mockRejectedValueOnce(new Error("timeout"));

    const handler = getToolHandler(server, "pinchtab_navigate");
    const result = await handler({ url: "https://example.com" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("timeout");
  });
});

describe("pinchtab_snapshot", () => {
  let server: McpServer;

  beforeEach(() => {
    mockPinch.mockReset();
    server = new McpServer({ name: "test", version: "0.0.0" });
    registerNavigationTools(server);
  });

  it("calls GET /snapshot without params", async () => {
    mockPinch.mockResolvedValueOnce({ count: 0, nodes: [] });

    const handler = getToolHandler(server, "pinchtab_snapshot");
    await handler({});

    expect(mockPinch).toHaveBeenCalledWith("GET", "/snapshot");
  });

  it("includes filter param in query string", async () => {
    mockPinch.mockResolvedValueOnce({ count: 0, nodes: [] });

    const handler = getToolHandler(server, "pinchtab_snapshot");
    await handler({ filter: "interactive" });

    expect(mockPinch).toHaveBeenCalledWith("GET", "/snapshot?filter=interactive");
  });

  it("includes format=compact in query string", async () => {
    mockPinch.mockResolvedValueOnce({ count: 0, nodes: [] });

    const handler = getToolHandler(server, "pinchtab_snapshot");
    await handler({ format: "compact" });

    expect(mockPinch).toHaveBeenCalledWith("GET", "/snapshot?format=compact");
  });

  it("includes diff=true in query string", async () => {
    mockPinch.mockResolvedValueOnce({ count: 0, nodes: [] });

    const handler = getToolHandler(server, "pinchtab_snapshot");
    await handler({ diff: true });

    expect(mockPinch).toHaveBeenCalledWith("GET", "/snapshot?diff=true");
  });

  it("combines multiple query params", async () => {
    mockPinch.mockResolvedValueOnce({ count: 0, nodes: [] });

    const handler = getToolHandler(server, "pinchtab_snapshot");
    await handler({ diff: true, filter: "interactive", format: "compact" });

    expect(mockPinch).toHaveBeenCalledWith(
      "GET",
      "/snapshot?filter=interactive&format=compact&diff=true",
    );
  });

  it("returns isError on failure", async () => {
    mockPinch.mockRejectedValueOnce(new Error("server error"));

    const handler = getToolHandler(server, "pinchtab_snapshot");
    const result = await handler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("server error");
  });
});

describe("pinchtab_scroll", () => {
  let server: McpServer;

  beforeEach(() => {
    mockPinch.mockReset();
    server = new McpServer({ name: "test", version: "0.0.0" });
    registerNavigationTools(server);
  });

  it("sends scroll action with default amount", async () => {
    mockPinch.mockResolvedValueOnce({ ok: true });

    const handler = getToolHandler(server, "pinchtab_scroll");
    await handler({ direction: "down" });

    expect(mockPinch).toHaveBeenCalledWith("POST", "/action", {
      amount: 500,
      direction: "down",
      kind: "scroll",
    });
  });

  it("sends scroll action with custom amount", async () => {
    mockPinch.mockResolvedValueOnce({ ok: true });

    const handler = getToolHandler(server, "pinchtab_scroll");
    await handler({ amount: 200, direction: "up" });

    expect(mockPinch).toHaveBeenCalledWith("POST", "/action", {
      amount: 200,
      direction: "up",
      kind: "scroll",
    });
  });

  it("returns isError on failure", async () => {
    mockPinch.mockRejectedValueOnce(new Error("scroll failed"));

    const handler = getToolHandler(server, "pinchtab_scroll");
    const result = await handler({ direction: "down" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("scroll failed");
  });
});

describe("registerNavigationTools", () => {
  it("registers without throwing", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    expect(() => registerNavigationTools(server)).not.toThrow();
  });
});
