import { type UserDetailsState } from '@inkverse/shared-client/dispatch/user-details';

interface SetupBlueskyProps {
  blueskyHandle: string;
  setBlueskyHandle: (handle: string) => void;
  userDetailsState: UserDetailsState;
  currentStep: 'bluesky' | 'bluesky-verify';
  onVerify: (e: React.FormEvent) => Promise<void>;
  onConfirm: (did: string) => Promise<void>;
  onBack: () => void;
  onSkip: () => void;
}

export function SetupBluesky({ 
  blueskyHandle, 
  setBlueskyHandle, 
  userDetailsState, 
  currentStep,
  onVerify,
  onConfirm,
  onBack, 
  onSkip,
}: SetupBlueskyProps) {
  if (currentStep === 'bluesky') {
    return (
      <div className="space-y-4">
        <div className="text-center mt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Connect with Bluesky
          </h2>
          <p className="text-inkverse-black dark:text-gray-300 mb-6">
            Find Inkverse creators that you follow on Bluesky
          </p>
        </div>

        <form onSubmit={onVerify} className="space-y-4">
          <div>
            <label htmlFor="blueskyHandle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enter your Bluesky handle
            </label>
            <input
              type="text"
              id="blueskyHandle"
              value={blueskyHandle}
              onChange={(e) => setBlueskyHandle(e.target.value)}
              className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink dark:focus:ring-taddy-blue text-inkverse-black bg-white"
              placeholder="yourhandle.bsky.social"
              required
            />
          </div>

          {userDetailsState.error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {userDetailsState.error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={userDetailsState.isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                userDetailsState.isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-brand-pink dark:bg-taddy-blue text-white hover:bg-brand-pink-dark dark:hover:bg-taddy-blue-dark'
              }`}
            >
              {userDetailsState.isLoading ? 'Verifying...' : 'Continue'}
            </button>
          </div>

          <button
            onClick={onSkip}
            className="mx-auto block text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Skip for now
          </button>
        </form>
      </div>
    );
  }

  if (currentStep === 'bluesky-verify') {
    const profile = userDetailsState.blueskyProfile;
    
    return (
      <div className="space-y-4">
        <div className="text-center mt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Confirm Your Bluesky Account
          </h2>
        </div>

        {profile && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center space-x-4">
              {profile.avatar ? (
                <img 
                  src={profile.avatar} 
                  alt={profile.displayName || profile.handle}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {profile.displayName || profile.handle}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  @{profile.handle}
                </p>
              </div>
            </div>
            
            {profile.description && (
              <p className="text-gray-700 dark:text-gray-300">
                {profile.description}
              </p>
            )}
            
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 px-4 rounded-lg font-medium transition-colors border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            No, go back
          </button>
          <button
            type="button"
            onClick={() => onConfirm(profile.did)}
            disabled={userDetailsState.isLoading}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              userDetailsState.isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-brand-pink dark:bg-taddy-blue text-white hover:opacity-90'
            }`}
          >
            {userDetailsState.isLoading ? 'Saving...' : 'Yes, that\'s me!'}
          </button>
        </div>

        {userDetailsState.error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {userDetailsState.error}
          </div>
        )}
      </div>
    );
  }

  return null;
}