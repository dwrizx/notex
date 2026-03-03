import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

const VIM_MODE_KEY = "notex-vim-mode";
const THEME_KEY = "notex-theme";
const WORD_WRAP_KEY = "notex-word-wrap";
const FONT_SIZE_KEY = "notex-font-size";
const AUTOSAVE_KEY = "notex-autosave";
const DEFAULT_FONT_SIZE = 14;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 22;
export const FONT_SIZE_PRESETS = [12, 14, 16, 18, 20];

function getInitialTheme(): ThemeMode {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useSettings() {
  const [vimMode, setVimMode] = useState<boolean>(() => {
    return localStorage.getItem(VIM_MODE_KEY) === "true";
  });
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [wordWrap, setWordWrap] = useState<boolean>(() => {
    const saved = localStorage.getItem(WORD_WRAP_KEY);
    return saved === null ? true : saved === "true";
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = Number(localStorage.getItem(FONT_SIZE_KEY));
    return Number.isFinite(saved)
      ? Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, saved))
      : DEFAULT_FONT_SIZE;
  });
  const [autosave, setAutosave] = useState<boolean>(() => {
    return localStorage.getItem(AUTOSAVE_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(VIM_MODE_KEY, String(vimMode));
  }, [vimMode]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(WORD_WRAP_KEY, String(wordWrap));
  }, [wordWrap]);

  useEffect(() => {
    localStorage.setItem(FONT_SIZE_KEY, String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem(AUTOSAVE_KEY, String(autosave));
  }, [autosave]);

  const toggleVimMode = () => {
    setVimMode((current) => !current);
  };

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const toggleWordWrap = () => {
    setWordWrap((current) => !current);
  };

  const zoomIn = () => {
    setFontSize((current) => Math.min(MAX_FONT_SIZE, current + 1));
  };

  const zoomOut = () => {
    setFontSize((current) => Math.max(MIN_FONT_SIZE, current - 1));
  };

  const resetZoom = () => {
    setFontSize(DEFAULT_FONT_SIZE);
  };

  const toggleAutosave = () => {
    setAutosave((current) => !current);
  };

  const applyFontSize = (size: number) => {
    setFontSize(Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, size)));
  };

  return {
    vimMode,
    toggleVimMode,
    theme,
    toggleTheme,
    wordWrap,
    toggleWordWrap,
    fontSize,
    zoomIn,
    zoomOut,
    resetZoom,
    applyFontSize,
    autosave,
    toggleAutosave,
    defaultFontSize: DEFAULT_FONT_SIZE,
  };
}
