import React, { useState } from "react";
import { Tab } from "../hooks/useNotepad";

interface Props {
  tabs: Tab[];
  activeTabId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
}

export const TabsBar: React.FC<Props> = ({
  tabs,
  activeTabId,
  onSelect,
  onClose,
  onReorder,
}) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  return (
    <div className="tabs-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTabId ? "active" : ""} ${
            draggedTabId === tab.id ? "dragging" : ""
          } ${dropTargetId === tab.id ? "drop-target" : ""}`}
          draggable
          onClick={() => onSelect(tab.id)}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", tab.id);
            setDraggedTabId(tab.id);
            setDropTargetId(tab.id);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (draggedTabId && draggedTabId !== tab.id) {
              event.dataTransfer.dropEffect = "move";
              setDropTargetId(tab.id);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            const fromId = event.dataTransfer.getData("text/plain");
            if (fromId && fromId !== tab.id) {
              onReorder(fromId, tab.id);
              onSelect(fromId);
            }
            setDraggedTabId(null);
            setDropTargetId(null);
          }}
          onDragEnd={() => {
            setDraggedTabId(null);
            setDropTargetId(null);
          }}
        >
          <span className="tab-title">{tab.name}</span>
          {tab.isDirty ? (
            <span className="tab-dirty" aria-hidden="true" />
          ) : null}
          <button
            type="button"
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              onClose(tab.id);
            }}
            aria-label={`Close ${tab.name}`}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
