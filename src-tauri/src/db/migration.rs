use tauri_plugin_sql::{Migration, MigrationKind};

/// Migrations for the database
pub const MIGRATION: Migration = Migration {
    version: 1,
    description: "create_initial_tables_v2",
    sql: "CREATE TABLE clipboard (
        id INTEGER PRIMARY KEY,
        content TEXT,
        first_copied_date TEXT,
        last_copied_date TEXT,
        window_title TEXT,
        window_exe TEXT,
        type TEXT,
        image TEXT,
        html TEXT,
        count INTEGER
        );
         CREATE VIRTUAL TABLE clipboard_fts USING fts5(
                content, 
                window_title, 
                window_exe,
                content='clipboard',
                content_rowid='id'
            );
            
            INSERT INTO clipboard_fts(rowid, content, window_title, window_exe)
            SELECT id, content, window_title, window_exe FROM clipboard;
            
            CREATE TRIGGER clipboard_ai AFTER INSERT ON clipboard BEGIN
                INSERT INTO clipboard_fts(rowid, content, window_title, window_exe)
                VALUES (new.id, new.content, new.window_title, new.window_exe);
            END;
            
            CREATE TRIGGER clipboard_ad AFTER DELETE ON clipboard BEGIN
                INSERT INTO clipboard_fts(clipboard_fts, rowid, content, window_title, window_exe)
                VALUES('delete', old.id, old.content, old.window_title, old.window_exe);
            END;
            
            CREATE TRIGGER clipboard_au AFTER UPDATE ON clipboard BEGIN
                INSERT INTO clipboard_fts(clipboard_fts, rowid, content, window_title, window_exe)
                VALUES('delete', old.id, old.content, old.window_title, old.window_exe);
                INSERT INTO clipboard_fts(rowid, content, window_title, window_exe)
                VALUES (new.id, new.content, new.window_title, new.window_exe);
            END;",
    kind: MigrationKind::Up,
};
