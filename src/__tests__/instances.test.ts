import { beforeEach, describe, expect, it, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerInstanceTools } from "../tools/instances.js";

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

describe("instance tools", () => {
  let server: McpServer;

  beforeEach(() => {
    mockPinch.mockReset();
    server = new McpServer({ name: "test", version: "0.0.0" });
    registerInstanceTools(server);
  });

  describe("pinchtab_list_instances", () => {
    it("calls GET /tabs", async () => {
      mockPinch.mockResolvedValueOnce({ tabs: [] });

      const handler = getToolHandler(server, "pinchtab_list_instances");
      await handler({});

      expect(mockPinch).toHaveBeenCalledWith("GET", "/tabs");
    });

    it("returns tab list as JSON text", async () => {
      mockPinch.mockResolvedValueOnce({
        tabs: [{ id: "abc", title: "Test", url: "https://test.com" }],
      });

      const handler = getToolHandler(server, "pinchtab_list_instances");
      const result = await handler({});

      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("abc");
      expect(result.content[0].text).toContain("Test");
    });

    it("returns isError on failure", async () => {
      mockPinch.mockRejectedValueOnce(new Error("connection refused"));

      const handler = getToolHandler(server, "pinchtab_list_instances");
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("connection refused");
    });
  });
});
