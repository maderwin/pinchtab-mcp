import { type ChildProcess, execSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PINCHTAB_BIN, PINCHTAB_URL } from "../config.js";

let pinchtabProcess: ChildProcess | undefined;
let startupPromise: Promise<void> | undefined;

const HEALTH_CHECK_TIMEOUT_MS = 2000;
const POLL_INITIAL_MS = 250;
const POLL_MAX_MS = 2000;
const POLL_TIMEOUT_MS = 15_000;

async function startPinchtab(): Promise<void> {
  const bin = findPinchtabBin();
  if (!bin) {
    const msg =
      "PinchTab not running and binary not found. " +
      "Install: curl -fsSL https://pinchtab.com/install.sh | bash";
    console.error(msg);
    throw new Error(msg);
  }

  console.error(`Starting PinchTab from ${bin}...`);

  const urlObj = new URL(PINCHTAB_URL);
  const port = urlObj.port || "9867";

  pinchtabProcess = spawn(bin, ["start", "--port", port], {
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  pinchtabProcess.unref();

  pinchtabProcess.stderr?.on("data", (data: Buffer) => {
    console.error(`[pinchtab] ${data.toString().trim()}`);
  });

  pinchtabProcess.on("exit", (code) => {
    console.error(`PinchTab process exited with code ${code}`);
    pinchtabProcess = undefined;
  });

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let delay = POLL_INITIAL_MS;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    if (await isPinchtabRunning()) {
      console.error("PinchTab is ready!");
      return;
    }
    delay = Math.min(delay * 2, POLL_MAX_MS);
  }

  throw new Error(`PinchTab started but did not become ready within ${POLL_TIMEOUT_MS / 1000}s`);
}

export function findPinchtabBin(): string | undefined {
  if (PINCHTAB_BIN) return PINCHTAB_BIN;

  // 1. Check node_modules/.bin (installed as dependency)
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const localBin = resolve(__dirname, "..", "node_modules", ".bin", "pinchtab");
  if (existsSync(localBin)) return localBin;

  // 2. Check PATH
  try {
    const result = execSync("which pinchtab", { encoding: "utf8" }).trim();
    return result || undefined;
  } catch {
    console.error("pinchtab binary not found in PATH");
    return undefined;
  }
}

export async function isPinchtabRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${PINCHTAB_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function ensurePinchtabRunning(): Promise<void> {
  if (startupPromise) {
    return startupPromise;
  }

  startupPromise = (async () => {
    if (await isPinchtabRunning()) {
      console.error("PinchTab already running at", PINCHTAB_URL);
      return;
    }
    await startPinchtab();
  })();

  try {
    await startupPromise;
  } finally {
    startupPromise = undefined;
  }
}

export function cleanup(): void {
  if (pinchtabProcess) {
    console.error("Stopping PinchTab...");
    pinchtabProcess.kill("SIGTERM");
    pinchtabProcess = undefined;
  }
}
