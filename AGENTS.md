# AGENTS.md

## Cursor Cloud specific instructions

PatentLens is a single **Next.js 15 (App Router) + React 19** web app. A user enters a
patent number; the server calls SerpApi (Google Patents) and Google Gemini and returns a
Korean-language structured analysis. There is no database or separate backend service — the
only server code is the route handler at `app/api/patents/analyze/route.ts`.

Standard scripts live in `package.json` (`dev`, `build`, `start`, `lint`). Notes below cover
only the non-obvious gotchas.

### Node version gotcha (important for running `dev`/`start`)

Every npm script sets `NODE_OPTIONS=--use-system-ca` (via `cross-env`). That flag is only
allowed in `NODE_OPTIONS` on **Node >= 22.15**. The default `node` on `PATH` in this
environment is `/exec-daemon/node` (v22.14.0), which **rejects the flag**, so a bare
`npm run dev` fails with `--use-system-ca is not allowed in NODE_OPTIONS`.

`nvm` ships a compatible Node (v22.22.2). Run dev/start with that node ahead on `PATH`:

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
npm run dev   # http://localhost:3000
```

`npm install` and `npm run build` work with either Node version. `--use-system-ca` is only
needed behind corporate TLS interception; on the VM it is otherwise harmless.

### API keys (BYOK) — needed for the full analysis path

Patent analysis calls external services and needs a **SerpApi key** and a **Gemini key**.
These are "bring your own key": enter them in the UI (top-right **API 키 설정**, stored in
`localStorage`) or set server defaults in `.env.local` (`SERPAPI_KEY`, `GEMINI_API_KEY`,
optional `GEMINI_MODEL`); see `.env.example`. Without keys, a search returns an error, but the
UI, result rendering, and the **PPTX / print export** can be exercised with the shipped dummy
analysis in `lib/patent-dummy-data.ts` (`DUMMY_PATENT` / `getDummyAnalysis`). The PPTX export
(`lib/export-patent-pptx.ts`) and print report run entirely client-side.

### Lint / build

`npm run build` runs TypeScript type-checking and lint and is the reliable validation signal.
`npm run lint` uses the deprecated `next lint`, which prompts **interactively** to create an
ESLint config (none is committed), so it does not run non-interactively — prefer `npm run build`.

### Regression script (needs keys + Node >= 22.15)

```bash
node --use-system-ca --env-file=.env.local scripts/prompt-regression.mjs
```
