export const getRelativeTime = (date: Date): string => {
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const daysDifference = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  const relativeTime = formatter.format(daysDifference, "day");
  return relativeTime.charAt(0).toUpperCase() + relativeTime.slice(1);
};
