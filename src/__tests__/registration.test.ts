import { describe, expect, it } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAllTools } from "../tools/index.js";

describe("tool registration", () => {
  it("registers all tools without throwing", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    expect(() => registerAllTools(server)).not.toThrow();
  });

  it("imports each module without errors", async () => {
    const instances = await import("../tools/instances.js");
    const navigation = await import("../tools/navigation.js");
    const interaction = await import("../tools/interaction.js");
    const content = await import("../tools/content.js");

    expect(instances.registerInstanceTools).toBeTypeOf("function");
    expect(navigation.registerNavigationTools).toBeTypeOf("function");
    expect(interaction.registerInteractionTools).toBeTypeOf("function");
    expect(content.registerContentTools).toBeTypeOf("function");
  });
});
