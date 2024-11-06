import { render } from "solid-js/web";
import { createSignal, onCleanup } from "solid-js";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { saveClipboardToDB } from "./utils/db";
import "./styles.css";
import { App } from "./App";

const root = document.getElementById("root");

const [showPopup, setShowPopup] = createSignal(false);
const [lastClipboard, setLastClipboard] = createSignal("");

const appWindow = getCurrentWindow();

const showAppWindow = () => {
  appWindow.show();
  appWindow.center();
  appWindow.setFocus();
  setShowPopup(true);
};

const hideAppWindow = () => {
  appWindow.hide();
  setShowPopup(false);
};

const toggleAppWindow = () => {
  setShowPopup((prev) => {
    if (prev) {
      hideAppWindow();
    } else {
      showAppWindow();
    }
    return !prev;
  });
};

const monitorClipboard = async () => {
  let previousContent = await readText();

  setLastClipboard(previousContent);

  const windowTitle = await appWindow.title();
  const windowExe = "unknown";
  await saveClipboardToDB(previousContent, windowTitle, windowExe, "text");

  const interval = setInterval(async () => {
    try {
      const currentContent = await readText();
      if (
        currentContent !== previousContent &&
        currentContent !== lastClipboard()
      ) {
        previousContent = currentContent;
        setLastClipboard(currentContent);
        await saveClipboardToDB(currentContent, windowTitle, windowExe, "text");
        emit("clipboard_updated", { content: currentContent });
      }
    } catch (e) {}
  }, 1000);

  onCleanup(() => clearInterval(interval));
};

const onBlur = () => {
  if (showPopup()) {
    hideAppWindow();
  }
};

if (root) {
  render(() => {
    listen("toggle-popup", () => {
      toggleAppWindow();
    });

    monitorClipboard();

    appWindow.onFocusChanged((focus) => {
      if (!focus.payload) {
        onBlur();
      }
    });

    return <App />;
  }, root);
}
