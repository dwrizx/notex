import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  type EditorSelection,
  type Extension,
  SelectionRange,
} from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import {
  findNext,
  findPrevious,
  getSearchQuery,
  gotoLine,
  openSearchPanel,
  replaceAll,
  replaceNext,
  SearchQuery,
  search,
  setSearchQuery,
} from "@codemirror/search";
import type { ThemeMode } from "../hooks/useSettings";

const DEFAULT_EXTENSIONS: Extension[] = [];
const SEARCH_EXTENSION = search({ top: true });

export type EditorCommand =
  | { type: "open-search"; nonce: number }
  | { type: "open-replace"; nonce: number }
  | { type: "find-next"; nonce: number }
  | { type: "find-previous"; nonce: number }
  | { type: "replace-next"; nonce: number }
  | { type: "replace-all"; nonce: number }
  | { type: "goto-line"; nonce: number }
  | null;

type CursorPosition = {
  line: number;
  column: number;
  selectionLength: number;
};

interface Props {
  text: string;
  onChange: (val: string) => void;
  vimMode: boolean;
  theme: ThemeMode;
  wordWrap: boolean;
  fontSize: number;
  fileName: string;
  command: EditorCommand;
  onCursorChange: (position: CursorPosition) => void;
}

export const Editor: React.FC<Props> = ({
  text,
  onChange,
  vimMode,
  theme,
  wordWrap,
  fontSize,
  fileName,
  command,
  onCursorChange,
}) => {
  const [vimExtensions, setVimExtensions] =
    useState<Extension[]>(DEFAULT_EXTENSIONS);
  const [languageExtensions, setLanguageExtensions] =
    useState<Extension[]>(DEFAULT_EXTENSIONS);
  const editorViewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    let disposed = false;

    if (!vimMode) {
      setVimExtensions(DEFAULT_EXTENSIONS);
      return () => {
        disposed = true;
      };
    }

    void import("@replit/codemirror-vim")
      .then(({ vim }) => {
        if (!disposed) {
          setVimExtensions([vim()]);
        }
      })
      .catch((error) => {
        console.error("Failed to load Vim mode:", error);
      });

    return () => {
      disposed = true;
    };
  }, [vimMode]);

  useEffect(() => {
    let disposed = false;
    const extension = fileName.split(".").pop()?.toLowerCase();

    if (!extension) {
      setLanguageExtensions(DEFAULT_EXTENSIONS);
      return () => {
        disposed = true;
      };
    }

    const loadLanguage = async () => {
      switch (extension) {
        case "js":
        case "mjs":
        case "cjs": {
          const { javascript } = await import("@codemirror/lang-javascript");
          return javascript();
        }
        case "jsx": {
          const { javascript } = await import("@codemirror/lang-javascript");
          return javascript({ jsx: true });
        }
        case "ts": {
          const { javascript } = await import("@codemirror/lang-javascript");
          return javascript({ typescript: true });
        }
        case "tsx": {
          const { javascript } = await import("@codemirror/lang-javascript");
          return javascript({ typescript: true, jsx: true });
        }
        case "json": {
          const { json } = await import("@codemirror/lang-json");
          return json();
        }
        case "md":
        case "markdown": {
          const { markdown } = await import("@codemirror/lang-markdown");
          return markdown();
        }
        case "html":
        case "htm": {
          const { html } = await import("@codemirror/lang-html");
          return html();
        }
        case "css": {
          const { css } = await import("@codemirror/lang-css");
          return css();
        }
        case "xml":
        case "svg": {
          const { xml } = await import("@codemirror/lang-xml");
          return xml();
        }
        case "py": {
          const { python } = await import("@codemirror/lang-python");
          return python();
        }
        case "rs": {
          const { rust } = await import("@codemirror/lang-rust");
          return rust();
        }
        case "sql": {
          const { sql } = await import("@codemirror/lang-sql");
          return sql();
        }
        case "yml":
        case "yaml": {
          const { yaml } = await import("@codemirror/lang-yaml");
          return yaml();
        }
        default:
          return null;
      }
    };

    void loadLanguage()
      .then((language) => {
        if (!disposed) {
          setLanguageExtensions(language ? [language] : DEFAULT_EXTENSIONS);
        }
      })
      .catch((error) => {
        console.error("Failed to load syntax highlighting:", error);
        if (!disposed) {
          setLanguageExtensions(DEFAULT_EXTENSIONS);
        }
      });

    return () => {
      disposed = true;
    };
  }, [fileName]);

  const extensions = useMemo(() => {
    const sharedExtensions = [
      SEARCH_EXTENSION,
      ...languageExtensions,
      ...vimExtensions,
    ];
    return wordWrap
      ? [EditorView.lineWrapping, ...sharedExtensions]
      : sharedExtensions;
  }, [languageExtensions, vimExtensions, wordWrap]);

  useEffect(() => {
    const editorView = editorViewRef.current;
    if (!editorView || !command) {
      return;
    }

    const fillQueryFromSelection = () => {
      const selectionText = editorView.state.sliceDoc(
        editorView.state.selection.main.from,
        editorView.state.selection.main.to,
      );
      if (!selectionText) {
        return;
      }

      const currentQuery = getSearchQuery(editorView.state);
      editorView.dispatch({
        effects: setSearchQuery.of(
          new SearchQuery({
            search: selectionText,
            caseSensitive: currentQuery.caseSensitive,
            literal: currentQuery.literal,
            regexp: currentQuery.regexp,
            wholeWord: currentQuery.wholeWord,
            replace: currentQuery.replace,
          }),
        ),
      });
    };

    switch (command.type) {
      case "open-search": {
        fillQueryFromSelection();
        openSearchPanel(editorView);
        break;
      }
      case "open-replace":
        fillQueryFromSelection();
        openSearchPanel(editorView);
        requestAnimationFrame(() => {
          const replaceField = editorView.dom.querySelector(
            'input[name="replace"]',
          );
          if (replaceField instanceof HTMLInputElement) {
            replaceField.focus();
            replaceField.select();
          }
        });
        break;
      case "find-next":
        findNext(editorView);
        break;
      case "find-previous":
        findPrevious(editorView);
        break;
      case "replace-next":
        if (getSearchQuery(editorView.state).valid) {
          replaceNext(editorView);
        } else {
          openSearchPanel(editorView);
        }
        break;
      case "replace-all":
        if (getSearchQuery(editorView.state).valid) {
          replaceAll(editorView);
        } else {
          openSearchPanel(editorView);
        }
        break;
      case "goto-line":
        gotoLine(editorView);
        break;
      default:
        break;
    }
  }, [command]);

  const handleCursorChange = (selection: EditorSelection) => {
    const mainSelection = selection.main;
    const line = selection.ranges[0]
      ? editorViewRef.current?.state.doc.lineAt(mainSelection.head)
      : null;
    onCursorChange({
      line: line?.number ?? 1,
      column: mainSelection.head - (line?.from ?? 0) + 1,
      selectionLength: selection.ranges.reduce(
        (total, range: SelectionRange) =>
          total + Math.abs(range.to - range.from),
        0,
      ),
    });
  };

  return (
    <div className="editor-wrapper">
      <div className="editor-surface">
        <CodeMirror
          value={text}
          height="100%"
          theme={theme}
          extensions={extensions}
          onChange={onChange}
          className="cm-editor-container"
          style={{ fontSize: `${fontSize}px` }}
          onCreateEditor={(view) => {
            editorViewRef.current = view;
            handleCursorChange(view.state.selection);
          }}
          onUpdate={(viewUpdate) => {
            if (viewUpdate.selectionSet || viewUpdate.docChanged) {
              handleCursorChange(viewUpdate.state.selection);
            }
          }}
        />
      </div>
    </div>
  );
};
