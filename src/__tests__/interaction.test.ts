import { beforeEach, describe, expect, it, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerInteractionTools } from "../tools/interaction.js";

const mockPinch = vi.fn();

vi.mock("../pinchtab/client.js", () => ({
  pinch: (...args: unknown[]) => mockPinch(...args),
}));

interface ToolResult {
  content: { text?: string; type: string }[];
  isError?: boolean;
}

type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

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

describe("interaction tools", () => {
  let server: McpServer;

  beforeEach(() => {
    mockPinch.mockReset();
    server = new McpServer({ name: "test", version: "0.0.0" });
    registerInteractionTools(server);
  });

  describe("pinchtab_click", () => {
    it("uses humanClick kind by default", async () => {
      mockPinch.mockResolvedValueOnce({ ok: true });

      const handler = getToolHandler(server, "pinchtab_click");
      await handler({ ref: "e5" });

      expect(mockPinch).toHaveBeenCalledWith("POST", "/action", {
        kind: "humanClick",
        ref: "e5",
      });
    });

    it("uses click kind when humanClick=false", async () => {
      mockPinch.mockResolvedValueOnce({ ok: true });

      const handler = getToolHandler(server, "pinchtab_click");
      await handler({ humanClick: false, ref: "e5" });

      expect(mockPinch).toHaveBeenCalledWith("POST", "/action", {
        kind: "click",
        ref: "e5",
      });
    });

    it("includes waitNav when set", async () => {
      mockPinch.mockResolvedValueOnce({ ok: true });

      const handler = getToolHandler(server, "pinchtab_click");
      await handler({ ref: "e5", waitNav: true });

      expect(mockPinch).toHaveBeenCalledWith("POST", "/action", {
        kind: "humanClick",
        ref: "e5",
        waitNav: true,
      });
    });

    it("returns isError on failure", async () => {
      mockPinch.mockRejectedValueOnce(new Error("element not found"));

      const handler = getToolHandler(server, "pinchtab_click");
      const result = await handler({ ref: "e99" });

      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain("element not found");
    });
  });

  describe("pinchtab_type", () => {
    it("uses humanType kind by default", async () => {
      mockPinch.mockResolvedValueOnce({ ok: true });

      const handler = getToolHandler(server, "pinchtab_type");
      await handler({ ref: "e3", text: "hello" });

      expect(mockPinch).toHaveBeenCalledWith("POST", "/action", {
        kind: "humanType",
        ref: "e3",
        text: "hello",
      });
    });

    it("uses fill kind when humanType=false", async () => {
      mockPinch.mockResolvedValueOnce({ ok: true });

      const handler = getToolHandler(server, "pinchtab_type");
      await handler({ humanType: false, ref: "e3", text: "hello" });

      expect(mockPinch).toHaveBeenCalledWith("POST", "/action", {
        kind: "fill",
        ref: "e3",
        text: "hello",
      });
    });

    it("includes fast flag for humanType", async () => {
      mockPinch.mockResolvedValueOnce({ ok: true });

      const handler = getToolHandler(server, "pinchtab_type");
      await handler({ fast: true, ref: "e3", text: "hello" });

      expect(mockPinch).toHaveBeenCalledWith("POST", "/action", {
        fast: true,
        kind: "humanType",
        ref: "e3",
        text: "hello",
      });
    });

    it("ignores fast flag when using fill kind", async () => {
      mockPinch.mockResolvedValueOnce({ ok: true });

      const handler = getToolHandler(server, "pinchtab_type");
      await handler({ fast: true, humanType: false, ref: "e3", text: "hello" });

      expect(mockPinch).toHaveBeenCalledWith("POST", "/action", {
        kind: "fill",
        ref: "e3",
        text: "hello",
      });
    });
  });

  describe("pinchtab_press", () => {
    it("sends press action with key", async () => {
      mockPinch.mockResolvedValueOnce({ ok: true });

      const handler = getToolHandler(server, "pinchtab_press");
      await handler({ key: "Enter" });

      expect(mockPinch).toHaveBeenCalledWith("POST", "/action", {
        key: "Enter",
        kind: "press",
      });
    });
  });

  describe("pinchtab_hover", () => {
    it("sends hover action with ref", async () => {
      mockPinch.mockResolvedValueOnce({ ok: true });

      const handler = getToolHandler(server, "pinchtab_hover");
      await handler({ ref: "e5" });

      expect(mockPinch).toHaveBeenCalledWith("POST", "/action", {
        kind: "hover",
        ref: "e5",
      });
    });
  });

  describe("pinchtab_focus", () => {
    it("sends focus action with ref", async () => {
      mockPinch.mockResolvedValueOnce({ ok: true });

      const handler = getToolHandler(server, "pinchtab_focus");
      await handler({ ref: "e3" });

      expect(mockPinch).toHaveBeenCalledWith("POST", "/action", {
        kind: "focus",
        ref: "e3",
      });
    });
  });

  describe("pinchtab_select", () => {
    it("sends select action with ref and value", async () => {
      mockPinch.mockResolvedValueOnce({ ok: true });

      const handler = getToolHandler(server, "pinchtab_select");
      await handler({ ref: "e7", value: "option1" });

      expect(mockPinch).toHaveBeenCalledWith("POST", "/action", {
        kind: "select",
        ref: "e7",
        value: "option1",
      });
    });
  });

  describe("error handling", () => {
    it("pinchtab_type returns isError on failure", async () => {
      mockPinch.mockRejectedValueOnce(new Error("type failed"));

      const handler = getToolHandler(server, "pinchtab_type");
      const result = await handler({ ref: "e1", text: "hi" });

      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain("type failed");
    });

    it("pinchtab_press returns isError on failure", async () => {
      mockPinch.mockRejectedValueOnce(new Error("press failed"));

      const handler = getToolHandler(server, "pinchtab_press");
      const result = await handler({ key: "Enter" });

      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain("press failed");
    });

    it("pinchtab_hover returns isError on failure", async () => {
      mockPinch.mockRejectedValueOnce(new Error("hover failed"));

      const handler = getToolHandler(server, "pinchtab_hover");
      const result = await handler({ ref: "e1" });

      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain("hover failed");
    });

    it("pinchtab_focus returns isError on failure", async () => {
      mockPinch.mockRejectedValueOnce(new Error("focus failed"));

      const handler = getToolHandler(server, "pinchtab_focus");
      const result = await handler({ ref: "e1" });

      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain("focus failed");
    });

    it("pinchtab_select returns isError on failure", async () => {
      mockPinch.mockRejectedValueOnce(new Error("select failed"));

      const handler = getToolHandler(server, "pinchtab_select");
      const result = await handler({ ref: "e1", value: "opt" });

      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain("select failed");
    });
  });
});
