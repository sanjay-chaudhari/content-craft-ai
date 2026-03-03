import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useTranslationHelper } from '../../utils/useTranslationHelper';

interface VerifyAccountProps {
  username: string;
  onUsernameChange: (username: string) => void;
  onSignIn: () => void;
}

const VerifyAccount: React.FC<VerifyAccountProps> = ({ 
  username, 
  onUsernameChange, 
  onSignIn 
}) => {
  const [confirmationCode, setConfirmationCode] = useState('');
  const { confirmSignUp, error, setError, isLoading } = useAuth();
  const { t } = useTranslationHelper();

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username) {
      setError(t('AUTH.ERROR.USERNAME_REQUIRED'));
      return;
    }
    
    if (!confirmationCode) {
      setError(t('AUTH.ERROR.CONFIRMATION_CODE_REQUIRED'));
      return;
    }
    
    try {
      await confirmSignUp(username, confirmationCode);
      onSignIn(); // Redirect to sign in after successful confirmation
    } catch (error) {
      // Error is handled in the AuthContext
    }
  };

  return (
    <div className="bg-aws-blue-medium p-6 rounded shadow-lg max-w-md w-full">
      <h2 className="text-2xl font-bold text-aws-orange mb-6">{t('AUTH.CONFIRM.TITLE')}</h2>
      
      {error && (
        <div className="bg-aws-red bg-opacity-20 border border-aws-red text-white p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <p className="text-aws-gray-300 mb-4">
        {t('AUTH.CONFIRM.INSTRUCTIONS')}
      </p>
      
      <form onSubmit={handleConfirmSignUp} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-aws-gray-300 mb-1">
            {t('AUTH.CONFIRM.USERNAME')}
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            className="w-full p-2 bg-aws-blue-light border border-aws-gray-600 rounded text-aws-gray-100"
            required
          />
        </div>
        
        <div>
          <label htmlFor="confirmationCode" className="block text-sm font-medium text-aws-gray-300 mb-1">
            {t('AUTH.CONFIRM.CODE')}
          </label>
          <input
            id="confirmationCode"
            type="text"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
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
          {isLoading ? t('AUTH.CONFIRM.CONFIRMING') : t('AUTH.CONFIRM.CONFIRM')}
        </button>
        
        <div className="text-center mt-4">
          <p className="text-aws-gray-300">
            {t('AUTH.CONFIRM.BACK_TO_SIGN_IN')}{' '}
            <button
              type="button"
              onClick={onSignIn}
              className="text-aws-orange hover:underline"
            >
              {t('AUTH.CONFIRM.SIGN_IN')}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default VerifyAccount;
