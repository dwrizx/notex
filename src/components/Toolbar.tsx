import React from "react";

interface Props {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
}

export const Toolbar: React.FC<Props> = ({
  onNew,
  onOpen,
  onSave,
  onSaveAs,
}) => {
  return (
    <div className="toolbar">
      <button onClick={onNew}>New</button>
      <button onClick={onOpen}>Open</button>
      <button onClick={onSave}>Save</button>
      <button onClick={onSaveAs}>Save As</button>
    </div>
  );
};
