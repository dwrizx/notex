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
