import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useTranslationHelper } from '../../utils/useTranslationHelper';

interface ForgotPasswordProps {
  onSignIn: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSignIn }) => {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  
  const { forgotPassword, forgotPasswordSubmit, error, setError, isLoading } = useAuth();
  const { t } = useTranslationHelper();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username) {
      setError(t('AUTH.ERROR.USERNAME_REQUIRED'));
      return;
    }
    
    try {
      await forgotPassword(username);
      setCodeSent(true);
    } catch (error) {
      // Error is handled in the AuthContext
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code) {
      setError(t('AUTH.ERROR.CONFIRMATION_CODE_REQUIRED'));
      return;
    }
    
    if (!newPassword) {
      setError(t('AUTH.ERROR.ALL_FIELDS_REQUIRED'));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError(t('AUTH.ERROR.PASSWORDS_DO_NOT_MATCH'));
      return;
    }
    
    try {
      await forgotPasswordSubmit(username, code, newPassword);
      onSignIn(); // Redirect to sign in after successful password reset
    } catch (error) {
      // Error is handled in the AuthContext
    }
  };

  return (
    <div className="bg-aws-blue-medium p-6 rounded shadow-lg max-w-md w-full">
      <h2 className="text-2xl font-bold text-aws-orange mb-6">
        {codeSent ? t('AUTH.NEW_PASSWORD.TITLE') : t('AUTH.FORGOT_PASSWORD.TITLE')}
      </h2>
      
      {error && (
        <div className="bg-aws-red bg-opacity-20 border border-aws-red text-white p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {!codeSent ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-aws-gray-300 mb-1">
              {t('AUTH.FORGOT_PASSWORD.USERNAME')}
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
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-aws-orange text-aws-blue-dark py-2 rounded hover:bg-aws-yellow transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? t('AUTH.FORGOT_PASSWORD.SUBMITTING') : t('AUTH.FORGOT_PASSWORD.SUBMIT')}
          </button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onSignIn}
              className="text-aws-orange hover:underline"
            >
              {t('AUTH.FORGOT_PASSWORD.BACK')}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-aws-gray-300 mb-1">
              {t('AUTH.NEW_PASSWORD.CODE')}
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-2 bg-aws-blue-light border border-aws-gray-600 rounded text-aws-gray-100"
              required
            />
          </div>
          
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-aws-gray-300 mb-1">
              {t('AUTH.NEW_PASSWORD.PASSWORD')}
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 bg-aws-blue-light border border-aws-gray-600 rounded text-aws-gray-100"
              required
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-aws-gray-300 mb-1">
              {t('AUTH.NEW_PASSWORD.CONFIRM_PASSWORD')}
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
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-aws-orange text-aws-blue-dark py-2 rounded hover:bg-aws-yellow transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? t('AUTH.NEW_PASSWORD.SUBMITTING') : t('AUTH.NEW_PASSWORD.SUBMIT')}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
