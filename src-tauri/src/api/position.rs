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