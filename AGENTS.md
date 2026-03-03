# Repository Guidelines

## Project Structure & Module Organization

`src/` contains the React frontend: `components/` for UI blocks, `hooks/` for app state and preferences, `App.tsx` as the composition root, and `App.css` for the main styling. `src-tauri/` contains the Rust host app, Tauri config, capabilities, and bundle assets. Use `public/` for static web assets and `docs/plans/` for design or implementation notes. Build output lands in `dist/`; do not hand-edit generated files.

## Build, Test, and Development Commands

Install dependencies with `bun install`.

- `bun run tauri dev` starts the Vite frontend and Tauri desktop shell together.
- `bun run dev` runs the frontend only at `http://localhost:1420`.
- `bun run build` builds the TypeScript app into `dist/`.
- `bun run tauri build` packages the desktop app.
- `bun run check` runs type checking, linting, and formatting checks.
- `bun run check:fast` runs lint + format checks only.
- `bun run fix` applies `oxlint` fixes and `oxfmt` formatting.

## Coding Style & Naming Conventions

Write TypeScript/TSX that matches `oxfmt` output: concise imports, consistent spacing, and lines near the configured 80-column width. Use `PascalCase` for components (`TabsBar.tsx`), `camelCase` for functions and event handlers (`handleSaveAs`), and `useX` for hooks (`useNotepad`). Prefer small, focused React components and keep shared state in hooks instead of prop chains. For Rust in `src-tauri/src/`, follow standard `rustfmt` conventions and keep Tauri-facing changes explicit.

## Testing Guidelines

There is no dedicated automated test suite yet. Treat `bun run check` as the minimum gate before every PR, then verify desktop behavior manually with `bun run tauri dev`, especially tab management, file open/save flows, and drag-and-drop. If you add tests, place them close to the feature as `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines

The current history uses Conventional Commit style, usually with scopes, for example `feat(app): ...`, `refactor(core): ...`, and `docs: ...`. Keep subjects imperative and focused on one change. PRs should include a short summary, linked issue or plan doc when relevant, the commands you ran (`bun run check`, manual Tauri verification), and screenshots or GIFs for visible UI changes.

## Tauri & Configuration Notes

When adding native capabilities, update `src-tauri/capabilities/default.json` alongside the frontend or Rust code that needs them. Keep file system and dialog access inside approved Tauri plugins instead of ad hoc native workarounds.
