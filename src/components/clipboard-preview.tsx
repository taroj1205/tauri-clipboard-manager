import type { Component } from "solid-js";
import type { ClipboardHistory } from "../types/clipboard";
import { CopyIcon } from "../icons";
import { highlightText } from "../utils/highlight";
import { getRelativeTime } from "../utils/time";

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

  const calculateImageSize = (base64String: string): string => {
    const padding = base64String.endsWith("==")
      ? 2
      : base64String.endsWith("=")
      ? 1
      : 0;
    const sizeInBytes = base64String.length * 0.75 - padding;

    const units = ["B", "kB", "MB", "GB"];
    let size = sizeInBytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex > 0 ? 1 : 0)}${units[unitIndex]}`;
  };

  return (
    <div class="grid grid-rows-[auto_1fr_auto] grid-cols-1 mt-2 px-4 w-full h-full max-h-[calc(100svh-5rem)] gap-2 justify-between">
      <div class="sticky top-0 grid grid-cols-[1fr_auto] place-items-center">
        {props.item?.last_copied_date && (
          <time class="text-gray-400 text-sm text-left w-full">
            {getRelativeTime(new Date(props.item.last_copied_date))} (
            {formatDate(props.item.last_copied_date)})
          </time>
        )}
        <p class="text-gray-400 text-sm text-right w-full">
          {props.item?.type?.charAt(0).toUpperCase() +
            props.item?.type?.slice(1)}
        </p>
      </div>

      {props?.item?.type === "image" ? (
        <div class="relative h-fit">
          <div class="overflow-auto max-h-[350px] scroll-area h-full">
            <img
              src={`data:image/png;base64,${props.item.image}`}
              alt="clipboard content"
              class="w-full object-contain rounded"
            />
          </div>
          <div class="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {calculateImageSize(props.item.image)}
          </div>
        </div>
      ) : props?.item?.type === "html" ? (
        <div class="h-full scroll-area w-full max-h-[350px] overflow-auto">
          <div class="w-fit" innerHTML={props.item?.html} />
        </div>
      ) : props?.item?.type === "files" ? (
        <div class="h-full scroll-area w-full max-h-[350px] overflow-auto">
          <ul class="list-disc list-inside space-y-1">
            {props.item?.content.split(",").map((file) => (
              <li class="truncate group relative" title={file}>
                {highlightText(file, props.searchQuery)}
              </li>
            ))}
          </ul>
        </div>
      ) : props?.item?.type === "color" ? (
        <div class="h-full scroll-area w-full max-h-[350px] overflow-auto place-items-center grid">
          <div class="relative w-40 h-40 group">
            <div
              style={{ background: props.item?.content }}
              class="w-full h-full rounded-full border-4 border-gray-700"
            />
            <button
              onClick={props.onCopy}
              class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <CopyIcon class="text-white" />
            </button>
          </div>
          <p>{props.item?.content}</p>
        </div>
      ) : (
        <div class="h-full scroll-area w-full max-h-[350px] overflow-auto whitespace-pre-wrap">
          {highlightText(props.item?.content, props.searchQuery)}
        </div>
      )}

      <div class="text-sm text-gray-300 flex flex-col divide-y divide-gray-700">
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
        {props.item.first_copied_date !== props.item.last_copied_date && (
          <div class="py-1.5 flex justify-between">
            <p class="text-gray-400">Last Copied</p>
            <p>{formatDate(props.item.last_copied_date)}</p>
          </div>
        )}
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
