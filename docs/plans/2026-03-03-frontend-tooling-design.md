# Frontend Tooling Design: "Fastest Frontend Tooling" with Bun, tsgo, Oxlint, and Oxfmt

## Overview
This document outlines the design and plan for setting up a high-performance, fast-feedback frontend tooling stack for the **Notex** project (a Vite + React + Tauri application). The goal is to provide instantaneous type checking, linting, and formatting.

## Architecture & Components
To maximize feedback speed and enforce strict guardrails, we replace traditional Node.js/npm-based tooling with a Bun-first approach:

1. **Bun**: Package manager and primary script runner for instantaneous script execution.
2. **tsgo (`@typescript/native-preview`)**: A high-speed native TypeScript type-checker, replacing standard `tsc` for type verification.
3. **Oxlint**: An ultra-fast linter written in Rust, configured for a "Standard" (no extra preset) setup.
4. **Oxfmt**: A rapid formatter (Prettier alternative), ensuring consistent coding style.

## Implementation Steps
Based on the `SKILL.md` checklist and user approval, the setup will proceed as follows:

1. **Install Dependencies (Bun-first)**
   ```bash
   bun add -D @typescript/native-preview oxlint oxfmt
   ```

2. **Configure `package.json` Scripts**
   Add standardized quality-gate scripts to enforce the workflow:
   - `typecheck`: `tsgo -p tsconfig.json`
   - `lint`: `oxlint .`
   - `lint:fix`: `oxlint . --fix`
   - `fmt`: `oxfmt .`
   - `fmt:check`: `oxfmt --check .`
   - `check:fast`: `bun run lint && bun run fmt:check`
   - `check`: `bun run typecheck && bun run lint && bun run fmt:check`
   - `fix`: `bun run lint:fix && bun run fmt`

3. **Editor Configuration (VS Code)**
   Create/update `.vscode/settings.json` to enable experimental tsgo language service features:
   ```jsonc
   {
       "typescript.experimental.useTsgo": true
   }
   ```

4. **Initialize Oxlint**
   Generate the base configuration for a fresh setup:
   ```bash
   bunx oxlint --init
   ```

5. **Configure Oxfmt**
   Create a minimal `.oxfmtrc.jsonc` file setting `printWidth` to 80 characters to ensure consistent line lengths.
   ```jsonc
   {
       "$schema": "./node_modules/oxfmt/configuration_schema.json",
       "printWidth": 80
   }
   ```

## Workflow Expectations
- **Development**: Developers should run `bun run check:fast` frequently for rapid linting and formatting feedback.
- **Pre-commit/PR**: Run `bun run check` to perform a comprehensive validation including full type checking.
- **Autofix**: Use `bun run fix` to automatically correct most linting and formatting issues.
