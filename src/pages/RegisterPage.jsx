import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import AuthScaleFit from '../components/auth/AuthScaleFit';
import './AuthPage.css';

const RegisterPage = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <AuthScaleFit>
          <RegisterForm />
        </AuthScaleFit>
      </div>
    </div>
  );
};

export default RegisterPage;



