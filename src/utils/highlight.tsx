interface HighlightProps {
  key: number;
  children: string;
}

export const Highlight = ({ key, children }: HighlightProps) => {
  return (
    <span data-key={key} className="bg-yellow-500/30 text-white">
      {children}
    </span>
  );
};

export const highlightText = (text: string, searchText: string) => {
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
