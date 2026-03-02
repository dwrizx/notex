import React from "react";

interface Props {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  vimMode: boolean;
  onToggleVim: () => void;
}

export const Toolbar: React.FC<Props> = ({
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  vimMode,
  onToggleVim,
}) => {
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
          className={vimMode ? "active-toggle" : ""}
        >
          {vimMode ? "Vim: ON" : "Vim: OFF"}
        </button>
      </div>
    </div>
  );
};
