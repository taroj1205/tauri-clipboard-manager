use base64::{engine::general_purpose::STANDARD, Engine};
use image::load_from_memory;
use std::env::temp_dir;
use std::sync::mpsc;
use std::thread;
use win_ocr::ocr;

#[tauri::command]
pub fn extract_text_from_base64(base64_str: String) -> Result<String, String> {
    // Create a channel to communicate between threads
    let (tx, rx) = mpsc::channel();

    // Spawn a new thread to perform the OCR extraction
    thread::spawn(move || {
        // Decode the base64 string to bytes
        let image_data = match STANDARD.decode(base64_str) {
            Ok(data) => data,
            Err(e) => {
                tx.send(Err(e.to_string())).unwrap();
                return;
            }
        };

        // Load the image from the decoded bytes
        let img = match load_from_memory(&image_data) {
            Ok(image) => image,
            Err(e) => {
                tx.send(Err(e.to_string())).unwrap();
                return;
            }
        };

        // Save the image to a temporary file
        let temp_path = temp_dir().join("temp_image.png");
        if let Err(e) = img.save(&temp_path) {
            tx.send(Err(e.to_string())).unwrap();
            return;
        }

        // Perform OCR on the image
        let ocr_text = match ocr(temp_path.to_str().unwrap()) {
            Ok(text) => text,
            Err(e) => {
                tx.send(Err(e.to_string())).unwrap();
                return;
            }
        };

        // Send the extracted text back to the main thread
        tx.send(Ok(ocr_text)).unwrap();
    });

    // Wait for the result from the OCR thread
    rx.recv().map_err(|e| e.to_string())?
}
