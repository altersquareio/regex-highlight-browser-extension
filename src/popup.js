// Add event listener for DOMContentLoaded event to execute handleDOMLoad function
document.addEventListener("DOMContentLoaded", handleDOMLoad);

/**
 * Handles the DOMContentLoaded event.
 * Initializes event listeners for buttons and loads regex and flags from storage.
 */

let isHighlighted = false;

const regexInput = document.getElementById("regex");
const buttons = document.querySelectorAll(".disabled"); // Select buttons initially disabled

regexInput.addEventListener("input", () => {
    isHighlighted = false;
    // Enable buttons when input is not empty
    if (regexInput.value.trim() !== "") {
        buttons.forEach(button => {
            button.classList.remove("disabled");
        });
    }
});

regexInput.addEventListener("focusout", () => {
    // Re-disable buttons when input is empty
    if (regexInput.value.trim() === "") {
        buttons.forEach(button => {
            button.classList.add("disabled");
        });
    }
});


async function handleDOMLoad() {
	document
		.getElementById("highlight")
		.addEventListener("click", handleHighlightClick);

	document
		.getElementById("clear")
		.addEventListener("click", handleClearHighlights);

	document
		.getElementById("prevMatch")
		.addEventListener("click", handleScroll.bind(this, "prev"));

	document
		.getElementById("nextMatch")
		.addEventListener("click", handleScroll.bind(this, "next"));

	document.getElementById("regex").addEventListener("keydown", async (event) => {
		if (event.key === "Enter") {
			event.preventDefault(); // Prevent form submission (if applicable)
	
			if (!isHighlighted) {
				// If text hasn't been highlighted yet, highlight it first
				await handleHighlightClick();
			}
	        isHighlighted=true
			// Navigate to the next match
			handleScroll("next");
		}
	});

	let { regex } = await getFromStorage("regex");
	let { flags } = await getFromStorage("flags");

	if (regex === undefined) {
		let val = "test.*";
		await setStorage("regex", val);
		regex = val;
	}

	if (flags === undefined) {
		let val = "gm";
		await setStorage("flags", val);
		flags = val;
	}

	if (regex !== undefined) {
		document.getElementById("regex").value = regex;
	}
	if (flags !== undefined) {
		document.getElementById("global").checked = flags.includes("g");
		document.getElementById("caseInsensitive").checked =
			flags.includes("i");
		document.getElementById("multiline").checked = flags.includes("m");
		document.getElementById("unicode").checked = flags.includes("u");
	}
}

/**
 * Handles the highlight button click event.
 * Retrieves regex and flags from input fields, saves them to storage, and executes the highlightText function in the active tab.
 */
async function handleHighlightClick() {
	await handleClearHighlights();
	const regexStr = document.getElementById("regex").value;
	const globalFlag = document.getElementById("global").checked ? "g" : "";
	const caseInsensitiveFlag = document.getElementById("caseInsensitive")
		.checked
		? "i"
		: "";
	const multilineFlag = document.getElementById("multiline").checked
		? "m"
		: "";
	const unicodeFlag = document.getElementById("unicode").checked ? "u" : "";

	const flags =
		globalFlag + caseInsensitiveFlag + multilineFlag + unicodeFlag;

	await setStorage("regex", regexStr);
	await setStorage("flags", flags);

	let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	if (!tabs || (tabs && tabs.length == 0)) {
		console.error("No active tab found.");
		return;
	}

	await chrome.scripting.executeScript({
		target: { tabId: tabs[0].id },
		function: highlightText,
		args: [regexStr, flags],
	});
    isHighlighted = true;
	await handleScroll("next");
}

/**
 * Highlights text in the page based on the given regex and flags.
 * @param {string} regexStr The regex string.
 * @param {string} flags The regex flags (e.g., "i" for case-insensitive, "g" for global).
 */
function highlightText(regexStr, flags) {
	const MAX_ARRAY_LENGTH = 100; // maximum number of matches allowed with the regex

	// If no regex string is provided, exit the function.
	if (!regexStr) return;

	let regex;
	try {
		// Attempt to create a new RegExp object.
		regex = new RegExp(regexStr, flags);
	} catch (error) {
		// If the regex is invalid, log an error to the console and display an alert.
		console.error("Invalid regex:", error);
		alert("Invalid regular expression. Please check your input.");
		return;
	}

	// Ensure the necessary CSS styles are injected into the document head.
	// This avoids repeatedly creating style elements on each call.

	// Style for highlighted text.
	let highlightedStyle = document.getElementById("regexFindHighlightStyle");
	if (!highlightedStyle) {
		let style0 = document.createElement("style");
		style0.id = "regexFindHighlightStyle";
		style0.innerHTML = `.regexfindhighlighted { background-color: yellow;  }`; //padding: 2px 4px; border-radius: 3px;
		document.head.appendChild(style0);
	}

	// Animation style for the currently highlighted element (if needed).
	let animationStyle = document.getElementById("regexCurrAnimation");
	if (!animationStyle) {
		let style1 = document.createElement("style");
		style1.id = "regexCurrAnimation";
		style1.innerHTML = `@keyframes regexfindhere { 30% { transform: scale(1.2); } 40%, 60% { transform: rotate(-3deg) scale(1.2); } 50% { transform: rotate(3deg) scale(1.2); } 70% { transform: rotate(0deg) scale(1.2); } 100% { transform: scale(1); } }`;
		document.head.appendChild(style1);
	}

	// Style for the currently matched element.
	let currHighlightedStyle = document.getElementById(
		"regexFindCurrHighlightStyle"
	);
	if (!currHighlightedStyle) {
		let style1 = document.createElement("style");
		style1.id = "regexFindCurrHighlightStyle";
		style1.innerHTML = `.regexfindcurrent { display: inline-block; background-color: #FF8080; font-size: x-large; padding: 2px 4px; border-radius: 3px; animation: regexfindhere 0.5s ease-in-out; }`;
		document.head.appendChild(style1);
	}

	/**
	 * Recursively traverses the DOM tree, highlighting text nodes that match the regex.
	 * @param {Node} node The current DOM node to traverse.
	 */
	function traverseTextNodes(node) {
		// Process text nodes.
		if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== "") {
			const matches = [];
			let match;

			// Reset regex.lastIndex before each execution to prevent repeated matches
			regex.lastIndex = 0;
			// Find all matches within the current text node.
			if (regex.flags.includes("\g")) {
				while ((match = regex.exec(node.nodeValue)) !== null) {
					if (matches.length < MAX_ARRAY_LENGTH) { // if matches exceed limit then dont match and stop
								matches.push({
									index: match.index,
									length: match[0].length,
								});
							
								if (match.index === regex.lastIndex) {
									regex.lastIndex++; 
								}
							} else {
								break;
							}
				}
			} else {
				match = node.nodeValue.match(regex); // Non-global case
				if (match) {
					let startIndex = node.nodeValue.indexOf(match[0]);
					matches.push({ index: startIndex, length: match[0].length });
				}
			}

			// If matches are found, split the text node and wrap the matches in <span> elements.
			if (matches.length > 0) {
				const fragment = document.createDocumentFragment(); // Use a fragment for efficient DOM updates.
				let lastIndex = 0;

				matches.forEach((m) => {
					// Add the text before the match to the fragment.
					const beforeText = node.nodeValue.substring(
						lastIndex,
						m.index
					);
					if (beforeText) {
						fragment.appendChild(
							document.createTextNode(beforeText)
						);
					}

					// Create a span for the highlighted text.
					const highlightedText = node.nodeValue.substring(
						m.index,
						m.index + m.length
					);
					const span = document.createElement("span");
					span.classList.add("regexfindhighlighted"); // Apply the highlight style.
					span.textContent = highlightedText;
					fragment.appendChild(span);

					lastIndex = m.index + m.length;
				});

				// Add the text after the last match to the fragment.
				const afterText = node.nodeValue.substring(lastIndex);
				if (afterText) {
					fragment.appendChild(document.createTextNode(afterText));
				}

				// Replace the original text node with the fragment containing the highlighted spans.
				//node.parentNode.replaceChild(fragment, node);
				node.replaceWith(fragment);
			}
			// Traverse child nodes of element nodes, excluding script and style tags.
		} else if (
			node.nodeType === Node.ELEMENT_NODE &&
			node.nodeName !== "SCRIPT" &&
			node.nodeName !== "STYLE"
		) {
			[...node.childNodes].forEach(traverseTextNodes);
		}
	}

	// Start traversing the DOM from the body element.
	traverseTextNodes(document.body);
}

/**
 * Handles the clear highlights button click event.
 * Clears all highlighted spans in the active tab.
 */
async function handleClearHighlights() {
	await removeFromStorage("idx");
	let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	if (!tabs || (tabs && tabs.length == 0)) {
		console.error("No active tab found.");
		return;
	}
	await chrome.scripting.executeScript({
		target: { tabId: tabs[0].id },
		function: clearHighlights,
	});
}

/**
 * Clears all highlighted spans in the page.
 */
function clearHighlights() {
	let highlightedSpans = document.querySelectorAll(".regexfindhighlighted");
	for (let i = highlightedSpans.length - 1; i >= 0; i--) {
		const span = highlightedSpans[i];
		const textNode = document.createTextNode(span.textContent);
		span.parentNode.replaceChild(textNode, span);
	}
}

/**
 * Handles the scroll to next/previous match button click event.
 * @param {string} mode The scroll mode ("next" or "prev").
 */



async function handleScroll(mode) {
    let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || (tabs && tabs.length == 0)) {
        console.error("No active tab found.");
        return;
    }

    // Get the current index from storage.
    let { idx } = await getFromStorage("idx");
    if (idx === undefined) {
        await setStorage("idx", -1);
        idx = -1;
    }

    // Execute the scrollToHighlight function in the active tab.
    let data = await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: scrollToHighlight,
        args: [idx, mode],
    });

    // Update the index based on the result of scrollToHighlight.
    if (data[0].result) {
        if (mode === "next") {
            idx++;
        } else if (mode === "prev") {
            idx--;
        }

        // Get the number of matches to handle wrapping.
        let matchCount = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: () => document.querySelectorAll(".regexfindhighlighted").length,
        });

        // Wrap around the index if it goes out of bounds.
        if (idx < 0) {
            idx = matchCount[0].result - 1; // Go to the last match.
        } else if (idx >= matchCount[0].result) {
            idx = 0; // Go to the first match.
        }

        // Save the updated index to storage.
        await setStorage("idx", idx);
    }
}

/**
 * Scrolls the page to the specified highlighted span.
 * @param {number} index The index of the highlighted span to scroll to.
 * @param {string} mode The scroll mode ("next" or "prev") to determine the next/previous element.
 * @returns {boolean} True if a highlighted span was found and scrolled to, false otherwise.
 */



function scrollToHighlight(index, mode) {
    // Adjust the index based on the scroll mode.
    if (mode === "next") index++; // Increment for "next"
    if (mode === "prev") index--; // Decrement for "prev"

    // Get all highlighted spans.
    let highlightedSpans = document.querySelectorAll(".regexfindhighlighted");

    // If there are no matches, return false.
    if (highlightedSpans.length === 0) {
        return false;
    }

    // Wrap around the index if it goes out of bounds.
    if (index < 0) {
        index = highlightedSpans.length - 1; // Go to the last match.
    } else if (index >= highlightedSpans.length) {
        index = 0; // Go to the first match.
    }

    // Remove the "current" class from the previously highlighted element (if any).
    let currHighlightElem = document.querySelector(".regexfindcurrent");
    if (currHighlightElem) {
        currHighlightElem.classList.remove("regexfindcurrent");
    }

    // Add the "current" class to the currently highlighted span.
    highlightedSpans[index].classList.add("regexfindcurrent");

    // Scroll the highlighted span into view.
    highlightedSpans[index].scrollIntoView({
        behavior: "auto",
        block: "center",
        inline: "center",
    });

    return true; // Return true to indicate that scrolling was successful.
}

/**
 * Validates the storage key to ensure it's a string.
 * @param {string} key The storage key to validate.
 * @returns {string} The validated storage key.
 * @throws {Error} If the key is not a string.
 */
function validateAndMutateKey(key) {
	if (typeof key !== "string") throw new Error("Invalid key");
	return key;
}

/**
 * Retrieves data from Chrome local storage.
 * @param {string} key The key to retrieve.
 * @returns {Promise<any>} A promise that resolves with the retrieved data.
 */
async function getFromStorage(key) {
	let storageKey = validateAndMutateKey(key); // Validate the key.
	return await chrome.storage.local.get([storageKey]);
}

/**
 * Removes data from Chrome local storage.
 * @param {string} key The key to remove.
 * @returns {Promise<void>} A promise that resolves when the data is removed.
 */
async function removeFromStorage(key) {
	let storageKey = validateAndMutateKey(key); // Validate the key.
	return await chrome.storage.local.remove(storageKey);
}

/**
 * Sets data in Chrome local storage.
 * @param {string} key The key to set.
 * @param {any} value The value to set.
 * @returns {Promise<void>} A promise that resolves when the data is set.
 */
async function setStorage(key, value) {
	let storageKey = validateAndMutateKey(key); // Validate the key.
	return await chrome.storage.local.set({ [storageKey]: value });
}
