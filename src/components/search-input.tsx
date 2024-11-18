import { type Component, createSignal, For, onCleanup } from "solid-js";

interface SearchInputProps {
  onInput: () => void;
  ref: HTMLInputElement | undefined;
  updateHistory: (offset?: number) => void;
  selectedTypes: () => ClipboardType[];
  setSelectedTypes: (types: ClipboardType[]) => void;
}

export type ClipboardType = "text" | "image" | "color" | "files";

export const SearchInput: Component<SearchInputProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [isHovering, setIsHovering] = createSignal(false);
  let closeTimeout: number | undefined;

  const types: { value: ClipboardType; label: string }[] = [
    { value: "text", label: "Text" },
    { value: "image", label: "Image" },
    { value: "color", label: "Color" },
    { value: "files", label: "Files" },
  ];

  const toggleType = (type: ClipboardType) => {
    const current = props.selectedTypes();
    const newTypes = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    props.setSelectedTypes(newTypes);
    props.updateHistory();
  };

  const startCloseTimer = () => {
    clearTimeout(closeTimeout);
    closeTimeout = window.setTimeout(() => {
      if (!isHovering()) {
        setIsOpen(false);
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

  onCleanup(() => {
    clearTimeout(closeTimeout);
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
      <div
        class="relative group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={() => setIsOpen((prev) => !prev)}
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
                  onClick={() => toggleType(type.value)}
                  class="w-full px-3 py-2 text-left text-gray-300 hover:bg-active hover:bg-opacity-20 hover:text-white transition-colors duration-200 flex items-center justify-between"
                >
                  <span>{type.label}</span>
                  {props.selectedTypes().includes(type.value) && (
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              )}
            </For>
          </div>
        )}
      </div>
    </div>
  );
};
