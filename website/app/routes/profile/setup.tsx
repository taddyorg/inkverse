import { useState, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router';
import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { getApolloClient } from '@/lib/apollo/client.client';
import { type ApolloClient } from '@apollo/client';
import { UserAgeRange } from '@inkverse/public/graphql/types';
import { getMetaTags } from '@/lib/seo';
import { 
  authReducer, 
  authInitialState,
  dispatchUpdateUserProfile,
  AuthActionType
} from '@inkverse/shared-client/dispatch/authentication';

export default function AccountSetup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [ageRange, setAgeRange] = useState<UserAgeRange | ''>('');
  const [birthYear, setBirthYear] = useState('');
  const [authState, dispatch] = useReducer(authReducer, authInitialState);

  // TODO: Check if user is authenticated and redirect if not
  // This would require implementing auth context or state management

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: AuthActionType.AUTH_CLEAR_ERROR });

    try {
      // Validate inputs
      if (!username.trim()) {
        throw new Error('Username is required');
      }
      if (!ageRange) {
        throw new Error('Age range is required');
      }
      if (ageRange === UserAgeRange.UNDER_18 && !birthYear) {
        throw new Error('Birth year is required for users under 18');
      }

      // Call updateUserProfile mutation
      const client = getApolloClient() as ApolloClient<any>;
      await dispatchUpdateUserProfile(
        { 
          publicClient: client,
          username: username.trim(),
          ageRange,
          birthYear: birthYear ? parseInt(birthYear) : undefined,
        },
        dispatch
      );

      // Navigate to home after successful update
      navigate('/');
    } catch (err: any) {
      // Error is handled by the dispatch function
    }
  };

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 100;
  const maxYear = currentYear - 13; // Must be at least 13 years old

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Complete Your Profile</h1>
        
        {authState.error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {authState.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink dark:focus:ring-taddy-blue text-inkverse-black dark:text-white bg-white dark:bg-gray-700"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label htmlFor="ageRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Age Range
            </label>
            <select
              id="ageRange"
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value as UserAgeRange)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink dark:focus:ring-taddy-blue text-inkverse-black dark:text-white bg-white dark:bg-gray-700"
              required
            >
              <option value="">Select your age range</option>
              <option value={UserAgeRange.UNDER_18}>Under 18</option>
              <option value={UserAgeRange.AGE_18_24}>18 to 24</option>
              <option value={UserAgeRange.AGE_25_34}>25 to 34</option>
              <option value={UserAgeRange.AGE_35_PLUS}>35+</option>
            </select>
          </div>

          {ageRange === UserAgeRange.UNDER_18 && (
            <div>
              <label htmlFor="birthYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Birth Year
              </label>
              <select
                id="birthYear"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink dark:focus:ring-taddy-blue text-inkverse-black dark:text-white bg-white dark:bg-gray-700"
                required
              >
                <option value="">Select your birth year</option>
                {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={authState.isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              authState.isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-brand-pink dark:bg-taddy-blue text-white hover:opacity-90'
            }`}
          >
            {authState.isLoading ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          By completing your profile, you agree to our{' '}
          <a href="/terms-of-service" className="hover:underline text-brand-pink dark:text-taddy-blue">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/terms-of-service/privacy-policy" className="hover:underline text-brand-pink dark:text-taddy-blue">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const seoMetaData = getMetaTags(url.href);
  
  return {
    seoMetaData,
  };
}