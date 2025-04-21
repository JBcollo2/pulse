import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the pre-auth URL from localStorage
        const preAuthUrl = localStorage.getItem('preAuthUrl');
        
        // Clear the pre-auth URL from localStorage
        localStorage.removeItem('preAuthUrl');
        
        // Check if we have the access token cookie
        const hasAccessToken = document.cookie.includes('access_token');
        
        if (!hasAccessToken) {
          toast({
            title: "Error",
            description: "Failed to authenticate with Google. Please try again.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        // Redirect to the original URL or home page
        navigate(preAuthUrl || '/');
      } catch (error) {
        console.error('Error handling Google callback:', error);
        toast({
          title: "Error",
          description: "An error occurred during authentication. Please try again.",
          variant: "destructive"
        });
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p>Please wait while we redirect you back to the application.</p>
      </div>
    </div>
  );
};

export default GoogleCallback; 