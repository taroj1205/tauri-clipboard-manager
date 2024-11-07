import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";

let db: Database;

export const initializeDatabase = async () => {
  db = await Database.load("sqlite:clipboard.db");
};

initializeDatabase();

export const saveClipboardToDB = async (
  content: string,
  windowTitle: string,
  windowExe: string,
  type: string,
  image = ""
) => {
  if (!db) {
    await initializeDatabase();
  }
  const date = new Date().toISOString();
  await db.execute(
    "INSERT INTO clipboard (content, date, window_title, window_exe, type, image) VALUES (?, ?, ?, ?, ?, ?)",
    [content, date, windowTitle, windowExe, type, image]
  );
  const result = await db.select<{ id: number }[]>(
    "SELECT last_insert_rowid() as id"
  );
  const id = result[0].id;

  if (type === "image")
    invoke("extract_text_from_base64", { base64Str: image }).then(
      (extractedText) => {
        updateClipboardInDB(id, extractedText as string);
      }
    );
};

export const updateClipboardInDB = async (
  id: number,
  extractedText: string
) => {
  await db.execute("UPDATE clipboard SET content = ? WHERE id = ?", [
    extractedText,
    id,
  ]);
};

export interface ClipboardHistory {
  content: string;
  date: string;
  windowTitle: string;
  windowExe: string;
  type: string;
  count: number;
  image: string;
}

export const getHistory = async ({
  offset = 0,
  limit = 20,
  filter = {},
  sort,
}: {
  offset?: number;
  limit?: number;
  filter?: {
    type?: string;
    windowTitle?: string;
    windowExe?: string;
    content?: string;
  };
  sort?: { column: keyof ClipboardHistory; order: "ASC" | "DESC" };
} = {}): Promise<ClipboardHistory[]> => {
  if (!db) {
    await initializeDatabase();
  }
  let query = `
    SELECT content, MAX(date) as date, window_title as windowTitle, window_exe as windowExe, type, image, COUNT(*) as count
    FROM clipboard
  `;

  const params: (string | number | undefined)[] = [];
  const whereClauses: string[] = [];

  if (filter?.type) {
    whereClauses.push("type = ?");
    params.push(filter.type);
  }

  if (filter?.windowTitle) {
    whereClauses.push("window_title = ?");
    params.push(filter.windowTitle);
  }

  if (filter?.windowExe) {
    whereClauses.push("window_exe = ?");
    params.push(filter.windowExe);
  }

  if (filter?.content) {
    if (filter.content.startsWith("img:")) {
      whereClauses.push("type = 'image'");
      const contentWords = filter.content.slice(4).trim().split(" ");
      const contentClauses = contentWords.map(() => "content LIKE ?");
      whereClauses.push(`(${contentClauses.join(" OR ")})`);
      params.push(...contentWords.map((word) => `%${word}%`));
    } else if (filter.content.startsWith("t:")) {
      whereClauses.push("type = 'text'");
      const contentWords = filter.content.slice(2).trim().split(" ");
      const contentClauses = contentWords.map(() => "content LIKE ?");
      whereClauses.push(`(${contentClauses.join(" OR ")})`);
      params.push(...contentWords.map((word) => `%${word}%`));
    } else {
      const contentWords = filter.content.trim().split(" ");
      const contentClauses = contentWords.map(() => "content LIKE ?");
      whereClauses.push(`(${contentClauses.join(" OR ")})`);
      params.push(...contentWords.map((word) => `%${word}%`));
    }
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  if (filter?.type === "image" || filter?.content?.startsWith("img:")) {
    query += " GROUP BY image";
  } else {
    query += " GROUP BY content, window_title, window_exe, type, image";
  }

  if (sort) {
    query += ` ORDER BY ${sort.column} ${sort.order}`;
  } else if (filter?.content) {
    query +=
      " ORDER BY (CASE WHEN content LIKE ? THEN 1 ELSE 0 END) DESC, MAX(date) DESC";
    params.push(`%${filter.content}%`);
  } else {
    query += " ORDER BY MAX(date) DESC";
  }

  if (typeof limit !== "undefined") {
    query += " LIMIT ?";
    params.push(limit);
  }

  if (typeof offset !== "undefined") {
    query += " OFFSET ?";
    params.push(offset);
  }

  const result = await db.select<ClipboardHistory[]>(query, params);
  return result;
};
