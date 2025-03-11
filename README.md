# Regex Highlighter

A Chrome extension that highlights text on any webpage using regular expressions, with navigation features to easily move between matches.


![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Real-time Highlighting:** Highlight text on any webpage using regular expressions
- **Regex Flags Support:** Use global, case-insensitive, multiline, and unicode flags
- **Match Navigation:** Easily navigate between highlighted matches with "Previous" and "Next" buttons
- **Keyboard Shortcuts:** Press Enter to quickly move to the next match
- **Visual Indication:** Current match is highlighted with a distinct style and animation
- **Persistent Settings:** Your regex patterns and flag settings are saved between uses
- **Clean UI:** Modern, intuitive interface with toggles for regex flags

## Installation

### From Chrome Web Store
*Coming soon*

### Manual Installation (Developer Mode)
1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/regex-text-highlighter.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the cloned directory

## Usage

1. Navigate to any webpage where you want to highlight text
2. Click the Regex Highlighter extension icon in your browser toolbar
3. Enter your regular expression in the text field
4. Select the appropriate regex flags:
   - **Global (g):** Find all matches (not just the first one)
   - **Case Insensitive (i):** Match regardless of letter case
   - **Multiline (m):** Make `^` and `$` match the start/end of each line
   - **Unicode (u):** Enable proper Unicode matching
5. Click "Highlight Matches" to highlight all matching text
6. Use the "Previous Match" and "Next Match" buttons to navigate between matches
7. Press Enter to quickly navigate to the next match
8. Click "Clear All" to remove all highlights

## Examples

Here are some useful regex patterns you can try:

| Pattern | Description |
|---------|-------------|
| `\b\w+ing\b` | Find all words ending with "ing" |
| `\b[A-Z][a-z]*\b` | Find words that start with a capital letter |
| `\d{3}-\d{3}-\d{4}` | Find US phone numbers in XXX-XXX-XXXX format |
| `\b\w+@\w+\.\w+\b` | Find simple email addresses |
| `\$\d+(\.\d{2})?` | Find dollar amounts |

## Technical Details

- Built with vanilla JavaScript, HTML, and CSS
- Uses Chrome's Storage API to save settings
- Efficiently processes DOM nodes to highlight text while preserving page structure
- Smart navigation between matches with wraparound functionality
- Responsive design that works across various screen sizes

## Privacy

This extension:
- Does NOT collect any user data
- Does NOT send any information to external servers
- Processes everything locally in your browser
- Requires minimal permissions (only activeTab, storage, and scripting)

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development

### Project Structure

```
├── icons              # Extension icons in various sizes
├── src                # Source code
│   ├── popup.html     # Extension popup UI
│   └── popup.js       # Popup functionality and text highlighting logic
├── .gitignore         # Git ignore file
├── .prettierrc.js     # Prettier configuration
├── eslint.config.mjs  # ESLint configuration
├── LICENSE            # MIT License
├── manifest.json      # Chrome extension manifest
├── package.json       # NPM package configuration
└── README.md          # This file
```

### Getting Started

```bash
# Install dependencies
npm install

# Run lint checks and format code
npm run lint
```
