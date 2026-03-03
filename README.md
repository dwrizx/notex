<div align="center">
  <img src="https://tauri.app/meta/logomark.svg" alt="Tauri Logo" width="100"/>
  <h1>📝 Notex Pro (v2.0)</h1>
  <p><strong>A Blazing Fast, Native-feeling Modular Plain Text Editor</strong></p>
  <p><i>Powered by Tauri v2, React, Bun, and CodeMirror 6.</i></p>
</div>

---

## ⚡ Overview

**Notex Pro** is a lightweight yet extremely powerful desktop text editor designed for developers and power users who value speed, efficiency, and minimalism. It bridges the gap between a classic simple Notepad and a full-fledged IDE, bringing you multi-tab workflows, instantaneous native IO, and true Vim keybindings—all while maintaining an incredibly tiny footprint.

## ✨ Core Features

- **Multi-Tab Architecture**: Work on multiple files simultaneously just like in your favorite browser. Open, seamlessly switch between, and manage multiple documents in a single window without compromising performance.
- **Vim Mode Integration**: Tired of reaching for the mouse? Enable the native **Vim Mode** (powered by `@replit/codemirror-vim`) to use all your favorite keybindings (`hjkl`, `dd`, `ciw`, visual block mode, etc.). Your preference is saved locally across sessions!
- **CodeMirror 6 Engine**: Gone is the clunky HTML `<textarea>`. Enjoy a robust programmer-centric editing engine with high performance, crisp monospace rendering, and endless extensibility.
- **Native OS Drag & Drop**: Drop any text file (`.txt`, `.md`, `.json`, `.csv`, etc.) directly into the application window and Notex will instantaneously open it in a brand-new tab.
- **Blazing Fast UI Tooling**: Built using the cutting-edge "Fastest Frontend Tooling" stack:
  - **Bun:** The ultimate package manager and script runner.
  - **tsgo:** Instantaneous native TypeScript type-checking.
  - **Oxlint & Oxfmt:** Rust-based linter and formatter, processing code in literally milliseconds.

---

## 🏗️ Architecture Under the Hood

This project rigorously enforces modular separation of concerns between the JavaScript frontend layer and the Rust system layer:

### Frontend (React + Context)

- **`useNotepad.ts`:** The central nervous system of the app. It maintains the UI state matrix (Array of `Tabs`), handles the logic for opening new/empty tabs, and triggers File IO bridging to Tauri.
- **`useSettings.ts`:** Manages global user preferences (like Vim Mode) and persists them securely to `localStorage`.
- **Component Modularity:** The UI is cleanly sliced into functional blocks (`TabsBar.tsx`, `Toolbar.tsx`, `Editor.tsx`, `StatusBar.tsx`) ensuring components remain testable and re-usable.

### Backend (Tauri v2 + Rust)

- **Zero Magic Custom Commands:** By utilizing the official stable **Tauri Plugins (`plugin-fs` & `plugin-dialog`)**, we abstract away custom unsafe Rust commands. The frontend communicates safely with the OS natively.
- **Strict Security Capabilities:** Defined centrally in `src-tauri/capabilities/default.json`. The app is heavily sandboxed, and features like opening native OS-level dialogs and reading/writing local files require explicit opt-in permissions.
- **Native File Drop API:** Employs the Tauri core window event `tauri://file-drop` to intercept native OS pointer actions gracefully without blocking the main event thread.

---

## 🛠️ Getting Started & Setup

### Prerequisites

1.  **Bun** installed (`curl -fsSL https://bun.sh/install | bash`).
2.  **Rust / Cargo** installed.
3.  OS-specific C++ build tools required by Tauri.

### Installation

Clone the repository and install the lightning-fast dependencies.

```bash
bun install
```

### Development

Launch the app in development mode with HMR (Hot Module Replacement):

```bash
bun run tauri dev
```

### Quality Control Checks

Ensure your code follows the strict quality standards before committing:

```bash
# Run the super-fast linter & formatter
bun run check:fast

# Perform a full test (Linter + Formatter + TS Type Check)
bun run check

# Auto-fix all syntax and format issues
bun run fix
```

### Build for Production

Package the app into a final standalone installer and executable (`.exe` on Windows, `.app` on Mac):

```bash
bun run tauri build
```

_The resulting binary will be located in the `src-tauri/target/release/` directory._

---

## 🤝 Contributing

Have ideas for adding Syntax Highlighting, Custom Themes, or Markdown Preview panels? Feel free to open a PR! We love expanding the modular ecosystem of Notex.
