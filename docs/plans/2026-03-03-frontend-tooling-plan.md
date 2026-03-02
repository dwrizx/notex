# Fastest Frontend Tooling Setup Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Menyiapkan tooling frontend Vite+React+Tauri dengan kecepatan maksimal menggunakan Bun, tsgo, Oxlint, dan Oxfmt.

**Architecture:** Mengganti tool lambat dengan eksekusi berbasis Bun, typecheck menggunakan native preview `tsgo`, linter dengan `oxlint`, dan format dengan `oxfmt`.

**Tech Stack:** Bun, tsgo (@typescript/native-preview), Oxlint, Oxfmt

---

### Task 1: Instalasi Tools

**Files:**

- Modify: `package.json`
- Modify: `bun.lock` (Otomatis terupdate lewat bun)

**Step 1: Install semua dependency**
Run: `bun add -D @typescript/native-preview oxlint oxfmt`
Expected: Instalasi sukses, `package.json` diupdate.

**Step 2: Install preset/migration opsional (jika dibutuhkan)**
_(Opsional - Tapi dalam design kita tidak pakai preset ketat, jadi ini bisa diskip)_
Run: `bun add -D @nkzw/oxlint-config`

**Step 3: Commit perubahan**

```bash
git add package.json bun.lock
git commit -m "build(deps): add bun-first frontend tooling base (tsgo, oxlint, oxfmt)"
```

---

### Task 2: Setup VS Code TypeScript Native Preview (tsgo)

**Files:**

- Create/Modify: `.vscode/settings.json`

**Step 1: Update/Buat `.vscode/settings.json`**

```jsonc
{
  "typescript.experimental.useTsgo": true,
}
```

**Step 2: Verifikasi JSON Format**
Run: `cat .vscode/settings.json`
Expected: Output sesuai file baru.

**Step 3: Commit perubahan**

```bash
git add .vscode/settings.json
git commit -m "chore(vscode): enable typescript.experimental.useTsgo"
```

---

### Task 3: Inisiasi Oxlint & Oxfmt Configuration

**Files:**

- Create: `.oxfmtrc.jsonc`

**Step 1: Setup minimal Oxfmt config**
Buat/tulis konfigurasi formatter di root folder:

```jsonc
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "printWidth": 80,
}
```

**Step 2: Init base config Oxlint**
Run: `bunx oxlint --init`
Expected: Linter base config tergenerate (jika tidak ada file config).

**Step 3: Commit perubahan**

```bash
git add .oxfmtrc.jsonc
# Tambahkan base oxlint config jika ada (misal .oxlintrc.json)
git add .oxlintrc.json
git commit -m "chore(tooling): add oxfmt and oxlint configs"
```

---

### Task 4: Konfigurasi NPM Scripts di package.json

**Files:**

- Modify: `package.json:6-12` (di bagian `scripts`)

**Step 1: Tambahkan scripts kualitas kode**
Ubah bagian `scripts` di `package.json` sehingga menjadi:

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "//": "=== Quality Gates ===",
    "typecheck": "tsgo -p tsconfig.json",
    "lint": "oxlint .",
    "lint:fix": "oxlint . --fix",
    "fmt": "oxfmt .",
    "fmt:check": "oxfmt --check .",
    "//2": "=== Bundled Checks ===",
    "check:fast": "bun run lint && bun run fmt:check",
    "check": "bun run typecheck && bun run lint && bun run fmt:check",
    "//3": "=== Convenience ===",
    "fix": "bun run lint:fix && bun run fmt"
  },
```

**Step 2: Uji semua eksekusi command check**
Run: `bun run check`
Expected: PASS tanpa error yang fatal (atau muncul error format/lint dari codebase saat ini yang bisa di fix di Task 5).

**Step 3: Commit perubahan scripts**

```bash
git add package.json
git commit -m "chore: add fast check scripts (lint, fmt, typecheck)"
```

---

### Task 5: Formating awal codebase saat ini

**Files:**

- Modify: Seluruh file dalam project `src/` atau `src-tauri/` yang disupport formatter.

**Step 1: Jalankan auto-fix linter dan formatter ke existing code**
Run: `bun run fix`
Expected: File project terformat sesuai standard oxfmt `printWidth: 80` dan linter issues ter-fix otomatis.

**Step 2: Uji validasi check ulang**
Run: `bun run check:fast`
Expected: PASS untuk semua rules.

**Step 3: Commit perubahan final formatting**

```bash
git add .
git commit -m "style: apply initial oxfmt and oxlint fixes"
```
