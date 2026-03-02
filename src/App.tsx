import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useNotepad } from "./hooks/useNotepad";
import { useSettings } from "./hooks/useSettings";
import { Toolbar } from "./components/Toolbar";
import { TabsBar } from "./components/TabsBar";
import { Editor } from "./components/Editor";
import { StatusBar } from "./components/StatusBar";
import "./App.css";

function App() {
  const notepad = useNotepad();
  const settings = useSettings();

  // Handle Drag & Drop File from OS
  useEffect(() => {
    const unlisten = listen("tauri://file-drop", (event) => {
      const paths = event.payload as string[];
      if (paths && paths.length > 0) {
        // Open the first dropped file
        notepad.openFileIntoNewTab(paths[0]);
      }
    });

    return () => {
      unlisten.then((f) => f());
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
