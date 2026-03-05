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
}
