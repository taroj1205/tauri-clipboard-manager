import { render } from "solid-js/web";
import { createSignal } from "solid-js";
import { emit } from "@tauri-apps/api/event";
import {
  hasImage,
  hasText,
  hasHTML,
  onClipboardUpdate,
  readText,
  readImageBase64,
  readHtml,
  hasFiles,
  readFiles,
} from "tauri-plugin-clipboard-api";
import "./styles.css";
import { App } from "./App";
import { invoke } from "@tauri-apps/api/core";
import { appConfigDir } from "@tauri-apps/api/path";
import { path } from "@tauri-apps/api";
import { ActiveWindowProps } from "./types/clipboard";
import "@fontsource/inter";

const main = async () => {
  const app_config_dir = await appConfigDir();
  const db_path = await path.join(app_config_dir, "clipboard.db");

  const root = document.getElementById("root");

  const [prevImage, setPrevImage] = createSignal("");
  const [prevText, setPrevText] = createSignal("");

  const saveClipboard = async () => {
    // if (isCopyingFromApp()) {
    //   setIsCopyingFromApp(false);
    //   return;
    // }

    const type = (await hasFiles())
      ? "files"
      : (await hasImage())
      ? "image"
      : (await hasHTML())
      ? "html"
      : (await hasText())
      ? "text"
      : null;
    console.log(type);

    const window = (await invoke("get_current_window")) as ActiveWindowProps;
    const windowTitle = window.title;
    const windowExe =
      window.process_path.split(/[/\\]/).pop() || window.process_path;

    if (type === "files") {
      const files = await readFiles();
      await invoke("save_clipboard_to_db", {
        db_path,
        content: files.toString(),
        window_title: windowTitle,
        window_exe: windowExe,
        type,
        image: null,
        html: null,
      });
    } else if (type === "image") {
      const image = await readImageBase64();
      if (image !== prevImage()) setPrevImage(image);
      else return;
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
      const isUrl =
        type === "text" && /^(https?:\/\/|www\.)\S+$/i.test(content);
      const isColorCode =
        type === "text" &&
        /^(#[0-9A-Fa-f]{3,8}|rgb\(.*\)|rgba\(.*\)|hsl\(.*\)|hsla\(.*\))$/.test(
          content.trim()
        );
      await invoke("save_clipboard_to_db", {
        db_path,
        content,
        window_title: windowTitle,
        window_exe: windowExe,
        type: isColorCode ? "color" : isUrl ? "url" : type,
        image: null,
        html,
      });
    }
  };

  if (root) {
    render(() => {
      onClipboardUpdate(async () => {
        await saveClipboard();
        emit("clipboard_saved");
      });

      return <App db_path={db_path} />;
    }, root);
  }
};

main().catch(console.error);
