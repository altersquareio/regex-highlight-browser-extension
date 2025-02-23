// Add event listener for DOMContentLoaded event to execute handleDOMLoad function
document.addEventListener("DOMContentLoaded", handleDOMLoad);

/**
 * Handles the DOMContentLoaded event.
 * Initializes event listeners for buttons and loads regex and flags from storage.
 */
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

	let { regex } = await getFromStorage("regex");
	let { flags } = await getFromStorage("flags");

	if (regex) {
		document.getElementById("regex").value = regex;
	}
	if (flags) {
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

	await handleScroll("next");
}

/**
 * Highlights text in the page based on the given regex and flags.
 * @param {string} regexStr The regex string.
 * @param {string} flags The regex flags.
 */
function highlightText(regexStr, flags) {
	if (!regexStr) return;

	let regex;
	try {
		regex = new RegExp(regexStr, flags);
	} catch (error) {
		console.error("Invalid regex:", error);
		alert("Invalid regular expression. Please check your input.");
		return;
	}

	function traverseTextNodes(node) {
		if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== "") {
			const matches = [];
			let match;
			while ((match = regex.exec(node.nodeValue))) {
				matches.push({
					index: match.index,
					length: match[0].length,
				});
			}

			if (matches.length > 0) {
				const fragment = document.createDocumentFragment();
				let lastIndex = 0;

				matches.forEach((m) => {
					const beforeText = node.nodeValue.substring(
						lastIndex,
						m.index
					);
					if (beforeText) {
						fragment.appendChild(
							document.createTextNode(beforeText)
						);
					}

					const highlightedText = node.nodeValue.substring(
						m.index,
						m.index + m.length
					);
					const span = document.createElement("span");
					span.style.backgroundColor = "yellow";
					span.style.padding = "2px 4px";
					span.style.borderRadius = "3px";
					span.textContent = highlightedText;
					fragment.appendChild(span);

					lastIndex = m.index + m.length;
				});

				const afterText = node.nodeValue.substring(lastIndex);
				if (afterText) {
					fragment.appendChild(document.createTextNode(afterText));
				}

				node.parentNode.replaceChild(fragment, node);
			}
		} else if (
			node.nodeType === Node.ELEMENT_NODE &&
			node.nodeName !== "SCRIPT" &&
			node.nodeName !== "STYLE"
		) {
			node.childNodes.forEach(traverseTextNodes);
		}
	}

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
	const highlightedSpans = document.querySelectorAll(
		'span[style*="background-color: yellow"]'
	);
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
	let { idx } = await getFromStorage("idx");
	if (idx == undefined) {
		await setStorage("idx", -1);
		idx = -1;
	}
	let data = await chrome.scripting.executeScript({
		target: { tabId: tabs[0].id },
		function: scrollToHighlight,
		args: [idx, mode],
	});
	if (data[0].result && mode == "next") idx++;
	if (data[0].result && mode == "prev") idx--;
	await setStorage("idx", idx);
}

/**
 * Scrolls the page to the specified highlighted span.
 * @param {number} index The index of the highlighted span.
 * @param {string} mode The scroll mode ("next" or "prev").
 * @returns {boolean} True if a highlighted span was found and scrolled to, false otherwise.
 */
function scrollToHighlight(index, mode) {
	let highlightedSpans = document.querySelectorAll(
		'span[style*="background-color: yellow"]'
	);

	if (mode == "next") index++;
	if (mode == "prev") index--;

	if (index < 0 || index > highlightedSpans.length - 1) return false;

	let rect = highlightedSpans[index].getBoundingClientRect();
	let top =
		rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2;
	let left =
		rect.left + window.scrollX - window.innerWidth / 2 + rect.width / 2;

	window.scrollTo({
		top: top,
		left: left,
		behavior: "smooth",
	});
	return true;
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
