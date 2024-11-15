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
        className="fixed z-50 bg-gray-800 rounded shadow-lg py-1 min-w-32"
        style={{
          left: `${props.x}px`,
          top: `${props.y}px`,
        }}
      >
        <button
          type="button"
          className="w-full px-4 py-2 text-left text-white hover:bg-gray-700"
          onClick={() => {
            props.onCopy();
            props.onClose();
          }}
        >
          Copy
        </button>
        <button
          type="button"
          className="w-full px-4 py-2 text-left text-red-500 hover:bg-gray-700"
          onClick={() => {
            props.onDelete();
            props.onClose();
          }}
        >
          Delete
        </button>
      </div>
    </Show>
  );
};
