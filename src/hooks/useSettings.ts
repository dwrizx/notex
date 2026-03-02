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
