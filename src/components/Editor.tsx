import React from "react";

interface Props {
  text: string;
  onChange: (val: string) => void;
}

export const Editor: React.FC<Props> = ({ text, onChange }) => {
  return (
    <textarea
      className="editor"
      value={text}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      placeholder="Type your notes here..."
    />
  );
};
