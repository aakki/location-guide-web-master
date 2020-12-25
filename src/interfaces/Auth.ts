export interface Credentials {
  access_token: string;
  access_token_expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
}

export interface CredentialsResponse {
  credentials: Credentials;
  success: true;
}

export interface CredentialsBody {
  login: string;
  password: string;
}
