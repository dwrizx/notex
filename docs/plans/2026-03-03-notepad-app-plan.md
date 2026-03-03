# Plain Text Notepad Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a blazing fast, modular Plain Text Notepad application using Tauri v2 and React.

**Architecture:** Use Tauri v2 plugins (`@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs`) for backend IO operations. Use React for state management, dividing UI into modular components (Editor, Toolbar, StatusBar) and connecting them using a custom `useNotepad` hook.

**Tech Stack:** Tauri v2, Rust, React, TypeScript, Bun

---

### Task 1: Setup Tauri Plugins and Permissions

**Files:**

- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/capabilities/default.json`
- Modify: `package.json`

**Step 1: Install frontend plugins**
Run: `bun add @tauri-apps/plugin-fs @tauri-apps/plugin-dialog`
Expected: Plugins added to package.json.

**Step 2: Add Rust dependencies**
Run: `cd src-tauri && cargo add tauri-plugin-fs tauri-plugin-dialog && cd ..`
Expected: Dependencies added to Cargo.toml.

**Step 3: Register plugins in Rust**
Modify `src-tauri/src/lib.rs` to initialize both plugins.

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 4: Grant Capabilities**
Modify `src-tauri/capabilities/default.json` to allow dialog and fs operations.

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": ["core:default", "fs:default", "dialog:default"]
}
```

**Step 5: Commit**

```bash
git add package.json bun.lock src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/src/lib.rs src-tauri/capabilities/default.json
git commit -m "chore(tauri): configure fs and dialog plugins with capabilities"
```

---

### Task 2: Create Custom React Hook for State & IO

**Files:**

- Create: `src/hooks/useNotepad.ts`

**Step 1: Implement the hook**
Create `src/hooks/useNotepad.ts`. This hook manages `text`, `filePath`, and `isDirty`, and uses Tauri APIs to interact with the system.

```typescript
import { useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export function useNotepad() {
  const [text, setText] = useState("");
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const updateText = (newText: string) => {
    setText(newText);
    setIsDirty(true);
  };

  const handleNew = () => {
    setText("");
    setFilePath(null);
    setIsDirty(false);
  };

  const handleOpen = async () => {
    try {
      const selected = await open({
        filters: [
          { name: "Text Files", extensions: ["txt", "md", "json", "csv"] },
        ],
        multiple: false,
      });
      if (selected && typeof selected === "string") {
        const content = await readTextFile(selected);
        setText(content);
        setFilePath(selected);
        setIsDirty(false);
      }
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  };

  const handleSave = async () => {
    if (filePath) {
      try {
        await writeTextFile(filePath, text);
        setIsDirty(false);
      } catch (err) {
        console.error("Failed to save file:", err);
      }
    } else {
      await handleSaveAs();
    }
  };

  const handleSaveAs = async () => {
    try {
      const selected = await save({
        filters: [{ name: "Text Files", extensions: ["txt", "md"] }],
      });
      if (selected && typeof selected === "string") {
        await writeTextFile(selected, text);
        setFilePath(selected);
        setIsDirty(false);
      }
    } catch (err) {
      console.error("Failed to save file as:", err);
    }
  };

  return {
    text,
    filePath,
    isDirty,
    updateText,
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
  };
}
```

**Step 2: Run verification**
Run: `bun run fix && bun run check:fast`
Expected: PASS

**Step 3: Commit**

```bash
git add src/hooks
git commit -m "feat(frontend): create useNotepad custom hook"
```

---

### Task 3: Create UI Components (Modularization)

**Files:**

- Create: `src/components/Toolbar.tsx`
- Create: `src/components/Editor.tsx`
- Create: `src/components/StatusBar.tsx`

**Step 1: Implement Toolbar**
Create `src/components/Toolbar.tsx`:

```typescript
import React from 'react';

interface Props {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
}

export const Toolbar: React.FC<Props> = ({ onNew, onOpen, onSave, onSaveAs }) => {
  return (
    <div className="toolbar">
      <button onClick={onNew}>New</button>
      <button onClick={onOpen}>Open</button>
      <button onClick={onSave}>Save</button>
      <button onClick={onSaveAs}>Save As</button>
    </div>
  );
};
```

**Step 2: Implement Editor**
Create `src/components/Editor.tsx`:

```typescript
import React from 'react';

interface Props {
  text: string;
  onChange: (val: string) => void;
}

export const Editor: React.FC<Props> = ({ text, onChange }) => {
  return (
    <textarea
      className="editor"
      value={text}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      placeholder="Type your notes here..."
    />
  );
};
```

**Step 3: Implement StatusBar**
Create `src/components/StatusBar.tsx`:

```typescript
import React from 'react';

interface Props {
  filePath: string | null;
  isDirty: boolean;
  charCount: number;
}

export const StatusBar: React.FC<Props> = ({ filePath, isDirty, charCount }) => {
  return (
    <div className="status-bar">
      <span>{filePath ? filePath : 'Untitled'} {isDirty && '*'}</span>
      <span>{charCount} chars</span>
    </div>
  );
};
```

**Step 4: Format and Check**
Run: `bun run fix && bun run check:fast`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components
git commit -m "feat(frontend): create modular UI components for Notepad"
```

---

### Task 4: Connect the Application

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Step 1: Update App.tsx**
Bring modules together.

```typescript
import { useNotepad } from './hooks/useNotepad';
import { Toolbar } from './components/Toolbar';
import { Editor } from './components/Editor';
import { StatusBar } from './components/StatusBar';
import './App.css';

function App() {
  const notepad = useNotepad();

  return (
    <div className="app-container">
      <Toolbar
        onNew={notepad.handleNew}
        onOpen={notepad.handleOpen}
        onSave={notepad.handleSave}
        onSaveAs={notepad.handleSaveAs}
      />
      <Editor
        text={notepad.text}
        onChange={notepad.updateText}
      />
      <StatusBar
        filePath={notepad.filePath}
        isDirty={notepad.isDirty}
        charCount={notepad.text.length}
      />
    </div>
  );
}

export default App;
```

**Step 2: Update App.css layout**

```css
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  box-sizing: border-box;
}

*,
*::before,
*::after {
  box-sizing: inherit;
}

body,
html,
#root {
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #1e1e1e;
  color: #d4d4d4;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background-color: #333333;
  border-bottom: 1px solid #444;
}

.toolbar button {
  padding: 4px 12px;
  background-color: #444;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
}

.toolbar button:hover {
  background-color: #555;
}

.editor {
  flex: 1;
  width: 100%;
  padding: 16px;
  background-color: #1e1e1e;
  color: #d4d4d4;
  border: none;
  resize: none;
  font-family: "Consolas", "Courier New", monospace;
  font-size: 14px;
  outline: none;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 4px 16px;
  background-color: #007acc;
  color: white;
  font-size: 12px;
}
```

**Step 3: Format and Check**
Run: `bun run fix && bun run check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/App.tsx src/App.css
git commit -m "feat(frontend): connect components and styles to main app"
```

---

### Task 5: Write the README Documentation

**Files:**

- Modify: `README.md`

**Step 1: Write README.md content**
Replace `README.md` to describe the application.

````markdown
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
````

````

**Step 2: Commit**
```bash
git add README.md
git commit -m "docs: write comprehensive README for Notex"
````
