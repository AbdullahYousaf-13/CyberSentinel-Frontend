import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../services/api';
import './AuthPage.css';
import '../components/auth/Auth.css';

const EmailVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        setStatus('success');
        setMessage('Email verified. Redirecting to login...');
        setTimeout(() => {
          navigate('/login', {
            state: { message: 'Email verified. You can now log in.' }
          });
        }, 1200);
      } catch (err) {
        setStatus('error');
        setMessage('Verification link is invalid or expired.');
      }
    };
    verify();
  }, [navigate, searchParams]);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="registration-container">
          <div className="registration-header">
            <h2>Email Verification</h2>
            <p>{status === 'success' ? 'Success' : status === 'error' ? 'Error' : 'Please wait'}</p>
          </div>
          <div className={status === 'error' ? 'form-error' : 'form-info'}>{message}</div>
          {status === 'error' && (
            <div className="form-actions-register">
              <button type="button" className="btn-primary" onClick={() => navigate('/login')}>
                Back To Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerifyPage;
