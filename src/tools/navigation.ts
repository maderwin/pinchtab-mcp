import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { pinch } from "../pinchtab/client.js";
import { toolError, toolResult } from "../utils.js";

const DEFAULT_SCROLL_PX = 500;
const DEFAULT_WAIT_SEC = 3;
const MAX_WAIT_SEC = 30;
const MIN_WAIT_SEC = 1;

export function registerNavigationTools(server: McpServer) {
  server.registerTool(
    "pinchtab_navigate",
    {
      description:
        "Navigate the browser to a URL. Wait 3+ seconds after calling before taking a snapshot.",
      inputSchema: z.object({
        url: z.string().describe("URL to navigate to"),
      }),
      title: "Navigate",
    },
    async ({ url }) => {
      try {
        return toolResult(await pinch("POST", "/navigate", { url }));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "pinchtab_snapshot",
    {
      description:
        "Get an accessibility tree snapshot of the page. Returns element refs (e0, e1, …) that can be used with click/type/press. Use filter='interactive' for fewer tokens. Use format='compact' for minimal output.",
      inputSchema: z.object({
        diff: z
          .boolean()
          .optional()
          .describe(
            "If true, return only changes since last snapshot. Great for multi-step workflows.",
          ),
        filter: z
          .enum(["all", "interactive"])
          .optional()
          .describe("Filter elements: 'interactive' for buttons/links/inputs only. Default: 'all'"),
        format: z
          .enum(["full", "compact"])
          .optional()
          .describe("'compact' returns minimal refs (~3.6K tokens). Default: 'full'"),
      }),
      title: "Snapshot",
    },
    async ({ filter, format, diff }) => {
      try {
        const params = new URLSearchParams();
        if (filter) params.set("filter", filter);
        if (format === "compact") params.set("format", "compact");
        if (diff) params.set("diff", "true");
        const qs = params.toString() ? `?${params.toString()}` : "";
        return toolResult(await pinch("GET", `/snapshot${qs}`));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "pinchtab_scroll",
    {
      description: "Scroll the page up or down by a specified amount.",
      inputSchema: z.object({
        amount: z
          .number()
          .optional()
          .describe(`Scroll amount in pixels. Default: ${DEFAULT_SCROLL_PX}`),
        direction: z.enum(["up", "down"]).describe("Scroll direction"),
      }),
      title: "Scroll",
    },
    async ({ direction, amount }) => {
      try {
        return toolResult(
          await pinch("POST", "/action", {
            amount: amount ?? DEFAULT_SCROLL_PX,
            direction,
            kind: "scroll",
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "pinchtab_wait",
    {
      description:
        "Wait for a specified number of seconds. Useful after navigation or dynamic content loading.",
      inputSchema: z.object({
        seconds: z
          .number()
          .optional()
          .describe(
            `Number of seconds to wait (${MIN_WAIT_SEC}-${MAX_WAIT_SEC}). Default: ${DEFAULT_WAIT_SEC}`,
          ),
      }),
      title: "Wait",
    },
    async ({ seconds }) => {
      const raw = typeof seconds === "number" ? seconds : DEFAULT_WAIT_SEC;
      const sec = Math.min(Math.max(raw, MIN_WAIT_SEC), MAX_WAIT_SEC);
      await new Promise((resolve) => setTimeout(resolve, sec * 1000));
      return toolResult({ waited: sec });
    },
  );
}
