import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { pinch } from "../pinchtab/client.js";
import { toolError, toolResult } from "../utils.js";

export function registerInstanceTools(server: McpServer) {
  server.registerTool(
    "pinchtab_list_instances",
    {
      description: "List all open browser tabs. Returns tab IDs, URLs, and titles.",
      inputSchema: z.object({}),
      title: "List Tabs",
    },
    async () => {
      try {
        return toolResult(await pinch("GET", "/tabs"));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "pinchtab_close_tab",
    {
      description: "Close the current tab or a specific tab by its ID.",
      inputSchema: z.object({
        tabId: z
          .string()
          .optional()
          .describe("Tab ID to close. If omitted, closes the current tab."),
      }),
      title: "Close Tab",
    },
    async ({ tabId }) => {
      try {
        const body: Record<string, unknown> = { action: "close" };
        if (tabId) body.tabId = tabId;
        return toolResult(await pinch("POST", "/tab", body));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "pinchtab_cookies",
    {
      description: "Get all cookies for the current page.",
      inputSchema: z.object({}),
      title: "Get Cookies",
    },
    async () => {
      try {
        return toolResult(await pinch("GET", "/cookies"));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "pinchtab_health",
    {
      description: "Check if PinchTab server is running and responsive.",
      inputSchema: z.object({}),
      title: "Health Check",
    },
    async () => {
      try {
        return toolResult(await pinch("GET", "/health"));
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
