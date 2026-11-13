import React from 'react';

export const AuthLayout = ({ children }) => {
  return (
    <div className="layout auth-layout">
      <div className="auth-card">
        <header className="auth-header">
          <h1>DropPilot AI</h1>
        </header>
        <div className="auth-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

