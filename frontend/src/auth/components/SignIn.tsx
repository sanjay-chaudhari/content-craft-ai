import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useTranslationHelper } from '../../utils/useTranslationHelper';

interface SignInProps {
  onSignUp: () => void;
  onForgotPassword: () => void;
  onVerifyAccount: () => void;
}

const SignIn: React.FC<SignInProps> = ({ onSignUp, onForgotPassword, onVerifyAccount }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, error, setError, isLoading } = useAuth();
  const { t } = useTranslationHelper();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError(t('AUTH.ERROR.ALL_FIELDS_REQUIRED'));
      return;
    }
    
    try {
      await signIn(username, password);
    } catch (error: any) {
      // Error is handled in the AuthContext
      
      // If the error is about user not being confirmed, suggest verification
      if (error.name === 'UserNotConfirmedException') {
        // This is handled in AuthContext, but we could add additional UI here if needed
      }
    }
  };

  return (
    <div className="bg-aws-blue-medium p-6 rounded shadow-lg max-w-md w-full">
      <h2 className="text-2xl font-bold text-aws-orange mb-6">{t('AUTH.SIGN_IN.TITLE')}</h2>
      
      {error && (
        <div className="bg-aws-red bg-opacity-20 border border-aws-red text-white p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-aws-gray-300 mb-1">
            {t('AUTH.SIGN_IN.USERNAME')}
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 bg-aws-blue-light border border-aws-gray-600 rounded text-aws-gray-100"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-aws-gray-300 mb-1">
            {t('AUTH.SIGN_IN.PASSWORD')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 bg-aws-blue-light border border-aws-gray-600 rounded text-aws-gray-100"
            required
          />
        </div>
        
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-aws-orange text-sm hover:underline"
        >
          {t('AUTH.SIGN_IN.FORGOT_PASSWORD')}
        </button>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-aws-orange text-aws-blue-dark py-2 rounded hover:bg-aws-yellow transition-colors ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? t('AUTH.SIGN_IN.SIGNING_IN') : t('AUTH.SIGN_IN.SIGN_IN')}
        </button>
        
        <div className="text-center mt-4">
          <p className="text-aws-gray-300">
            {t('AUTH.SIGN_IN.NO_ACCOUNT')}{' '}
            <button
              type="button"
              onClick={onSignUp}
              className="text-aws-orange hover:underline"
            >
              {t('AUTH.SIGN_IN.SIGN_UP')}
            </button>
          </p>
          
          <p className="text-aws-gray-300 mt-2">
            {t('AUTH.SIGN_IN.NEED_VERIFICATION')}{' '}
            <button
              type="button"
              onClick={onVerifyAccount}
              className="text-aws-orange hover:underline"
            >
              {t('AUTH.SIGN_IN.VERIFY_ACCOUNT')}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignIn;
