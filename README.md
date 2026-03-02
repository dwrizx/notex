# Notex Notepad 📝

A blazing fast, modular, and cross-platform plain-text Editor built with Tauri v2, React, and Bun.

## Architecture

This project strictly adheres to separation of concerns:

- **Frontend State (React)**: Handles the application state via a dedicated hook (`useNotepad.ts`), taking care of tracking file contents, paths, and "is dirty" flags.
- **Backend IO (Tauri v2 Core + Rust)**: Uses `@tauri-apps/plugin-fs` and `@tauri-apps/plugin-dialog` to communicate directly with the operational system for robust raw IO operations (bypassing browser constraints).
- **Tooling**: Accelerated with `bun`, `@typescript/native-preview` (tsgo), `oxlint`, and `oxfmt` ensuring instantaneous verification loops.

## Features

- Modular Component structure (`Toolbar`, `Editor`, `StatusBar`).
- Complete File I/O (New, Open, Save, Save As...).
- Unsaved changes indicator (`*`).
- Code validation under 100ms.

## Setup & Running

```bash
# Install dependencies
bun install

# Run the project in development mode
bun run tauri dev

# Check code health
bun run check:fast
```
