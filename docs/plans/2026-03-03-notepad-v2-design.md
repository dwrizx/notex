# Notex V2 (Pro) Application Design

## Overview

Pembaruan Notepad v2 untuk menjadi _Pro Editor_ (mirip VS Code / Vim ringan) namun dengan _footprint_ instalasi yang sangat minim dengan Rust + Tauri v2.

_Upgrades_: Dukungan Multi-Tab, Editor Berbasis **CodeMirror 6**, Integrasi Plugin **Vim Mode**, **Drag & Drop** sistem operasi secara Native, dan menu **Settings** _(local-storage)_.

## Architecture

### 1. Data Mode & Management (State Level): `useNotepad.ts`

_Single state_ berformat String (`text`, `filePath`) akan direfaktor besar-besaran menjadi struktur _List Objects_ di memori React.

```typescript
type Tab = {
  id: string; // Unique uuid
  name: string; // File name atau "Untitled"
  filePath: string | null;
  content: string;
  isDirty: boolean;
};

// Global Store Hook structure
const [tabs, setTabs] = useState<Tab[]>([{ ...default_empty_tab }]);
const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
```

### 2. Frontend Editor Layer (CodeMirror)

`<textarea>` HTML biasa akan diganti oleh komponen `@uiw/react-codemirror`. Jika opsi "Vim Mode" diaktifkan oleh pengguna melalui menu Setting, extension VIM dari CodeMirror akan diinjeksikan secara dinamis ke konfigurasi _CodeMirror Provider_.

### 3. Native File System Interactions (Drag and Drop)

Aplikasi memanfaatkan event listener natif dari Tauri v2 Core Webview (menggunakan Event system Tauri dari `plugin-window`). Saat file diseret dari desktop ke atas aplikasi:

1. Tauri menangkap _`payload_path`_.
2. Frontend membaca isi text (via FS Plugin).
3. React mengeksekusi aksi penambahan objek ke `tabs[]`.
4. _Focus_ diarahkan ke tab yang baru dibuat tersebut.

### 4. Setting & Preferences (Persistence API)

Semua opsi pengguna, seperti toggle _Vim Mode_, akan diatur dalam React Context sederhana. Nilai aslinya disimpan ke dalam LocalStorage browser layer untuk menghindari inisialisasi FS yang mahal saat startup.
Vim mode bisa dimatikan atau dihidupkan melalui tombol "Settings / Gear" di aplikasi.

## UI/UX Flow

1. **Tabs Bar**: Membentang di bawah Toolbar Utama (New, Open, Save). Berisi tumpukan nama file dengan tombol `X` (close tab).
2. **Editor**: Layar _code-editor_ utuh dari CodeMirror dengan highlight dasar monospace.
3. **Settings Modal**: Kotak abu-abu di tengah layar berupa _overlay_.
4. **Vim Block Cursor**: Kursor akan merubah otomatis dari garis vertical ke Block ketika "Vim Mode" diaktifkan dan indikator "insert/normal" akan bisa di set disana.

## Backend Consideration

Fungsi backend Rust V2 sama sekali tak perlu dimodifikasi logika beratnya. Yang berpotensi memerlukan penambahan hanyalah inisiasi Tauri Window events (seperti drag 'n' drop support) seandainya belum di-enable secara default di konfigurasi v2.
