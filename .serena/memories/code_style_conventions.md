# Code Style & Conventions — pinchtab-mcp

## Module System
- **ESM only** — `"type": "module"` in package.json
- Import paths must use `.js` extensions (Node16 ESM resolution)

## TypeScript
- `strict: true` in tsconfig
- No `any` (warn) — use proper types
- `interface` over `type` for object shapes
- `Record<K,V>` over index signatures (`{ [key: string]: V }`)
- No `null` — use `undefined` (unicorn/no-null rule)

## Imports
- Sorted members inside `{ }` alphabetically (sort-imports rule)
- No duplicate imports

## Object Keys
- All object literals must have keys sorted alphabetically (natural, case-insensitive)
- This applies to `z.object({...})` schemas too

## Async/Await
- Use `async/await` + `try/catch`, NOT `.then()/.catch()`
- Promise chaining is discouraged (promise/prefer-await-to-then)

## Tests
- Use `it()` not `test()`
- Test titles lowercase (except `describe` blocks)
- Unit tests mock nothing — verify registration, config, logic
- E2E tests require real PinchTab + browser

## Tool Registration Pattern
```typescript
server.registerTool(name, {
  description: "...",
  inputSchema: z.object({
    // keys SORTED alphabetically
    fieldA: z.string().describe("..."),
    fieldB: z.number().optional().describe("..."),
  }),
  title: "...",
}, async (args) => { ... });
```

## Naming
- Tool names: `pinchtab_` prefix, snake_case
- Files: kebab-case (unicorn/filename-case)
- Functions/variables: camelCase

## Interaction Defaults
- `humanClick=true` by default (real mouse events)
- `humanType=true` by default (human-like keystrokes)
- Programmatic variants are opt-in via `humanClick=false` / `humanType=false`

## Adding a New Tool
1. Pick correct file in `src/tools/` (instances, navigation, interaction, content)
2. Register via `server.registerTool()`
3. Sort all object keys alphabetically
4. Tool name must start with `pinchtab_`
5. Add tests in `src/__tests__/`
6. Run `npm run check` before committing

## Commit Convention
- `feat:` new tool or feature
- `fix:` bug fix
- `refactor:` code restructuring
- `test:` adding or fixing tests
- `docs:` documentation changes
- `chore:` CI, deps, config
