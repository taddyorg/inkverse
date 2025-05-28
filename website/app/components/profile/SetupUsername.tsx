import { type UserDetailsState } from '@inkverse/shared-client/dispatch/user-details';

interface SetupUsernameProps {
  username: string;
  setUsername: (username: string) => void;
  userDetailsState: UserDetailsState;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function SetupUsername({ username, setUsername, userDetailsState, onSubmit }: SetupUsernameProps) {
  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="username" className="block text-inkverse-black dark:text-white font-semibold mb-1">
        Choose a username
      </label>
      <input
        type="text"
        id="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink dark:focus:ring-taddy-blue text-inkverse-black bg-white"
        placeholder="Enter your username"
        required
        autoFocus
      />

      <button
        type="submit"
        disabled={userDetailsState.isLoading}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors mt-4 ${
          userDetailsState.isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-brand-pink dark:bg-taddy-blue text-white font-semibold hover:bg-brand-pink-dark dark:hover:bg-taddy-blue-dark'
        }`}
      >
        {userDetailsState.isLoading ? 'Saving...' : 'Continue'}
      </button>

      {userDetailsState.error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {userDetailsState.error}
        </div>
      )}
    </form>
  );
}