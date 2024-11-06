import { createSignal, For } from "solid-js";
import { type ClipboardHistory, getHistory } from "./utils/db";
import { listen } from "@tauri-apps/api/event";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { getRelativeTime } from "./utils/time";
import { DocumentIcon } from "./icons";
import { cn } from "./utils/tailwind";

export const App = () => {
  const [activeIndex, setActiveIndex] = createSignal(0);
  const [clipboardHistory, setClipboardHistory] = createSignal<
    Record<string, ClipboardHistory[]>
  >({});
  const [offset, setOffset] = createSignal(0);
  const limit = 20;
  let inputRef: HTMLInputElement | undefined;
  let listRef: HTMLUListElement | undefined;
  let scrollAreaRef: HTMLDivElement | undefined;

  const handleKeyDown = (event: KeyboardEvent) => {
    const totalLength = Object.values(clipboardHistory()).reduce(
      (acc, curr) => acc + curr.length,
      0
    );
    if (event.key === "ArrowDown" && totalLength > 0) {
      setActiveIndex((prev) => Math.min(prev + 1, totalLength - 1));
    } else if (event.key === "ArrowUp" && totalLength > 0) {
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const activeElement = listRef?.children[activeIndex()];
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      const totalLength = Object.values(clipboardHistory()).reduce(
        (acc, curr) => acc + curr.length,
        0
      );
      if (activeIndex() >= totalLength - 5) {
        setOffset((prev) => prev + limit);
        updateHistory(offset(), limit);
      }
    }
  };

  const handleScroll = () => {
    if (scrollAreaRef) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef;
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        setOffset((prev) => prev + limit);
        updateHistory(offset(), limit);
      }
    }
  };

  const updateHistory = (offset = 0, limit = 20) => {
    console.log("Updating history");
    getHistory(offset, limit).then((history) => {
      const newHistory = history.reduce((acc, item) => {
        const relativeTime = getRelativeTime(new Date(item.date));
        if (!acc[relativeTime]) {
          acc[relativeTime] = [];
        }
        acc[relativeTime].push(item);
        return acc;
      }, {} as Record<string, ClipboardHistory[]>);
      setClipboardHistory((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(newHistory).map(([key, value]) => [
            key,
            [...(prev[key] || []), ...value],
          ])
        ),
      }));
    });
  };

  const handleCopy = async (content: string) => {
    await writeText(content);
    updateHistory();
  };

  updateHistory();

  listen("clipboard_updated", () => {
    updateHistory();
  });

  return (
    <main class="w-full h-screen text-gray-300">
      <div class="flex flex-col h-screen p-2">
        <input
          ref={inputRef}
          onkeydown={handleKeyDown}
          type="text"
          class="p-2 mb-2 w-full bg-transparent outline-none text-white"
          placeholder="Type here..."
        />
        <div class="border-b border-gray-700 " />
        <div class="grid grid-cols-[1fr_auto_2fr] gap-4 h-full">
          <div
            ref={scrollAreaRef}
            onScroll={handleScroll}
            class="h-full pb-2 overflow-y-auto invisible hover:visible max-h-[calc(100vh-4rem)] hover:overflow-y-scroll select-none"
          >
            <ul ref={listRef} class="visible">
              <For each={Object.values(clipboardHistory()).flat()}>
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
          <div class="border-l border-gray-700" />
          <div class="w-full h-full mt-2 pr-2 overflow-hidden">
            {Object.values(clipboardHistory()).flat().length === 0 ? (
              <p class="text-lg whitespace-pre overflow-auto">
                No content available
              </p>
            ) : (
              <>
                <div class="sticky top-0 py-2 grid grid-cols-[1fr_1fr_auto] bg-primary">
                  <time class="text-gray-400">
                    {getRelativeTime(
                      new Date(
                        Object.values(clipboardHistory()).flat()[
                          activeIndex()
                        ].date
                      )
                    )}
                  </time>
                  <p class="text-gray-400">
                    {Object.values(clipboardHistory()).flat()[activeIndex()]
                      .windowTitle || "Unknown"}{" "}
                    (
                    {
                      Object.values(clipboardHistory()).flat()[activeIndex()]
                        .count
                    }
                    )
                  </p>
                  <button
                    type="button"
                    class="text-gray-400"
                    onClick={() => {
                      handleCopy(
                        Object.values(clipboardHistory()).flat()[activeIndex()]
                          .content
                      );
                    }}
                  >
                    <DocumentIcon />
                  </button>
                </div>
                <div class="overflow-auto h-full invisible hover:visible max-h-[calc(100vh-7rem)] max-w-full">
                  <p class="text-lg whitespace-pre visible">
                    {
                      Object.values(clipboardHistory()).flat()[activeIndex()]
                        .content
                    }
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
