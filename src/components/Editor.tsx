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

type SearchStatus = {
  query: string;
  current: number;
  total: number;
};

type VimStatus = {
  mode: string;
  commandText: string | null;
};

type VimModeChange = {
  mode?: string;
  subMode?: string;
};

type VimLikeState = {
  mode?: string;
  status?: string;
  insertMode?: boolean;
  visualMode?: boolean;
  visualLine?: boolean;
  visualBlock?: boolean;
};

type VimLikeEditor = {
  state: {
    vim?: VimLikeState;
  };
  on: (
    event: "vim-mode-change",
    handler: (event: VimModeChange) => void,
  ) => void;
  off?: (
    event: "vim-mode-change",
    handler: (event: VimModeChange) => void,
  ) => void;
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
  onSearchStatusChange: (status: SearchStatus) => void;
  onVimStatusChange: (status: VimStatus | null) => void;
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
  onSearchStatusChange,
  onVimStatusChange,
}) => {
  const [vimExtensions, setVimExtensions] =
    useState<Extension[]>(DEFAULT_EXTENSIONS);
  const [languageExtensions, setLanguageExtensions] =
    useState<Extension[]>(DEFAULT_EXTENSIONS);
  const editorViewRef = useRef<EditorView | null>(null);
  const getVimEditorRef = useRef<
    ((view: EditorView) => VimLikeEditor | null) | null
  >(null);

  const updateSearchStatus = (view: EditorView) => {
    const query = getSearchQuery(view.state);
    if (!query.search || !query.valid) {
      onSearchStatusChange({ query: "", current: 0, total: 0 });
      return;
    }

    const mainSelection = view.state.selection.main;
    let total = 0;
    let current = 0;

    let cursor = query.getCursor(view.state);
    let match = cursor.next();
    while (!match.done) {
      total += 1;
      if (
        match.value.from === mainSelection.from &&
        match.value.to === mainSelection.to &&
        current === 0
      ) {
        current = total;
      }
      match = cursor.next();
    }

    if (total > 0 && current === 0) {
      let index = 0;
      let firstAfterCursor = 0;

      cursor = query.getCursor(view.state);
      match = cursor.next();
      while (!match.done) {
        index += 1;
        if (match.value.from >= mainSelection.head) {
          firstAfterCursor = index;
          break;
        }
        match = cursor.next();
      }

      current = firstAfterCursor || 1;
    }

    onSearchStatusChange({
      query: query.search,
      current,
      total,
    });
  };

  const formatVimMode = (
    mode: string | undefined,
    subMode: string | undefined,
    vimState: VimLikeState | undefined,
  ) => {
    if (!mode && !vimState) {
      return "Normal";
    }

    if (mode === "visual" || vimState?.visualMode) {
      if (subMode === "linewise" || vimState?.visualLine) {
        return "Visual Line";
      }
      if (subMode === "blockwise" || vimState?.visualBlock) {
        return "Visual Block";
      }
      return "Visual";
    }

    switch ((mode ?? vimState?.mode ?? "normal").toLowerCase()) {
      case "insert":
        return "Insert";
      case "replace":
        return "Replace";
      case "operatorpending":
        return "Operator Pending";
      case "normal":
        return "Normal";
      default:
        return (mode ?? vimState?.mode ?? "Normal").replace(
          /(^\w)|(\s+\w)/g,
          (segment) => segment.toUpperCase(),
        );
    }
  };

  const updateVimStatus = (
    modeChange?: VimModeChange,
    view: EditorView | null = editorViewRef.current,
  ) => {
    if (!vimMode) {
      onVimStatusChange(null);
      return;
    }

    if (!view) {
      onVimStatusChange({ mode: "Normal", commandText: null });
      return;
    }

    const cm = getVimEditorRef.current?.(view) ?? null;
    const vimState = cm?.state.vim;
    const commandText = vimState?.status?.trim() || null;
    const mode = commandText?.startsWith(":")
      ? "Command"
      : commandText?.startsWith("/") || commandText?.startsWith("?")
        ? "Search"
        : formatVimMode(modeChange?.mode, modeChange?.subMode, vimState);
    onVimStatusChange({ mode, commandText });
  };

  useEffect(() => {
    let disposed = false;

    if (!vimMode) {
      setVimExtensions(DEFAULT_EXTENSIONS);
      getVimEditorRef.current = null;
      onVimStatusChange(null);
      return () => {
        disposed = true;
      };
    }

    void import("@replit/codemirror-vim")
      .then(({ vim, getCM }) => {
        if (!disposed) {
          getVimEditorRef.current = getCM as (
            view: EditorView,
          ) => VimLikeEditor | null;
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
    const editorView = editorViewRef.current;
    if (!vimMode || !editorView) {
      return;
    }

    let disposeListener: (() => void) | undefined;
    let retryTimer = 0;

    const attachListener = () => {
      const cm = getVimEditorRef.current?.(editorView) ?? null;
      if (!cm) {
        retryTimer = window.setTimeout(attachListener, 80);
        return;
      }

      const handleModeChange = (event: VimModeChange) => {
        updateVimStatus(event, editorView);
      };

      cm.on("vim-mode-change", handleModeChange);
      updateVimStatus(undefined, editorView);
      disposeListener = () => {
        cm.off?.("vim-mode-change", handleModeChange);
      };
    };

    attachListener();

    return () => {
      window.clearTimeout(retryTimer);
      disposeListener?.();
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
            updateSearchStatus(view);
            updateVimStatus(undefined, view);
          }}
          onUpdate={(viewUpdate) => {
            if (viewUpdate.selectionSet || viewUpdate.docChanged) {
              handleCursorChange(viewUpdate.state.selection);
            }
            if (
              viewUpdate.docChanged ||
              viewUpdate.selectionSet ||
              viewUpdate.transactions.some((transaction) =>
                transaction.effects.some((effect) => effect.is(setSearchQuery)),
              )
            ) {
              updateSearchStatus(viewUpdate.view);
            }
            if (
              vimMode &&
              (viewUpdate.selectionSet ||
                viewUpdate.docChanged ||
                viewUpdate.focusChanged)
            ) {
              updateVimStatus(undefined, viewUpdate.view);
            }
          }}
        />
      </div>
    </div>
  );
};
