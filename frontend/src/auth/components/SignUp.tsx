import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useTranslationHelper } from '../../utils/useTranslationHelper';

interface SignUpProps {
  onSignIn: () => void;
  onSignUpComplete: (username: string) => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSignIn, onSignUpComplete }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { signUp, error, setError, isLoading } = useAuth();
  const { t } = useTranslationHelper();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email || !password || !confirmPassword) {
      setError(t('AUTH.ERROR.ALL_FIELDS_REQUIRED'));
      return;
    }
    
    if (password !== confirmPassword) {
      setError(t('AUTH.ERROR.PASSWORDS_DO_NOT_MATCH'));
      return;
    }
    
    try {
      const result = await signUp(username, password, email);
      console.log("Sign up result:", result);
      
      // Immediately redirect to verification screen
      onSignUpComplete(username);
    } catch (error) {
      // Error is handled in the AuthContext
    }
  };

  return (
    <div className="bg-aws-blue-medium p-6 rounded shadow-lg max-w-md w-full">
      <h2 className="text-2xl font-bold text-aws-orange mb-6">{t('AUTH.SIGN_UP.TITLE')}</h2>
      
      {error && (
        <div className="bg-aws-red bg-opacity-20 border border-aws-red text-white p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-aws-gray-300 mb-1">
            {t('AUTH.SIGN_UP.USERNAME')}
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
          <label htmlFor="email" className="block text-sm font-medium text-aws-gray-300 mb-1">
            {t('AUTH.SIGN_UP.EMAIL')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 bg-aws-blue-light border border-aws-gray-600 rounded text-aws-gray-100"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-aws-gray-300 mb-1">
            {t('AUTH.SIGN_UP.PASSWORD')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 bg-aws-blue-light border border-aws-gray-600 rounded text-aws-gray-100"
            required
          />
          <p className="text-xs text-aws-gray-400 mt-1">
            {t('AUTH.SIGN_UP.PASSWORD_REQUIREMENTS')}
          </p>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-aws-gray-300 mb-1">
            {t('AUTH.SIGN_UP.CONFIRM_PASSWORD')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 bg-aws-blue-light border border-aws-gray-600 rounded text-aws-gray-100"
            required
          />
        </div>
        
        <div className="text-xs text-aws-gray-400 mt-2">
          {t('AUTH.LEGAL.TERMS_NOTICE')}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-aws-orange text-aws-blue-dark py-2 rounded hover:bg-aws-yellow transition-colors ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? t('AUTH.SIGN_UP.SIGNING_UP') : t('AUTH.SIGN_UP.SIGN_UP')}
        </button>
        
        <div className="text-center mt-4">
          <p className="text-aws-gray-300">
            {t('AUTH.SIGN_UP.HAVE_ACCOUNT')}{' '}
            <button
              type="button"
              onClick={onSignIn}
              className="text-aws-orange hover:underline"
            >
              {t('AUTH.SIGN_UP.SIGN_IN')}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignUp;
