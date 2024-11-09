import { render } from "solid-js/web";
import { createSignal } from "solid-js";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  hasImage,
  hasText,
  onClipboardUpdate,
  readText,
  readImageBase64,
} from "tauri-plugin-clipboard-api";
import "./styles.css";
import { App } from "./App";
import { invoke } from "@tauri-apps/api/core";
import { appConfigDir } from "@tauri-apps/api/path";
import { path } from "@tauri-apps/api";

let db_path = "";
const initDbPath = async () => {
  const app_config_dir = await appConfigDir();
  db_path = await path.join(app_config_dir, "clipboard.db");
};
await initDbPath();

const root = document.getElementById("root");

const appWindow = getCurrentWindow();

const [hasImageSignal, setHasImageSignal] = createSignal(false);
const [hasTextSignal, setHasTextSignal] = createSignal(false);

const [isCopyingFromApp, setIsCopyingFromApp] = createSignal(false);
createSignal(false);

const saveClipboard = async () => {
  if (isCopyingFromApp()) {
    setIsCopyingFromApp(false);
    return;
  }
  const windowTitle = await appWindow.title();
  const windowExe = "unknown";
  const type = hasImageSignal()
    ? "image"
    : hasTextSignal()
    ? "text"
    : "unknown";

  console.log(type);

  if (type === "image") {
    const image = await readImageBase64();
    await invoke("save_clipboard_to_db", {
      db_path,
      content: "",
      windowTitle,
      windowExe,
      type_: type,
      image: image,
    });
  } else {
    const content = type === "text" ? await readText() : "";
    await invoke("save_clipboard_to_db", {
      db_path,
      content,
      windowTitle,
      windowExe,
      type_: type,
      image: null,
    });
  }
};

if (root) {
  render(() => {
    listen("copy-from-app", () => {
      setIsCopyingFromApp(true);
    });

    onClipboardUpdate(async () => {
      setHasImageSignal(await hasImage());
      setHasTextSignal(await hasText());

      await saveClipboard();
      emit("clipboard_saved");
    });

    return <App db_path={db_path} />;
  }, root);
}
