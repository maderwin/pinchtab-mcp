# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-03-05

### Added

- `pinchtab_close_tab` tool — close the current tab or a specific tab by ID
- `pinchtab_cookies` tool — get all cookies for the current page
- `pinchtab_health` tool — check if PinchTab server is running and responsive
- `newTab` parameter for `pinchtab_navigate` — open URL in a new tab
- `ref` parameter for `pinchtab_press` — target a specific element
- `ref` parameter for `pinchtab_scroll` — scroll within an element
- `left`/`right` directions for `pinchtab_scroll`

## [1.0.0] - 2026-03-05

### Added

- Initial release with 15 MCP tools for browser automation
- Navigation: `pinchtab_navigate`, `pinchtab_snapshot`, `pinchtab_scroll`, `pinchtab_wait`
- Interaction: `pinchtab_click`, `pinchtab_type`, `pinchtab_press`, `pinchtab_hover`, `pinchtab_focus`, `pinchtab_select`
- Content: `pinchtab_screenshot`, `pinchtab_pdf`, `pinchtab_html`, `pinchtab_eval`, `pinchtab_list_instances`
- Automatic PinchTab process management
- Accessibility tree snapshot with diff and filter modes

[1.1.0]: https://github.com/maderwin/pinchtab-mcp/releases/tag/v1.1.0
[1.0.0]: https://github.com/maderwin/pinchtab-mcp/releases/tag/v1.0.0
