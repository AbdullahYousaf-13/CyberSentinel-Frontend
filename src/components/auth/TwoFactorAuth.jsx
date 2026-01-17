import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const TwoFactorAuth = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const navigate = useNavigate();

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = e.target.parentElement.nextElementSibling?.querySelector('input');
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = e.target.parentElement.previousElementSibling?.querySelector('input');
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      // Handle 2FA verification logic here
      navigate('/dashboard');
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Two-Factor Authentication</h2>
      <p className="auth-subtitle">Enter the 6-digit code from your authenticator app</p>
      <div className="two-factor-inputs">
        {code.map((digit, index) => (
          <input
            key={index}
            type="text"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="two-factor-digit"
            required
          />
        ))}
      </div>
      <button type="submit" className="auth-button">
        Verify
      </button>
    </form>
  );
};

export default TwoFactorAuth;



