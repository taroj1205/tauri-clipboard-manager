import { type Component, createEffect, createSignal, For } from "solid-js";
import { cn } from "../utils/tailwind";
import { DocumentIcon } from "../icons";
import type { ClipboardHistory } from "../utils/db";
export interface ClipboardListProps {
  handleScroll: (event: Event) => void;
  clipboardHistory: Record<string, ClipboardHistory[]>;
  activeIndex: () => number;
  handleCopy: (content: string) => void;
  scrollAreaRef: HTMLDivElement | undefined;
  listRef: HTMLUListElement | undefined;
}

export const ClipboardList: Component<ClipboardListProps> = ({
  handleScroll,
  clipboardHistory,
  activeIndex,
  handleCopy,
  scrollAreaRef,
  listRef,
}) => {
  const [history, setHistory] = createSignal<ClipboardHistory[]>(
    Object.values(clipboardHistory).flat()
  );

  createEffect(() => {
    setHistory(Object.values(clipboardHistory).flat());
  });

  return (
    <div
      ref={scrollAreaRef}
      onScroll={handleScroll}
      class="h-full pb-2 overflow-y-auto invisible hover:visible max-h-[calc(100vh-4rem)] hover:overflow-y-scroll select-none"
    >
      <ul ref={listRef} class="visible">
        <For each={history()}>
          {(item, index) => (
            <li
              class={cn(
                "cursor-pointer grid grid-cols-[auto_1fr] gap-2 p-2 h-10 rounded truncate overflow-hidden place-items-center",
                {
                  "bg-active": index() === activeIndex(),
                }
              )}
              onMouseUp={() => {
                handleCopy(item.content);
              }}
            >
              <DocumentIcon />
              <p class="w-full">{item.content.trim().split("\n")[0]}</p>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
};
