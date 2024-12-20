import type { Component } from "solid-js";
import { ClipboardIcon } from "../icons/clipboard";

interface EmptyStateProps {
  searchQuery?: string;
}

export const EmptyState: Component<EmptyStateProps> = (props) => {
  return (
    <div class="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
      <ClipboardIcon class="size-12 opacity-50" />
      {props.searchQuery ? (
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
