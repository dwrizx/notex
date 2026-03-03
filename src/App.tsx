import {
  Suspense,
  lazy,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { message } from "@tauri-apps/plugin-dialog";
import { useNotepad } from "./hooks/useNotepad";
import { useSettings } from "./hooks/useSettings";
import { TabsBar } from "./components/TabsBar";
import { StatusBar } from "./components/StatusBar";
import "./App.css";

const Editor = lazy(async () => {
  const module = await import("./components/Editor");
  return { default: module.Editor };
});

type MenuActionPayload = {
  action: string;
  filePath?: string | null;
};

type SearchStatus = {
  query: string;
  current: number;
  total: number;
};

type VimStatus = {
  mode: string;
  commandText: string | null;
};

function App() {
  const notepad = useNotepad();
  const settings = useSettings();
  const deferredContent = useDeferredValue(notepad.activeTab.content);
  const [cursorState, setCursorState] = useState({
    line: 1,
    column: 1,
    selectionLength: 0,
  });
  const [editorCommand, setEditorCommand] = useState<{
    type:
      | "open-search"
      | "open-replace"
      | "find-next"
      | "find-previous"
      | "replace-next"
      | "replace-all"
      | "goto-line";
    nonce: number;
  } | null>(null);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>({
    query: "",
    current: 0,
    total: 0,
  });
  const [vimStatus, setVimStatus] = useState<VimStatus | null>(null);

  const handleFileDrop = useEffectEvent((paths: string[]) => {
    const firstPath = paths[0];
    if (firstPath) {
      void notepad.openFileIntoNewTab(firstPath);
    }
  });

  const queueEditorCommand = (
    type:
      | "open-search"
      | "open-replace"
      | "find-next"
      | "find-previous"
      | "replace-next"
      | "replace-all"
      | "goto-line",
  ) => {
    setEditorCommand({ type, nonce: Date.now() });
  };

  const handleMenuAction = useEffectEvent((payload: MenuActionPayload) => {
    const fontSizeMatch = payload.action.match(/^settings\.font_size\.(\d+)$/);
    if (fontSizeMatch) {
      settings.applyFontSize(Number(fontSizeMatch[1]));
      return;
    }

    switch (payload.action) {
      case "file.new":
        notepad.handleNewTab();
        break;
      case "file.open":
        void notepad.handleOpen();
        break;
      case "file.save":
        void notepad.handleSave();
        break;
      case "file.save_as":
        void notepad.handleSaveAs();
        break;
      case "file.open_recent":
        if (payload.filePath) {
          void notepad.openRecentFile(payload.filePath);
        }
        break;
      case "edit.find":
        queueEditorCommand("open-search");
        break;
      case "edit.replace":
        queueEditorCommand("open-replace");
        break;
      case "edit.find_next":
        queueEditorCommand("find-next");
        break;
      case "edit.find_previous":
        queueEditorCommand("find-previous");
        break;
      case "edit.replace_next":
        queueEditorCommand("replace-next");
        break;
      case "edit.replace_all":
        queueEditorCommand("replace-all");
        break;
      case "edit.go_to_line":
        queueEditorCommand("goto-line");
        break;
      case "settings.toggle_theme":
        settings.toggleTheme();
        break;
      case "settings.toggle_wrap":
        settings.toggleWordWrap();
        break;
      case "settings.toggle_vim":
        settings.toggleVimMode();
        break;
      case "settings.toggle_autosave":
        settings.toggleAutosave();
        break;
      case "settings.zoom_in":
        settings.zoomIn();
        break;
      case "settings.zoom_out":
        settings.zoomOut();
        break;
      case "settings.zoom_reset":
        settings.resetZoom();
        break;
      case "help.about":
        void message(
          "Notex is a native-feeling plain text editor built with Tauri, React, and CodeMirror.",
          {
            title: "About Notex",
            kind: "info",
          },
        );
        break;
      default:
        break;
    }
  });

  useEffect(() => {
    const unlisten = listen("tauri://file-drop", (event) => {
      handleFileDrop(event.payload as string[]);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  useEffect(() => {
    const unlisten = listen<MenuActionPayload>(
      "notex://menu-action",
      (event) => {
        handleMenuAction(event.payload);
      },
    );

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  useEffect(() => {
    void invoke("sync_native_menu", {
      state: {
        theme: settings.theme,
        vimMode: settings.vimMode,
        wordWrap: settings.wordWrap,
        autosave: settings.autosave,
        recentFiles: notepad.recentFiles,
        fontSize: settings.fontSize,
      },
    });
  }, [
    notepad.recentFiles,
    settings.autosave,
    settings.fontSize,
    settings.theme,
    settings.vimMode,
    settings.wordWrap,
  ]);

  useEffect(() => {
    if (
      !settings.autosave ||
      !notepad.activeTab.filePath ||
      !notepad.activeTab.isDirty
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void notepad.handleSave();
    }, 800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    notepad.activeTab.content,
    notepad.activeTab.filePath,
    notepad.activeTab.id,
    notepad.activeTab.isDirty,
    notepad.handleSave,
    settings.autosave,
  ]);

  const lineCount = deferredContent.split(/\r?\n/).length;

  return (
    <div className="app-container">
      <div className="workspace-shell">
        <TabsBar
          tabs={notepad.tabs}
          activeTabId={notepad.activeTabId}
          onSelect={notepad.setActiveTabId}
          onClose={notepad.closeTab}
          onReorder={notepad.reorderTabs}
        />
        <Suspense
          fallback={<div className="editor-loading">Loading editor…</div>}
        >
          <Editor
            text={notepad.activeTab.content}
            onChange={notepad.updateActiveText}
            vimMode={settings.vimMode}
            theme={settings.theme}
            wordWrap={settings.wordWrap}
            fontSize={settings.fontSize}
            fileName={notepad.activeTab.name}
            command={editorCommand}
            onCursorChange={setCursorState}
            onSearchStatusChange={setSearchStatus}
            onVimStatusChange={setVimStatus}
          />
        </Suspense>
      </div>
      <StatusBar
        filePath={notepad.activeTab.filePath}
        isDirty={notepad.activeTab.isDirty}
        charCount={deferredContent.length}
        lineCount={lineCount}
        cursorLine={cursorState.line}
        cursorColumn={cursorState.column}
        selectionLength={cursorState.selectionLength}
        theme={settings.theme}
        wordWrap={settings.wordWrap}
        fontSize={settings.fontSize}
        defaultFontSize={settings.defaultFontSize}
        autosave={settings.autosave}
        searchStatus={searchStatus}
        vimStatus={vimStatus}
      />
    </div>
  );
}

export default App;
