import { useState, useEffect } from 'react';
import { type UserDetailsState } from '@inkverse/shared-client/dispatch/user-details';
import { validateUsername } from '@inkverse/public/user';

interface SetupUsernameProps {
  username: string;
  setUsername: (username: string) => void;
  userDetailsState: UserDetailsState;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  mode?: 'setup' | 'edit';
  currentUsername?: string;
  onCancel?: () => void;
}

export function SetupUsername({ username, setUsername, userDetailsState, onSubmit, mode = 'setup', currentUsername, onCancel }: SetupUsernameProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);

  // Validate username in real-time
  useEffect(() => {
    if (username.trim().length === 0) {
      setValidationError(null);
      setIsValid(false);
      return;
    }

    // If in edit mode and username hasn't changed, it's valid
    if (mode === 'edit' && username.trim() === currentUsername) {
      setValidationError(null);
      setIsValid(true);
      return;
    }

    const validation = validateUsername(username);
    if (validation.hide) {
      setValidationError(null);
      return;
    }

    setValidationError(validation.error || null);
    setIsValid(validation.isValid);
  }, [username, mode, currentUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit if validation fails or username hasn't changed in edit mode
    if (!isValid || validationError || (mode === 'edit' && username.trim() === currentUsername)) {
      return;
    }
    
    await onSubmit(e);
  };

  const hasChanges = mode === 'edit' ? username.trim() !== currentUsername : true;

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="username" className="block text-inkverse-black dark:text-white font-semibold mb-1">
        Choose a username
      </label>
      
      <div className="relative">
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={`w-full px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 text-inkverse-black bg-white transition-colors border-gray-300 dark:border-gray-600 focus:ring-brand-pink dark:focus:ring-taddy-blue`}
          placeholder='Enter your username'
          required
          autoFocus
        />
      </div>

      {/* Validation error */}
      {validationError && hasChanges && (
        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {validationError}
        </div>
      )}

      {mode === 'edit' ? (
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-lg font-semibold transition-colors border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={userDetailsState.isLoading || !isValid || !hasChanges}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              userDetailsState.isLoading || !isValid || !hasChanges
                ? 'bg-brand-pink dark:bg-taddy-blue text-white'
                : 'bg-brand-pink dark:bg-taddy-blue text-white font-semibold hover:bg-brand-pink-dark dark:hover:bg-taddy-blue-dark'
            }`}
          >
            {userDetailsState.isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={userDetailsState.isLoading || !isValid}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors mt-4 ${
            userDetailsState.isLoading || !isValid
              ? 'bg-brand-pink dark:bg-taddy-blue text-white'
              : 'bg-brand-pink dark:bg-taddy-blue text-white font-semibold hover:bg-brand-pink-dark dark:hover:bg-taddy-blue-dark'
          }`}
        >
          {userDetailsState.isLoading ? 'Saving...' : 'Continue'}
        </button>
      )}

      {/* Server-side errors */}
      {userDetailsState.error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {userDetailsState.error}
        </div>
      )}
    </form>
  );
}