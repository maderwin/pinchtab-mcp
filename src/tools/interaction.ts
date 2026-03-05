import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { pinch } from "../pinchtab/client.js";
import { toolError, toolResult } from "../utils.js";

export function registerInteractionTools(server: McpServer) {
  server.registerTool(
    "pinchtab_click",
    {
      description:
        "Click an element by its ref ID (e.g. 'e5'). Uses human-like click by default (real mouse events: mousedown → mouseup → click). Set humanClick=false for programmatic click.",
      inputSchema: z.object({
        humanClick: z
          .boolean()
          .optional()
          .describe(
            "Use real mouse events (default: true). Set to false for programmatic .click().",
          ),
        ref: z.string().describe("Element reference ID (e.g. 'e5')"),
        waitNav: z
          .boolean()
          .optional()
          .describe("Wait for navigation after click (useful for link clicks). Default: false."),
      }),
      title: "Click",
    },
    async ({ ref, humanClick, waitNav }) => {
      try {
        const kind = humanClick === false ? "click" : "humanClick";
        const body: Record<string, unknown> = { kind, ref };
        if (waitNav) body.waitNav = true;
        return toolResult(await pinch("POST", "/action", body));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "pinchtab_type",
    {
      description:
        "Type text into an input field by its ref ID. Uses human-like typing by default (character-by-character with realistic delays). Set humanType=false for instant programmatic fill.",
      inputSchema: z.object({
        fast: z
          .boolean()
          .optional()
          .describe(
            "Speed up humanType with shorter delays between keystrokes. Only applies when humanType=true.",
          ),
        humanType: z
          .boolean()
          .optional()
          .describe(
            "Use human-like keystroke simulation (default: true). Set to false for fast programmatic fill.",
          ),
        ref: z.string().describe("Element reference ID of the input field"),
        text: z.string().describe("Text to type into the field"),
      }),
      title: "Type",
    },
    async ({ ref, text, humanType, fast }) => {
      try {
        const kind = humanType === false ? "fill" : "humanType";
        const body: Record<string, unknown> = { kind, ref, text };
        if (fast && kind === "humanType") body.fast = true;
        return toolResult(await pinch("POST", "/action", body));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "pinchtab_press",
    {
      description:
        "Press a keyboard key (e.g. 'Enter', 'Tab', 'Escape', 'ArrowDown'). Optionally target a specific element.",
      inputSchema: z.object({
        key: z.string().describe("Key to press (e.g. 'Enter', 'Tab', 'Escape')"),
        ref: z
          .string()
          .optional()
          .describe("Element ref to focus before pressing the key (e.g. 'e5')."),
      }),
      title: "Press Key",
    },
    async ({ key, ref }) => {
      try {
        const body: Record<string, unknown> = { key, kind: "press" };
        if (ref) body.ref = ref;
        return toolResult(await pinch("POST", "/action", body));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "pinchtab_hover",
    {
      description:
        "Hover over an element by its ref ID. Triggers mouseover/mouseenter events — useful for revealing tooltips, dropdown menus, or hover states.",
      inputSchema: z.object({
        ref: z.string().describe("Element reference ID (e.g. 'e5')"),
      }),
      title: "Hover",
    },
    async ({ ref }) => {
      try {
        return toolResult(
          await pinch("POST", "/action", {
            kind: "hover",
            ref,
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "pinchtab_focus",
    {
      description:
        "Focus an element by its ref ID. Useful for triggering focus-dependent UI (e.g. autocomplete dropdowns) without clicking.",
      inputSchema: z.object({
        ref: z.string().describe("Element reference ID (e.g. 'e3')"),
      }),
      title: "Focus",
    },
    async ({ ref }) => {
      try {
        return toolResult(
          await pinch("POST", "/action", {
            kind: "focus",
            ref,
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "pinchtab_select",
    {
      description:
        "Select an option in a <select> dropdown by its ref ID. Pass the option value or visible text.",
      inputSchema: z.object({
        ref: z.string().describe("Element reference ID of the <select>"),
        value: z.string().describe("Option value or visible text to select"),
      }),
      title: "Select",
    },
    async ({ ref, value }) => {
      try {
        return toolResult(
          await pinch("POST", "/action", {
            kind: "select",
            ref,
            value,
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
