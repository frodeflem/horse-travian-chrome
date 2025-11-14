// options.ts
const $ = (id: string): HTMLElement | null => document.getElementById(id);

// Load current prefs when the page opens
(async () => {
	const { apiKey = "" } = await chrome.storage.local.get(["apiKey"]);
	const apiKeyInput = $("apiKey") as HTMLInputElement;

	if (apiKeyInput) {
		apiKeyInput.value = apiKey;
	}
})();

// Save button handler
const saveButton = $("save") as HTMLButtonElement;
if (saveButton) {
	saveButton.addEventListener("click", async () => {
		const apiKeyInput = $("apiKey") as HTMLInputElement;
		const statusElement = $("status") as HTMLElement;

		if (apiKeyInput) {
			await chrome.storage.local.set({
				apiKey: apiKeyInput.value.trim(),
			});
		}

		if (statusElement) {
			statusElement.textContent = "Saved ✓";
			setTimeout(() => (statusElement.textContent = ""), 1600);
		}
	});
}
