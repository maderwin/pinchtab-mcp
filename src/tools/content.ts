import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { pinch } from "../pinchtab/client.js";
import { isRecord, toJson, toolError, toolResult } from "../utils.js";

export function registerContentTools(server: McpServer) {
  server.registerTool(
    "pinchtab_get_text",
    {
      description:
        "Get readable text content from the page (~800 tokens). Best for extracting article content or page information.",
      inputSchema: z.object({}),
      title: "Get Text",
    },
    async () => {
      try {
        const result = await pinch("GET", "/text");
        const text = typeof result === "string" ? result : toJson(result);
        return { content: [{ text, type: "text" as const }] };
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "pinchtab_screenshot",
    {
      description: "Take a screenshot of the page. Returns a base64-encoded image.",
      inputSchema: z.object({}),
      title: "Screenshot",
    },
    async () => {
      try {
        const result = await pinch("GET", "/screenshot");
        const data = isRecord(result) && typeof result.base64 === "string" ? result.base64 : "";
        if (data) {
          return {
            content: [{ data, mimeType: "image/jpeg", type: "image" as const }],
          };
        }
        return toolResult(result);
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "pinchtab_eval",
    {
      description:
        "Execute JavaScript code in the page context. Returns the result of the expression.",
      inputSchema: z.object({
        code: z.string().describe("JavaScript code to execute in the page"),
      }),
      title: "Evaluate JavaScript",
    },
    async ({ code }) => {
      try {
        const result = await pinch("POST", "/evaluate", { expression: code });
        const text =
          isRecord(result) && "result" in result ? String(result.result) : toJson(result);
        return { content: [{ text, type: "text" as const }] };
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "pinchtab_pdf",
    {
      description: "Export the current page as a PDF. Returns the PDF as base64.",
      inputSchema: z.object({}),
      title: "Export PDF",
    },
    async () => {
      try {
        const result = await pinch("GET", "/pdf");
        const text = typeof result === "string" ? result : toJson(result);
        return { content: [{ text, type: "text" as const }] };
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
