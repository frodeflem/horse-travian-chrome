import { API_HOST, EXPORT_ENDPOINT, GET_USER_TOKEN_BY_NAME_ENDPOINT, LOGIN_API_KEY_ENDPOINT, LOGIN_ENDPOINT, REFRESH_TOKEN_ENDPOINT } from "./config";
import { BaseToken, AccessToken, RefreshToken, UserAccessToken } from "./dtos";

function isTokenValid(token: BaseToken | null): boolean {
	return !!(token && token.exp && token.exp * 1000 > Date.now());
}

function decodeToken(tokenString: string | null) {
	if (!tokenString) return null;
	return JSON.parse(atob(tokenString.split(".")[1]));
}

let accessTokenString: string | null = null;
export let accessToken: AccessToken | null = decodeToken(accessTokenString);
export async function setAccessToken(tokenString: string) {
	accessTokenString = tokenString;
	accessToken = decodeToken(tokenString);
	await chrome.storage.local.set({ accessToken: tokenString });
}

let refreshTokenString: string | null = null;
export let refreshToken: RefreshToken | null = decodeToken(refreshTokenString);
export async function setRefreshToken(tokenString: string) {
	refreshTokenString = tokenString;
	refreshToken = decodeToken(tokenString);
	await chrome.storage.local.set({ refreshToken: tokenString });
}

let userTokenString: string | null = null;
export let userToken: UserAccessToken | null = decodeToken(userTokenString);
export async function setUserToken(tokenString: string) {
	userTokenString = tokenString;
	userToken = decodeToken(tokenString);
	await chrome.storage.local.set({ userToken: tokenString });
}

// Public API
export class PublicApi {
	// fetch without bearer token:
	static async fetch(path: string, options: RequestInit) {
		const response = await fetch(`${API_HOST}${path}`, {
			...options,
			headers: {
				...options.headers,
			},
		});

		if (!response.ok) {
			console.error(response);
		}

		return response;
	}

	static async GET(path: string) {
		return await this.fetch(path, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	static async POST(path: string, body?: any) {
		return await this.fetch(path, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
	}

	static async PUT(path: string, body?: any) {
		return await this.fetch(path, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
	}

	static async DELETE(path: string, body?: any) {
		return await this.fetch(path, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
	}

	static async login(username: string, password: string) {
		const response = await this.POST(LOGIN_ENDPOINT, {
			username: username,
			password: password,
		});

		const data = await response.json();
		const accessToken = data.access_token;
		const refreshToken = data.refresh_token;

		setAccessToken(accessToken);
		setRefreshToken(refreshToken);
	}

	static async loginWithApiKey(apiKey: string) {
		const response = await this.POST(LOGIN_API_KEY_ENDPOINT, {
			api_key: apiKey,
		});

		const data = await response.json();
		const accessToken = data.access_token;
		const refreshToken = data.refresh_token;

		setAccessToken(accessToken);
		setRefreshToken(refreshToken);
	}

	static async refreshAccessToken() {
		const response = await this.POST(REFRESH_TOKEN_ENDPOINT, {
			refresh_token: refreshTokenString,
		});

		const data = await response.json();
		setAccessToken(data.access_token);
	}
}

// Protected API: Admin level
export class AdminApi {
	// fetch with bearer token middleware:
	static async fetch(path: string, options: RequestInit) {
		const response = await fetch(`${API_HOST}${path}`, {
			...options,
			headers: {
				...options.headers,
				Authorization: `Bearer ${await this.accessTokenString()}`,
			},
		});

		if (!response.ok) {
			console.error(response);
		}

		return response;
	}

	static async GET(path: string) {
		return await this.fetch(path, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	static async POST(path: string, body?: any) {
		return await this.fetch(path, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
	}

	static async PUT(path: string, body?: any) {
		return await this.fetch(path, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
	}

	static async DELETE(path: string, body?: any) {
		return await this.fetch(path, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
	}

	static async accessTokenString() {
		if (isTokenValid(accessToken)) return accessTokenString;

		if (isTokenValid(refreshToken)) {
			await PublicApi.refreshAccessToken();

			if (isTokenValid(accessToken)) {
				return accessTokenString;
			} else {
				throw new Error("Failed to refresh access token");
			}
		}

		const { apiKey } = await chrome.storage.local.get(["apiKey"]);
		if (apiKey) {
			await PublicApi.loginWithApiKey(apiKey);

			if (isTokenValid(accessToken)) {
				return accessTokenString;
			} else {
				throw new Error("Failed to login with API key");
			}
		}

		return null;
	}

	static async parsePage(url: string, avatarName: string, body: string) {
		console.log(`${EXPORT_ENDPOINT}?avatar_name=${avatarName}&url=${url.replaceAll("&", "%26")}`);
		const response = await this.fetch(`${EXPORT_ENDPOINT}?avatar_name=${avatarName}&url=${url.replaceAll("&", "%26")}`, {
			method: "POST",
			body: body,
		});

		return response;
	}
}

// Initialize tokens from storage:
(async () => {
	const { accessToken: storedAccessToken, refreshToken: storedRefreshToken } = await chrome.storage.local.get(["accessToken", "refreshToken"]);

	if (storedAccessToken) {
		setAccessToken(storedAccessToken);
	}

	if (storedRefreshToken) {
		setRefreshToken(storedRefreshToken);
	}
})();
