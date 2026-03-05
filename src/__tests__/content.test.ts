import { beforeEach, describe, expect, it, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerContentTools } from "../tools/content.js";

const mockPinch = vi.fn();

vi.mock("../pinchtab/client.js", () => ({
  pinch: (...args: unknown[]) => mockPinch(...args),
}));

interface ContentResult {
  content: { data?: string; mimeType?: string; text?: string; type: string }[];
  isError?: boolean;
}

type ToolHandler = (args: Record<string, unknown>) => Promise<ContentResult>;

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

describe("content tools", () => {
  let server: McpServer;

  beforeEach(() => {
    mockPinch.mockReset();
    server = new McpServer({ name: "test", version: "0.0.0" });
    registerContentTools(server);
  });

  describe("pinchtab_pdf", () => {
    it("calls GET /pdf", async () => {
      mockPinch.mockResolvedValueOnce("base64pdfdata");

      const handler = getToolHandler(server, "pinchtab_pdf");
      await handler({});

      expect(mockPinch).toHaveBeenCalledWith("GET", "/pdf");
    });

    it("returns text content with pdf data", async () => {
      mockPinch.mockResolvedValueOnce("JVBERi0xLjQ=");

      const handler = getToolHandler(server, "pinchtab_pdf");
      const result = await handler({});

      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("JVBERi0xLjQ=");
    });
  });

  describe("pinchtab_screenshot", () => {
    it("returns image content when response has base64 field", async () => {
      mockPinch.mockResolvedValueOnce({ base64: "/9j/4AAQSkZ" });

      const handler = getToolHandler(server, "pinchtab_screenshot");
      const result = await handler({});

      expect(result.content[0].type).toBe("image");
      expect(result.content[0].data).toBe("/9j/4AAQSkZ");
      expect(result.content[0].mimeType).toBe("image/jpeg");
    });

    it("returns text content when response has no base64 field", async () => {
      mockPinch.mockResolvedValueOnce({ error: "not found" });

      const handler = getToolHandler(server, "pinchtab_screenshot");
      const result = await handler({});

      expect(result.content[0].type).toBe("text");
    });

    it("calls GET /screenshot", async () => {
      mockPinch.mockResolvedValueOnce({ base64: "abc" });

      const handler = getToolHandler(server, "pinchtab_screenshot");
      await handler({});

      expect(mockPinch).toHaveBeenCalledWith("GET", "/screenshot");
    });
  });

  describe("pinchtab_get_text", () => {
    it("returns string response as plain text", async () => {
      mockPinch.mockResolvedValueOnce("Hello world");

      const handler = getToolHandler(server, "pinchtab_get_text");
      const result = await handler({});

      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Hello world");
    });

    it("returns JSON response as stringified JSON", async () => {
      mockPinch.mockResolvedValueOnce({ text: "Hello", title: "Test" });

      const handler = getToolHandler(server, "pinchtab_get_text");
      const result = await handler({});

      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain('"text"');
      expect(result.content[0].text).toContain("Hello");
    });

    it("calls GET /text", async () => {
      mockPinch.mockResolvedValueOnce("text");

      const handler = getToolHandler(server, "pinchtab_get_text");
      await handler({});

      expect(mockPinch).toHaveBeenCalledWith("GET", "/text");
    });
  });

  describe("pinchtab_eval", () => {
    it("sends expression to POST /evaluate", async () => {
      mockPinch.mockResolvedValueOnce({ result: "Example Domain" });

      const handler = getToolHandler(server, "pinchtab_eval");
      await handler({ code: "document.title" });

      expect(mockPinch).toHaveBeenCalledWith("POST", "/evaluate", {
        expression: "document.title",
      });
    });

    it("returns the result field as text", async () => {
      mockPinch.mockResolvedValueOnce({ result: "Example Domain" });

      const handler = getToolHandler(server, "pinchtab_eval");
      const result = await handler({ code: "document.title" });

      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Example Domain");
    });

    it("handles non-string result values", async () => {
      mockPinch.mockResolvedValueOnce({ result: 42 });

      const handler = getToolHandler(server, "pinchtab_eval");
      const result = await handler({ code: "1 + 1" });

      expect(result.content[0].text).toBe("42");
    });

    it("falls back to JSON when response has no result field", async () => {
      mockPinch.mockResolvedValueOnce({ output: "something" });

      const handler = getToolHandler(server, "pinchtab_eval");
      const result = await handler({ code: "void 0" });

      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain('"output"');
      expect(result.content[0].text).toContain("something");
    });

    it("returns isError on failure", async () => {
      mockPinch.mockRejectedValueOnce(new Error("eval failed"));

      const handler = getToolHandler(server, "pinchtab_eval");
      const result = await handler({ code: "throw new Error()" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("eval failed");
    });
  });

  describe("error handling", () => {
    it("pinchtab_get_text returns isError on failure", async () => {
      mockPinch.mockRejectedValueOnce(new Error("network error"));

      const handler = getToolHandler(server, "pinchtab_get_text");
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("network error");
    });

    it("pinchtab_screenshot returns isError on failure", async () => {
      mockPinch.mockRejectedValueOnce(new Error("screenshot failed"));

      const handler = getToolHandler(server, "pinchtab_screenshot");
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("screenshot failed");
    });

    it("pinchtab_pdf returns isError on failure", async () => {
      mockPinch.mockRejectedValueOnce(new Error("pdf failed"));

      const handler = getToolHandler(server, "pinchtab_pdf");
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("pdf failed");
    });
  });
});
