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
    
    // Enable FTS5 extension
    conn.execute_batch("PRAGMA foreign_keys = ON;").map_err(|e| e.to_string())?;
    
    // Create main clipboard table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS clipboard (
            id            INTEGER PRIMARY KEY,
            content       TEXT,
            date         TEXT,
            window_title TEXT,
            window_exe   TEXT,
            type         TEXT,
            image        TEXT
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    // Create FTS5 virtual table
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS clipboard_fts USING fts5(
            content,
            window_title,
            window_exe,
            content='clipboard',
            content_rowid='id'
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    // Create triggers to keep FTS index up to date
    conn.execute_batch(
        "
        CREATE TRIGGER IF NOT EXISTS clipboard_ai AFTER INSERT ON clipboard BEGIN
            INSERT INTO clipboard_fts(rowid, content, window_title, window_exe)
            VALUES (new.id, new.content, new.window_title, new.window_exe);
        END;
        CREATE TRIGGER IF NOT EXISTS clipboard_ad AFTER DELETE ON clipboard BEGIN
            INSERT INTO clipboard_fts(clipboard_fts, rowid, content, window_title, window_exe)
            VALUES('delete', old.id, old.content, old.window_title, old.window_exe);
        END;
        CREATE TRIGGER IF NOT EXISTS clipboard_au AFTER UPDATE ON clipboard BEGIN
            INSERT INTO clipboard_fts(clipboard_fts, rowid, content, window_title, window_exe)
            VALUES('delete', old.id, old.content, old.window_title, old.window_exe);
            INSERT INTO clipboard_fts(rowid, content, window_title, window_exe)
            VALUES (new.id, new.content, new.window_title, new.window_exe);
        END;
        "
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
    
    // Start with a base query that always uses the latest entries
    let mut query = String::from(
        "WITH LatestEntries AS (
            SELECT content, MAX(id) as latest_id
            FROM clipboard
            GROUP BY content
        )
        SELECT c.id, c.content, c.date, c.window_title, c.window_exe, c.type, c.image, 1 as count
        FROM clipboard c
        INNER JOIN LatestEntries le ON c.id = le.latest_id"
    );

    let mut conditions = Vec::new();
    let mut param_values = Vec::new(); // Hold owned values
    let mut params: Vec<&dyn rusqlite::ToSql> = Vec::new();

    // Add conditions based on filter
    if let Some(f) = &filter {
        // Always join with FTS table if we have any filter
        query.push_str("\nINNER JOIN clipboard_fts ON clipboard_fts.rowid = c.id");

        if let Some(t) = &f.type_ {
            conditions.push("c.type = ?");
            param_values.push(t.clone());
        }
        if let Some(wt) = &f.window_title {
            conditions.push("clipboard_fts.window_title MATCH ?");
            param_values.push(format!("\"{}\"", wt));
        }
        if let Some(we) = &f.window_exe {
            conditions.push("clipboard_fts.window_exe MATCH ?");
            param_values.push(format!("\"{}\"", we));
        }
        if let Some(content) = &f.content {
            if !content.is_empty() {
                conditions.push("clipboard_fts.content MATCH ?");
                // Use proper FTS query syntax for better matching
                param_values.push(format!("\"{}\"*", content));
            }
        }
    }

    if !conditions.is_empty() {
        query.push_str(" WHERE ");
        query.push_str(&conditions.join(" AND "));
    }

    // Apply sorting
    if let Some(s) = sort {
        query.push_str(&format!(" ORDER BY c.{} {}", s.column, s.order));
    } else {
        query.push_str(" ORDER BY c.date DESC");
    }

    // Apply pagination
    let offset = offset.unwrap_or(0);
    let limit = limit.unwrap_or(20);
    query.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    
    // Create references to parameter values after all values are stored
    params.extend(param_values.iter().map(|v| v as &dyn rusqlite::ToSql));
    
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
        history.push(entry.map_err(|e| e.to_string())?);
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
