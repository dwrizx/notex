use std::{path::Path, sync::Mutex};

use serde::{Deserialize, Serialize};
use tauri::{
    menu::{CheckMenuItemBuilder, MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    AppHandle, Emitter, Manager, Runtime, State,
};

struct NativeMenuState {
    recent_files: Vec<String>,
    dark_mode: bool,
    vim_mode: bool,
    word_wrap: bool,
    autosave: bool,
    font_size: u8,
}

impl Default for NativeMenuState {
    fn default() -> Self {
        Self {
            recent_files: Vec::new(),
            dark_mode: false,
            vim_mode: false,
            word_wrap: true,
            autosave: false,
            font_size: 14,
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NativeMenuSyncState {
    recent_files: Vec<String>,
    theme: String,
    vim_mode: bool,
    word_wrap: bool,
    autosave: bool,
    font_size: u8,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct MenuActionPayload {
    action: String,
    file_path: Option<String>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn recent_file_label(file_path: &str) -> String {
    let file_name = Path::new(file_path)
        .file_name()
        .and_then(|item| item.to_str())
        .unwrap_or(file_path);
    format!("{file_name}    {file_path}")
}

fn build_native_menu<R: Runtime>(
    app: &AppHandle<R>,
    state: &NativeMenuState,
) -> tauri::Result<tauri::menu::Menu<R>> {
    let mut recent_files_menu = SubmenuBuilder::new(app, "Recent &Files");
    if state.recent_files.is_empty() {
        recent_files_menu = recent_files_menu.item(
            &MenuItemBuilder::with_id("file.recent.empty", "No recent files")
                .enabled(false)
                .build(app)?,
        );
    } else {
        for (index, file_path) in state.recent_files.iter().enumerate() {
            recent_files_menu = recent_files_menu.item(
                &MenuItemBuilder::with_id(
                    format!("file.recent.{index}"),
                    recent_file_label(file_path),
                )
                .build(app)?,
            );
        }
    }

    let file_menu = SubmenuBuilder::new(app, "&File")
        .item(
            &MenuItemBuilder::with_id("file.new", "&New")
                .accelerator("Ctrl+N")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::with_id("file.open", "&Open...")
                .accelerator("Ctrl+O")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::with_id("file.save", "&Save")
                .accelerator("Ctrl+S")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::with_id("file.save_as", "Save &As...")
                .accelerator("Ctrl+Shift+S")
                .build(app)?,
        )
        .separator()
        .item(&recent_files_menu.build()?)
        .separator()
        .quit_with_text("E&xit")
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "&Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .separator()
        .item(
            &MenuItemBuilder::with_id("edit.find", "&Find...")
                .accelerator("Ctrl+F")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::with_id("edit.replace", "&Replace...")
                .accelerator("Ctrl+H")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::with_id("edit.find_next", "Find &Next")
                .accelerator("F3")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::with_id("edit.find_previous", "Find &Previous")
                .accelerator("Shift+F3")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::with_id("edit.replace_next", "Replace &Next")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::with_id("edit.replace_all", "Replace A&ll")
                .accelerator("Ctrl+Shift+H")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::with_id("edit.go_to_line", "&Go To Line...")
                .accelerator("Ctrl+G")
                .build(app)?,
        )
        .separator()
        .select_all()
        .build()?;

    let mut font_size_menu = SubmenuBuilder::new(app, "Font Si&ze");
    for preset in [12_u8, 14, 16, 18, 20] {
        font_size_menu = font_size_menu.item(
            &CheckMenuItemBuilder::with_id(
                format!("settings.font_size.{preset}"),
                format!("{preset} pt"),
            )
            .checked(state.font_size == preset)
            .build(app)?,
        );
    }

    let settings_menu = SubmenuBuilder::new(app, "&Preferences")
        .item(
            &CheckMenuItemBuilder::with_id("settings.toggle_theme", "&Dark Mode")
                .checked(state.dark_mode)
                .accelerator("Ctrl+Alt+T")
                .build(app)?,
        )
        .item(
            &CheckMenuItemBuilder::with_id("settings.toggle_wrap", "Word &Wrap")
                .checked(state.word_wrap)
                .accelerator("Alt+Z")
                .build(app)?,
        )
        .item(
            &CheckMenuItemBuilder::with_id("settings.toggle_vim", "&Vim Mode")
                .checked(state.vim_mode)
                .accelerator("Ctrl+Alt+V")
                .build(app)?,
        )
        .separator()
        .item(
            &CheckMenuItemBuilder::with_id("settings.toggle_autosave", "&Autosave")
                .checked(state.autosave)
                .accelerator("Ctrl+Alt+S")
                .build(app)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id("settings.zoom_in", "Zoom &In")
                .accelerator("Ctrl+=")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::with_id("settings.zoom_out", "Zoom &Out")
                .accelerator("Ctrl+-")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::with_id("settings.zoom_reset", "&Actual Size")
                .accelerator("Ctrl+0")
                .build(app)?,
        )
        .separator()
        .item(&font_size_menu.build()?)
        .build()?;

    let view_menu = SubmenuBuilder::new(app, "&View")
        .item(
            &MenuItemBuilder::with_id("edit.find", "&Find...")
                .accelerator("Ctrl+F")
                .build(app)?,
        )
        .separator()
        .minimize()
        .maximize()
        .separator()
        .fullscreen()
        .build()?;

    let window_menu = SubmenuBuilder::new(app, "&Window")
        .minimize()
        .maximize()
        .separator()
        .fullscreen()
        .build()?;

    let help_menu = SubmenuBuilder::new(app, "&Help")
        .item(
            &MenuItemBuilder::with_id("help.about", "&About Notex")
                .build(app)?,
        )
        .build()?;

    MenuBuilder::new(app)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&settings_menu)
        .item(&view_menu)
        .item(&window_menu)
        .item(&help_menu)
        .build()
}

#[tauri::command]
fn sync_native_menu<R: Runtime>(
    app: AppHandle<R>,
    state: NativeMenuSyncState,
    menu_state: State<'_, Mutex<NativeMenuState>>,
) -> tauri::Result<()> {
    {
        let mut current_state = menu_state.lock().unwrap();
        current_state.recent_files = state.recent_files;
        current_state.dark_mode = state.theme == "dark";
        current_state.vim_mode = state.vim_mode;
        current_state.word_wrap = state.word_wrap;
        current_state.autosave = state.autosave;
        current_state.font_size = state.font_size;
    }

    let current_state = menu_state.lock().unwrap();
    let menu = build_native_menu(&app, &current_state)?;
    app.set_menu(menu)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(NativeMenuState::default()))
        .setup(|app| {
            let menu_state = app.state::<Mutex<NativeMenuState>>();
            let state = menu_state.lock().unwrap();
            let menu = build_native_menu(&app.handle(), &state)?;
            app.set_menu(menu)?;
            Ok(())
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            "file.new"
            | "file.open"
            | "file.save"
            | "file.save_as"
            | "edit.find"
            | "edit.replace"
            | "edit.find_next"
            | "edit.find_previous"
            | "edit.replace_next"
            | "edit.replace_all"
            | "edit.go_to_line"
            | "settings.toggle_theme"
            | "settings.toggle_wrap"
            | "settings.toggle_vim"
            | "settings.toggle_autosave"
            | "settings.zoom_in"
            | "settings.zoom_out"
            | "settings.zoom_reset"
            | "help.about" => {
                let _ = app.emit(
                    "notex://menu-action",
                    MenuActionPayload {
                        action: event.id().as_ref().to_string(),
                        file_path: None,
                    },
                );
            }
            item_id if item_id.starts_with("settings.font_size.") => {
                let _ = app.emit(
                    "notex://menu-action",
                    MenuActionPayload {
                        action: item_id.to_string(),
                        file_path: None,
                    },
                );
            }
            item_id if item_id.starts_with("file.recent.") => {
                let menu_state = app.state::<Mutex<NativeMenuState>>();
                let state = menu_state.lock().unwrap();
                let index = item_id
                    .trim_start_matches("file.recent.")
                    .parse::<usize>()
                    .ok();
                if let Some(file_path) = index.and_then(|value| state.recent_files.get(value)) {
                    let _ = app.emit(
                        "notex://menu-action",
                        MenuActionPayload {
                            action: "file.open_recent".to_string(),
                            file_path: Some(file_path.clone()),
                        },
                    );
                }
            }
            _ => {}
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet, sync_native_menu])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
