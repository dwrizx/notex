# Notex V2 (Pro) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the existing plain text Notepad to a multi-tab professional editor with CodeMirror 6, Vim mode toggle, and native OS Drag & Drop support.

**Architecture:** Replace the `<textarea>` with `@uiw/react-codemirror`. Refactor `useNotepad.ts` state to handle an array of `tab` objects instead of a single file context. Introduce a React Context for `Settings` (Vim toggle) backed by local storage. Tauri's native drag-drop features will be invoked to auto-read dropped files.

**Tech Stack:** Tauri v2, React, TypeScript, Bun, `@uiw/react-codemirror`, `@replit/codemirror-vim`, TailwindCSS (or raw CSS for tabs).

---

### Task 1: Install Editor Dependencies & Refactor Settings State

**Files:**

- Modify: `package.json`
- Create: `src/hooks/useSettings.ts`

**Step 1: Install frontend packages**
Run: `bun add @uiw/react-codemirror @replit/codemirror-vim uuid` and `bun add -D @types/uuid`
Expected: Dependencies added to package.json.

**Step 2: Create Settings Hook**
Create a new hook `src/hooks/useSettings.ts` to manage Vim mode via LocalStorage.

```typescript
import { useState, useEffect } from "react";

export function useSettings() {
  const [vimMode, setVimMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("notex-vim-mode");
    return saved === "true";
  });

  const toggleVimMode = () => {
    const newVal = !vimMode;
    setVimMode(newVal);
    localStorage.setItem("notex-vim-mode", newVal.toString());
  };

  return { vimMode, toggleVimMode };
}
```

**Step 3: Run formatting check**
Run: `bun run fix`
Expected: Formatting applied cleanly.

**Step 4: Commit**

```bash
git add package.json bun.lock src/hooks/useSettings.ts
git commit -m "feat(editor): install codemirror and add settings hook"
```

---

### Task 2: Refactor useNotepad for Multi-Tab Logic

**Files:**

- Modify: `src/hooks/useNotepad.ts`

**Step 1: Rewrite hook for Array State**
Replace `src/hooks/useNotepad.ts` with multi-tab structure.

```typescript
import { useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { v4 as uuidv4 } from "uuid";

export type Tab = {
  id: string;
  name: string;
  filePath: string | null;
  content: string;
  isDirty: boolean;
};

export function useNotepad() {
  const createEmptyTab = (): Tab => ({
    id: uuidv4(),
    name: "Untitled",
    filePath: null,
    content: "",
    isDirty: false,
  });

  const [tabs, setTabs] = useState<Tab[]>([createEmptyTab()]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const updateActiveText = (newText: string) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTabId
          ? { ...tab, content: newText, isDirty: true }
          : tab,
      ),
    );
  };

  const handleNewTab = () => {
    const newTab = createEmptyTab();
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length === 0) {
        const newt = createEmptyTab();
        setActiveTabId(newt.id);
        return [newt];
      }
      if (activeTabId === id) {
        setActiveTabId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  };

  const openFileIntoNewTab = async (filePath: string) => {
    try {
      const content = await readTextFile(filePath);
      // get filename from path
      const name = filePath.split("\\").pop()?.split("/").pop() || "Unknown";
      const newTab: Tab = {
        id: uuidv4(),
        name,
        filePath,
        content,
        isDirty: false,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
    } catch (err) {
      console.error("Failed to read dragged file:", err);
    }
  };

  const handleOpen = async () => {
    try {
      const selected = await open({
        filters: [
          { name: "Text Files", extensions: ["txt", "md", "json", "csv", "*"] },
        ],
        multiple: false,
      });
      if (selected && typeof selected === "string") {
        await openFileIntoNewTab(selected);
      }
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  };

  const handleSave = async () => {
    if (activeTab.filePath) {
      try {
        await writeTextFile(activeTab.filePath, activeTab.content);
        setTabs((prev) =>
          prev.map((tab) =>
            tab.id === activeTabId ? { ...tab, isDirty: false } : tab,
          ),
        );
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
        filters: [{ name: "Text Files", extensions: ["txt", "md", "*"] }],
      });
      if (selected && typeof selected === "string") {
        await writeTextFile(selected, activeTab.content);
        const name = selected.split("\\").pop()?.split("/").pop() || "Unknown";
        setTabs((prev) =>
          prev.map((tab) =>
            tab.id === activeTabId
              ? { ...tab, filePath: selected, name, isDirty: false }
              : tab,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to save file as:", err);
    }
  };

  return {
    tabs,
    activeTabId,
    activeTab,
    setActiveTabId,
    updateActiveText,
    handleNewTab,
    closeTab,
    handleOpen,
    handleSave,
    handleSaveAs,
    openFileIntoNewTab,
  };
}
```

**Step 2: Run verification**
Run: `bun run fix && bun run check:fast`
Expected: PASS

**Step 3: Commit**

```bash
git add src/hooks/useNotepad.ts
git commit -m "refactor(core): implement multi-tab logic in useNotepad hook"
```

---

### Task 3: Upgrade Editor Component to CodeMirror (with Vim) & Tabs Component

**Files:**

- Modify: `src/components/Editor.tsx`
- Create: `src/components/TabsBar.tsx`
- Modify: `src/components/Toolbar.tsx`

**Step 1: Build TabsBar**
Create `src/components/TabsBar.tsx`

```typescript
import React from 'react';
import { Tab } from '../hooks/useNotepad';

interface Props {
  tabs: Tab[];
  activeTabId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export const TabsBar: React.FC<Props> = ({ tabs, activeTabId, onSelect, onClose }) => {
  return (
    <div className="tabs-bar">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          <span className="tab-title">{tab.name} {tab.isDirty ? '*' : ''}</span>
          <button
            className="tab-close"
            onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
```

**Step 2: Upgrade Editor to CodeMirror**
Modify `src/components/Editor.tsx`:

```typescript
import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vim } from '@replit/codemirror-vim';

interface Props {
  text: string;
  onChange: (val: string) => void;
  vimMode: boolean;
}

export const Editor: React.FC<Props> = ({ text, onChange, vimMode }) => {
  const extensions = vimMode ? [vim()] : [];

  return (
    <div className="editor-wrapper">
      <CodeMirror
        value={text}
        height="100%"
        theme="dark"
        extensions={extensions}
        onChange={(value) => onChange(value)}
        className="cm-editor-container"
      />
    </div>
  );
};
```

**Step 3: Update Toolbar**
Add a Settings/Vim toggle button to `src/components/Toolbar.tsx`.

```typescript
import React from 'react';

interface Props {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  vimMode: boolean;
  onToggleVim: () => void;
}

export const Toolbar: React.FC<Props> = ({ onNew, onOpen, onSave, onSaveAs, vimMode, onToggleVim }) => {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button onClick={onNew}>New Tab</button>
        <button onClick={onOpen}>Open</button>
        <button onClick={onSave}>Save</button>
        <button onClick={onSaveAs}>Save As</button>
      </div>
      <div className="toolbar-right">
        <button
           onClick={onToggleVim}
           className={vimMode ? 'active-toggle' : ''}
        >
          {vimMode ? 'Vim: ON' : 'Vim: OFF'}
        </button>
      </div>
    </div>
  );
};
```

**Step 4: Format code**
Run: `bun run fix`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components
git commit -m "feat(ui): add tabs bar, codemirror editor, and vim toggle"
```

---

### Task 4: Connect Everything and Implement Native Drag & Drop

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Step 1: Update App.tsx logic and layout**
Modify `src/App.tsx` to handle Tauri's window file drop event.

```typescript
import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useNotepad } from './hooks/useNotepad';
import { useSettings } from './hooks/useSettings';
import { Toolbar } from './components/Toolbar';
import { TabsBar } from './components/TabsBar';
import { Editor } from './components/Editor';
import { StatusBar } from './components/StatusBar';
import './App.css';

function App() {
  const notepad = useNotepad();
  const settings = useSettings();

  // Handle Drag & Drop File from OS
  useEffect(() => {
    const unlisten = listen('tauri://file-drop', (event) => {
      const paths = event.payload as string[];
      if (paths && paths.length > 0) {
        // Open the first dropped file
        notepad.openFileIntoNewTab(paths[0]);
      }
    });

    return () => {
      unlisten.then(f => f());
    };
  }, [notepad]);

  return (
    <div className="app-container">
      <Toolbar
        onNew={notepad.handleNewTab}
        onOpen={notepad.handleOpen}
        onSave={notepad.handleSave}
        onSaveAs={notepad.handleSaveAs}
        vimMode={settings.vimMode}
        onToggleVim={settings.toggleVimMode}
      />
      <TabsBar
        tabs={notepad.tabs}
        activeTabId={notepad.activeTabId}
        onSelect={notepad.setActiveTabId}
        onClose={notepad.closeTab}
      />
      <Editor
        text={notepad.activeTab.content}
        onChange={notepad.updateActiveText}
        vimMode={settings.vimMode}
      />
      <StatusBar
        filePath={notepad.activeTab.filePath}
        isDirty={notepad.activeTab.isDirty}
        charCount={notepad.activeTab.content.length}
      />
    </div>
  );
}

export default App;
```

**Step 2: Fix styling in App.css**

```css
/* Add to existing App.css */
.toolbar {
  display: flex;
  justify-content: space-between;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 8px;
}

.active-toggle {
  background-color: #2b702b !important;
  color: white;
  border-color: #3d8f3d !important;
}

.tabs-bar {
  display: flex;
  background-color: #252526;
  overflow-x: auto;
  border-bottom: 1px solid #1e1e1e;
}

.tab {
  display: flex;
  align-items: center;
  padding: 6px 14px;
  background-color: #2d2d2d;
  color: #969696;
  cursor: pointer;
  border-right: 1px solid #1e1e1e;
  border-top: 2px solid transparent;
  min-width: 120px;
  font-size: 13px;
  user-select: none;
}

.tab.active {
  background-color: #1e1e1e;
  color: #ffffff;
  border-top: 2px solid #007acc;
}

.tab:hover:not(.active) {
  background-color: #333333;
}

.tab-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 8px;
}

.tab-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
  border-radius: 4px;
  line-height: 1;
}

.tab-close:hover {
  background-color: #444;
  color: #fff;
}

.editor-wrapper {
  flex: 1;
  width: 100%;
  background-color: #1e1e1e;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.cm-editor-container {
  flex: 1;
  overflow: auto;
  font-family: "Consolas", "Courier New", monospace;
  font-size: 14px;
}

/* Force codemirror to take full height */
.cm-theme-dark,
.cm-editor {
  height: 100% !important;
}
.cm-scroller {
  overflow: auto !important;
}
```

**Step 3: Test and format**
Run: `bun run fix && bun run check:fast`
Expected: PASS

**Step 4: Commit**

```bash
git add src/App.tsx src/App.css
git commit -m "feat(app): wire up tabs, code mirror, drag and drop with final styling"
```
