import type { Component } from "solid-js";

export const SkeletonItem: Component = () => {
  return (
    <li class="animate-pulse flex items-start gap-3 rounded-lg p-3">
      <div class="w-6 h-6 bg-gray-700 rounded" />
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-gray-700 rounded w-3/4" />
        <div class="h-3 bg-gray-700 rounded w-1/4" />
      </div>
    </li>
  );
};
