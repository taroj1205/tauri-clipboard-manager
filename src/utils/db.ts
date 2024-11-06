import Database from "@tauri-apps/plugin-sql";

const db = await Database.load("sqlite:clipboard.db");

export const saveClipboardToDB = async (
  content: string,
  windowTitle: string,
  windowExe: string,
  type: string
) => {
  const date = new Date().toISOString();
  await db.execute(
    "INSERT INTO clipboard (content, date, window_title, window_exe, type) VALUES (?, ?, ?, ?, ?)",
    [content, date, windowTitle, windowExe, type]
  );
};

export interface ClipboardHistory {
  content: string;
  date: string;
  windowTitle: string;
  windowExe: string;
  type: string;
  count: number;
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
  let query = `
    SELECT content, MAX(date) as date, window_title as windowTitle, window_exe as windowExe, type, COUNT(*) as count
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
    whereClauses.push("content LIKE ?");
    params.push(`%${filter.content}%`);
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  query += `
    GROUP BY content, window_title, window_exe, type
  `;

  if (sort) {
    query += ` ORDER BY ${sort.column} ${sort.order}`;
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
