import { UserApi } from "./api";

async function ensureOffscreenDocument(): Promise<void> {
	const exists = await chrome.offscreen.hasDocument();
	if (!exists) {
		await chrome.offscreen.createDocument({
			url: chrome.runtime.getURL("offscreen.html"),
			reasons: [chrome.offscreen.Reason.DOM_PARSER],
			justification: "Parse captured HTML to extract player name.",
		});
	}
}

async function extractPlayerName(html: string): Promise<string | null> {
	await ensureOffscreenDocument();

	return new Promise((resolve) => {
		chrome.runtime.sendMessage({ type: "parse-html", html }, (response) => {
			resolve(response?.playerName ?? null);
		});
	});
}

chrome.action.onClicked.addListener(async (tab) => {
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

	const { adminUsername } = await chrome.storage.local.get(["adminUsername"]);
	if (!adminUsername) {
		return chrome.runtime.openOptionsPage();
	}

	const playerName = await extractPlayerName(html);
	if (!playerName) {
		throw new Error("Player name not found in the HTML.");
	}

	// Extract 'ts2.x1.europe' from 'https://ts2.x1.europe.travian.com/':
	const avatarHost = url.split("://")[1].split(".travian.com")[0];

	// Get access token for the Travian avatar extracted from the page
	// to ensure the admin is authorized to access the avatar:
	await UserApi.setUserByName(playerName, avatarHost);

	await UserApi.parsePage(url, html);
	console.log("Page parsed: ", url);
});
