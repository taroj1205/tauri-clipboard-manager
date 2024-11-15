import type { Component } from "solid-js";

interface SearchInputProps {
  onInput: () => void;
  ref: HTMLInputElement | undefined;
}

export const SearchInput: Component<SearchInputProps> = (props) => {
  return (
    <input
      ref={props.ref}
      onInput={props.onInput}
      type="text"
      className="p-2 mb-2 w-full bg-transparent outline-none text-white"
      placeholder="Type here..."
    />
  );
};
