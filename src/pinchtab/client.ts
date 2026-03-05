import { PINCHTAB_TOKEN, PINCHTAB_URL } from "../config.js";
import { ensurePinchtabRunning, isPinchtabRunning } from "./process.js";

const REQUEST_TIMEOUT_MS = 30_000;

export async function pinch(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  if (!(await isPinchtabRunning())) {
    await ensurePinchtabRunning();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (PINCHTAB_TOKEN) {
    headers["Authorization"] = `Bearer ${PINCHTAB_TOKEN}`;
  }

  const url = `${PINCHTAB_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      body: body ? JSON.stringify(body) : undefined,
      headers,
      method,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error(`PinchTab ${method} ${path} timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw error;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PinchTab ${method} ${path} → ${res.status}: ${text}`);
  }

  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].toLowerCase().trim();
  if (contentType === "application/json") {
    return res.json();
  }
  return res.text();
}
