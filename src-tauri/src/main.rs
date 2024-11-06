// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

mod db;
use db::MIGRATION;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command(rename_all = "snake_case")]
fn message(message: String) {
    println!("{}", message);
}

fn main() {
    let migrations = vec![MIGRATION];

    let mut builder = tauri::Builder::default().plugin(
        tauri_plugin_sql::Builder::default()
            .add_migrations("sqlite:clipboard.db", migrations)
            .build(),
    );
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }));
    }
    builder
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                // use tauri::Manager;
                use tauri::Emitter;
                use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutState};

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_shortcuts(["alt+v"])? // Added "alt+v" shortcut
                        .with_handler(|app, shortcut, event| {
                            if event.state == ShortcutState::Pressed {
                                if shortcut.matches(Modifiers::ALT, Code::KeyV) {
                                    println!("Alt+V triggered");
                                    // Handle "alt+v" shortcut
                                    let _ = app.emit("shortcut-event", "Alt+V triggered");
                                    // Emit an event to open the popup
                                    let _ = app.emit("toggle-popup", ());
                                }
                            }
                        })
                        .build(),
                )?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![message])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
