import { render } from "solid-js/web";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  hasHTML,
  hasImage,
  hasRTF,
  hasText,
  hasFiles,
  onClipboardUpdate,
  readText,
  readImageBase64,
} from "tauri-plugin-clipboard-api";
import { saveClipboardToDB } from "./utils/db";
import "./styles.css";
import { App } from "./App";

const root = document.getElementById("root");

const appWindow = getCurrentWindow();

const toggleAppWindow = () => {
  appWindow.isVisible().then((visible) => {
    if (visible) {
      appWindow.hide();
    } else {
      appWindow.show();
      appWindow.setFocus();
      emit("app_window_shown");
    }
  });
};

const has = {
  hasHTML: false,
  hasImage: false,
  hasText: false,
  hasRTF: false,
  hasFiles: false,
};

const saveClipboard = async () => {
  const windowTitle = await appWindow.title();
  const windowExe = "unknown";
  const type = has.hasImage ? "image" : has.hasText ? "text" : "unknown";
  const content = type === "text" ? await readText() : await readImageBase64();
  await saveClipboardToDB(content, windowTitle, windowExe, type);
};

if (root) {
  render(() => {
    listen("toggle-popup", () => {
      toggleAppWindow();
    });

    onClipboardUpdate(async () => {
      has.hasHTML = await hasHTML();
      has.hasImage = await hasImage();
      has.hasText = await hasText();
      has.hasRTF = await hasRTF();
      has.hasFiles = await hasFiles();

      if (has.hasText) {
        await saveClipboard();
      } else if (has.hasImage) {
        await saveClipboard();
      }
      emit("clipboard_saved");
    });

    return <App />;
  }, root);
}
