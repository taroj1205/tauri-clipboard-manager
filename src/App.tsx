import { createSignal, For, onCleanup, onMount } from "solid-js";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { writeImageBase64, writeText } from "tauri-plugin-clipboard-api";
import { invoke } from "@tauri-apps/api/core";
import type { ClipboardHistory } from "./types/clipboard";
import { SearchInput } from "./components/search-input";
import { ClipboardPreview } from "./components/clipboard-preview";
import { ContextMenu } from "./components/context-menu";
import { EmptyState } from "./components/empty-state";
import { getRelativeTime } from "./utils/time";
import { SkeletonItem } from "./components/skeleton-item";
import { ClipboardItem } from "./components/clipboard-item";

export const App = ({ db_path }: { db_path: string }) => {
  const [activeIndex, setActiveIndex] = createSignal(0);
  const [isInitialLoading, setIsInitialLoading] = createSignal(true);
  const [isLoadingMore, setIsLoadingMore] = createSignal(false);
  const [clipboardHistory, setClipboardHistory] = createSignal<
    ClipboardHistory[]
  >([]);
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
    getCurrentWindow().hide();
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
      })
        .then((items) => {
          setClipboardHistory(items);
          setIsInitialLoading(false);
        })
        .catch(() => {
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

  listen("clipboard_saved", async () => {
    console.log("clipboard saved");
    // Get the latest history in background
    const newHistory = await invoke<ClipboardHistory[]>("get_history", {
      db_path,
      offset: 0,
      limit: 20,
    });

    // Compare with current history
    const currentHistory = clipboardHistory().slice(0, 20);

    // Only update if there are differences
    if (JSON.stringify(newHistory) !== JSON.stringify(currentHistory)) {
      setClipboardHistory(newHistory);
    }
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
    const item = clipboardHistory()[activeIndex()];
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

  return (
    <main class="w-full text-gray-300 p-2 h-[calc(100svh-1rem)] max-h-[calc(100svh-1rem)]">
      <div class="flex flex-col h-full max-w-[800px] mx-auto">
        <SearchInput ref={inputRef} onInput={handleInput} />
        <div class="border-b border-gray-700" />
        <div class="grid grid-cols-[300px_auto_1fr] h-full">
          <div
            ref={scrollAreaRef}
            onScroll={handleScroll}
            class="h-full pb-2 overflow-y-auto invisible hover:visible max-h-[calc(100svh-4.5rem)] hover:overflow-y-auto select-none scroll-area"
          >
            <ul ref={listRef} class="visible w-full h-full">
              {isInitialLoading() ? (
                <For each={Array(10).fill(0)}>{() => <SkeletonItem />}</For>
              ) : clipboardHistory().length === 0 ? (
                <EmptyState searchQuery={inputRef?.value || ""} />
              ) : (
                <>
                  <For each={clipboardHistory()}>
                    {(item, index) => {
                      const currentDate = getRelativeTime(new Date(item.date));
                      const prevDate =
                        index() > 0
                          ? getRelativeTime(
                              new Date(clipboardHistory()[index() - 1].date)
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
                            <ClipboardItem
                              item={item}
                              isActive={index() === activeIndex()}
                              index={index()}
                              searchQuery={inputRef?.value || ""}
                              onDoubleClick={() => handleCopy(item)}
                              onClick={() => handleClick(index())}
                              onContextMenu={(e) => handleContextMenu(e, item)}
                            />
                          </li>
                        </>
                      );
                    }}
                  </For>
                  {isLoadingMore() && (
                    <For each={Array(5).fill(0)}>{() => <SkeletonItem />}</For>
                  )}
                </>
              )}
            </ul>
          </div>
          {clipboardHistory().length > 0 && (
            <div class="border-l border-gray-700 h-full" />
          )}
          <div
            class="w-full h-full flex flex-col gap-2 mt-2 px-4 overflow-hidden"
            onContextMenu={handleRightPanelContextMenu}
          >
            {isInitialLoading() ? (
              <div class="flex flex-col gap-4">
                <div class="sticky top-0 grid grid-cols-[1fr_1fr_auto] place-items-center">
                  <div class="animate-pulse bg-gray-700 h-4 w-32 rounded" />
                  <div class="animate-pulse bg-gray-700 h-4 w-24 rounded" />
                  <div class="animate-pulse bg-gray-700 h-6 w-6 rounded" />
                </div>
                <div class="animate-pulse bg-gray-700 h-[390px] w-full rounded" />
              </div>
            ) : clipboardHistory().length > 0 ? (
              <ClipboardPreview
                item={clipboardHistory()[activeIndex()]}
                searchQuery={inputRef?.value || ""}
                onCopy={() => handleCopy(clipboardHistory()[activeIndex()])}
              />
            ) : null}
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
