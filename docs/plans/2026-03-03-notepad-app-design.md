# Notepad App Design

## Architecture & Goal

Membuat aplikasi text editor `Plain Text Notepad` minimalis, aman, dan berkecepatan tinggi dengan integrasi React (Frontend) dan Rust + Tauri v2 (Backend/System).

Tujuan utama adalah membuat struktur kodenya **Modular** agar mudah diekspan dan bebas _magic code_.

## Core Approach

- **Frontend State (React)**: Menyimpan buffer karakter editor saat ini, mengurus logic "telah di-edit" (Dirty Flag), serta visualisasi UI/Toolbar.
- **Backend IO (Rust)**: Fokus pada pembacaan bytes ke disk, dialog native (open/save), memastikan file write aman dan minim error IPC timeout.
- Komponen menggunakan Custom Hooks untuk mengurangi kompleksitas di file `App.tsx`.

## Modules & Folder Structure

### Frontend (React / Vite)

- `src/components/`
  - `Toolbar.tsx`: Menyediakan tombol "New", "Open", "Save", "Save As...".
  - `Editor.tsx`: Komponen `<textarea>` raksasa penampung plain text, meneruskan propagasi on-change ke state utama.
  - `StatusBar.tsx`: Indikator `Unsaved`, jumlah baris/karakter, nama file aktif.
- `src/hooks/`
  - `useFileIO.ts`: Custom hook khusus menangani panggil fungsi IPC ke Rust dengan `@tauri-apps/plugin-dialog` dan `@tauri-apps/plugin-fs`.

### Backend (Tauri v2 / Rust)

_Karna kita menggunakan Tauri Plugins (v2 std API), custom command rust `fs.rs` tidak dibutuhkan (v2 telah menyediakan File System API via plugin frontend)._

Oleh karenanya backend akan difokuskan untuk meregistrasi:

1. `tauri-plugin-fs`
2. `tauri-plugin-dialog`

## Workflow / IPC Events

1. **Open File:**
   Frontend panggil API Dialog: `open({ filters: [...] })` -> Terima Path -> Panggil fungsi FS: `readTextFile(path)` -> Load ke State React.
2. **Save (existing file):**
   Cek React State (if path exist) -> Panggil fungsi FS: `writeTextFile(path, text)` -> Set Dirty flag React ke `False`.
3. **Save As:**
   Frontend Panggil API Dialog: `save({ filters: [...] })` -> Terima Path Baru -> Panggil Fungsi FS: `writeTextFile(path, text)` -> Ubah State path aktif -> Set Dirty flag ke `False`.

## Security / Capabilities (V2 Strict)

Aplikasi di Tauri v2 harus menyatakan secara _eksplisit_ _capabilities_ yang di allow.

Diperlukan konfigurasi file `.json` Capabilities:

- Enable Plugin: `fs:default` (read/write all home/app scope dir)
- Enable Plugin: `dialog:default` (open/save)
- **Hard rule:** Modifikasi `src-tauri/capabilities/default.json` dengan akses File Dialog & Reading/Writing secara spesifik.
