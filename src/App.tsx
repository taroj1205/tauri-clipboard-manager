import { createSignal, For, onMount } from "solid-js";
import { type ClipboardHistory, getHistory } from "./utils/db";
import { listen } from "@tauri-apps/api/event";
import { getRelativeTime } from "./utils/time";
import { DocumentIcon, CopyIcon } from "./icons";
import { cn } from "./utils/tailwind";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { writeImageBase64, writeText } from "tauri-plugin-clipboard-api";
import { ImageIcon } from "./icons/image";

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
    } else if (event.key === "Enter") {
      const item =
        clipboardHistory()[Object.keys(clipboardHistory())[0]][activeIndex()];
      handleCopy(item);
      getCurrentWindow().hide();
    } else if (event.key === "Escape") {
      if (inputRef && inputRef.value.length > 0) {
        inputRef.value = "";
        updateHistory();
      } else {
        getCurrentWindow().hide();
      }
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
    getHistory({ offset, limit }).then((history) => {
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

  const handleCopy = async (item: ClipboardHistory) => {
    if (item.type === "image") {
      await writeImageBase64(item.image);
    } else {
      await writeText(item.content);
    }
    updateHistory();
    setActiveIndex(0);
    const activeElement = listRef?.children[0];
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const handleInput = () => {
    getHistory({ filter: { content: inputRef?.value } }).then((items) => {
      const newHistory = items.reduce((acc, item) => {
        const relativeTime = getRelativeTime(new Date(item.date));
        if (!acc[relativeTime]) {
          acc[relativeTime] = [];
        }
        acc[relativeTime].push(item);
        return acc;
      }, {} as Record<string, ClipboardHistory[]>);
      setClipboardHistory(newHistory);
    });
  };

  const refreshHistory = () => {
    setOffset(0);
    setClipboardHistory({});
    getHistory().then((history) => {
      const newHistory = history.reduce((acc, item) => {
        const relativeTime = getRelativeTime(new Date(item.date));
        if (!acc[relativeTime]) {
          acc[relativeTime] = [];
        }
        acc[relativeTime].push(item);
        return acc;
      }, {} as Record<string, ClipboardHistory[]>);
      setClipboardHistory(newHistory);
    });
  };

  updateHistory();

  listen("clipboard_saved", () => {
    refreshHistory();
  });

  listen("app_window_shown", () => {
    inputRef?.focus();
  });

  const handleClick = (index: number) => {
    setActiveIndex(index);
  };

  onMount(() => {
    inputRef?.focus();
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  return (
    <main class="w-full text-gray-300 p-2 max-h-[calc(100svh-1rem)] ">
      <div class="flex flex-col">
        <input
          ref={inputRef}
          onInput={handleInput}
          type="text"
          class="p-2 mb-2 w-full bg-transparent outline-none text-white"
          placeholder="Type here..."
        />
        <div class="border-b border-gray-700 " />
        <div class="grid grid-cols-[1fr_auto_2fr] h-full">
          <div
            ref={scrollAreaRef}
            onScroll={handleScroll}
            class="h-full pb-2 overflow-y-auto invisible hover:visible max-h-[calc(100svh-4.5rem)] hover:overflow-y-scroll select-none scroll-area"
          >
            <ul ref={listRef} class="visible w-full">
              <For each={Object.entries(clipboardHistory())}>
                {([time, items]) => (
                  <>
                    <li class="text-gray-400 text-sm p-2">{time}</li>
                    <For each={items}>
                      {(item, index) => (
                        <li class="w-full">
                          <button
                            type="button"
                            onDblClick={() => handleCopy(item)}
                            onClick={() => handleClick(index())}
                            class={cn(
                              "cursor-pointer w-full grid grid-cols-[auto_1fr] gap-2 p-2 h-10 rounded truncate overflow-hidden place-items-center",
                              {
                                "bg-active": index() === activeIndex(),
                              }
                            )}
                          >
                            {item.type === "image" ? (
                              <>
                                <ImageIcon class="size-4" />
                                <img
                                  src={`data:image/png;base64,${item.image}`}
                                  alt="clipboard content"
                                  class="h-full w-full object-cover overflow-hidden"
                                />
                              </>
                            ) : (
                              <>
                                <DocumentIcon class="size-4" />
                                <p class="w-full overflow-hidden text-left text-ellipsis">
                                  {item.content.trim().split("\n")[0]}
                                </p>
                              </>
                            )}
                          </button>
                        </li>
                      )}
                    </For>
                  </>
                )}
              </For>
            </ul>
          </div>
          <div class="border-l border-gray-700" />
          <div class="w-full h-full mt-2 px-4  overflow-hidden">
            {Object.values(clipboardHistory()).flat().length === 0 ? (
              <p class="text-lg whitespace-pre overflow-auto">
                No content available
              </p>
            ) : (
              <>
                <div class="sticky top-0  grid grid-cols-[1fr_1fr_auto] bg-primary place-items-center">
                  <time class="text-gray-400 text-sm text-left w-full">
                    {new Intl.DateTimeFormat("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }).format(
                      new Date(
                        Object.values(clipboardHistory()).flat()[
                          activeIndex()
                        ].date
                      )
                    )}
                  </time>
                  <p class="text-gray-400">
                    {/* {Object.values(clipboardHistory()).flat()[activeIndex()]
                      .windowTitle || "Unknown"}{" "}
                    (
                    {Object.values(clipboardHistory()).flat()[activeIndex()]
                      .type === "text"
                      ? Object.values(clipboardHistory()).flat()[activeIndex()]
                          .count
                      : null}
                    ) */}
                  </p>
                  <button
                    type="button"
                    class="text-gray-400"
                    onClick={() => {
                      handleCopy(
                        Object.values(clipboardHistory()).flat()[activeIndex()]
                      );
                    }}
                  >
                    <CopyIcon />
                  </button>
                </div>
                {Object.values(clipboardHistory()).flat()[activeIndex()]
                  .type === "image" ? (
                  <div class="max-h-[400px] overflow-auto scroll-area">
                    <img
                      src={`data:image/png;base64,${
                        Object.values(clipboardHistory()).flat()[activeIndex()]
                          .image
                      }`}
                      alt="clipboard content"
                      class="w-full object-contain"
                    />
                  </div>
                ) : (
                  <textarea
                    class="h-full scroll-area w-full max-h-[400px] resize-none bg-primary outline-none"
                    value={
                      Object.values(clipboardHistory()).flat()[activeIndex()]
                        .content
                    }
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
