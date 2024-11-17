import type { Component } from "solid-js";
import type { ClipboardHistory } from "../types/clipboard";
import { CopyIcon } from "../icons";
import { highlightText } from "../utils/highlight";

interface ClipboardPreviewProps {
  item: ClipboardHistory;
  searchQuery: string;
  onCopy: () => void;
}

export const ClipboardPreview: Component<ClipboardPreviewProps> = (props) => {
  return (
    <div class="flex flex-col gap-2">
      <div class="sticky top-0 grid grid-cols-[1fr_1fr_auto] place-items-center">
        {props.item?.date && (
          <time class="text-gray-400 text-sm text-left w-full">
            {new Intl.DateTimeFormat("ja-JP", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }).format(new Date(props.item.date))}
          </time>
        )}
        <p class="text-gray-400">
          {/* {props.item.window_title} ({props.item.type === "text" ? props.item.count : null}) */}
        </p>
        <button type="button" class="text-gray-400" onClick={props.onCopy}>
          <CopyIcon />
        </button>
      </div>
      {props?.item?.type === "image" ? (
        <div class="max-h-[390px] overflow-auto scroll-area">
          <img
            src={`data:image/png;base64,${props.item.image}`}
            alt="clipboard content"
            class="w-full object-contain rounded"
          />
        </div>
      ) : props?.item?.type === "html" ? (
        <div class="h-full scroll-area w-full max-h-[390px] overflow-auto">
          <div 
            class="max-w-none"
            innerHTML={props.item?.content}
          />
        </div>
      ) : (
        <div class="h-full scroll-area w-full max-h-[390px] overflow-auto whitespace-pre-wrap">
          {highlightText(props.item?.content, props.searchQuery)}
        </div>
      )}
    </div>
  );
};
