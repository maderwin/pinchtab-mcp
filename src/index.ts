import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { instructions } from "./instructions.js";
import { cleanup, ensurePinchtabRunning } from "./pinchtab/process.js";
import { registerAllTools } from "./tools/index.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

// Cleanup on exit
process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});
process.on("exit", cleanup);

// Server
const server = new McpServer({ name: "pinchtab-mcp", version }, { instructions });
registerAllTools(server);

async function main() {
  await ensurePinchtabRunning();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PinchTab MCP server running on stdio");
}

try {
  await main();
} catch (error) {
  console.error("Fatal:", error);
  process.exit(1);
}
