import { createCookie } from "react-router";

export interface InkverseSettings {
  theme?: string;
  zoomMode?: string;
}

export const settingsCookie = createCookie("inkverse-settings", {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 400,
});

export async function getSettings(request: Request): Promise<InkverseSettings> {
  const cookieHeader = request.headers.get("Cookie");
  const settings = await settingsCookie.parse(cookieHeader);
  return settings || {};
}

export async function setSettings(settings: InkverseSettings) {
  return await settingsCookie.serialize(settings);
}