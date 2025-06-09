import { jwtDecode, type JwtPayload } from "jwt-decode";

const TOKEN_REFRESH_BUFFER = 5 * 60; // 5 minutes buffer

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode(token) as JwtPayload;
    if (!decoded || !decoded.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    const expirationTime = decoded.exp - TOKEN_REFRESH_BUFFER;

    return now >= expirationTime;
  } catch {
    return true;
  }
}
