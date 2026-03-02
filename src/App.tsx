import { useNotepad } from "./hooks/useNotepad";
import { Toolbar } from "./components/Toolbar";
import { Editor } from "./components/Editor";
import { StatusBar } from "./components/StatusBar";
import "./App.css";

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
      <Editor text={notepad.text} onChange={notepad.updateText} />
      <StatusBar
        filePath={notepad.filePath}
        isDirty={notepad.isDirty}
        charCount={notepad.text.length}
      />
    </div>
  );
}

export default App;
