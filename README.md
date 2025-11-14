# Travian HTML Exporter Extension

This Chrome browser extension captures the HTML source of Travian game pages and uploads it to a specified external API for data analysis. It offers functionality similar to the Travco extension but was originally developed to work with a specific API maintained by the author.

While the extension was not designed for use with third-party APIs, you are welcome to adapt it for your own backend. Instructions for configuring the API endpoint are included to ensure transparency and make customization easy.

⚠️ Important: Use of this extension is subject to Travian Games' terms of service. This extension does not automate gameplay or send commands to the game server. It simply exports HTML for external processing.

## 🚀 Getting Started

### 1. Clone

```
git clone https://github.com/frodeflem/horse-travian-chrome.git
cd travian-extension
```

### 2. Configure

Before building the extension, you may want to make modifications to the `src/config.ts` file in order to use your own backend and endpoints.

1. Open `src/config.ts`.
2. Set the correct URL of your API server:

```ts
// src/config.ts
export const API_HOST = "https://your.api.host.com";
```

3. Open `static/manifest.json`.
4. Modify host_permissions to use the same URL:

```
// static/manifest.json
  ...
	"host_permissions": [
		"https://your.api.host.com/*"
	],
  ...
```

### 3. Build

Install dependencies and build:

```
npm install
npm run build
```

This will generate a `dist/` folder containing the unpackaged extension.

### 4. Install the Extension in Chrome

To install the unpacked extension in Google Chrome:

1. Open Chrome and go to chrome://extensions/
2. Enable Developer mode (toggle in the top right).
3. Click Load unpacked.
4. Select the `dist/` directory that was generated after building.

The extension should now appear in your list of installed extensions. You may want to pin the extension.

## 📄 Disclaimer

This extension is an unofficial tool and is not affiliated with or endorsed by Travian Games. Use is at your own risk.
