# Clippr

## 1.6.4

### Patch Changes

- [#80](https://github.com/taroj1205/tauri-clipboard-manager/pull/80) [`28680a4`](https://github.com/taroj1205/tauri-clipboard-manager/commit/28680a4812d3c0a9fc0731d3f063dd99b17382ed) Thanks [@taroj1205](https://github.com/taroj1205)! - Improve overall performance when searching using debounce.

## 1.6.3

### Patch Changes

- [#68](https://github.com/taroj1205/tauri-clipboard-manager/pull/68) [`d275bbf`](https://github.com/taroj1205/tauri-clipboard-manager/commit/d275bbfaad1a95619a5561ab1e259c684fda60af) Thanks [@taroj1205](https://github.com/taroj1205)! - Fixed the content not selectable.

- [#63](https://github.com/taroj1205/tauri-clipboard-manager/pull/63) [`834bd97`](https://github.com/taroj1205/tauri-clipboard-manager/commit/834bd97f6b49c86096c858042a7874d7cd928c69) Thanks [@taroj1205](https://github.com/taroj1205)! - Fix not being able to copy text to clipboard.

## 1.6.2

### Patch Changes

- cc68107: Disabled tab index and removed focus outlines globally to improve visual cleanliness
- 8365641: Fix scroll always trying to fetch even if last item

## 1.6.1

### Patch Changes

- cd7525a: Fixed how check icon was not shown in dropdown

## 1.6.0

### Minor Changes

- f98d5bf: Added a sorting feature

## 1.5.0

### Minor Changes

- 6dfdb12: Add dropdown menu for advance filtering

  - Image, Text, Files, and Color
  - Reset filter when pressing [Escape]

  Made the window slightly larger.

## 1.4.0

### Minor Changes

- 2a93cb1: Added information section and added multiple type display

## 1.3.0

### Minor Changes

- 90e928d: Add support for HTML and ignore file copies

## 1.2.1

### Patch Changes

- 3db2d0d: Disable default context menu and reset active index on close

## 1.2.0

### Minor Changes

- 367ecca: Add position module and improve position management

## 1.1.0

### Minor Changes

- a4ecf61: Removed context menu because there is only one function

## 1.0.3

### Patch Changes

- 1c58df7: Remove delete button from context menu to simplify the UI and focus on core clipboard functionality.

## 1.0.2

### Patch Changes

- d36cebb: Formatted frontend code and made minor bug fixes.

## 1.0.1

### Patch Changes

- 4ab5ca9: - Fixed active index handling in clipboard list with improved keyboard navigation
  - Enhanced clipboard preview with better image and text display
  - Added context menu for copy and delete actions
  - Improved search functionality with debounced input
  - Added infinite scrolling with loading states
  - Updated UI components with better accessibility and user experience
  - Fixed window focus and clipboard event handling

## 1.0.0

## Major Changes

- 18a3f94: 🎉 Official 1.0.0 Release

### Features:

- Clipboard history management
  - Text content support
  - Image content support with preview
  - Rich text support
- System tray integration for quick access
- Global hotkey support for seamless workflow
- Powerful search functionality
  - Full-text search for text content
  - Image search with visual previews
  - Real-time search results
- Modern UI with dark mode support
- Persistent storage for clipboard history

## 0.1.2

### Patch Changes

- b8b2962: Configure release workflow for Windows-only builds
- 8eeb5e9: Configure CI and release workflows for Windows-only builds

## 0.1.1

### Patch Changes

- 20a4e8a: Fixed the bug where search filter did not work
