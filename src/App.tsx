import { createSignal, For, onCleanup, onMount } from "solid-js";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  writeFiles,
  writeImageBase64,
  writeText,
} from "tauri-plugin-clipboard-api";
import { invoke } from "@tauri-apps/api/core";
import type { ClipboardHistory } from "./types/clipboard";
import { ClipboardType, SearchInput, SortType } from "./components/search-input";
import { ClipboardPreview } from "./components/clipboard-preview";
import { EmptyState } from "./components/empty-state";
import { getRelativeTime } from "./utils/time";
import { SkeletonItem } from "./components/skeleton-item";
import { ClipboardItem } from "./components/clipboard-item";

export const App = ({ db_path }: { db_path: string }) => {
  const [activeIndex, setActiveIndex] = createSignal(0);
  const [isLoadingMore, setIsLoadingMore] = createSignal(false);
  const [clipboardHistory, setClipboardHistory] = createSignal<ClipboardHistory[]>(
    []
  );
  const [offset, setOffset] = createSignal(0);
  const limit = 20;
  const [isLastItem, setIsLastItem] = createSignal(false);
  let inputRef: HTMLInputElement | undefined;
  let listRef: HTMLUListElement | undefined;
  let scrollAreaRef: HTMLDivElement | undefined;

  const [selectedTypes, setSelectedTypes] = createSignal<ClipboardType[]>([]);
  const [selectedSort, setSelectedSort] = createSignal<SortType>("recent");

  const handleKeyDown = (event: KeyboardEvent) => {
    try {
      const list = listRef?.children;
      const totalLength = clipboardHistory().length;
      if (event.key === "ArrowDown") {
        if (totalLength - 1 < 20 && activeIndex() === totalLength - 1) {
          return;
        }
        event.preventDefault();
        setActiveIndex((prev) => {
          const newIndex = Math.min(prev + 1, totalLength - 1);
          // Scroll after state update to ensure correct positioning
          setTimeout(() => {
            list?.[newIndex]?.scrollIntoView({
              behavior: "auto",
              block: "center",
            });
          }, 0);
          return newIndex;
        });
        // Only load more if we have at least 20 items in the current history and haven't reached the last item
        if (activeIndex() >= totalLength - 5 && !isLastItem()) {
          setOffset((prev) => prev + limit);
          updateHistory(offset());
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => {
          const newIndex = Math.max(prev - 1, 0);
          // Scroll after state update to ensure correct positioning
          setTimeout(() => {
            list?.[newIndex]?.scrollIntoView({
              behavior: "auto",
              block: "center",
            });
          }, 0);
          return newIndex;
        });
      } else if (
        event.key === "Enter" ||
        event.key === "NumpadEnter" ||
        (event.ctrlKey &&
          event.key === "c" &&
          !window.getSelection()?.toString())
      ) {
        const item = clipboardHistory()[activeIndex()];
        handleCopy(item);
        getCurrentWindow().hide();
      } else if (event.key === "Escape") {
        event.preventDefault();
        console.log(selectedTypes());
        if (activeIndex() > 0) {
          setActiveIndex(0);
          list?.[activeIndex()]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (inputRef && inputRef.value.length > 0) {
          inputRef.value = "";
          updateHistory();
        } else if (selectedTypes().length > 0) {
          setSelectedTypes([]);
          updateHistory();
        } else if (activeIndex() > 0) {
          setActiveIndex(0);
          list?.[0]?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          getCurrentWindow().hide();
        }
      } else if (!event.ctrlKey) {
        inputRef?.focus();
        setActiveIndex(0);
        list?.[activeIndex()]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleScroll = () => {
    if (scrollAreaRef) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef;
      if (scrollTop + clientHeight >= scrollHeight && !isLastItem()) {
        setOffset((prev) => prev + limit);
        updateHistory(offset());
      }
    }
  };

  const updateHistory = (offset = 0) => {
    if (offset !== 0) {
      setIsLoadingMore(true);
    }
    invoke<ClipboardHistory[]>("get_history", {
      db_path,
      offset,
      limit,
      filter: {
        content: inputRef?.value,
        types: selectedTypes(),
      },
      sort: {
        column: selectedSort() === "recent" ? "last_copied_date" : "count",
        order: "DESC",
      },
    }).then((history) => {
      if (history.length < limit) {
        setIsLastItem(true);
      } else {
        setIsLastItem(false);
      }
      if (offset === 0) {
        setClipboardHistory(history);
      } else {
        setClipboardHistory((prev) => [...prev, ...history]);
        setIsLoadingMore(false);
      }
    });
  };

  const handleCopy = async (item: ClipboardHistory) => {
    if (item.type === "image") {
      writeImageBase64(item.image);
    } else if (item.type === "files") {
      writeFiles(item.content.split(","));
    } else {
      writeText(item.content);
    }
    getCurrentWindow().hide();
  };

  const handleInput = () => {
    setActiveIndex(0);
    updateHistory();
  };

  updateHistory();

  listen("clipboard_saved", async () => {
    try {
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
    } catch (error) {
      console.error(error);
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
    setActiveIndex(0);
    blurInput();
  });

  const handleClick = (index: number) => {
    setActiveIndex(index);
  };

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <main
      class="w-full text-gray-300 p-2 h-[calc(100svh-1rem)] max-h-[calc(100svh-1rem)] overflow-clip"
      oncontextmenu={(e) => e.preventDefault()}
    >
      <div class="flex flex-col h-full max-w-[800px] mx-auto">
        <SearchInput
          ref={inputRef}
          onInput={handleInput}
          updateHistory={updateHistory}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
          selectedSort={selectedSort}
          setSelectedSort={setSelectedSort}
        />
        <div class="border-b border-gray-700" />
        {clipboardHistory().length === 0 ? (
          <EmptyState searchQuery={inputRef?.value || ""} />
        ) : (
          <div class="grid grid-cols-[300px_auto_1fr] h-full">
            <div
              ref={scrollAreaRef}
              onScroll={handleScroll}
              class="h-full pb-2 overflow-y-auto invisible hover:visible max-h-[calc(100svh-4.5rem)] hover:overflow-y-auto select-none scroll-area"
            >
              <ul ref={listRef} class="visible w-full h-full">
                <For each={clipboardHistory()}>
                  {(item, index) => {
                    const currentDate = getRelativeTime(
                      new Date(item.last_copied_date)
                    );
                    const prevDate =
                      index() > 0
                        ? getRelativeTime(
                            new Date(
                              clipboardHistory()[index() - 1].last_copied_date
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
                          <ClipboardItem
                            item={item}
                            isActive={index() === activeIndex()}
                            index={index()}
                            searchQuery={inputRef?.value || ""}
                            onDoubleClick={() => handleCopy(item)}
                            onClick={() => handleClick(index())}
                          />
                        </li>
                      </>
                    );
                  }}
                </For>
                {isLoadingMore() && (
                  <For each={Array(5).fill(0)}>{() => <SkeletonItem />}</For>
                )}
              </ul>
            </div>
            {clipboardHistory().length > 0 && (
              <div class="border-l border-gray-700 h-full" />
            )}
            {clipboardHistory().length > 0 ? (
              <ClipboardPreview
                item={clipboardHistory()[activeIndex()]}
                searchQuery={inputRef?.value || ""}
                onCopy={() => handleCopy(clipboardHistory()[activeIndex()])}
              />
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
};
