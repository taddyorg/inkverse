import type { ActionFunction } from "react-router";
import { setSettings, getSettings } from "@/lib/action/settings";

export const action: ActionFunction = async ({ request }: { request: Request }) => {
  try {
    if (request.method !== "POST") {
      throw new Response("Method not allowed", { status: 405 });
    }

    const body = await request.json();
    const { theme, zoomMode } = body;
    
    // Validate theme if provided
    if (theme !== undefined && theme !== "dark" && theme !== "light") {
      throw new Response("Invalid theme", { status: 400 });
    }

    // Validate zoomMode if provided
    if (zoomMode !== undefined && zoomMode !== "in" && zoomMode !== "out") {
      throw new Response("Invalid zoom mode", { status: 400 });
    }

    // Create settings object with only provided values
    const settings = {
      ...(theme !== undefined && { theme }),
      ...(zoomMode !== undefined && { zoomMode })
    };

    const cookie = await setSettings(settings);
    
    if (!cookie) {
      throw new Error("Failed to set settings cookie");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookie,
      },
    });
  } catch (error) {
    console.error("Settings update error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to update settings" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

export async function loader({ request }: { request: Request }) {
  const settings = await getSettings(request);
  return new Response(JSON.stringify(settings), {
    headers: {
      "Content-Type": "application/json",
    },
  });
} 