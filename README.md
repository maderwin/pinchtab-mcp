# pinchtab-mcp

[![npm version](https://img.shields.io/npm/v/pinchtab-mcp)](https://www.npmjs.com/package/pinchtab-mcp)
[![npm downloads](https://img.shields.io/npm/dm/pinchtab-mcp)](https://www.npmjs.com/package/pinchtab-mcp)
[![CI](https://github.com/maderwin/pinchtab-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/maderwin/pinchtab-mcp/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/maderwin/pinchtab-mcp/graph/badge.svg)](https://codecov.io/gh/maderwin/pinchtab-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/node/v/pinchtab-mcp)](https://nodejs.org)

MCP server for [PinchTab](https://pinchtab.com) — control Chrome (or any Chromium browser) via accessibility tree snapshots through the Model Context Protocol.

PinchTab is included as a dependency and starts automatically — no manual setup required.

## Quick Start

```bash
npx pinchtab-mcp
```

Or install globally:

```bash
npm install -g pinchtab-mcp
pinchtab-mcp
```

## Client Setup

**Claude Desktop** — add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pinchtab": {
      "command": "npx",
      "args": ["-y", "pinchtab-mcp"]
    }
  }
}
```

With a custom browser (see [Configuration](#configuration)):

```json
{
  "mcpServers": {
    "pinchtab": {
      "command": "npx",
      "args": ["-y", "pinchtab-mcp"],
      "env": {
        "CHROME_BINARY": "/Applications/Yandex.app/Contents/MacOS/Yandex",
        "BRIDGE_HEADLESS": "false"
      }
    }
  }
}
```

**Cursor / VS Code** — add to `.cursor/mcp.json` or `.vscode/mcp.json`:

```json
{
  "servers": {
    "pinchtab": {
      "command": "npx",
      "args": ["-y", "pinchtab-mcp"]
    }
  }
}
```

**Claude Code:**

```bash
claude mcp add pinchtab -- npx -y pinchtab-mcp
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PINCHTAB_URL` | `http://127.0.0.1:9867` | PinchTab API endpoint |
| `PINCHTAB_TOKEN` | *(empty)* | Auth token (must match PinchTab's `BRIDGE_TOKEN`) |
| `PINCHTAB_BIN` | *(auto-detect)* | Explicit path to PinchTab binary |

Binary lookup order: `PINCHTAB_BIN` → `node_modules/.bin/pinchtab` → system PATH.

### PinchTab Configuration

PinchTab itself is configured via env variables or a config file (`~/.config/pinchtab/config.json`):

| Variable | Default | Description |
|---|---|---|
| `CHROME_BINARY` | *(bundled Chromium)* | Path to browser binary — use this for Yandex Browser, Brave, Edge, etc. |
| `CDP_URL` | *(none)* | Connect to an already-running browser's DevTools (e.g. `http://localhost:9222`) |
| `BRIDGE_HEADLESS` | `true` | Set to `false` to see the browser window |
| `BRIDGE_PORT` | `9867` | PinchTab HTTP API port |
| `BRIDGE_TOKEN` | *(none)* | Protect the API with an auth token |
| `BRIDGE_PROFILE` | `~/.config/pinchtab/chrome-profile` | Browser profile directory (cookies, sessions) |
| `BRIDGE_MAX_TABS` | `20` | Max open tabs |
| `BRIDGE_BLOCK_ADS` | `false` | Block ads |
| `BRIDGE_BLOCK_IMAGES` | `false` | Block image loading (faster scraping) |
| `BRIDGE_BLOCK_MEDIA` | `false` | Block video/audio |
| `BRIDGE_NO_ANIMATIONS` | `false` | Disable CSS animations |
| `BRIDGE_STEALTH` | `light` | Anti-detection level |
| `BRIDGE_TIMEZONE` | *(system)* | Override timezone |
| `BRIDGE_USER_AGENT` | *(auto)* | Override User-Agent |
| `CHROME_FLAGS` | *(none)* | Extra flags passed to the browser |

### Custom Browser Examples

```bash
# Yandex Browser
CHROME_BINARY="/Applications/Yandex.app/Contents/MacOS/Yandex" npx pinchtab-mcp

# Brave
CHROME_BINARY="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npx pinchtab-mcp

# Microsoft Edge
CHROME_BINARY="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" npx pinchtab-mcp

# Visible browser (non-headless) for debugging
BRIDGE_HEADLESS=false npx pinchtab-mcp

# Custom window size (default: random common resolution for stealth)
CHROME_FLAGS="--window-size=1920,1080" npx pinchtab-mcp

# Connect to an existing browser session (keeps your tabs, cookies, logins)
CDP_URL="http://localhost:9222" npx pinchtab-mcp
```

## Documentation

For tools reference, project structure, agent workflow, and code style see [PROJECT_INDEX.md](PROJECT_INDEX.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
