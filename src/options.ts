// options.ts
const $ = (id: string): HTMLElement | null => document.getElementById(id);

// Load current prefs when the page opens
(async () => {
	const { adminUsername = "", password = "" } = await chrome.storage.local.get(["adminUsername", "password"]);
	const adminUsernameInput = $("adminUsername") as HTMLInputElement;
	const passwordInput = $("password") as HTMLInputElement;

	if (adminUsernameInput) {
		adminUsernameInput.value = adminUsername;
	}
	if (passwordInput) {
		passwordInput.value = password;
	}
})();

// Save button handler
const saveButton = $("save") as HTMLButtonElement;
if (saveButton) {
	saveButton.addEventListener("click", async () => {
		const adminUsernameInput = $("adminUsername") as HTMLInputElement;
		const passwordInput = $("password") as HTMLInputElement;
		const statusElement = $("status") as HTMLElement;

		if (adminUsernameInput && passwordInput) {
			await chrome.storage.local.set({
				adminUsername: adminUsernameInput.value.trim(),
				password: passwordInput.value.trim(),
			});
		}

		if (statusElement) {
			statusElement.textContent = "Saved ✓";
			setTimeout(() => (statusElement.textContent = ""), 1600);
		}
	});
}
