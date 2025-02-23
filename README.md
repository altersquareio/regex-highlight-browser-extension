# Regex Highlighter Chrome Extension

This Chrome extension allows you to highlight text on any webpage using regular expressions. It provides a simple interface to input your regex, select flags, and easily navigate between highlighted matches.

## Features

- **Real-time Highlighting:** Dynamically highlights text on the current webpage as you type your regex.
- **Regex Flags:** Supports common regex flags (global, case-insensitive, multiline, unicode) for flexible matching.
- **Clear Highlights:** Easily remove all highlights with a single click.
- **Navigation:** Navigate between highlighted matches using "Previous Match" and "Next Match" buttons.
- **Persistent Settings:** Saves your regex and flags so they are retained between uses.

## Installation

1. Clone this repository: `git clone https://github.com/rohandhamapurkar/regex-highlight-browser-extension.git`
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked".
5. Select the directory where you cloned the repository.

## Usage

1. Open a webpage where you want to highlight text.
2. Click the Regex Highlighter extension icon in your browser toolbar.
3. Enter your regular expression in the input field.
4. Select the desired flags.
5. Click the "Highlight" button.
6. Use the "Previous Match" and "Next Match" buttons to navigate between highlighted instances.
7. Click the "Clear Highlights" button to remove all highlights.

## Options

- **Regex Input:** The text field where you enter your regular expression.
- **Flags:** Checkboxes to enable various regex flags:
    - **Global (g):** Finds all matches in the text, not just the first one.
    - **Case Insensitive (i):** Matches regardless of case.
    - **Multiline (m):** Makes `^` and `$` match the beginning/end of each line, not just the entire string.
    - **Unicode (u):** Enables Unicode-aware matching.
- **Highlight Button:** Triggers the highlighting process.
- **Clear Highlights Button:** Removes all highlights from the page.
- **Previous Match Button:** Scrolls to the previous highlighted match.
- **Next Match Button:** Scrolls to the next highlighted match.

## Contributing

Contributions are welcome! Feel free to submit pull requests or open issues.

## License

This extension is licensed under the [MIT License](LICENSE).

## Credits

This extension was developed by Rohan Dhamapurkar.

## Contact

If you have any questions or issues, please contact dhamapurkar54@gmail.com.