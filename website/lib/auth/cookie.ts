import { createCookie } from "react-router";

export const refreshTokenCookie = createCookie("inkverse-refresh-token", {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 180, // 180 days
});

export async function getRefreshToken(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("Cookie");
  
  if (!cookieHeader) return null;
  
  // Use manual parsing since React Router's parse expects JSON format
  // but we're storing plain JWT strings
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      acc[name] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);
  
  const refreshToken = cookies['inkverse-refresh-token'];  
  return refreshToken || null;
}


export async function setRefreshToken(refreshToken: string) {
  return await refreshTokenCookie.serialize(refreshToken);
}

export async function clearRefreshToken() {
  return await refreshTokenCookie.serialize("", { maxAge: 0 });
}