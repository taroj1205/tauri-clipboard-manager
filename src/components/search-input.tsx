import { type Component, createSignal, For, onCleanup } from "solid-js";

interface SearchInputProps {
  onInput: () => void;
  ref: HTMLInputElement | undefined;
  updateHistory: (offset?: number) => void;
  selectedTypes: () => ClipboardType[];
  setSelectedTypes: (types: ClipboardType[]) => void;
  selectedSort: () => SortType;
  setSelectedSort: (sort: SortType) => void;
}

export type ClipboardType = "text" | "image" | "color" | "files";
export type SortType = "recent" | "copied";

export const SearchInput: Component<SearchInputProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [isSortOpen, setIsSortOpen] = createSignal(false);
  const [isHovering, setIsHovering] = createSignal(false);
  const [isSortHovering, setIsSortHovering] = createSignal(false);
  let closeTimeout: number | undefined;
  let sortCloseTimeout: number | undefined;

  const types: { value: ClipboardType; label: string }[] = [
    { value: "text", label: "Text" },
    { value: "image", label: "Image" },
    { value: "color", label: "Color" },
    { value: "files", label: "Files" },
  ];

  const sorts: { value: SortType; label: string }[] = [
    { value: "recent", label: "Most Recent" },
    { value: "copied", label: "Most Copied" },
  ];

  const toggleSort = () => {
    setIsSortOpen((prev) => !prev);
    setIsOpen(false);
  };

  const toggleType = () => {
    setIsOpen((prev) => !prev);
    setIsSortOpen(false);
  };

  const selectType = (type: ClipboardType) => {
    const current = props.selectedTypes();
    const newTypes = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    props.setSelectedTypes(newTypes);
    props.updateHistory();
  };

  const selectSort = (sort: SortType) => {
    props.setSelectedSort(sort);
    props.updateHistory();
    setIsSortOpen(false);
  };

  const startCloseTimer = () => {
    clearTimeout(closeTimeout);
    closeTimeout = window.setTimeout(() => {
      if (!isHovering()) {
        setIsOpen(false);
      }
    }, 500);
  };

  const startSortCloseTimer = () => {
    clearTimeout(sortCloseTimeout);
    sortCloseTimeout = window.setTimeout(() => {
      if (!isSortHovering()) {
        setIsSortOpen(false);
      }
    }, 500);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    clearTimeout(closeTimeout);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    startCloseTimer();
  };

  const handleSortMouseEnter = () => {
    setIsSortHovering(true);
    clearTimeout(sortCloseTimeout);
  };

  const handleSortMouseLeave = () => {
    setIsSortHovering(false);
    startSortCloseTimer();
  };

  onCleanup(() => {
    clearTimeout(closeTimeout);
    clearTimeout(sortCloseTimeout);
  });

  return (
    <div class="relative flex mb-2 bg-[#1a1b26]/30 z-20 rounded border border-gray-700/50 backdrop-blur-sm">
      <input
        ref={props.ref}
        onInput={props.onInput}
        type="text"
        class="flex-1 p-2 bg-transparent outline-none text-white"
        placeholder="Type here..."
      />
      <div class="flex">
        <div
          class="relative group"
          onMouseEnter={handleSortMouseEnter}
          onMouseLeave={handleSortMouseLeave}
        >
          <button
            onClick={toggleSort}
            class="h-full px-3 py-2 flex items-center gap-1 text-gray-300 hover:text-white border-l border-gray-700/50"
          >
            {sorts.find((s) => s.value === props.selectedSort())?.label}
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {isSortOpen() && (
            <div
              class="absolute top-full right-0 mt-1 w-40 bg-[#1e1e21] rounded border border-gray-700 shadow-lg backdrop-blur-md"
              onMouseEnter={handleSortMouseEnter}
              onMouseLeave={handleSortMouseLeave}
            >
              <For each={sorts}>
                {(sort) => (
                  <button
                    onClick={() => selectSort(sort.value)}
                    class="w-full px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-700/50"
                  >
                    {sort.label}
                  </button>
                )}
              </For>
            </div>
          )}
        </div>
        <div
          class="relative group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={toggleType}
            class="h-full px-3 py-2 flex items-center gap-1 text-gray-300 hover:text-white border-l border-gray-700/50"
          >
            {props.selectedTypes().length === 0
              ? "All Types"
              : `${props.selectedTypes().length} Selected`}
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {isOpen() && (
            <div
              class="absolute top-full right-0 mt-1 w-40 bg-[#1e1e21] rounded border border-gray-700 shadow-lg backdrop-blur-md"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <For each={types}>
                {(type) => (
                  <button
                    onClick={() => selectType(type.value)}
                    class="w-full px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-700/50"
                  >
                    <span
                      class={
                        props.selectedTypes().includes(type.value)
                          ? "text-white"
                          : ""
                      }
                    >
                      {type.label}
                    </span>
                  </button>
                )}
              </For>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
