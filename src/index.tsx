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
import { saveClipboardToDB } from "./utils/db";
import "./styles.css";
import { App } from "./App";

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
    saveClipboardToDB("", windowTitle, windowExe, type, image);
  } else {
    const content = type === "text" ? await readText() : "";
    saveClipboardToDB(content, windowTitle, windowExe, type);
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

    return <App />;
  }, root);
}
