import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Amplify } from 'aws-amplify';
import { signIn, signUp, confirmSignUp, signOut, getCurrentUser, fetchUserAttributes, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { useTranslation } from 'react-i18next';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  signIn: (username: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  signUp: (username: string, password: string, email: string) => Promise<any>;
  confirmSignUp: (username: string, code: string) => Promise<any>;
  forgotPassword: (username: string) => Promise<any>;
  forgotPasswordSubmit: (username: string, code: string, newPassword: string) => Promise<any>;
  error: string | null;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      const userAttributes = await fetchUserAttributes();
      setUser({ ...currentUser, attributes: userAttributes });
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await signIn({ username, password });
      await checkAuthState(); // Refresh auth state after sign in
      return result;
    } catch (error: any) {
      console.error('Error signing in:', error);
      if (error.name === 'UserNotConfirmedException') {
        setError(t('AUTH.ERROR.USER_NOT_CONFIRMED'));
      } else if (error.name === 'NotAuthorizedException') {
        setError(t('AUTH.ERROR.INCORRECT_USERNAME_PASSWORD'));
      } else {
        setError(t('AUTH.ERROR.SIGN_IN_FAILED'));
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
      setError(t('AUTH.ERROR.SIGN_OUT_FAILED'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (username: string, password: string, email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
          },
          autoSignIn: true
        }
      });
      return result;
    } catch (error: any) {
      console.error('Error signing up:', error);
      if (error.name === 'UsernameExistsException') {
        setError(t('AUTH.ERROR.USERNAME_EXISTS'));
      } else {
        setError(t('AUTH.ERROR.SIGN_UP_FAILED'));
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignUp = async (username: string, code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      return await confirmSignUp({ username, confirmationCode: code });
    } catch (error: any) {
      console.error('Error confirming sign up:', error);
      if (error.name === 'CodeMismatchException') {
        setError(t('AUTH.ERROR.INVALID_CODE'));
      } else {
        setError(t('AUTH.ERROR.CONFIRM_SIGN_UP_FAILED'));
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (username: string) => {
    try {
      setIsLoading(true);
      setError(null);
      return await resetPassword({ username });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      setError(t('AUTH.ERROR.FORGOT_PASSWORD_FAILED'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (username: string, code: string, newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);
      return await confirmResetPassword({ username, confirmationCode: code, newPassword });
    } catch (error: any) {
      console.error('Error submitting new password:', error);
      if (error.name === 'CodeMismatchException') {
        setError(t('AUTH.ERROR.INVALID_CODE'));
      } else {
        setError(t('AUTH.ERROR.PASSWORD_RESET_FAILED'));
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    signIn: handleSignIn,
    signOut: handleSignOut,
    signUp: handleSignUp,
    confirmSignUp: handleConfirmSignUp,
    forgotPassword: handleForgotPassword,
    forgotPasswordSubmit: handleForgotPasswordSubmit,
    error,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
