import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { pinch } from "../pinchtab/client.js";
import { toolError, toolResult } from "../utils.js";
import { waitAndSnapshot } from "./shared.js";

const DEFAULT_SCROLL_PX = 500;
const DEFAULT_WAIT_SEC = 3;
const MAX_WAIT_SEC = 30;
const MIN_WAIT_SEC = 1;
const SELECTOR_POLL_MS = 500;
const SELECTOR_TIMEOUT_DEFAULT = 5000;
const SELECTOR_TIMEOUT_MAX = 15_000;

export function registerNavigationTools(server: McpServer) {
  server.registerTool(
    "pinchtab_navigate",
    {
      description:
        "Navigate the browser to a URL. Set waitMs to wait for page load and get a snapshot back automatically.",
      inputSchema: z.object({
        newTab: z
          .boolean()
          .optional()
          .describe("Open the URL in a new tab instead of navigating the current one."),
        url: z.string().describe("URL to navigate to"),
        waitMs: z
          .number()
          .optional()
          .describe(
            "Wait this many ms after navigation, then return a compact page snapshot (max 10000).",
          ),
      }),
      title: "Navigate",
    },
    async ({ url, newTab, waitMs }) => {
      try {
        if (newTab) {
          await pinch("POST", "/tab", { action: "new", url });
        } else {
          await pinch("POST", "/navigate", { url });
        }
        if (waitMs && waitMs > 0) {
          const snap = await waitAndSnapshot(waitMs);
          return toolResult(`Navigated to ${url}\n\n${snap}`);
        }
        return toolResult({ navigated: url });
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
      description: "Scroll the page or a specific element. Supports all four directions.",
      inputSchema: z.object({
        amount: z
          .number()
          .optional()
          .describe(`Scroll amount in pixels. Default: ${DEFAULT_SCROLL_PX}`),
        direction: z.enum(["up", "down", "left", "right"]).describe("Scroll direction"),
        ref: z
          .string()
          .optional()
          .describe("Element ref to scroll within (e.g. 'e5'). If omitted, scrolls the page."),
      }),
      title: "Scroll",
    },
    async ({ direction, amount, ref }) => {
      try {
        const body: Record<string, unknown> = {
          amount: amount ?? DEFAULT_SCROLL_PX,
          direction,
          kind: "scroll",
        };
        if (ref) body.ref = ref;
        return toolResult(await pinch("POST", "/action", body));
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

  server.registerTool(
    "pinchtab_wait_for_selector",
    {
      description:
        "Wait for a CSS selector to appear on the page. Polls every 500ms up to the timeout. Useful for waiting on dynamic content, modals, or lazy-loaded elements.",
      inputSchema: z.object({
        selector: z
          .string()
          .describe("CSS selector to wait for (e.g. '#login-form', '.loaded', '[data-ready]')"),
        timeoutMs: z
          .number()
          .optional()
          .describe("Maximum wait time in ms (default: 5000, max: 15000)."),
      }),
      title: "Wait for Selector",
    },
    async ({ selector, timeoutMs }) => {
      const timeout = Math.min(timeoutMs ?? SELECTOR_TIMEOUT_DEFAULT, SELECTOR_TIMEOUT_MAX);
      const deadline = Date.now() + timeout;
      try {
        while (Date.now() < deadline) {
          const result = await pinch("POST", "/evaluate", {
            expression: `!!document.querySelector(${JSON.stringify(selector)})`,
          });
          const found =
            result === true ||
            result === "true" ||
            (typeof result === "object" &&
              result !== null &&
              (result as Record<string, unknown>).result === true);
          if (found) return toolResult({ found: true, selector });
          await new Promise((resolve) => setTimeout(resolve, SELECTOR_POLL_MS));
        }
        return toolError(new Error(`Selector "${selector}" not found within ${timeout}ms`));
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
