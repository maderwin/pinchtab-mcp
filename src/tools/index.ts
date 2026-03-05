import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerInstanceTools } from "./instances.js";
import { registerNavigationTools } from "./navigation.js";
import { registerInteractionTools } from "./interaction.js";
import { registerContentTools } from "./content.js";

export function registerAllTools(server: McpServer) {
  registerInstanceTools(server);
  registerNavigationTools(server);
  registerInteractionTools(server);
  registerContentTools(server);
}
