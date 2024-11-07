import { render } from "solid-js/web";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  hasImage,
  hasText,
  onClipboardUpdate,
  readText,
  readImageBase64,
} from "tauri-plugin-clipboard-api";
import { saveClipboardToDB } from "./utils/db";
import "./styles.css";
import { App } from "./App";

const root = document.getElementById("root");

const appWindow = getCurrentWindow();

const has = {
  hasHTML: false,
  hasImage: false,
  hasText: false,
  hasRTF: false,
  hasFiles: false,
};

let isCopyingFromApp = false;
let saved = false;

const saveClipboard = async () => {
  if (isCopyingFromApp) {
    isCopyingFromApp = false;
    return;
  }
  const windowTitle = await appWindow.title();
  const windowExe = "unknown";
  const type = has.hasImage ? "image" : has.hasText ? "text" : "unknown";

  console.log(type);

  if (type === "image") {
    const image = await readImageBase64();
    saveClipboardToDB("", windowTitle, windowExe, type, image);
  } else {
    const content = type === "text" ? await readText() : "";
    saveClipboardToDB(content, windowTitle, windowExe, type);
  }

  saved = true;
};

if (root) {
  render(() => {
    listen("copy-from-app", () => {
      isCopyingFromApp = true;
    });

    onClipboardUpdate(async () => {
      has.hasImage = await hasImage();
      has.hasText = await hasText();

      if (!saved) await saveClipboard();
      emit("clipboard_saved");
    });

    return <App />;
  }, root);
}
