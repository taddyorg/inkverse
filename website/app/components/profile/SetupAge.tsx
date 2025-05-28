import { UserAgeRange } from '@inkverse/public/graphql/types';
import { type UserDetailsState } from '@inkverse/shared-client/dispatch/user-details';

interface SetupAgeProps {
  ageRange: UserAgeRange | '';
  setAgeRange: (ageRange: UserAgeRange | '') => void;
  birthYear: string;
  setBirthYear: (birthYear: string) => void;
  userDetailsState: UserDetailsState;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function SetupAge({ ageRange, setAgeRange, birthYear, setBirthYear, userDetailsState, onSubmit }: SetupAgeProps) {
  const currentYear = new Date().getFullYear();

  return (
    <form onSubmit={onSubmit} className="mt-6">
      <label className="block text-inkverse-black dark:text-white font-semibold mb-1">
        Select your age range
      </label>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={() => setAgeRange(UserAgeRange.UNDER_18)}
          className={`p-4 rounded-lg font-medium transition-colors border-2 ${
            ageRange === UserAgeRange.UNDER_18
              ? 'border-brand-pink dark:border-taddy-blue bg-pink-200 dark:bg-taddy-blue text-brand-pink dark:text-white'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-white text-gray-700 dark:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-50'
          }`}
        >
          Under 18
        </button>
        <button
          type="button"
          onClick={() => setAgeRange(UserAgeRange.AGE_18_24)}
          className={`p-4 rounded-lg font-medium transition-colors border-2 ${
            ageRange === UserAgeRange.AGE_18_24
              ? 'border-brand-pink dark:border-taddy-blue bg-pink-200 dark:bg-taddy-blue text-brand-pink dark:text-white'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-white text-gray-700 dark:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-50'
          }`}
        >
          18 to 24
        </button>
        <button
          type="button"
          onClick={() => setAgeRange(UserAgeRange.AGE_25_34)}
          className={`p-4 rounded-lg font-medium transition-colors border-2 ${
            ageRange === UserAgeRange.AGE_25_34
              ? 'border-brand-pink dark:border-taddy-blue bg-pink-200 dark:bg-taddy-blue text-brand-pink dark:text-white'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-white text-gray-700 dark:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-50'
          }`}
        >
          25 to 34
        </button>
        <button
          type="button"
          onClick={() => setAgeRange(UserAgeRange.AGE_35_PLUS)}
          className={`p-4 rounded-lg font-medium transition-colors border-2 ${
            ageRange === UserAgeRange.AGE_35_PLUS
              ? 'border-brand-pink dark:border-taddy-blue bg-pink-200 dark:bg-taddy-blue text-brand-pink dark:text-white'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-white text-gray-700 dark:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-50'
          }`}
        >
          35+
        </button>
      </div>

      {ageRange === UserAgeRange.UNDER_18 && (
        <div className="mb-2">
          <label htmlFor="birthYear" className="block text-inkverse-black dark:text-white mt-4 mb-1 font-semibold">
            Birth Year (some comics are age restricted)
          </label>
          <select
            id="birthYear"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            className="w-full px-4 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink dark:focus:ring-taddy-blue text-inkverse-black bg-white"
            required
          >
            <option value="">Select your birth year</option>
            {Array.from({ length: 18 }, (_, i) => currentYear - 17 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={userDetailsState.isLoading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          userDetailsState.isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-brand-pink dark:bg-taddy-blue text-white font-semibold hover:bg-brand-pink-dark dark:hover:bg-taddy-blue-dark'
        }`}
      >
        {userDetailsState.isLoading ? 'Saving...' : 'Continue'}
      </button>
    </form>
  );
}