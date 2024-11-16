import { type Component, For } from "solid-js";
import type { ClipboardHistory } from "../types/clipboard";
import { getRelativeTime } from "../utils/time";
import { SkeletonItem } from "./skeleton-item";
import { EmptyState } from "./empty-state";
import { ClipboardItem } from "./clipboard-item";

interface ClipboardListProps {
  items: ClipboardHistory[];
  activeIndex: number;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  searchQuery: string;
  onScroll: () => void;
  onItemClick: (index: number) => void;
  onItemCopy: (item: ClipboardHistory) => void;
  onItemContextMenu: (e: MouseEvent, item: ClipboardHistory) => void;
  listRef: HTMLUListElement | undefined;
  scrollAreaRef: HTMLDivElement | undefined;
}

export const ClipboardList: Component<ClipboardListProps> = (props) => {
  return (
    <div
      ref={(el) => {
        props.scrollAreaRef = el;
      }}
      onScroll={props.onScroll}
      class="h-full pb-2 overflow-y-auto invisible hover:visible max-h-[calc(100svh-4.5rem)] hover:overflow-y-auto select-none scroll-area"
    >
      <ul
        ref={(el) => {
          props.listRef = el;
        }}
        class="visible w-full h-full"
      >
        {props.isInitialLoading ? (
          <For each={Array(10).fill(0)}>{() => <SkeletonItem />}</For>
        ) : props.items.length === 0 ? (
          <EmptyState searchQuery={props.searchQuery} />
        ) : (
          <>
            <For each={props.items}>
              {(item, index) => {
                const currentDate = getRelativeTime(new Date(item.date));
                const prevDate =
                  index() > 0
                    ? getRelativeTime(new Date(props.items[index() - 1].date))
                    : null;

                return (
                  <>
                    {(index() === 0 || currentDate !== prevDate) && (
                      <li class="text-gray-400 text-sm p-2">{currentDate}</li>
                    )}
                    <li class="w-full">
                      <ClipboardItem
                        item={item}
                        isActive={index() === props.activeIndex}
                        index={index()}
                        searchQuery={props.searchQuery}
                        onDoubleClick={() => props.onItemCopy(item)}
                        onClick={() => props.onItemClick(index())}
                        onContextMenu={(e) => props.onItemContextMenu(e, item)}
                      />
                    </li>
                  </>
                );
              }}
            </For>
            {props.isLoadingMore && (
              <For each={Array(5).fill(0)}>{() => <SkeletonItem />}</For>
            )}
          </>
        )}
      </ul>
    </div>
  );
};
