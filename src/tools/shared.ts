import { pinch } from "../pinchtab/client.js";

const MAX_WAIT_MS = 10_000;

/** Wait then return a compact snapshot. Shared by navigation and interaction tools. */
export async function waitAndSnapshot(ms: number): Promise<string> {
  const clamped = Math.min(ms, MAX_WAIT_MS);
  await new Promise((resolve) => setTimeout(resolve, clamped));
  const snapshot = await pinch("GET", "/snapshot?format=compact");
  return typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot, undefined, 2);
}
