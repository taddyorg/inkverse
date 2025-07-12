import React, { useState, useReducer, useEffect, useRef } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaApple } from 'react-icons/fa';
import { MdEmail, MdArrowBack } from 'react-icons/md';
import { isAValidEmail } from '@inkverse/public/utils';
import { createPortal } from 'react-dom';
import config from '@/config';
import { useNavigate } from 'react-router';

import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import AppleSignin from 'react-apple-signin-auth';

import { 
  authReducer, 
  authInitialState, 
  dispatchLoginWithEmail,
  dispatchLoginWithGoogle,
  dispatchLoginWithApple,
  clearAuthError,
  AuthActionType
} from '@inkverse/shared-client/dispatch/authentication';

import { getUserDetails, isAuthenticated, webStorageFunctions } from '@/lib/auth/user';
import { getUserApolloClient } from '@/lib/apollo/client.client';
import { fetchAllHostingProviderTokens } from '@inkverse/shared-client/dispatch/hosting-provider';
import { saveHostingProviderRefreshToken } from '@/lib/auth/hosting-provider';
import { refreshHostingProviderAccessToken } from '@/lib/auth/hosting-provider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  hideComponent?: boolean;
  onAuthSuccess?: () => void;
}

type AuthMode = 'signup' | 'emailInput' | 'verifyEmail';

export function SignupModal({ isOpen, onClose, hideComponent = true, onAuthSuccess }: AuthModalProps) {
  const isUserAuthenticated = isAuthenticated();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [authState, dispatch] = useReducer(authReducer, authInitialState);
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const onTokenSuccessfullyReceivedQuickSignup = async () => {
    const userClient = getUserApolloClient();

    // Notify parent component of successful authentication
    onAuthSuccess?.();

    fetchAllHostingProviderTokens({ 
      userClient: userClient as any, 
      saveHostingProviderRefreshToken, 
      refreshHostingProviderAccessToken 
    })

    onClose();
  }

  const onTokenSuccessfullyReceived = async () => {
    const user = await getUserDetails();
    const userClient = getUserApolloClient();

    // Notify parent component of successful authentication
    onAuthSuccess?.();

    fetchAllHostingProviderTokens({ 
      userClient: userClient as any, 
      saveHostingProviderRefreshToken, 
      refreshHostingProviderAccessToken 
    })

    if (!user?.username) {
      navigate('/profile/setup');
    }

    // close modal
    onClose();
  }

  const handleGoogleLoginSuccessQuickSignup = async (credentialResponse: any) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }
      
      await dispatchLoginWithGoogle(
        { 
          baseUrl: config.AUTH_URL,
          source: 'web',
          googleIdToken: credentialResponse.credential,
          storageFunctions: webStorageFunctions,
          includeCredentials: true,
          onSuccessFunction: onTokenSuccessfullyReceivedQuickSignup
        },
        dispatch
      );
      
      // Close the modal on success
      onClose();
    } catch (err: any) {
      // Error is handled by the dispatch function
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse: any) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }
      
      await dispatchLoginWithGoogle(
        { 
          baseUrl: config.AUTH_URL,
          source: 'web',
          googleIdToken: credentialResponse.credential,
          storageFunctions: webStorageFunctions,
          includeCredentials: true,
          onSuccessFunction: onTokenSuccessfullyReceived
        },
        dispatch
      );
      
      // Close the modal on success
      onClose();
    } catch (err: any) {
      // Error is handled by the dispatch function
    }
  };
  
  const handleGoogleLoginError = () => {
    dispatch({ type: AuthActionType.AUTH_ERROR, payload: 'Google sign-in was unsuccessful' });
  };

  useGoogleOneTapLogin({
    onSuccess: handleGoogleLoginSuccessQuickSignup,
    onError: handleGoogleLoginError,
    disabled: isOpen || isUserAuthenticated
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMode('signup');
      setEmail('');
      dispatch({ type: AuthActionType.AUTH_RESET });
    }
  }, [isOpen]);

  // Handle body scroll locking
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;
    
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      const activeElement = document.activeElement as HTMLElement;
      setTimeout(() => {
        initialFocusRef.current?.focus();
      }, 0);
      
      return () => {
        activeElement?.focus?.();
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        onClose();
      }
      
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (event.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        } 
        else if (!event.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEmailSubmit = async () => {
    try {
      if (!isAValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      await dispatchLoginWithEmail(
        { baseUrl: config.AUTH_URL, email },
        dispatch
      );

      setMode('verifyEmail');

    } catch (err: any) {
      dispatch({ type: AuthActionType.AUTH_ERROR, payload: err?.message || 'Failed to submit email' });
    }
  };
  
  const handleAppleLogin = async (response: any) => {
    try {
      if (!response.authorization?.id_token) {
        throw new Error('No ID token received from Apple');
      }
      
      await dispatchLoginWithApple(
        { 
          baseUrl: config.AUTH_URL, 
          idToken: response.authorization.id_token,
          source: 'web',
          storageFunctions: webStorageFunctions,
          includeCredentials: true,
          onSuccessFunction: onTokenSuccessfullyReceived
        },
        dispatch
      );
      
      // Close the modal on success
      onClose();
    } catch (err: any) {
      // Error is handled by the dispatch function
    }
  };

  const handleAppleLoginError = (error: any) => {
    console.log('handleAppleLoginError Apple sign-in was unsuccessful');
  };

  if (!isOpen || !hideComponent) return null;
  
  // Modal content
  const modalContent = (
    <div 
      className="fixed inset-0 m-0 p-0 z-[9999] left-0 top-0 right-0 bottom-0 overflow-hidden"
      style={{
        position: 'fixed',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div 
        ref={modalRef}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={initialFocusRef}
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center w-10 h-10"
          aria-label="Close modal"
        >
          <IoClose className="w-5 h-5" />
        </button>

        {/* Back button - shown in email input mode */}
        {mode === 'emailInput' && (
          <button
            onClick={() => {
              setMode('signup');
              clearAuthError(dispatch);
            }}
            className="absolute left-4 top-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center w-10 h-10"
            aria-label="Back to sign up options"
          >
            <MdArrowBack className="w-5 h-5" />
          </button>
        )}

        {/* Signup Options */}
        {mode === 'signup' && (
          <>  
            <h2 id="auth-modal-title" className="text-xl font-bold mb-6 text-center">
              Sign Up / Log In to Inkverse
            </h2>

            <div className="space-y-3 mb-2">
              <div className="w-full flex justify-center mb-4">
                <div style={{ width: '240px' }}>
                  <GoogleLogin
                    onSuccess={handleGoogleLoginSuccess}
                    onError={handleGoogleLoginError}
                    ux_mode="popup"
                    size="large"
                    theme="outline"
                    shape="rectangular"
                    text="continue_with"
                    locale="en"
                    width="240"
                    context="signin"
                  />
                </div>
              </div>

              <div className="w-full flex justify-center">
                <div style={{ width: '240px' }}>
                  <AppleSignin
                    authOptions={{
                      clientId: config.APPLE_SERVICE_ID,
                      scope: 'email',
                      redirectURI: config.APPLE_REDIRECT_URI,
                      nonce: Math.random().toString(36).substring(2, 10),
                      usePopup: true,
                    }}
                    uiType="light"
                    onSuccess={handleAppleLogin}
                    onError={handleAppleLoginError}
                    render={({ onClick }: any) => (
                      <button
                        onClick={onClick}
                        disabled={authState.isLoading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        id="apple-sign-in-button"
                      >
                        <FaApple className="w-5 h-5" />
                        <span>Continue with Apple</span>
                      </button>
                    )}
                  />
                </div>
              </div>

              <div className="w-full flex justify-center">
                <div style={{ width: '240px' }}>
                  <button
                    onClick={() => {
                      setMode('emailInput');
                      clearAuthError(dispatch);
                    }}
                    disabled={authState.isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <MdEmail className="w-5 h-5" />
                    <span>Continue with Email</span>
                  </button>
                </div>
              </div>
            </div>

            {authState.error && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {authState.error}
              </div>
            )}

            {/* <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Please see our <a href="/terms-of-service" className="hover:underline" target='_blank'>Terms of Service</a> and <a href="/terms-of-service/privacy-policy" className="hover:underline" target='_blank'>Privacy Policy</a>.
            </p> */}
          </>
        )}

        {/* Email Input */}
        {mode === 'emailInput' && (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">Enter your email</h2>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink dark:focus:ring-taddy-blue text-inkverse-black"
              autoFocus
            />

            <button
              onClick={handleEmailSubmit}
              disabled={authState.isLoading || !email}
              className={`mt-4 px-6 py-3 font-medium rounded-full transition-colors w-full text-white ${
                authState.isLoading || !email
                  ? 'bg-brand-pink dark:bg-taddy-blue cursor-not-allowed opacity-50'
                  : 'bg-brand-pink hover:bg-brand-pink-dark dark:bg-taddy-blue dark:hover:bg-taddy-blue-dark'
              }`}
            >
              {authState.isLoading ? 'Sending...' : 'Submit'}
            </button>

            {authState.error && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {authState.error}
              </div>
            )}
          </>
        )}

        {/* Verify Email */}
        {mode === 'verifyEmail' && (
          <>
            <div className="mb-4 p-3 text-center">
              <span>We have sent an email to <span className="font-bold">{email}</span>.<br />Click the link in the email to verify your email address. (If you don't see it, check your spam folder.)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Use React Portal to render the modal at the root level
  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}