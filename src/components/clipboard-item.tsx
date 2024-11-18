import type { Component } from "solid-js";
import type { ClipboardHistory } from "../types/clipboard";
import { cn } from "../utils/tailwind";
import { DocumentIcon } from "../icons";
import { ImageIcon } from "../icons/image";
import { CodeIcon } from "../icons/code";
import { FileIcon } from "../icons/file";
import { highlightText } from "../utils/highlight";

interface ClipboardItemProps {
  item: ClipboardHistory;
  isActive: boolean;
  index: number;
  searchQuery: string;
  onDoubleClick: () => void;
  onClick: () => void;
}

export const ClipboardItem: Component<ClipboardItemProps> = (props) => {
  const getFaviconUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}`;
    } catch {
      return null;
    }
  };

  return (
    <button
      type="button"
      onDblClick={props.onDoubleClick}
      onClick={props.onClick}
      class={cn(
        "cursor-pointer w-full grid grid-cols-[auto_1fr] gap-2 p-2 h-10 rounded truncate overflow-hidden place-items-center",
        {
          "bg-active bg-opacity-20": props.isActive,
        }
      )}
    >
      {props.item.type === "image" ? (
        <>
          <ImageIcon class="size-4 text-gray-400" />
          <img
            src={`data:image/png;base64,${props.item.image}`}
            alt="clipboard content"
            class="h-full w-full object-cover overflow-hidden"
          />
        </>
      ) : props.item.type === "html" ? (
        <>
          <CodeIcon class="size-4 text-gray-400" />
          <p class="w-full overflow-hidden text-left text-ellipsis">
            {highlightText(
              props.item.content.trim().split("\n")[0],
              props.searchQuery
            )}
          </p>
        </>
      ) : props.item.type === "files" ? (
        <>
          <FileIcon class="size-4  text-gray-400" />
          <p class="w-full overflow-hidden text-left text-ellipsis">
            {highlightText(props.item.content.split(",")[0], props.searchQuery)}
          </p>
        </>
      ) : props.item.type === "url" ? (
        <>
          <img
            src={getFaviconUrl(props.item.content) || ""}
            alt="favicon"
            class="size-4"
            onError={(e) => {
              e.currentTarget.src = "";
              e.currentTarget.alt = "🌐";
            }}
          />
          <p class="w-full overflow-hidden text-left text-ellipsis">
            {highlightText(props.item.content, props.searchQuery)}
          </p>
        </>
      ) :  props.item.type === "color" ? (
        <>
          <div
            style={{ background: props.item.content }}
            class="size-4 rounded"
          />
          <p class="w-full overflow-hidden text-left text-ellipsis">
            {highlightText(props.item.content, props.searchQuery)}
          </p>
        </>
      ) :
      (
        <>
          <DocumentIcon class="size-4 text-gray-400" />
          <p class="w-full overflow-hidden text-left text-ellipsis">
            {highlightText(
              props.item.content.trim().split("\n")[0],
              props.searchQuery
            )}
          </p>
        </>
      )}
    </button>
  );
};
