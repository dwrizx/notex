import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { vim } from "@replit/codemirror-vim";

interface Props {
  text: string;
  onChange: (val: string) => void;
  vimMode: boolean;
}

export const Editor: React.FC<Props> = ({ text, onChange, vimMode }) => {
  const extensions = vimMode ? [vim()] : [];

  return (
    <div className="editor-wrapper">
      <CodeMirror
        value={text}
        height="100%"
        theme="dark"
        extensions={extensions}
        onChange={(value) => onChange(value)}
        className="cm-editor-container"
      />
    </div>
  );
};
