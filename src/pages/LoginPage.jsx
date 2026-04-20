import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import AuthScaleFit from '../components/auth/AuthScaleFit';
import './AuthPage.css';

const LoginPage = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <AuthScaleFit>
          <LoginForm />
        </AuthScaleFit>
      </div>
    </div>
  );
};

export default LoginPage;



