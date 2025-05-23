import { createCookie } from "react-router";

export const refreshTokenCookie = createCookie("inkverse-refresh-token", {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 180, // 180 days
});

export async function getRefreshToken(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("inkverse-refresh-token");
  const refreshToken = await refreshTokenCookie.parse(cookieHeader);
  return refreshToken || null;
}

export async function setRefreshToken(refreshToken: string) {
  return await refreshTokenCookie.serialize(refreshToken);
}

export async function clearRefreshToken() {
  return await refreshTokenCookie.serialize("", { maxAge: 0 });
}