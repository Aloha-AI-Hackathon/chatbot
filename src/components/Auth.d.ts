import React from 'react';

interface AuthProps {
  onAuthSuccess: (token: string) => void;
  defaultMode?: 'login' | 'register';
}

declare const Auth: React.FC<AuthProps>;

export default Auth; 