import { startTransition, useEffect, useState } from "react";
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

type PersistedSession = {
  tabs: Tab[];
  activeTabId: string;
};

function getFileName(filePath: string) {
  return filePath.split("\\").pop()?.split("/").pop() || "Unknown";
}

const RECENT_FILES_KEY = "notex-recent-files";
const SESSION_KEY = "notex-session";
const MAX_RECENT_FILES = 6;

function createEmptyTab(): Tab {
  return {
    id: uuidv4(),
    name: "Untitled",
    filePath: null,
    content: "",
    isDirty: false,
  };
}

function getInitialSession(): PersistedSession {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) {
      const freshTab = createEmptyTab();
      return { tabs: [freshTab], activeTabId: freshTab.id };
    }

    const parsed = JSON.parse(saved) as Partial<PersistedSession>;
    const tabs = Array.isArray(parsed.tabs)
      ? parsed.tabs.filter(
          (tab): tab is Tab =>
            typeof tab?.id === "string" &&
            typeof tab?.name === "string" &&
            (typeof tab?.filePath === "string" || tab?.filePath === null) &&
            typeof tab?.content === "string" &&
            typeof tab?.isDirty === "boolean",
        )
      : [];

    if (tabs.length === 0) {
      const freshTab = createEmptyTab();
      return { tabs: [freshTab], activeTabId: freshTab.id };
    }

    const activeTabId =
      typeof parsed.activeTabId === "string" &&
      tabs.some((tab) => tab.id === parsed.activeTabId)
        ? parsed.activeTabId
        : tabs[0].id;

    return { tabs, activeTabId };
  } catch {
    const freshTab = createEmptyTab();
    return { tabs: [freshTab], activeTabId: freshTab.id };
  }
}

export function useNotepad() {
  const [initialSession] = useState(getInitialSession);
  const [tabs, setTabs] = useState<Tab[]>(initialSession.tabs);
  const [activeTabId, setActiveTabId] = useState<string>(
    initialSession.activeTabId,
  );
  const [recentFiles, setRecentFiles] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_FILES_KEY);
      const parsed = saved ? (JSON.parse(saved) as unknown) : [];
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  });

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(recentFiles));
  }, [recentFiles]);

  useEffect(() => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        tabs,
        activeTabId,
      } satisfies PersistedSession),
    );
  }, [activeTabId, tabs]);

  const rememberRecentFile = (filePath: string) => {
    setRecentFiles((prev) => {
      const next = [filePath, ...prev.filter((item) => item !== filePath)];
      return next.slice(0, MAX_RECENT_FILES);
    });
  };

  const removeRecentFile = (filePath: string) => {
    setRecentFiles((prev) => prev.filter((item) => item !== filePath));
  };

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
    startTransition(() => {
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
    });
  };

  const closeTab = (id: string) => {
    const closingIndex = tabs.findIndex((tab) => tab.id === id);
    const filtered = tabs.filter((tab) => tab.id !== id);

    if (filtered.length === 0) {
      const freshTab = createEmptyTab();
      startTransition(() => {
        setTabs([freshTab]);
        setActiveTabId(freshTab.id);
      });
      return;
    }

    const fallbackIndex = Math.max(0, closingIndex - 1);
    const nextActiveId =
      activeTabId === id
        ? filtered[Math.min(fallbackIndex, filtered.length - 1)].id
        : activeTabId;

    startTransition(() => {
      setTabs(filtered);
      setActiveTabId(nextActiveId);
    });
  };

  const reorderTabs = (fromId: string, toId: string) => {
    if (fromId === toId) {
      return;
    }

    startTransition(() => {
      setTabs((prev) => {
        const fromIndex = prev.findIndex((tab) => tab.id === fromId);
        const toIndex = prev.findIndex((tab) => tab.id === toId);

        if (fromIndex === -1 || toIndex === -1) {
          return prev;
        }

        const next = [...prev];
        const [movedTab] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, movedTab);
        return next;
      });
    });
  };

  const openFileIntoNewTab = async (filePath: string) => {
    const existingTab = tabs.find((tab) => tab.filePath === filePath);
    if (existingTab) {
      startTransition(() => {
        setActiveTabId(existingTab.id);
      });
      rememberRecentFile(filePath);
      return;
    }

    try {
      const content = await readTextFile(filePath);
      const newTab: Tab = {
        id: uuidv4(),
        name: getFileName(filePath),
        filePath,
        content,
        isDirty: false,
      };
      startTransition(() => {
        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(newTab.id);
      });
      rememberRecentFile(filePath);
    } catch (err) {
      console.error("Failed to read dragged file:", err);
      removeRecentFile(filePath);
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
        rememberRecentFile(activeTab.filePath);
        startTransition(() => {
          setTabs((prev) =>
            prev.map((tab) =>
              tab.id === activeTabId ? { ...tab, isDirty: false } : tab,
            ),
          );
        });
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
        rememberRecentFile(selected);
        startTransition(() => {
          setTabs((prev) =>
            prev.map((tab) =>
              tab.id === activeTabId
                ? {
                    ...tab,
                    filePath: selected,
                    name: getFileName(selected),
                    isDirty: false,
                  }
                : tab,
            ),
          );
        });
      }
    } catch (err) {
      console.error("Failed to save file as:", err);
    }
  };

  const openRecentFile = async (filePath: string) => {
    await openFileIntoNewTab(filePath);
  };

  return {
    tabs,
    activeTabId,
    activeTab,
    setActiveTabId,
    updateActiveText,
    handleNewTab,
    closeTab,
    reorderTabs,
    handleOpen,
    handleSave,
    handleSaveAs,
    openFileIntoNewTab,
    recentFiles,
    openRecentFile,
  };
}
