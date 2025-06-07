import { useState, useEffect } from 'react';
import { type UserDetailsState } from '@inkverse/shared-client/dispatch/user-details';
import { validateUsername } from '@inkverse/public/user';

interface SetupUsernameProps {
  username: string;
  setUsername: (username: string) => void;
  userDetailsState: UserDetailsState;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function SetupUsername({ username, setUsername, userDetailsState, onSubmit }: SetupUsernameProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [showRequirements, setShowRequirements] = useState<boolean>(false);

  // Validate username in real-time
  useEffect(() => {
    if (username.trim().length === 0) {
      setValidationError(null);
      setIsValid(false);
      return;
    }

    const validation = validateUsername(username);
    setValidationError(validation.error || null);
    setIsValid(validation.isValid);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit if validation fails
    if (!isValid || validationError) {
      return;
    }
    
    await onSubmit(e);
  };

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
          onFocus={() => setShowRequirements(true)}
          onBlur={() => setShowRequirements(false)}
          className={`w-full px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 text-inkverse-black bg-white transition-colors ${
            username.length === 0 
              ? 'border-gray-300 dark:border-gray-600 focus:ring-brand-pink dark:focus:ring-taddy-blue' 
              : isValid
                ? 'border-green-400 focus:ring-green-400'
                : 'border-red-400 focus:ring-red-400'
          }`}
          placeholder="Enter your username"
          required
          autoFocus
        />
        
        {username.length > 0 && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <span className="text-green-500 text-sm">✓</span>
            ) : (
              <span className="text-red-500 text-sm">✗</span>
            )}
          </div>
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {validationError}
        </div>
      )}

      <button
        type="submit"
        disabled={userDetailsState.isLoading || !isValid}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors mt-4 ${
          userDetailsState.isLoading || !isValid
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-brand-pink dark:bg-taddy-blue text-white font-semibold hover:bg-brand-pink-dark dark:hover:bg-taddy-blue-dark'
        }`}
      >
        {userDetailsState.isLoading ? 'Saving...' : 'Continue'}
      </button>

      {/* Server-side errors */}
      {userDetailsState.error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {userDetailsState.error}
        </div>
      )}
    </form>
  );
}