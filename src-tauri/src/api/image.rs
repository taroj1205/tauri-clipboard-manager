use base64::{engine::general_purpose::STANDARD, Engine};
use image::load_from_memory;
use std::env::temp_dir;
use tokio::task;
use win_ocr::ocr;

#[tauri::command]
pub async fn extract_text_from_base64(base64_str: String) -> Result<String, String> {
    // Spawn a new asynchronous task to perform the OCR extraction
    let handle = task::spawn_blocking(move || {
        // Decode the base64 string to bytes
        let image_data = match STANDARD.decode(base64_str) {
            Ok(data) => data,
            Err(e) => return Err(e.to_string()),
        };

        // Load the image from the decoded bytes
        let img = match load_from_memory(&image_data) {
            Ok(image) => image,
            Err(e) => return Err(e.to_string()),
        };

        // Save the image to a temporary file
        let temp_path = temp_dir().join("temp_image.png");
        if let Err(e) = img.save(&temp_path) {
            return Err(e.to_string());
        }

        // Perform OCR on the image
        let ocr_text = match ocr(temp_path.to_str().unwrap()) {
            Ok(text) => text,
            Err(e) => return Err(e.to_string()),
        };

        // Return the extracted text
        Ok(ocr_text)
    });

    // Await the result from the OCR task
    handle.await.map_err(|e| e.to_string())?
}
