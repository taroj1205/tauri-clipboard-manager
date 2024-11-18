use active_win_pos_rs::get_active_window;
use serde::Serialize;
use tauri::{LogicalPosition, WebviewWindow};

#[tauri::command]
pub fn center_window_on_current_monitor(window: &WebviewWindow) {
    if let Some(monitor) = window.current_monitor().ok().flatten() {
        let monitor_size = monitor.size();
        let window_size = window.outer_size().ok().unwrap_or_default();

        let x = (monitor_size.width as f64 - window_size.width as f64) / 2.0;
        let y = (monitor_size.height as f64 - window_size.height as f64) / 2.0;

        window
            .set_position(LogicalPosition::new(x, y))
            .expect("Failed to set window position");
    }
}

#[derive(Serialize)]
pub struct WindowInfo {
    pub title: String,
    pub process_path: String,
    pub app_name: String,
    pub window_id: String,
    pub process_id: u64,
}

#[tauri::command]
pub fn get_current_window() -> Option<WindowInfo> {
    get_active_window().ok().map(|window| WindowInfo {
        title: window.title,
        process_path: window
            .process_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string(),
        app_name: window.app_name,
        window_id: window.window_id,
        process_id: window.process_id,
    })
}
