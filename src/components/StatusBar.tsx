import React from "react";

interface Props {
  filePath: string | null;
  isDirty: boolean;
  charCount: number;
}

export const StatusBar: React.FC<Props> = ({
  filePath,
  isDirty,
  charCount,
}) => {
  return (
    <div className="status-bar">
      <span>
        {filePath ? filePath : "Untitled"} {isDirty && "*"}
      </span>
      <span>{charCount} chars</span>
    </div>
  );
};
