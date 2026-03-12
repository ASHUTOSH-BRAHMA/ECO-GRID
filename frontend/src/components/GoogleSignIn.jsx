import React, { useEffect, useContext } from 'react';
import { AuthContext } from '../Context/AuthContext';
import { handleerror, handlesuccess } from '../../utils';
import { API_BASE_URL } from '../config';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleSignIn = ({ onSuccess, onError, userType = 'consumer', buttonText = 'Sign in with Google' }) => {
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google && GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular',
          }
        );
      }
    };

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: response.credential,
          userType,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Store token
        localStorage.setItem('authToken', data.token);

        // Update auth context — pass user as flat doc (Shape B)
        // AuthContext.login + normalizeUser will handle it correctly
        if (login) {
          login({
            token: data.token,
            persist: true,
            user: data.user,
          });
        }

        handlesuccess(data.message);

        // Pass the FULL response to the parent so it can read
        // data.isNewUser, data.userType, data.token, data.user all at once
        if (onSuccess) onSuccess(data);
      } else {
        handleerror(data.message || 'Google sign-in failed');
        if (onError) onError(data.message);
      }
    } catch (error) {
      console.error('Google auth error:', error);
      handleerror('Failed to authenticate with Google');
      if (onError) onError(error.message);
    }
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="w-full p-3 bg-gray-100 rounded-lg text-center text-gray-500 text-sm">
        Google Sign-In not configured
      </div>
    );
  }

  return (
    <div className="w-full">
      <div id="google-signin-button" className="w-full flex justify-center" />
    </div>
  );
};

export default GoogleSignIn;