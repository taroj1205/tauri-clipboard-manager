import { createSignal, For, onCleanup, onMount } from "solid-js";
import { emit, listen } from "@tauri-apps/api/event";
import { getRelativeTime } from "./utils/time";
import { DocumentIcon, CopyIcon } from "./icons";
import { cn } from "./utils/tailwind";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { writeImageBase64, writeText } from "tauri-plugin-clipboard-api";
import { ImageIcon } from "./icons/image";
import { invoke } from "@tauri-apps/api/core";
import { ContextMenu } from "./components/context-menu";
import { ClipboardIcon } from "./icons/clipboard";

type ClipboardHistory = {
  id: number;
  content: string;
  date: string;
  window_title: string;
  window_exe: string;
  type: string;
  count: number;
  image: string;
};

const Highlight = ({ key, children }: { key: number; children: string }) => {
  return (
    <span data-key={key} class="bg-yellow-500/30 text-white">
      {children}
    </span>
  );
};

const highlightText = (text: string, searchText: string) => {
  if (!searchText) return text;
  const parts = text.split(new RegExp(`(${searchText})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === searchText.toLowerCase() ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
      <Highlight key={i}>{part}</Highlight>
    ) : (
      part
    )
  );
};

export const App = ({ db_path }: { db_path: string }) => {
  const [activeIndex, setActiveIndex] = createSignal(0);
  const [isInitialLoading, setIsInitialLoading] = createSignal(true);
  const [isLoadingMore, setIsLoadingMore] = createSignal(false);
  const [clipboardHistory, setClipboardHistory] = createSignal<ClipboardHistory[]>(
    []
  );
  const [offset, setOffset] = createSignal(0);
  const limit = 20;
  let inputRef: HTMLInputElement | undefined;
  let listRef: HTMLUListElement | undefined;
  let scrollAreaRef: HTMLDivElement | undefined;

  const [contextMenu, setContextMenu] = createSignal<{
    show: boolean;
    x: number;
    y: number;
    item: ClipboardHistory | null;
  }>({
    show: false,
    x: 0,
    y: 0,
    item: null,
  });

  const [searchTimeout, setSearchTimeout] = createSignal<number>();

  const handleContextMenu = (e: MouseEvent, item: ClipboardHistory) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      item,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({
      show: false,
      x: 0,
      y: 0,
      item: null,
    });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const list = listRef?.children;
    const totalLength = list?.length ?? 0;
    if (event.key === "ArrowDown") {
      setActiveIndex((prev) => Math.min(prev + 1, totalLength - 1));
      if (activeIndex() >= totalLength - 5) {
        setOffset((prev) => prev + limit);
        updateHistory(offset(), limit);
      }
    } else if (event.key === "ArrowUp") {
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter") {
      const item = clipboardHistory()[activeIndex()];
      handleCopy(item);
      getCurrentWindow().hide();
    } else if (event.key === "Escape") {
      if (inputRef && inputRef.value.length > 0) {
        inputRef.value = "";
        updateHistory();
      } else if (activeIndex() > 0) {
        setActiveIndex(0);
        list?.[0]?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        getCurrentWindow().hide();
      }
    } else {
      inputRef?.focus();
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      list?.[activeIndex()]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const handleScroll = () => {
    if (scrollAreaRef) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef;
      if (scrollTop + clientHeight >= scrollHeight) {
        setOffset((prev) => prev + limit);
        updateHistory(offset(), limit);
      }
    }
  };

  const updateHistory = (offset = 0, limit = 20) => {
    if (offset === 0) {
      setIsInitialLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    invoke<ClipboardHistory[]>("get_history", {
      db_path,
      offset,
      limit,
      filter: { content: inputRef?.value },
    }).then((history) => {
      if (offset === 0) {
        setClipboardHistory(history);
        setIsInitialLoading(false);
      } else {
        setClipboardHistory((prev) => [...prev, ...history]);
        setIsLoadingMore(false);
      }
    });
  };

  const handleCopy = async (item: ClipboardHistory) => {
    emit("copy-from-app");
    if (item.type === "image") {
      writeImageBase64(item.image);
    } else {
      writeText(item.content);
    }
  };

  const handleDelete = async (item: ClipboardHistory) => {
    await invoke<void>("delete_clipboard_from_db", { db_path, id: item.id });
    refreshHistory();
  };

  const handleInput = () => {
    setActiveIndex(0);
    setIsInitialLoading(true);
    if (searchTimeout()) window.clearTimeout(searchTimeout());
    const timeoutId = window.setTimeout(() => {
      invoke<ClipboardHistory[]>("get_history", {
        db_path,
        filter: { content: inputRef?.value },
      }).then((items) => {
        setClipboardHistory(items);
        setIsInitialLoading(false);
      });
    }, 300);
    setSearchTimeout(timeoutId);
  };

  const refreshHistory = () => {
    setOffset(0);
    setIsInitialLoading(true);
    invoke<ClipboardHistory[]>("get_history", {
      db_path,
    }).then((history) => {
      setClipboardHistory(history);
      setIsInitialLoading(false);
    });
  };

  updateHistory();

  listen("clipboard_saved", () => {
    console.log("clipboard saved");
    refreshHistory();
  });

  const focusInput = () => {
    if (inputRef) {
      inputRef.focus();
    }
  };

  const blurInput = () => {
    if (inputRef) {
      inputRef.blur();
    }
  };

  listen("tauri://focus", () => {
    focusInput();
  });

  listen("tauri://blur", () => {
    console.log("blur");
    blurInput();
  });

  const handleClick = (index: number) => {
    setActiveIndex(index);
  };

  const handleRightPanelContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    const item = Object.values(clipboardHistory()).flat()[activeIndex()];
    if (item) {
      setContextMenu({
        show: true,
        x: e.clientX,
        y: e.clientY,
        item,
      });
    }
  };

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", closeContextMenu);
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("click", closeContextMenu);
  });

  const SkeletonItem = () => {
    return (
      <li class="animate-pulse flex items-start gap-3 rounded-lg p-3">
        <div class="w-6 h-6 bg-gray-700 rounded" />
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-700 rounded w-3/4" />
          <div class="h-3 bg-gray-700 rounded w-1/4" />
        </div>
      </li>
    );
  };

  const EmptyState = ({ searchQuery }: { searchQuery?: string }) => {
    return (
      <div class="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
        <ClipboardIcon class="size-12 opacity-50" />
        {searchQuery ? (
          <>
            <p class="text-lg font-medium">No results found</p>
            <p class="text-sm opacity-75">Try a different search term</p>
          </>
        ) : (
          <>
            <p class="text-lg font-medium">No clipboard history</p>
            <p class="text-sm opacity-75">Copy something to get started</p>
          </>
        )}
      </div>
    );
  };

  return (
    <main class="w-full text-gray-300 p-2 h-[calc(100svh-1rem)] max-h-[calc(100svh-1rem)]">
      <div class="flex flex-col h-full max-w-[800px] mx-auto">
        <input
          ref={inputRef}
          onInput={handleInput}
          type="text"
          class="p-2 mb-2 w-full bg-transparent outline-none text-white"
          placeholder="Type here..."
        />
        <div class="border-b border-gray-700" />
        <div class="grid grid-cols-[300px_auto_1fr] h-full">
          <div
            ref={scrollAreaRef}
            onScroll={handleScroll}
            class="h-full pb-2 overflow-y-auto invisible hover:visible max-h-[calc(100svh-4.5rem)] hover:overflow-y-auto select-none scroll-area"
          >
            <ul ref={listRef} class="visible w-full h-full">
              {isInitialLoading() ? (
                <For each={Array(10).fill(0)}>
                  {() => <SkeletonItem />}
                </For>
              ) : clipboardHistory().length === 0 ? (
                <EmptyState searchQuery={inputRef?.value} />
              ) : (
                <>
                  <For each={clipboardHistory()}>
                    {(item, index) => {
                      const currentDate = getRelativeTime(
                        new Date(item.date)
                      );
                      const prevDate =
                        index() > 0
                          ? getRelativeTime(
                              new Date(
                                clipboardHistory()[index() - 1].date
                              )
                            )
                          : null;

                      return (
                        <>
                          {(index() === 0 || currentDate !== prevDate) && (
                            <li class="text-gray-400 text-sm p-2">
                              {currentDate}
                            </li>
                          )}
                          <li class="w-full">
                            <button
                              type="button"
                              onDblClick={() => handleCopy(item)}
                              onClick={() => handleClick(index())}
                              onContextMenu={(e) => handleContextMenu(e, item)}
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
                                    {highlightText(
                                      item.content.trim().split("\n")[0],
                                      inputRef?.value || ""
                                    )}
                                  </p>
                                </>
                              )}
                            </button>
                          </li>
                        </>
                      );
                    }}
                  </For>
                  {isLoadingMore() && (
                    <For each={Array(5).fill(0)}>
                      {() => <SkeletonItem />}
                    </For>
                  )}
                </>
              )}
            </ul>
          </div>
          {clipboardHistory().length > 0 && (
            <div class="border-l border-gray-700 h-full" />
          )}
          <div
            class="w-full h-[calc(100%-4.5rem)] flex flex-col gap-2 mt-2 px-4 overflow-hidden"
            onContextMenu={handleRightPanelContextMenu}
          >
            {isInitialLoading() ? (
              <div class="flex flex-col gap-4">
                <div class="sticky top-0 grid grid-cols-[1fr_1fr_auto] bg-primary place-items-center">
                  <div class="animate-pulse bg-gray-700 h-4 w-32 rounded" />
                  <div class="animate-pulse bg-gray-700 h-4 w-24 rounded" />
                  <div class="animate-pulse bg-gray-700 h-6 w-6 rounded" />
                </div>
                <div class="animate-pulse bg-gray-700 h-[390px] w-full rounded" />
              </div>
            ) : clipboardHistory().length > 0 ? (
              <>
                <div class="sticky top-0 grid grid-cols-[1fr_1fr_auto] bg-primary place-items-center">
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
                        Object.values(clipboardHistory()).flat()[activeIndex()]
                          ?.date || Date.now()
                      )
                    )}
                  </time>
                  <p class="text-gray-400">
                    {/* {Object.values(clipboardHistory()).flat()[activeIndex()]
                      ?.windowTitle || "Unknown"}{" "}
                    (
                    {Object.values(clipboardHistory()).flat()[activeIndex()]
                      ?.type === "text"
                      ? Object.values(clipboardHistory()).flat()[activeIndex()]
                          ?.count
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
                  ?.type === "image" ? (
                  <div class="max-h-[390px] overflow-auto scroll-area">
                    <img
                      src={`data:image/png;base64,${
                        Object.values(clipboardHistory()).flat()[activeIndex()]
                          ?.image
                      }`}
                      alt="clipboard content"
                      class="w-full object-contain rounded mt-2"
                    />
                  </div>
                ) : (
                  <div class="h-full scroll-area w-full max-h-[390px] overflow-auto whitespace-pre-wrap bg-primary p-2">
                    {highlightText(
                      Object.values(clipboardHistory()).flat()[activeIndex()]
                        ?.content || "",
                      inputRef?.value || ""
                    )}
                  </div>
                )}
              </> 
            ) : (
              null
            )}
          </div>
        </div>
      </div>
      <ContextMenu
        show={contextMenu().show}
        x={contextMenu().x}
        y={contextMenu().y}
        onDelete={() => {
          const item = contextMenu().item;
          if (item) handleDelete(item);
        }}
        onCopy={() => {
          const item = contextMenu().item;
          if (item) handleCopy(item);
        }}
        onClose={closeContextMenu}
      />
    </main>
  );
};
