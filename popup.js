document.addEventListener("DOMContentLoaded", handleDOMLoad);

async function handleDOMLoad() {
	document
		.getElementById("highlight")
		.addEventListener("click", handleHighlightClick);

	document
		.getElementById("clear")
		.addEventListener("click", clearEventHandler);

	document.getElementById("prevMatch").addEventListener("click", scrollPrev);

	document.getElementById("nextMatch").addEventListener("click", scrollNext);

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

async function handleHighlightClick() {
	clearEventHandler();
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
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (tabs && tabs.length > 0) {
			chrome.scripting.executeScript({
				target: { tabId: tabs[0].id },
				function: highlightText,
				args: [regexStr, flags],
			});
			scrollNext();
		} else {
			console.error("No active tab found.");
		}
	});
}

function highlightText(regexStr, flags) {
	if (!regexStr) return;

	try {
		const regex = new RegExp(regexStr, flags);

		function traverseTextNodes(node) {
			if (
				node.nodeType === Node.TEXT_NODE &&
				node.nodeValue.trim() !== ""
			) {
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
						span.style.padding = "2px 4px"; // Add some padding
						span.style.borderRadius = "3px"; // Slightly rounded corners
						span.textContent = highlightedText;
						fragment.appendChild(span);

						lastIndex = m.index + m.length;
					});

					const afterText = node.nodeValue.substring(lastIndex);
					if (afterText) {
						fragment.appendChild(
							document.createTextNode(afterText)
						);
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
	} catch (error) {
		console.error("Invalid regex:", error);
		alert("Invalid regular expression. Please check your input."); // Alert the user
	}
}

function clearEventHandler() {
	chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
		if (tabs && tabs.length > 0) {
			chrome.scripting.executeScript({
				target: { tabId: tabs[0].id },
				function: clearHighlights,
			});
			await removeFromStorage("idx");
		} else {
			console.error("No active tab found.");
		}
	});
}

function clearHighlights() {
	const highlightedSpans = document.querySelectorAll(
		'span[style*="background-color: yellow"]'
	);
	for (let i = highlightedSpans.length - 1; i >= 0; i--) {
		// Iterate backwards
		const span = highlightedSpans[i];
		const textNode = document.createTextNode(span.textContent);
		span.parentNode.replaceChild(textNode, span);
	}
}

function scrollNext() {
	chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
		if (!tabs || tabs.length == 0) {
			console.error("No active tab found.");
		}
		let { idx } = await getFromStorage("idx");
		if (idx == undefined) {
			await setStorage("idx", -1);
			idx = -1;
		}
		let data = await chrome.scripting.executeScript({
			target: { tabId: tabs[0].id },
			function: async (index) => {
				let highlightedSpans = document.querySelectorAll(
					'span[style*="background-color: yellow"]'
				);

				if (index + 1 < 0 || index + 1 > highlightedSpans.length - 1)
					return false;
				index++;

				let rect = highlightedSpans[index].getBoundingClientRect();
				let top =
					rect.top +
					window.scrollY -
					window.innerHeight / 2 +
					rect.height / 2; // Adjust for current scroll position
				let left =
					rect.left +
					window.scrollX -
					window.innerWidth / 2 +
					rect.width / 2; // Adjust for current scroll position

				window.scrollTo({
					top: top,
					left: left,
					behavior: "smooth",
				});
				return true;
			},
			args: [idx],
		});
		if (data[0].result) idx++;
		await setStorage("idx", idx);
	});
}

function scrollPrev() {
	chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
		if (!tabs || tabs.length == 0) {
			console.error("No active tab found.");
		}
		let { idx } = await getFromStorage("idx");
		if (idx == undefined) {
			await setStorage("idx", -1);
			idx = -1;
		}
		let data = await chrome.scripting.executeScript({
			target: { tabId: tabs[0].id },
			function: async (index) => {
				let highlightedSpans = document.querySelectorAll(
					'span[style*="background-color: yellow"]'
				);

				if (index - 1 < 0 || index - 1 > highlightedSpans.length - 1)
					return false;
				index--;

				let rect = highlightedSpans[index].getBoundingClientRect();
				let top =
					rect.top +
					window.scrollY -
					window.innerHeight / 2 +
					rect.height / 2; // Adjust for current scroll position
				let left =
					rect.left +
					window.scrollX -
					window.innerWidth / 2 +
					rect.width / 2; // Adjust for current scroll position

				window.scrollTo({
					top: top,
					left: left,
					behavior: "smooth",
				});
				return true;
			},
			args: [idx],
		});
		if (data[0].result) idx--;
		await setStorage("idx", idx);
	});
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
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(storageKey, (result) => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError); // Reject with any Chrome runtime errors.
			} else {
				resolve(result); // Resolve with the retrieved data.
			}
		});
	});
}

/**
 * Removes data from Chrome local storage.
 * @param {string} key The key to remove.
 * @returns {Promise<void>} A promise that resolves when the data is removed.
 */
async function removeFromStorage(key) {
	let storageKey = validateAndMutateKey(key); // Validate the key.
	return new Promise((resolve, reject) => {
		chrome.storage.local.remove(storageKey, () => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError); // Reject with any Chrome runtime errors.
			} else {
				resolve(); // Resolve when data is removed.
			}
		});
	});
}

/**
 * Sets data in Chrome local storage.
 * @param {string} key The key to set.
 * @param {any} value The value to set.
 * @returns {Promise<void>} A promise that resolves when the data is set.
 */
async function setStorage(key, value) {
	let storageKey = validateAndMutateKey(key); // Validate the key.
	return new Promise((resolve, reject) => {
		chrome.storage.local.set({ [storageKey]: value }, () => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError); // Reject with Chrome runtime error.
			} else {
				resolve(); // Resolve when data is set.
			}
		});
	});
}
