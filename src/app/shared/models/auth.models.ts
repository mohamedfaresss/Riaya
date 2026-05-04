export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  clinicId: string;
  name?: string;
}
