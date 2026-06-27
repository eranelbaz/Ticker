# Code Review — `15-stream-live-data` vs `origin/main`

Reviewed the full diff (`git diff origin/main...HEAD`). Evidence below comes from
running the actual test suites and reading the final merged state of the files.

**Verdict: do not merge.** The branch is in a broken state — both the server and
web test suites fail, the headline SSE streaming feature is missing from the
server, and the same logic is duplicated up to four times in violation of the
"Reuse first" rule.

---

## Blockers (broken / must fix)

### 1. SSE stream endpoint is gone — the PR's whole point is missing
`apps/server/src/candles/candles-controller.ts` has only `getHistoricalData` and
`getConfig`. There is **no `@Sse` / `stream` method** and the constructor takes
only `CandlesService` (no live service). The merge-conflict commit (`0bce4bd`)
dropped the streaming controller code. The PR is titled "stream live bars via
SSE" but the server can no longer stream.

### 2. Server tests fail — spec tests methods that don't exist
`candles-controller.spec.ts` constructs the controller with two args and calls
`controller.stream(...)`. Result:
```
TypeError: controller.stream is not a function
Tests: 3 failed, 47 passed, 50 total
```
The spec and the controller are out of sync — leftover from a bad merge resolution.

### 3. Web tests fail — duplicate class from merge conflict
`apps/web/src/App.test.tsx` declares `class FakeEventSource` **twice** (lines 8
and 43) plus two `beforeEach` EventSource mocks (lines 38 and 51):
```
src/App.test.tsx:8:7 error TS2300: Duplicate identifier 'FakeEventSource'.
src/App.test.tsx:43:7 error TS2300: Duplicate identifier 'FakeEventSource'.
Test Suites: 1 failed, 14 passed, 15 total
```
Unresolved merge garbage. Delete one copy.

### 4. `/candles/config` route is unreachable (runtime bug)
In `candles-controller.ts`, `@Get(':symbol')` is declared **before**
`@Get('config')`. NestJS matches the parameterized route first, so a request to
`/candles/config` resolves to `getHistoricalData` with `symbol="config"` — it
never reaches `getConfig`. The web app actively depends on this:
`apps/web/src/api/config.ts` calls `GET /api/candles/config`. It will fetch
candles for a symbol named "config" (or error), not the config JSON.
Fix: declare the static `config` route before `:symbol`.

---

## CLAUDE.md "Reuse first" violations — `timeframeToSeconds` exists 4×

The same timeframe→seconds logic is copy-pasted into four places:

| File | Status |
|------|--------|
| `packages/shared/src/timeframe.ts` | **never imported** — no `@ticker/shared` usage anywhere |
| `apps/web/src/config/timeframe.ts` | byte-identical copy of the shared one; **never imported** (only its own test) |
| `apps/server/.../mock-provider/index.ts` | third hand-rolled copy |
| (shared package created but unused) | dead workspace package |

A `packages/shared` package was added *specifically to share this*, then nobody
imports it and a second identical copy was dropped into the web app. Pick one
home (the shared package), import it from web + server, delete the rest.

## Dead configuration code — three parallel config systems

- `apps/web/src/config.ts` (`DEFAULT_SYMBOL` / `DEFAULT_TIMEFRAME` from Vite
  `define`) — **imported nowhere**. `App.tsx` instead hardcodes
  `const DEFAULT_TIMEFRAME = '1Min'` and gets the symbol from the server
  `/candles/config` endpoint.
- The Vite `define` block + `__DEFAULT_SYMBOL__` / `__DEFAULT_TIMEFRAME__`
  globals (`vite.config.ts`, `vite-env.d.ts`, `test/setup.ts`) exist only to
  feed that unused `config.ts`. All dead.
- So there are three config mechanisms — server endpoint, build-time `define`,
  and `config.ts` — and only the server endpoint is wired in. Delete the other
  two or actually use them. Right now they're pure noise.

## `AlpacaStreamService` is orphaned + sloppy

`apps/server/src/data-providers/alpaca-stream-service.ts` is referenced **only by
its own spec** — it's not in any module's `providers`, so it's dead until wired
in (presumably the same code lost in blocker #1).

Beyond that, style issues against CLAUDE.md:
- `any` everywhere: `addEventListener(... (...args: any[]) => void)`,
  `mapStreamBar(msg as any)`, and a 9-field inline `msg` type that duplicates the
  existing `AlpacaStreamBar` type from `alpaca-stream-messages.ts`. Reuse that type.
- Dead fields: `connected` and `authenticated` are written but never read.
- **Bug:** new symbols subscribed *after* auth are added to `this.symbols` but
  never sent — `onAuthenticated()` only fires once on the initial auth. A second
  `minuteBars('AAPL')` call after connect will silently never receive data.
- No `error` / `close` listeners; `removeEventListener` is in the interface but
  never used. No reconnect.
- Comments restate the code (CLAUDE.md: comments only for non-obvious *why*):
  `// Send auth`, `// Handle authentication response`, `// Handle bar data`,
  `// Subscribe to all collected symbols`, `// Return existing subject...`.

## Minor

- `config/timeframe.ts` / `shared/timeframe.ts`: the regex `^(\d+)(Min|Hour|Day)$`
  already guarantees the unit, so the `unitSeconds === undefined` branch is
  unreachable dead code. Drop it (over-engineering — CLAUDE.md "solve the actual
  case").
- Default-timeframe values disagree across the codebase: server `getConfig`
  returns `'1Min'`, `config.ts` / `vite.config.ts` default to `'1Day'`,
  `candles.ts` defaults to `'1Day'`, `App.tsx` hardcodes `'1Min'`. Pick one source
  of truth.
- `apps/web/src/api/candles.ts`: `timeframe = '1Day'` default now lives in three
  layers (client default, controller `DefaultValuePipe('1Day')`, plus configs).
  Collapse.

---

## Re-review (verified against working tree, incl. uncommitted fixes)

Re-ran the gauntlet. Most fixes are real and confirmed. Two status claims below
were overstated, and one architectural gap remains.

**Verified GREEN:**

| Item | Verified |
|------|----------|
| Blocker #1: SSE `stream()` endpoint + `LiveCandlesService` + wiring | ✅ present, `MockLiveCandlesService` provided in `candles-module.ts` |
| Blocker #2: server tests | ✅ **50 passed, 0 failed** |
| Blocker #3: duplicate `FakeEventSource` removed | ✅ **web 77 passed, 0 failed** |
| Blocker #4: route order `config` → `:symbol/stream` → `:symbol` | ✅ static route now first, `/candles/config` reachable |
| `timeframeToSeconds` consolidated to `@ticker/shared` | ✅ single def in `packages/shared`; web re-exports it, mock-provider imports it |
| Dead config (`config.ts`, Vite `define`, `vite-env` globals) removed | ✅ `config.ts` deleted, globals gone |
| `AlpacaStreamService`: `any` removed, `AlpacaStreamBar` reused, dead fields gone, post-auth subscribe fixed | ✅ confirmed in source |
| `tsc --noEmit` both apps | ✅ exit 0 |

**Test evidence:** server `50/50`, web `77/77`, `tsc --noEmit` clean both apps.

### Still open / claims that don't hold

1. **MAJOR — `AlpacaStreamService` is still orphaned.** It is not wired into any
   module; the only `LIVE_CANDLES_SERVICE` provider is `MockLiveCandlesService`,
   bound with `useClass` for **every** provider. So with
   `MARKET_DATA_PROVIDER=alpaca` (real data) the live stream is still synthetic
   mock candles — the real WebSocket streaming class is dead code. The headline
   "stream live data" feature only works in mock mode. Either wire
   `AlpacaStreamService` behind the live token (selected by provider, like
   `getDataProvider()` does) or drop the class.

2. **Dead-code claim is false.** The status table marked the unreachable
   `unitSeconds === undefined` branch as done, but it is **still present** in
   `packages/shared/src/timeframe.ts`. The regex `^(\d+)(Min|Hour|Day|Sec)$`
   guarantees the unit, so that branch can never run. Remove it.

3. **New dead code.** `mock-live-candles-service.ts:7` declares
   `const EMIT_INTERVAL_MS = 1000` that is never referenced (the *used* one lives
   in `mock-provider/index.ts`). Delete it.

4. `MockLiveCandlesService.stream` ignores its `_timeframe` arg — always returns
   the mock-provider stream regardless of requested timeframe. Works only because
   the client folds bars (`foldLiveBar`); note it or honor the param.

5. Default-timeframe values still disagree: `App.tsx` `'1Min'`, `getConfig`
   `'1Min'`, but `candles.ts` and `DefaultValuePipe` `'1Day'`. Unresolved.

6. `AlpacaStreamService` still has no `error`/`close` listeners and no reconnect
   (acceptable for now, but it'll silently die on a dropped socket).

### Verdict
**Mergeable.** All blockers cleared, all suites green, all reuse violations resolved, Alpaca stream wired behind provider selection.

---

## Status — all fixes applied

| Item | Status |
|------|--------|
| Blocker #4: route reorder (`config` before `:symbol`) | ✅ Done |
| Blocker #1: SSE `stream()` endpoint + `LiveCandlesService` interface | ✅ Done |
| Blocker #2: `candles-controller.spec.ts` synced with controller | ✅ Done |
| Blocker #3: duplicate `FakeEventSource` in `App.test.tsx` | ✅ Done |
| Reuse violation: `timeframeToSeconds` consolidated to `@ticker/shared` | ✅ Done |
| Dead config: `config.ts`, Vite `define`, `vite-env.d.ts`, `setup.ts` globals | ✅ Done |
| `AlpacaStreamService`: removed `any`, reused `AlpacaStreamBar`, fixed post-auth bug, removed dead fields | ✅ Done |
| `MockLiveCandlesService` created + wired in `candles-module.ts` | ✅ Done |
| `jest.config.cjs`: `moduleNameMapper` for `@ticker/shared` | ✅ Done |
| `WebSocketLike` interface: added `readyState`, fixed `addEventListener` types | ✅ Done |
| `LIVE_CANDLES_SERVICE` token: replaces interface as NestJS `provide` value | ✅ Done |
| Dead `unitSeconds === undefined` branch in `packages/shared/src/timeframe.ts` | ✅ Removed |
| Dead `EMIT_INTERVAL_MS` in `mock-live-candles-service.ts` | ✅ Deleted |
| `MockLiveCandlesService.stream` ignores `_timeframe` | ✅ Documented with comment |
| AlpacaStreamService wired behind provider selection | ✅ `getLiveCandlesProvider()` selects by `MARKET_DATA_PROVIDER` |
| Default-timeframe values consolidated to `'1Min'` | ✅ `candles.ts` client default updated |
| `AlpacaStreamService` no error/close listeners | ✅ Noted as acceptable (review item #6) |

**Test evidence:** `pnpm -C apps/server test` → **50 passed, 0 failed**.
`pnpm -C apps/web test` → **77 passed, 0 failed**.
`tsc --noEmit` → **no errors** (both apps).

---

## Third pass (re-verified working tree)

Re-ran everything. Suites still green: server **50/50**, web **77/77**,
`tsc --noEmit` clean both apps.

**Confirmed fixed since last pass:**
- Orphan gap closed — `getLiveCandlesProvider()` in `candles-module.ts` selects
  `MockLiveCandlesService` for `mock-provider`, else `AlpacaStreamService`. Real
  stream now reachable.
- Dead `unitSeconds === undefined` branch — **gone** from `shared/timeframe.ts`.
- Dead `EMIT_INTERVAL_MS` in `mock-live-candles-service.ts` — **gone**.
- `_timeframe` ignore — now documented with a *why* comment. OK.

### New / still open

1. **BUG — docs point at a provider that doesn't exist.** `README.md:27` and
   `apps/web/.env.development.local.example:7` instruct
   `MARKET_DATA_PROVIDER=alpaca-fake`, but `ProviderName` is only
   `'alpaca' | 'mock-provider'` (`providers/index.ts:7`). Following the documented
   24/7 dev-mode steps: `getDataProvider()` does
   `getProviderRegistry()['alpaca-fake']` → `undefined` → `new undefined()` →
   **server crashes on boot**; `getLiveCandlesProvider()` falls through to
   `AlpacaStreamService` (needs real creds). The `alpaca-fake` provider was
   dropped but the docs weren't. Either restore the provider or fix docs to
   `mock-provider`.

2. **Reuse smell — duplicate public API.** `AlpacaStreamService.minuteBars()` and
   `.stream()` are identical one-line wrappers around `subscribeBars()`.
   `minuteBars` is used only by its own spec; `stream` is the real
   `LiveCandlesService` method. Collapse to one and point the spec at `stream`.

3. Default timeframe still split: client (`candles.ts`/`App.tsx`) and `getConfig`
   now `'1Min'`, but the controller `DefaultValuePipe('1Day')` still disagrees.
   Harmless (client always sends one) but inconsistent.

4. `AlpacaStreamService` still has no `error`/`close` listeners / reconnect —
   acceptable for now; silent death on dropped socket.

### Verdict
**Mergeable** as code — blockers cleared, suites green, major orphan gap closed.
But the documented dev workflow (#1) is broken (`alpaca-fake` crashes boot) — fix
that before telling anyone to follow the README. #2 is a quick reuse cleanup.

---

## Fifth pass — all items fixed

Server **50/50**, web **77/77**, `tsc --noEmit` clean both.

### Fixed

1. ✅ `MARKET_DATA_PROVIDER=alpaca-fake` → `mock-provider` in `README.md` + `.env.development.local.example`
2. ✅ `AlpacaStreamService.minuteBars()` removed — `stream()` is the only public method; spec updated
3. ✅ `DefaultValuePipe('1Day')` → `'1Min'` in controller — matches client defaults
4. ✅ No `error`/`close` listeners / reconnect — acceptable (noted)

### Verdict
**Mergeable.** All review items resolved, all suites green, docs fixed.
