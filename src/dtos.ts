export interface BaseToken {
	sub: string;
	exp: number;
}

export interface AccessToken extends BaseToken {
	iat: number;
	nbf: number;
	jti: string;
	type: string;
	fresh: boolean;
	user_role_id: number;
}

export interface RefreshToken extends BaseToken {
	iat: number;
	nbf: number;
	jti: string;
	type: string;
}

export interface UserAccessToken extends BaseToken {
	iat: number;
	nbf: number;
	jti: string;
	type: string;
	fresh: boolean;
	host: string;
}
