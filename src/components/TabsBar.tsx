import React from "react";
import { Tab } from "../hooks/useNotepad";

interface Props {
  tabs: Tab[];
  activeTabId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export const TabsBar: React.FC<Props> = ({
  tabs,
  activeTabId,
  onSelect,
  onClose,
}) => {
  return (
    <div className="tabs-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTabId ? "active" : ""}`}
          onClick={() => onSelect(tab.id)}
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
