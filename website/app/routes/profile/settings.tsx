import { type LoaderFunctionArgs, type MetaFunction, redirect } from 'react-router';
import { useLoaderData, Link, useNavigate } from 'react-router';
import { loadProfileEdit } from '@/lib/loader/profile-edit.server';
import { getMetaTags } from '@/lib/seo';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';
import { MdArrowBack } from 'react-icons/md';
import { FaComments, FaSpinner } from 'react-icons/fa';
import { useState, useEffect, useReducer, useRef } from 'react';
import { getCannySso, settingsReducer, settingsInitialState } from '@inkverse/shared-client/dispatch/settings';
import { getUserApolloClient } from '@/lib/apollo/client.client';

export const meta: MetaFunction<typeof loader> = () => {
  return getMetaTags({
    title: 'Profile Settings',
    description: 'Manage your Inkverse profile settings',
    url: `${inkverseWebsiteUrl}/profile/settings`,
  });
};

export const loader = async ({ params, request, context }: LoaderFunctionArgs) => {
  const data = await loadProfileEdit({ params, request, context });
  
  // If user is not logged in, redirect to home
  if (!data.user) {
    return redirect('/');
  }
  
  return data;
};

export const headers = () => {
  return {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
};

export default function ProfileSettings() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [theme, setTheme] = useState<string>('light');
  const [settingsState, settingsDispatch] = useReducer(settingsReducer, settingsInitialState);
  const userClientRef = useRef<ReturnType<typeof getUserApolloClient> | null>(null);

  useEffect(() => {
    // Get initial theme from document class
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(currentTheme);
  }, []);

  useEffect(() => {
    const userClient = getUserApolloClient();
    userClientRef.current = userClient;
  }, []);

  const handleThemeToggle = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Update document class
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    
    // Update settings
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (error) {
      console.error('Failed to save theme setting:', error);
    }
  };

  const handleSuggestFeature = async () => {
    // If user is not logged in, open regular Canny URL
    if (!user) {
      return;
    }

    // If already loading, don't make another request
    if (settingsState.cannySso.isLoading) {
      return;
    }

    try {
      // Get the user Apollo client and fetch Canny SSO data
      const userClient = getUserApolloClient();
      if (!userClient) {
        throw new Error('User client not available');
      }

      const cannyData = await getCannySso({ userClient }, settingsDispatch);
      
      if (cannyData && cannyData.redirectUrl) {
        // Navigate to the Canny SSO URL
        window.location.href = cannyData.redirectUrl;
      }
    } catch (error) {
      console.error('Error getting Canny SSO:', error);
    }
  };

  const handleEmailHelp = () => {
    window.location.href = 'mailto:danny@inkverse.com';
  };

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    navigate('/logout');
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="rounded-lg">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(`/${user.username}`)}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MdArrowBack className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Settings Options */}
        <div className="space-y-1">
          {/* Theme Toggle */}
          <button
            onClick={handleThemeToggle}
            className="flex items-center justify-between py-4 px-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors w-full rounded-lg"
          >
            <p className="text-lg font-medium text-inkverse-black dark:text-white px-4">
              Theme
            </p>
            <div className="flex items-center gap-3 px-4">
              <span className="text-md text-gray-500 dark:text-gray-400">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
              <div className="p-1 rounded-full">
                {theme === 'light' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800 dark:text-white stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
                    />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800 dark:text-white stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
                    />
                  </svg>
                )}
              </div>
            </div>
          </button>

          {/* Edit Profile Link */}
          <Link
            to="/profile/edit"
            className="flex items-center justify-between py-4 px-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg"
          >
            <p className="text-lg font-medium text-inkverse-black dark:text-white px-4">
              Edit Your Profile
            </p>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Log Out Button */}
          <button
            onClick={handleLogoutClick}
            className="flex items-center justify-between py-4 px-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors w-full rounded-lg mb-10"
          >
            <p className="text-lg font-medium text-red-600 dark:text-red-400 px-4">
              Log Out
            </p>
          </button>

          {/* Founder Section */}
          <div className="mx-auto sm:p-6 lg:p-8 zoomed-in:max-w-3xl max-w-xl">
            {/* Founder Card */}
            <div className="flex items-start mt-6 mb-6 px-4">
              <img 
                src="https://ax0.taddy.org/general/danny-avatar-2.jpg"
                alt="Danny - Founder"
                className="w-[60px] h-[60px] rounded-full mr-3.5 border-2 border-white"
              />
              <div className="flex-1 pt-0.5">
                <p className="text-[15px] leading-[21px] text-gray-800 dark:text-gray-200 opacity-90">
                  👋 Hey! I'm Danny. I'm building Inkverse to help comic fans discover amazing indie comics. What would make Inkverse even better?
                </p>
              </div>
            </div>

            {/* Primary CTA Button */}
            <button
              onClick={handleSuggestFeature}
              disabled={settingsState.cannySso.isLoading}
              className={`w-full max-w-[320px] mx-auto flex items-center justify-center gap-2.5 bg-[#E85D4E] text-white font-semibold px-10 py-3.5 rounded-full transition-all shadow-md mb-3 ${
                settingsState.cannySso.isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {settingsState.cannySso.isLoading ? (
                <FaSpinner className="w-[18px] h-[18px] animate-spin" />
              ) : (
                <FaComments className="w-[18px] h-[18px]" />
              )}
              <span className="text-base tracking-wide">Suggest an improvement</span>
            </button>

            {/* Secondary email option */}
            <button
              onClick={handleEmailHelp}
              className="w-full text-center text-[15px] text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
            >
              or email me
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Confirm Logout
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}