import { AdminApi } from "./api";

async function ensureOffscreenDocument(): Promise<void> {
	const exists = await chrome.offscreen.hasDocument();
	if (!exists) {
		await chrome.offscreen.createDocument({
			url: chrome.runtime.getURL("offscreen.html"),
			reasons: [chrome.offscreen.Reason.DOM_PARSER],
			justification: "Parse captured HTML to extract avatar name.",
		});
	}
}

async function extractAvatarName(html: string): Promise<string | null> {
	await ensureOffscreenDocument();

	return new Promise((resolve) => {
		chrome.runtime.sendMessage({ type: "parse-html", html }, (response) => {
			resolve(response?.avatarName ?? null);
		});
	});
}

async function parsePage(tab: chrome.tabs.Tab) {
	if (!tab || !tab.id) {
		console.error("No active tab found.");
		return;
	}

	// 1. Run a small function INSIDE the tab’s JS environment:
	const [{ result: { html, url } = { html: "", url: "" } }] = await chrome.scripting.executeScript({
		target: { tabId: tab.id },
		func: () => {
			console.log(document.URL);
			return {
				html: document.documentElement.outerHTML,
				url: document.URL,
			};
		}, // returns an object with html and url
	});

	if (!html) {
		console.error("No HTML content found.");
		return;
	}

	if (!url || !url.includes("travian")) {
		console.error("Not a Travian page.");
		return;
	}

	const { apiKey } = await chrome.storage.local.get(["apiKey"]);
	if (!apiKey) {
		return chrome.runtime.openOptionsPage();
	}

	const avatarName = await extractAvatarName(html);
	if (!avatarName) {
		throw new Error("Avatar name not found in the HTML.");
	}

	// Extract 'ts2.x1.europe' from 'https://ts2.x1.europe.travian.com/':
	// const avatarHost = url.split("://")[1].split(".travian.com")[0];

	chrome.action.setBadgeText({ text: "..." });
	await AdminApi.parsePage(url, avatarName, html);
	console.log("Page parsed: ", url);
	// Show a temporary label on the extension button:
	chrome.action.setBadgeText({ text: "✔️" });
	setTimeout(() => {
		chrome.action.setBadgeText({ text: "" });
	}, 3000);

	// Show a popup message at the extension button:
	// chrome.action.setPopup({ popup: "popup.html" });
	if (false) {
		chrome.action.setTitle({ title: `Parsed: ${avatarName}` });
		// chrome.action.setIcon({ path: "images/icon-48.png" }); // Change icon to indicate success

		const { notificationId } = await chrome.storage.local.get(["notificationId"]);

		if (notificationId) {
			chrome.notifications.clear(notificationId, () => {
				console.log("Cleared previous notification:", notificationId);
			});
		}

		chrome.notifications.create(
			{
				type: "basic",
				iconUrl: "images/icon-48.png",
				title: "Page Parsed",
				message: `Parsed page for ${avatarName} successfully!`,
			},
			(notificationId) => {
				console.log("Notification created:", notificationId);
				chrome.storage.local.set({ notificationId });
			}
		);
	}
}

chrome.action.onClicked.addListener(parsePage);

chrome.commands.onCommand.addListener((command) => {
	if (command === "do-something") {
		console.log("🔑 Ctrl+Q triggered");

		// Example: inject content script into active tab
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const tab = tabs[0];
			if (!tab?.id) return;
			parsePage(tab);
		});

		// You can also trigger anything else here — open popup, capture DOM, etc.
	}
});
