import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the URL to redirect back to
        const preAuthUrl = localStorage.getItem('preAuthUrl');
        localStorage.removeItem('preAuthUrl'); // Clean up
        
        // Redirect back to the original URL or home page
        if (preAuthUrl) {
          window.location.href = preAuthUrl;
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error handling Google callback:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Completing Sign In...</h2>
        <p className="text-gray-600">Please wait while we redirect you back to the application.</p>
      </div>
    </div>
  );
};

export default GoogleCallback; 