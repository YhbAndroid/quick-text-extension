# Quick Text

A Chrome extension based on Manifest V3 that helps you quickly manage and copy frequently used text.

## Features

- ✅ **Quick Copy**: Click the entire row to copy text to clipboard
- ✅ **Add Text**: Quickly add text to the list by entering it
- ✅ **Edit Text**: Modify existing quick text at any time
- ✅ **Delete Text**: Remove unwanted text
- ✅ **Drag to Sort**: Adjust text order by dragging with mouse
- ✅ **Tag Categories**: Add tags to text and filter by tags
- ✅ **Import/Export**: Support TXT format import/export (including tags)
- ✅ **Shortcut**: Press `Alt+Q` to quickly open the extension
- ✅ **Data Persistence**: Automatically save to browser local storage
- ✅ **Storage Monitoring**: Real-time display of storage capacity and progress bar
- ✅ **Tag Memory**: Automatically restore last selected tag when opened

## Project Structure

```
quick-text-extension/
├── manifest.json       # Extension configuration file (Manifest V3)
├── popup.html          # Popup window interface and styles
├── popup.js            # Popup window core logic
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── .gitignore          # Git ignore configuration
└── README.md           # Project documentation
```

## Installation

1. **Load extension in Chrome**:
   - Open Chrome browser and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select this project directory

## Usage

### Basic Operations
1. Click the extension icon in the browser toolbar, or press `Alt+Q` to open the popup window
2. Enter text in the input box, optionally enter a tag, and click "Add" button or press Enter to add
3. **Click the entire row** to copy text to clipboard
4. Click "Edit" button to modify text content and tags
5. Click "Delete" button to remove text

### Tag Categories
- You can enter a tag when adding text (max 10 characters)
- Click the tag button at the top to filter and view text in that category

### Drag to Sort
- Hold the `⋮⋮` icon on the left side of the list item and drag
- Release the mouse after dragging to the target position
- Order is automatically saved

### Import/Export
- **Export**: Click the "Export" button in the top right to download a TXT file
- **Import**: Click the "Import" button in the top right to select a TXT file (appends to existing data)
- Import format: `[Tag] Text content`, e.g., `[Work] Meeting notes`

## Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| `Alt+Q` | Open extension popup window |

## Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Store user's quick text data and tag settings |
| `commands` | Support keyboard shortcut operations |

## License

Apache-2.0
