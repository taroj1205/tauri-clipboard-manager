use tauri_plugin_sql::{Migration, MigrationKind};

/// Migrations for the database
pub const MIGRATION: Migration = Migration {
    version: 1,
    description: "create_initial_tables_v2",
    sql: "CREATE TABLE clipboard (
                id INTEGER PRIMARY KEY,
                content TEXT,
                date TEXT,
                window_title TEXT,
                window_exe TEXT,
                type TEXT
              );",
    kind: MigrationKind::Up,
};
