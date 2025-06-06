interface SetupPatreonProps {
  currentStep: 'patreon' | 'patreon-connected';
  onConnect: () => void;
  onSkip: () => void;
  onBack: () => void;
  onContinue: () => void;
}

export function SetupPatreon({ currentStep, onConnect, onSkip, onBack, onContinue }: SetupPatreonProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mt-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Connect your Patreon
        </h2>
        <p className="text-inkverse-black dark:text-gray-300 mb-6">
          Find Inkverse creators that you follow on Patreon
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={onConnect}
          className="w-full py-3 px-4 rounded-lg font-medium transition-colors bg-[#FF424D] text-white hover:bg-[#E63946] flex items-center justify-center gap-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.003 3.5C5.897 3.5 5 4.397 5 5.503v13C5 19.607 5.897 20.5 7.003 20.5H8.5V3.5H7.003zm8.443 0c-2.734 0-4.947 2.213-4.947 4.946c0 2.734 2.213 4.947 4.947 4.947c2.734 0 4.948-2.213 4.948-4.947c0-2.733-2.214-4.946-4.948-4.946z"/>
          </svg>
          Connect with Patreon
        </button>

        <button
          onClick={onSkip}
          className="mx-auto block text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}