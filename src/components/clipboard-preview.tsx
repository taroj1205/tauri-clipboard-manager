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
  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(dateStr));
  };

  return (
    <div class="grid grid-rows-[auto_auto_1fr] h-full max-h-[calc(100svh-5rem)] gap-2">
      <div class="sticky top-0 grid grid-cols-[1fr_auto] place-items-center">
        {props.item?.last_copied_date && (
          <time class="text-gray-400 text-sm text-left w-full">
            {formatDate(props.item.last_copied_date)}
          </time>
        )}
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
          <div class="w-fit" innerHTML={props.item?.html} />
        </div>
      ) : (
        <div class="h-full scroll-area w-full max-h-[390px] overflow-auto whitespace-pre-wrap">
          {highlightText(props.item?.content, props.searchQuery)}
        </div>
      )}

      <div class="text-sm text-gray-300 flex flex-col divide-y divide-gray-700 justify-end">
        <div class="py-1.5 flex justify-between">
          <p class="text-gray-400">Copy Count</p>
          <p>{props.item.count} times</p>
        </div>
        <div class="py-1.5 flex justify-between">
          <p class="text-gray-400">Content Type</p>
          <p class="capitalize">{props.item.type}</p>
        </div>
        <div class="py-1.5 flex justify-between">
          <p class="text-gray-400">First Copied</p>
          <p>{formatDate(props.item.first_copied_date)}</p>
        </div>
        <div class="py-1.5 flex justify-between">
          <p class="text-gray-400">Last Copied</p>
          <p>{formatDate(props.item.last_copied_date)}</p>
        </div>
        <div class="py-1.5 flex justify-between">
          <p class="text-gray-400">Window</p>
          <p
            class="text-right max-w-[70%] truncate"
            title={props.item.window_title}
          >
            {props.item.window_title}
          </p>
        </div>
        <div class="py-1.5 flex justify-between">
          <p class="text-gray-400">Application</p>
          <p
            class="text-right max-w-[70%] truncate"
            title={props.item.window_exe}
          >
            {props.item.window_exe}
          </p>
        </div>
      </div>
    </div>
  );
};
