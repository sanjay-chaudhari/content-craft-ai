import React, { useState } from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';
import VerifyAccount from './VerifyAccount';
import ForgotPassword from './ForgotPassword';
import { useTranslationHelper } from '../../utils/useTranslationHelper';

enum AuthState {
  SIGN_IN,
  SIGN_UP,
  VERIFY_ACCOUNT,
  FORGOT_PASSWORD
}

const AuthContainer: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>(AuthState.SIGN_IN);
  const [username, setUsername] = useState('');
  const { t } = useTranslationHelper();

  const renderAuthComponent = () => {
    switch (authState) {
      case AuthState.SIGN_IN:
        return (
          <SignIn
            onSignUp={() => setAuthState(AuthState.SIGN_UP)}
            onForgotPassword={() => setAuthState(AuthState.FORGOT_PASSWORD)}
            onVerifyAccount={() => setAuthState(AuthState.VERIFY_ACCOUNT)}
          />
        );
      case AuthState.SIGN_UP:
        return (
          <SignUp
            onSignIn={() => setAuthState(AuthState.SIGN_IN)}
            onSignUpComplete={(username) => {
              setUsername(username);
              setAuthState(AuthState.VERIFY_ACCOUNT);
            }}
          />
        );
      case AuthState.VERIFY_ACCOUNT:
        return (
          <VerifyAccount
            username={username}
            onUsernameChange={setUsername}
            onSignIn={() => setAuthState(AuthState.SIGN_IN)}
          />
        );
      case AuthState.FORGOT_PASSWORD:
        return (
          <ForgotPassword
            onSignIn={() => setAuthState(AuthState.SIGN_IN)}
          />
        );
      default:
        return (
          <SignIn
            onSignUp={() => setAuthState(AuthState.SIGN_UP)}
            onForgotPassword={() => setAuthState(AuthState.FORGOT_PASSWORD)}
            onVerifyAccount={() => setAuthState(AuthState.VERIFY_ACCOUNT)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-aws-blue-dark flex items-center justify-center">
      <div className="bg-aws-blue-medium p-8 rounded shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-aws-orange mb-6 text-center">
          {t('APP.WELCOME')}
        </h1>
        {renderAuthComponent()}
      </div>
    </div>
  );
};

export default AuthContainer;
