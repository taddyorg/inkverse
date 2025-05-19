import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AuthProvider } from '@inkverse/public/graphql/types';

interface SignupData {
  email: string | null;
  provider: AuthProvider | null;
  providerId?: string;
  // We'll add more fields as needed
}

interface SignupContextType {
  signupData: SignupData;
  updateSignupData: (data: Partial<SignupData>) => void;
  resetSignupData: () => void;
}

const initialSignupData: SignupData = {
  email: null,
  provider: null,
  providerId: undefined,
};

const SignupContext = createContext<SignupContextType | undefined>(undefined);

export function SignupProvider({ children }: { children: ReactNode }) {
  const [signupData, setSignupData] = useState<SignupData>(initialSignupData);

  const updateSignupData = (data: Partial<SignupData>) => {
    setSignupData(prev => ({ ...prev, ...data }));
  };

  const resetSignupData = () => {
    setSignupData(initialSignupData);
  };

  return (
    <SignupContext.Provider value={{ signupData, updateSignupData, resetSignupData }}>
      {children}
    </SignupContext.Provider>
  );
}

export function useSignupContext() {
  const context = useContext(SignupContext);
  if (context === undefined) {
    throw new Error('useSignup must be used within a SignupProvider');
  }
  return context;
}