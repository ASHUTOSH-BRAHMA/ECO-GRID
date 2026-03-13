import React, { useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../Context/AuthContext';
import { handleerror, handlesuccess } from '../../utils';
import { API_BASE_URL } from '../config';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
let googleScriptPromise;

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener('load', resolve, { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  return googleScriptPromise;
};

const GoogleSignIn = ({ onSuccess, onError, userType = 'consumer', buttonText = 'Sign in with Google' }) => {
  const { login } = useContext(AuthContext);
  const buttonRef = useRef(null);

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

  useEffect(() => {

    if (!GOOGLE_CLIENT_ID || !buttonRef.current) {
      return;
    }

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !buttonRef.current) {
          return;
        }

        buttonRef.current.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: buttonText === 'Sign up with Google' ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
        });
      })
      .catch(() => {
        if (!cancelled) {
          handleerror('Failed to load Google Sign-In');
        }
      });

    return () => {
      cancelled = true;
      if (buttonRef.current) {
        buttonRef.current.innerHTML = '';
      }
    };
  }, [buttonText, login, onError, onSuccess, userType]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="w-full p-3 bg-gray-100 rounded-lg text-center text-gray-500 text-sm">
        Google Sign-In not configured
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full flex justify-center" />
    </div>
  );
};

export default GoogleSignIn;
