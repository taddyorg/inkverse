import { clearLocalStorage } from "@/lib/storage/local";
import { getConnectedHostingProviderUuids, clearHostingProviderAuthData } from "@/lib/auth/hosting-provider";
import { useEffect } from "react";
import { useNavigate, type LoaderFunctionArgs } from "react-router";
import { getPublicApolloClient, getUserApolloClient } from "@/lib/apollo/client.client";
import { loadLogout } from "@/lib/loader/logout.server";

export const loader = async ({ params, request, context }: LoaderFunctionArgs) => {
  return await loadLogout({ params, request, context });
};

export const headers = () => {
  return {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
};

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear local storage
    clearLocalStorage();

    // Clear hosting provider data
    const hostingProviderUuids = getConnectedHostingProviderUuids();
    hostingProviderUuids.forEach((hostingProviderUuid) => {
      clearHostingProviderAuthData(hostingProviderUuid);
    });

    //clear apollo local store
    getPublicApolloClient().resetStore();

    //clear apollo local store
    getUserApolloClient().resetStore();

    // Redirect to home
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p>Logging out...</p>
      </div>
    </div>
  );
}