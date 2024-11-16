import { Show } from "solid-js";

type ContextMenuProps = {
  x: number;
  y: number;
  show: boolean;
  onDelete: () => void;
  onCopy: () => void;
  onClose: () => void;
};

export const ContextMenu = (props: ContextMenuProps) => {
  return (
    <Show when={props.show}>
      <div
        class="fixed z-50 bg-gray-800/90 backdrop-blur-2xl rounded-lg shadow-xl py-1 min-w-32 border border-gray-700/50"
        style={{
          left: `${props.x}px`,
          top: `${props.y}px`,
        }}
      >
        <button
          type="button"
          class="w-full px-4 py-2 text-left text-white hover:bg-gray-700/70 transition-colors duration-200"
          onClick={() => {
            props.onCopy();
            props.onClose();
          }}
        >
          Copy
        </button>
        {/* <button
          type="button"
          class="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700/70 transition-colors duration-200"
          onClick={() => {
            props.onDelete();
            props.onClose();
          }}
        >
          Delete
        </button> */}
      </div>
    </Show>
  );
};
