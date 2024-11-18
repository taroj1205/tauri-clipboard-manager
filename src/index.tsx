import { render } from "solid-js/web";
import { createSignal } from "solid-js";
import { emit, listen } from "@tauri-apps/api/event";
import {
  hasImage,
  hasText,
  hasHTML,
  onClipboardUpdate,
  readText,
  readImageBase64,
  readHtml,
  hasFiles,
} from "tauri-plugin-clipboard-api";
import "./styles.css";
import { App } from "./App";
import { invoke } from "@tauri-apps/api/core";
import { appConfigDir } from "@tauri-apps/api/path";
// import { writeFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { path } from "@tauri-apps/api";
import { ActiveWindowProps } from "./types/clipboard";

const main = async () => {
  const app_config_dir = await appConfigDir();
  const db_path = await path.join(app_config_dir, "clipboard.db");

  const root = document.getElementById("root");

  const [prevImage, setPrevImage] = createSignal("");
  const [prevText, setPrevText] = createSignal("");

  const [isCopyingFromApp, setIsCopyingFromApp] = createSignal(false);
  createSignal(false);

  const saveClipboard = async () => {
    if (isCopyingFromApp()) {
      setIsCopyingFromApp(false);
      return;
    }

    
    const type = await hasFiles() ? "file" : await hasImage() ? "image" : await hasHTML() ? "html" : await hasText() ? "text" : null;

    // Skip if clipboard has file
    if (type === "file") return;

    const window = await invoke("get_current_window") as ActiveWindowProps;
    const windowTitle = window.title;
    const windowExe = window.process_path.split(/[/\\]/).pop() || window.process_path;

    if (type === "image") {
      const image = await readImageBase64();
      if (image !== prevImage()) setPrevImage(image);
      else return;
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
        html: null,
      });
    } else {
      const content = await readText();
      if (content !== prevText()) setPrevText(content);
      else return;
      const html = type === "html" ? await readHtml() : "";
      await invoke("save_clipboard_to_db", {
        db_path,
        content,
        window_title: windowTitle,
        window_exe: windowExe,
        type,
        image: null,
        html,
      });
    }
  };

  if (root) {
    render(() => {
      listen("copy-from-app", () => {
        setIsCopyingFromApp(true);
      });

      onClipboardUpdate(async () => {
        await saveClipboard();
        emit("clipboard_saved");
      });

      return <App db_path={db_path} />;
    }, root);
  }
};

main().catch(console.error);
