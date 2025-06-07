import { type LoaderFunctionArgs, redirect } from "react-router";
import { clearRefreshToken } from "@/lib/auth/cookie";

export async function loadLogout({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const success = searchParams.get("success");
  if (success) {
    return null;
  }

  // Clear the refresh token cookie
  const headers = new Headers({
    "Set-Cookie": await clearRefreshToken(),
  });

  return redirect("/logout?success=true", { headers });
}