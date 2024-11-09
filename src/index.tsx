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
// import { writeFile, BaseDirectory } from "@tauri-apps/plugin-fs";
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
  const windowTitle = (await appWindow.title()) || "unknown";
  const windowExe = "unknown";
  const type = hasImageSignal()
    ? "image"
    : hasTextSignal()
    ? "text"
    : "unknown";

  console.log(type);

  if (type === "image") {
    const image = await readImageBase64();
    // const path = new Date().toISOString().replace(/:/g, "-");
    // const file = await writeFile(
    //   `images/${path}`,
    //   new Uint8Array(Buffer.from(image, "base64")),
    //   {
    //     baseDir: BaseDirectory.AppData,
    //   }
    // );
    // console.log(file);
    await invoke("save_clipboard_to_db", {
      db_path,
      content: "",
      window_title: windowTitle,
      window_exe: windowExe,
      type,
      image,
    });
  } else {
    const content = type === "text" ? await readText() : "";
    await invoke("save_clipboard_to_db", {
      db_path,
      content,
      window_title: windowTitle,
      window_exe: windowExe,
      type,
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
