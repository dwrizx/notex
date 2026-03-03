import React from "react";
import { ThemeMode } from "../hooks/useSettings";

type SearchStatus = {
  query: string;
  current: number;
  total: number;
};

type VimStatus = {
  mode: string;
  commandText: string | null;
};

interface Props {
  filePath: string | null;
  isDirty: boolean;
  charCount: number;
  lineCount: number;
  cursorLine: number;
  cursorColumn: number;
  selectionLength: number;
  theme: ThemeMode;
  wordWrap: boolean;
  fontSize: number;
  defaultFontSize: number;
  autosave: boolean;
  searchStatus: SearchStatus;
  vimStatus: VimStatus | null;
}

export const StatusBar: React.FC<Props> = ({
  filePath,
  isDirty,
  charCount,
  lineCount,
  cursorLine,
  cursorColumn,
  selectionLength,
  theme,
  wordWrap,
  fontSize,
  defaultFontSize,
  autosave,
  searchStatus,
  vimStatus,
}) => {
  const zoomPercent = Math.round((fontSize / defaultFontSize) * 100);

  return (
    <div className="status-bar">
      <span className="status-item">
        {filePath ? filePath : "Untitled"}
        {isDirty ? " • Unsaved" : " • Saved"}
      </span>
      <div className="status-meta">
        <span className="status-item">
          Ln {cursorLine}, Col {cursorColumn}
        </span>
        <span className="status-item">
          {selectionLength > 0 ? `${selectionLength} selected` : "No selection"}
        </span>
        {searchStatus.query ? (
          <span className="status-item status-pill">
            Find {searchStatus.current}/{searchStatus.total}
          </span>
        ) : null}
        {vimStatus ? (
          <span className="status-item status-pill">
            Vim {vimStatus.mode}
            {vimStatus.commandText ? ` ${vimStatus.commandText}` : ""}
          </span>
        ) : null}
        <span className="status-item">{lineCount} lines</span>
        <span className="status-item">{charCount} chars</span>
        <span className="status-item">{wordWrap ? "Wrap On" : "Wrap Off"}</span>
        <span className="status-item">
          {autosave ? "Autosave On" : "Autosave Off"}
        </span>
        <span className="status-item">{zoomPercent}%</span>
        <span className="status-item">
          {theme === "dark" ? "Dark" : "Light"} theme
        </span>
      </div>
    </div>
  );
};
