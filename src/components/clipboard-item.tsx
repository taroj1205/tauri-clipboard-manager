import type { Component } from "solid-js";
import type { ClipboardHistory } from "../types/clipboard";
import { cn } from "../utils/tailwind";
import { DocumentIcon } from "../icons";
import { ImageIcon } from "../icons/image";
import { CodeIcon } from "../icons/code";
import { highlightText } from "../utils/highlight";

interface ClipboardItemProps {
  item: ClipboardHistory;
  isActive: boolean;
  index: number;
  searchQuery: string;
  onDoubleClick: () => void;
  onClick: () => void;
  // onContextMenu: (e: MouseEvent) => void;
}

export const ClipboardItem: Component<ClipboardItemProps> = (props) => {
  return (
    <button
      type="button"
      onDblClick={props.onDoubleClick}
      onClick={props.onClick}
      // onContextMenu={props.onContextMenu}
      class={cn(
        "cursor-pointer w-full grid grid-cols-[auto_1fr] gap-2 p-2 h-10 rounded truncate overflow-hidden place-items-center",
        {
          "bg-active bg-opacity-20": props.isActive,
        }
      )}
    >
      {props.item.type === "image" ? (
        <>
          <ImageIcon class="size-4" />
          <img
            src={`data:image/png;base64,${props.item.image}`}
            alt="clipboard content"
            class="h-full w-full object-cover overflow-hidden"
          />
        </>
      ) : props.item.type === "html" ? (
        <>
          <CodeIcon class="size-4" />
          <p class="w-full overflow-hidden text-left text-ellipsis">
            {highlightText(
              props.item.content.replace(/<[^>]*>/g, '').trim().split("\n")[0],
              props.searchQuery
            )}
          </p>
        </>
      ) : (
        <>
          <DocumentIcon class="size-4" />
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
