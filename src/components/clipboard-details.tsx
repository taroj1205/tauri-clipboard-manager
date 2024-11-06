import { getRelativeTime } from "../utils/time";
import { DocumentIcon } from "../icons";
import { createEffect, createSignal, type Component } from "solid-js";
import type { ClipboardHistory } from "../utils/db";

export interface ClipboardDetailsProps {
  clipboardHistory: Record<string, ClipboardHistory[]>;
  activeIndex: () => number;
  handleCopy: (content: string) => void;
}

export const ClipboardDetails: Component<ClipboardDetailsProps> = ({
  clipboardHistory,
  activeIndex,
  handleCopy,
}) => {
  const [history, setHistory] = createSignal<ClipboardHistory[]>(
    Object.values(clipboardHistory).flat()
  );

  const [activeHistory, setActiveHistory] = createSignal<ClipboardHistory>(
    history().length > 0 ? history()[activeIndex()] : ({} as ClipboardHistory)
  );

  createEffect(() => {
    setHistory(Object.values(clipboardHistory).flat());
    setActiveHistory(history()[activeIndex()]);
  });

  if (history().length === 0) {
    return (
      <p class="text-lg whitespace-pre overflow-auto">No content available</p>
    );
  }

  return (
    <div class="w-full h-full mt-2 pr-2 overflow-hidden">
      <div class="sticky top-0 py-2 grid grid-cols-[1fr_1fr_auto] bg-primary">
        <time class="text-gray-400">
          {getRelativeTime(new Date(activeHistory().date))}
        </time>
        <p class="text-gray-400">
          {activeHistory().windowTitle || "Unknown"} ({activeHistory().count})
        </p>
        <button
          type="button"
          class="text-gray-400"
          onClick={() => {
            handleCopy(activeHistory().content);
          }}
        >
          <DocumentIcon />
        </button>
      </div>
      <div class="overflow-auto h-full invisible hover:visible max-h-[calc(100vh-7rem)] max-w-full">
        <p class="text-lg whitespace-pre visible">{activeHistory().content}</p>
      </div>
    </div>
  );
};
