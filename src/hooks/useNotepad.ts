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
