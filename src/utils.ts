/** Type guard: checks that a value is a non-null object (record). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Pretty-print a value as indented JSON. */
export function toJson(value: unknown): string {
  return JSON.stringify(value, undefined, 2);
}

interface ToolResult {
  [key: string]: unknown;
  content: { text: string; type: "text" }[];
  isError?: boolean;
}

/** Wrap a tool handler with standardized error handling. */
export function toolResult(data: unknown): ToolResult {
  return { content: [{ text: toJson(data), type: "text" as const }] };
}

/** Format an error as an MCP tool error response. */
export function toolError(error: unknown): ToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ text: message, type: "text" as const }],
    isError: true,
  };
}
