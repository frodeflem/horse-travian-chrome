chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
	console.log("hi");

	if (msg.type !== "parse-html") return;

	const parser = new DOMParser();
	const doc = parser.parseFromString(msg.html, "text/html");

	const el = doc.querySelector<HTMLDivElement>("#sidebarBoxActiveVillage div.content div.playerName");

	sendResponse({ avatarName: el?.textContent?.trim() ?? null });

	return true; // Keeps the response channel open
});

// To run esbuild offscreen.ts --bundle --outfile=dist/offscreen.js, you must first install esbuild locally as a dev dependency:
// npm install esbuild --save-dev

// Then, you can run the command in your terminal to bundle the TypeScript file into a single JavaScript file:
// npx esbuild src/offscreen.ts --bundle --outfile=dist/offscreen.js
