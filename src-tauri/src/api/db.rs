use chrono::Utc;
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};

use super::image::extract_text_from_base64;

#[derive(Serialize, Deserialize)]
pub struct ClipboardHistory {
    content: String,
    date: String,
    window_title: String,
    window_exe: String,
    #[serde(rename = "type")]
    type_: String,
    count: i32,
    image: String,
}

#[derive(Deserialize)]
pub struct FilterOptions {
    type_: Option<String>,
    window_title: Option<String>,
    window_exe: Option<String>,
    content: Option<String>,
}

#[derive(Deserialize)]
pub struct SortOptions {
    column: String,
    order: String,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn initialize_database(db_path: String) -> Result<(), String> {
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS clipboard (
            id            INTEGER PRIMARY KEY,
            content       TEXT,
            date          TEXT,
            window_title  TEXT,
            window_exe    TEXT,
            type          TEXT,
            image         TEXT
        )",
        [],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn save_clipboard_to_db(
    db_path: String,
    content: String,
    window_title: String,
    window_exe: String,
    type_: String,
    image: Option<String>,
) -> Result<i64, String> {
    let conn = Connection::open(db_path.clone()).map_err(|e| e.to_string())?;
    let date = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO clipboard (content, date, window_title, window_exe, type, image) VALUES (?, ?, ?, ?, ?, ?)",
        params![
            content,
            date,
            window_title,
            window_exe,
            type_,
            image.clone().unwrap_or_default()
        ],
    ).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();

    if type_ == "image" {
        let base64_str = image.unwrap_or_default();
        let text = extract_text_from_base64(base64_str).await?;
        update_clipboard_in_db(db_path, id, text).await?;
    }
    Ok(id)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn update_clipboard_in_db(
    db_path: String,
    id: i64,
    extracted_text: String,
) -> Result<(), String> {
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE clipboard SET content = ? WHERE id = ?",
        params![extracted_text, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_history(
    db_path: String,
    offset: Option<i64>,
    limit: Option<i64>,
    filter: Option<FilterOptions>,
    sort: Option<SortOptions>,
) -> Result<Vec<ClipboardHistory>, String> {
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    let mut query = String::from(
        "SELECT id, content, MAX(date) as date, window_title, window_exe, type, image, COUNT(*) as count FROM clipboard",
    );
    let mut conditions = Vec::new();
    let mut params_vec: Vec<String> = Vec::new();

    if let Some(f) = filter {
        if let Some(t) = f.type_ {
            conditions.push("type = ?".to_string());
            params_vec.push(t);
        }
        if let Some(wt) = f.window_title {
            conditions.push("window_title = ?".to_string());
            params_vec.push(wt);
        }
        if let Some(we) = f.window_exe {
            conditions.push("window_exe = ?".to_string());
            params_vec.push(we);
        }
        if let Some(c) = f.content {
            conditions.push("content LIKE ?".to_string());
            params_vec.push(format!("%{}%", c));
        }
    }

    if !conditions.is_empty() {
        query.push_str(" WHERE ");
        query.push_str(&conditions.join(" AND "));
    }

    query.push_str(" GROUP BY id, content, window_title, window_exe, type, image");

    if let Some(s) = sort {
        query.push_str(&format!(" ORDER BY {} {}", s.column, s.order));
    } else {
        query.push_str(" ORDER BY MAX(date) DESC");
    }

    let offset = offset.unwrap_or(0);
    let limit = limit.unwrap_or(20);

    query.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let params: Vec<&dyn rusqlite::ToSql> = params_vec
        .iter()
        .map(|s| s as &dyn rusqlite::ToSql)
        .collect();
    let history_iter = stmt
        .query_map(params.as_slice(), |row| {
            Ok(ClipboardHistory {
                content: row.get(1)?,
                date: row.get(2)?,
                window_title: row.get(3)?,
                window_exe: row.get(4)?,
                type_: row.get(5)?,
                image: row.get(6)?,
                count: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut history = Vec::new();
    for entry in history_iter {
        let entry = entry.map_err(|e| e.to_string())?;
        history.push(entry);
    }

    Ok(history)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_clipboard_from_db(db_path: String, id: i64) -> Result<(), String> {
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM clipboard WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
