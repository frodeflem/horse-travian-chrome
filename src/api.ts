import { API_HOST, EXPORT_ENDPOINT, GET_USER_TOKEN_BY_NAME_ENDPOINT, LOGIN_ENDPOINT, REFRESH_TOKEN_ENDPOINT } from "./config";
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

		const { adminUsername, password } = await chrome.storage.local.get(["adminUsername", "password"]);
		if (adminUsername && password) {
			await PublicApi.login(adminUsername, password);

			if (isTokenValid(accessToken)) {
				return accessTokenString;
			} else {
				throw new Error("Failed to login");
			}
		}

		return null;
	}

	static async accessToken() {
		if (isTokenValid(accessToken)) return accessToken;

		if (isTokenValid(refreshToken)) {
			await PublicApi.refreshAccessToken();

			if (isTokenValid(accessToken)) {
				return accessToken;
			} else {
				throw new Error("Failed to refresh access token");
			}
		}

		return null;
	}

	static async getUserTokenByName(avatar_name: string, host: string, sitter_avatar_name: string | null = null) {
		const response = await this.GET(`${GET_USER_TOKEN_BY_NAME_ENDPOINT}?avatar_name=${avatar_name}&host=${host}${sitter_avatar_name ? `&sitter_avatar_name=${sitter_avatar_name}` : ""}`);
		const data = await response.json();
		return data;
	}
}

// User API
export class UserApi {
	static avatarName: string | null = null;
	static avatarHost: string | null = null;

	// fetch with bearer token middleware:
	static async fetch(path: string, options: RequestInit) {
		const response = await fetch(`${API_HOST}${path}`, {
			...options,
			headers: {
				...options.headers,
				Authorization: `Bearer ${await this.userToken()}`,
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

	static async userToken() {
		if (isTokenValid(userToken)) return userTokenString;

		if (isTokenValid(await AdminApi.accessToken())) {
			await this.refreshUserTokenByName();

			if (isTokenValid(userToken)) {
				return userTokenString;
			} else {
				throw new Error("Failed to refresh user token");
			}
		}

		return null;
	}

	static async refreshUserTokenByName() {
		if (!this.avatarName || !this.avatarHost) throw new Error("No account selected");
		const response = await AdminApi.getUserTokenByName(this.avatarName, this.avatarHost);
		setUserToken(response);

		if (!isTokenValid(userToken)) {
			throw new Error("Failed to refresh user token");
		}
	}

	static async setUserByName(avatarName: string, host: string) {
		// Try to get a user token from storage with the given avatar name+host:
		if (this.avatarName === avatarName && this.avatarHost === host) {
			return;
		}

		this.avatarName = avatarName;
		this.avatarHost = host;

		const key = `userToken\0${avatarName}\0${host}`;
		const { [key]: storedUserToken } = await chrome.storage.local.get([key]);
		if (!storedUserToken || !isTokenValid(storedUserToken)) {
			await this.refreshUserTokenByName();
		} else {
			await setUserToken(storedUserToken);
		}
	}

	static async parsePage(url: string, body: string) {
		const response = await this.fetch(`${EXPORT_ENDPOINT}?url=${url.replaceAll("&", "%26")}`, {
			method: "POST",
			body: body,
		});

		return response;
	}
}

// Initialize tokens from storage:
(async () => {
	const {
		accessToken: storedAccessToken,
		refreshToken: storedRefreshToken,
		userToken: storedUserToken,
		avatarName: storedAvatarName,
		avatarHost: storedAvatarHost,
	} = await chrome.storage.local.get(["accessToken", "refreshToken", "userToken", "avatarName", "avatarHost"]);

	console.log("Stored tokens:", { storedAccessToken, storedRefreshToken, storedUserToken });

	if (storedAccessToken) {
		setAccessToken(storedAccessToken);
	}

	if (storedRefreshToken) {
		setRefreshToken(storedRefreshToken);
	}

	if (storedUserToken) {
		setUserToken(storedUserToken);
	}

	if (storedAvatarName) {
		UserApi.avatarName = storedAvatarName;
	}

	if (storedAvatarHost) {
		UserApi.avatarHost = storedAvatarHost;
	}
})();
