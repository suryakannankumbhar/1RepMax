import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setError('');
      setIsLoading(true);
      await login();
      // React Router will automatically push them to the home screen 
      // because the currentUser state will change in App.jsx
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-full max-w-sm bg-surface p-8 rounded-2xl border border-muted/20">
        <h1 className="text-3xl font-bold text-accent mb-2">1RepMax</h1>
        <p className="text-muted text-sm mb-8">Your minimalist lifting ledger.</p>
        
        {error && <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg mb-4 border border-red-500/20">{error}</div>}
        
        <button 
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-highlight text-white font-semibold py-3 px-4 rounded-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? 'Connecting...' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
}