import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Dialog, DialogContent } from './ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import * as lucideReact from 'lucide-react';
import { useAuth, getRoleBasedRedirect } from '@/contexts/AuthContext';

const AuthCard = ({ isOpen, onClose, initialView = 'signin', toast }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { loginUser, refreshUser, user, isAuthenticated } = useAuth();

  // Get token from URL if present
  const resetTokenFromUrl = searchParams.get('token') ||
    (location.pathname.match(/\/reset-password\/([^\/]+)/)?.[1]);

  // State management
  const [currentView, setCurrentView] = useState(initialView);
  const [token, setToken] = useState(resetTokenFromUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tokenValidated, setTokenValidated] = useState(false);

  // Sign In state
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Sign Up state
  const [signUpData, setSignUpData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: ''
  });

  // Forgot Password state
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  // Reset Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ENHANCED Role-based redirect handler with better state management
  const handleSuccessfulAuth = useCallback(async (userData, redirectDelay = 800) => {
    try {
      console.log('🚀 Starting authentication success flow for user:', userData);

      // Normalize user data to ensure consistency
      const normalizedUser = {
        id: userData.id || userData.user_id,
        name: userData.name || userData.full_name || userData.username,
        email: userData.email,
        role: userData.role,
        full_name: userData.full_name,
        phone_number: userData.phone_number,
        ...userData
      };

      console.log('✅ Normalized user data:', normalizedUser);

      // Immediate state updates
      loginUser(normalizedUser);

      // Show success message
      const displayName = normalizedUser.full_name || normalizedUser.name || normalizedUser.email;
      setSuccessMessage(`Welcome back, ${displayName}!`);

      // Close the auth modal immediately
      if (onClose) {
        onClose();
      }

      // Show success toast
      if (toast) {
        toast({
          title: "Login Successful",
          description: `Welcome ${displayName}! Redirecting to your dashboard...`,
          variant: "default"
        });
      }

      // Trigger immediate auth state change event
      const authEvent = new CustomEvent('auth-state-changed', { 
        detail: { 
          user: normalizedUser, 
          action: 'login',
          timestamp: Date.now()
        } 
      });
      window.dispatchEvent(authEvent);

      // Cross-tab sync
      localStorage.setItem('auth-login', Date.now().toString());
      setTimeout(() => localStorage.removeItem('auth-login'), 100);

      // Role-based redirect with proper timing
      setTimeout(async () => {
        const redirectPath = getRoleBasedRedirect(normalizedUser.role);
        console.log(`🎯 Redirecting ${normalizedUser.role} user to: ${redirectPath}`);
        
        // Force navigate with replace to avoid back button issues
        navigate(redirectPath, { 
          replace: true,
          state: { fromAuth: true, userRole: normalizedUser.role }
        });

        // Ensure auth context is fully synced after navigation
        setTimeout(async () => {
          try {
            await refreshUser();
            console.log('🔄 User context refreshed after redirect');
          } catch (error) {
            console.warn('⚠️ Context refresh failed, but user should still be authenticated:', error);
          }
        }, 100);
      }, redirectDelay);

    } catch (error) {
      console.error('❌ Error in handleSuccessfulAuth:', error);
      setError('Authentication successful but redirect failed. Please refresh the page.');
    }
  }, [onClose, toast, loginUser, navigate, refreshUser]);

  // Helper to reset all form-specific states when changing views
  const resetFormStates = useCallback(() => {
    setError('');
    setSuccessMessage('');
    setIsLoading(false);
    setTokenValidated(false);
    setSignInData({ email: '', password: '' });
    setSignUpData({ full_name: '', email: '', phone_number: '', password: '' });
    setForgotPasswordEmail('');
    setNewPassword('');
    setConfirmPassword('');
  }, []);

  const toggleForm = useCallback((view) => {
    setCurrentView(view);
    resetFormStates();
  }, [resetFormStates]);

  // Token validation function
  const validateResetToken = useCallback(async (tokenToValidate) => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    setTokenValidated(false);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/reset-password/${tokenToValidate}`,
        { withCredentials: true }
      );

      if (response.status === 200) {
        setSuccessMessage(response.data.msg || 'Token is valid. You can now reset your password.');
        setTokenValidated(true);
      }
    } catch (error) {
      console.error('Token validation error:', error);
      let errorMessage = 'Invalid or expired reset token. Please request a new password reset.';
      if (axios.isAxiosError(error) && error.response && error.response.data.msg) {
        errorMessage = error.response.data.msg;
      }
      setError(errorMessage);
      setTokenValidated(false);

      setTimeout(() => {
        toggleForm('forgot-password');
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  }, [toggleForm]);

  // Auto-detect reset password flow on component mount or URL change
  useEffect(() => {
    if (resetTokenFromUrl) {
      setCurrentView('reset-password');
      setToken(resetTokenFromUrl);
      validateResetToken(resetTokenFromUrl);
    } else {
      setCurrentView(initialView);
    }
  }, [resetTokenFromUrl, validateResetToken, initialView]);

  // Sign In handlers
  const handleSignInChange = (e) => {
    const { id, value } = e.target;
    const field = id.replace('signin-', '');
    setSignInData(prev => ({ ...prev, [field]: value }));
  };

  // ENHANCED SIGN IN HANDLER with better error handling and state management
  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log('🔐 Starting sign in process...');

      // Make login request
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        signInData,
        { 
          withCredentials: true,
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('✅ Login API response:', response.data);

      // Extract user data from response with multiple fallback strategies
      let userData = null;

      if (response.data.user) {
        userData = response.data.user;
      } else if (response.data.id || response.data.email) {
        userData = response.data;
      } else {
        console.log('🔍 User data not in login response, fetching profile...');
        // Fallback: fetch user profile
        const profileResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/profile`,
          { 
            withCredentials: true,
            timeout: 5000
          }
        );
        userData = profileResponse.data;
        console.log('✅ Profile fetch successful:', userData);
      }

      // Validate essential user data
      if (!userData) {
        throw new Error('No user data received from server');
      }

      if (!userData.role) {
        throw new Error('User role not found in response');
      }

      if (!userData.email) {
        throw new Error('User email not found in response');
      }

      console.log('🎉 Authentication successful, processing redirect...');

      // Handle successful login with role-based redirect
      await handleSuccessfulAuth(userData);

    } catch (error) {
      console.error('❌ Sign in error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout. Please check your connection and try again.';
        } else if (error.response) {
          errorMessage = error.response.data?.msg || 'Sign in failed. Please check your credentials.';
        } else if (error.request) {
          errorMessage = 'Network error. Please check your connection.';
        }
      } else if (error.message.includes('User role not found')) {
        errorMessage = 'Authentication successful but user role is missing. Please contact support.';
      } else if (error.message.includes('No user data received')) {
        errorMessage = 'Authentication failed. Please try again.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up handlers
  const handleSignUpChange = (e) => {
    const { id, value } = e.target;
    const field = id.replace('signup-', '');
    setSignUpData(prev => ({ ...prev, [field]: value }));
  };

  // ENHANCED SIGN UP HANDLER with immediate login capability
  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log('📝 Starting sign up process...');

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        signUpData,
        { 
          withCredentials: true,
          timeout: 10000
        }
      );

      console.log('✅ Sign up successful:', response.data);

      // Check if user is automatically logged in after registration
      if (response.data.user && response.data.user.role) {
        console.log('🎉 Auto-login after registration detected');
        setSuccessMessage('Account created successfully! Redirecting to your dashboard...');
        await handleSuccessfulAuth(response.data.user);
      } else {
        // Traditional flow - user needs to verify email or sign in manually
        setSuccessMessage('Account created successfully! Please sign in to continue.');
        
        // Auto-fill sign in form with registered email
        setSignInData(prev => ({ ...prev, email: signUpData.email }));
        
        // Switch to sign in after successful registration
        setTimeout(() => {
          toggleForm('signin');
        }, 2000);
      }

    } catch (error) {
      console.error('❌ Sign up error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout. Please try again.';
        } else if (error.response) {
          errorMessage = error.response.data?.msg || 'Registration failed. Please check your information.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
        { email: forgotPasswordEmail },
        { withCredentials: true, timeout: 10000 }
      );

      setSuccessMessage('Password reset link sent to your email!');
      console.log('Forgot password successful', response.data);

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.msg || 'Failed to send reset link. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password handler
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    // Client-side validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setError('Password must contain both letters and numbers.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`,
        { password: newPassword },
        { withCredentials: true, timeout: 10000 }
      );

      setSuccessMessage('Password reset successful! Redirecting to sign in...');
      console.log('Password reset successful', response.data);

      // Clear the token from the URL
      if (navigate) {
        const basePath = location.pathname.split('/reset-password')[0] || '/';
        navigate(basePath, { replace: true });
      }

      // Switch to sign in view
      setTimeout(() => {
        toggleForm('signin');
        if (onClose) {
          onClose();
        }
      }, 2000);

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error response:', error.response);
        setError(error.response.data.msg || 'Failed to reset password. Please try again.');

        if (error.response.status === 400 || error.response.status === 401) {
          setTimeout(() => {
            toggleForm('forgot-password');
            setError('Your reset link has expired or is invalid. Please request a new one.');
          }, 2000);
        }
      } else {
        console.error('An unexpected error occurred during password reset:', error);
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ENHANCED GOOGLE LOGIN HANDLER
  const handleGoogleLogin = () => {
    try {
      // Store the current URL to redirect back after Google login
      const currentUrl = window.location.href;
      if (typeof Storage !== 'undefined') {
        localStorage.setItem('preAuthUrl', currentUrl);
      }

      console.log('🔗 Initiating Google OAuth login...');
      console.log('API URL:', import.meta.env.VITE_API_URL);

      const googleLoginUrl = `${import.meta.env.VITE_API_URL}/auth/login/google`;
      console.log('Google Login URL:', googleLoginUrl);

      setIsLoading(true);
      setError('');
      setSuccessMessage('Redirecting to Google...');

      // Redirect to Google OAuth endpoint
      window.location.href = googleLoginUrl;
    } catch (error) {
      console.error('❌ Error initiating Google login:', error);
      setIsLoading(false);
      
      const errorMsg = "Failed to initiate Google login. Please try again.";
      
      if (toast) {
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive"
        });
      } else {
        setError(errorMsg);
      }
    }
  };

  // ENHANCED Google OAuth callback handler
  useEffect(() => {
    const handleGoogleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isGoogleCallback = urlParams.get('google_auth') === 'success';
      
      if (isGoogleCallback) {
        console.log('🔗 Processing Google OAuth callback...');
        setIsLoading(true);
        
        try {
          // Small delay to ensure backend session is ready
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Fetch user profile after Google login
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/auth/profile`,
            { 
              withCredentials: true,
              timeout: 10000
            }
          );
          
          if (response.data && response.data.role) {
            console.log('✅ Google login profile fetch successful:', response.data);
            await handleSuccessfulAuth(response.data, 500);
          } else {
            throw new Error('User profile not found after Google login');
          }
        } catch (error) {
          console.error('❌ Error fetching profile after Google login:', error);
          setError('Google login was successful, but we could not load your profile. Please try signing in again.');
        } finally {
          setIsLoading(false);
          // Clean up URL parameters
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    };

    handleGoogleCallback();
  }, [handleSuccessfulAuth]);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && user.role && !isLoading) {
      console.log('👤 User already authenticated, checking for auto-redirect...');
      
      // Only auto-redirect if we're not on a password reset flow
      if (currentView !== 'reset-password' && !resetTokenFromUrl) {
        const redirectPath = getRoleBasedRedirect(user.role);
        console.log(`🔄 Auto-redirecting authenticated ${user.role} user to: ${redirectPath}`);
        
        if (onClose) onClose();
        
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 100);
      }
    }
  }, [isAuthenticated, user, currentView, resetTokenFromUrl, navigate, onClose, isLoading]);

  // Rest of your component's JSX return statement goes here...
  // [The return statement would contain all your form JSX - keeping this comment to indicate where it should go]


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 bg-transparent border-none shadow-none">
        <div className="relative w-full min-h-[580px]">
          {/* Sign In View */}
          {currentView === 'signin' && (
            <Card className="w-full p-6 glass-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-gradient">Sign In</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <lucideReact.AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="default" className="bg-green-100 border-green-400 text-green-800">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSignIn}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <lucideReact.Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        placeholder="Enter your email"
                        type="email"
                        className="pl-10"
                        value={signInData.email}
                        onChange={handleSignInChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Password</Label>
                      <button
                        type="button"
                        onClick={() => toggleForm('forgot-password')}
                        className="text-sm text-pulse-purple hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <lucideReact.Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        value={signInData.password}
                        onChange={handleSignInChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button
                      className="w-full bg-pulse-purple hover:bg-pulse-deep-purple"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Button>
                  </div>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 hover:bg-gray-100 border border-gray-300"
                  onClick={handleGoogleLogin}
                  type="button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </Button>
              </CardContent>
              <CardFooter className="pt-2">
                <p className="text-sm text-muted-foreground text-center w-full">
                  Don't have an account?{" "}
                  <button
                    onClick={() => toggleForm('signup')}
                    className="text-pulse-purple hover:underline font-medium"
                    type="button"
                  >
                    Sign Up
                  </button>
                </p>
              </CardFooter>
            </Card>
          )}

          {/* Sign Up View */}
          {currentView === 'signup' && (
            <Card className="w-full p-6 glass-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-gradient">Create Account</CardTitle>
                <CardDescription>Enter your details to create your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <lucideReact.AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="default" className="bg-green-100 border-green-400 text-green-800">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSignUp}>
                  <div className="space-y-2">
                    <Label htmlFor="signup-full_name">Full Name</Label>
                    <div className="relative">
                      <lucideReact.User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="signup-full_name"
                        placeholder="Enter your full name"
                        className="pl-10"
                        value={signUpData.full_name}
                        onChange={handleSignUpChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <lucideReact.Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        placeholder="Enter your email"
                        type="email"
                        className="pl-10"
                        value={signUpData.email}
                        onChange={handleSignUpChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="signup-phone_number">Phone Number</Label>
                    <div className="relative">
                      <lucideReact.Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="signup-phone_number"
                        placeholder="Enter your Safaricom number"
                        className="pl-10"
                        value={signUpData.phone_number}
                        onChange={handleSignUpChange}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Must be a valid Safaricom number (e.g., 0712345678)</p>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <lucideReact.Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        className="pl-10"
                        value={signUpData.password}
                        onChange={handleSignUpChange}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Password must be at least 8 characters long and include both letters and numbers</p>
                  </div>
                  <div className="mt-6">
                    <Button
                      className="w-full bg-pulse-purple hover:bg-pulse-deep-purple"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing Up..." : "Sign Up"}
                    </Button>
                  </div>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 hover:bg-gray-100 border border-gray-300"
                  onClick={handleGoogleLogin}
                  type="button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign up with Google
                </Button>
              </CardContent>
              <CardFooter className="pt-2">
                <p className="text-sm text-muted-foreground text-center w-full">
                  Already have an account?{" "}
                  <button
                    onClick={() => toggleForm('signin')}
                    className="text-pulse-purple hover:underline font-medium"
                    type="button"
                  >
                    Sign In
                  </button>
                </p>
              </CardFooter>
            </Card>
          )}

          {/* Forgot Password View */}
          {currentView === 'forgot-password' && (
            <Card className="w-full p-6 glass-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-gradient">Forgot Password</CardTitle>
                <CardDescription>Enter your email to receive a password reset link</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <lucideReact.AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="default" className="bg-green-100 border-green-400 text-green-800">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleForgotPassword}>
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <lucideReact.Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        placeholder="Enter your email"
                        type="email"
                        className="pl-10"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button
                      className="w-full bg-pulse-purple hover:bg-pulse-deep-purple"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="pt-2">
                <p className="text-sm text-muted-foreground text-center w-full">
                  Remembered your password?{" "}
                  <button
                    onClick={() => toggleForm('signin')}
                    className="text-pulse-purple hover:underline font-medium"
                    type="button"
                  >
                    Back to Sign In
                  </button>
                </p>
              </CardFooter>
            </Card>
          )}

          {/* Reset Password View */}
          {currentView === 'reset-password' && (
            <Card className="w-full p-6 glass-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-gradient">Reset Password</CardTitle>
                <CardDescription>Enter your new password below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <lucideReact.AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="default" className="bg-green-100 border-green-400 text-green-800">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                {/* Conditional rendering of the form based on token validation and loading state */}
                {isLoading && <p className="text-center text-muted-foreground">Validating reset link...</p>}
                {!isLoading && !tokenValidated && !error && resetTokenFromUrl && (
                  <p className="text-center text-muted-foreground">Please wait while we validate your reset link, or it might be invalid/expired.</p>
                )}

                {!isLoading && tokenValidated && !error && (
                  <form onSubmit={handleResetPassword}>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <lucideReact.Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Enter your new password"
                          className="pl-10"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={8}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 8 characters long and include both letters and numbers
                      </p>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <div className="relative">
                        <lucideReact.Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm your new password"
                          className="pl-10"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={8}
                        />
                      </div>
                      {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-500">Passwords do not match</p>
                      )}
                      {newPassword && confirmPassword && newPassword === confirmPassword && (
                        <p className="text-xs text-green-600">Passwords match ✓</p>
                      )}
                    </div>

                    <div className="mt-6">
                      <Button
                        className="w-full bg-pulse-purple hover:bg-pulse-deep-purple"
                        type="submit"
                        disabled={
                          isLoading ||
                          !newPassword ||
                          !confirmPassword ||
                          newPassword !== confirmPassword ||
                          newPassword.length < 8 ||
                          !(/[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword)) // Added strength check to button disable
                        }
                      >
                        {isLoading ? "Resetting..." : "Reset Password"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
              <CardFooter className="pt-2">
                <p className="text-sm text-muted-foreground text-center w-full">
                  Remembered your password?{" "}
                  <button
                    onClick={() => toggleForm('signin')}
                    className="text-pulse-purple hover:underline font-medium"
                    type="button"
                  >
                    Back to Sign In
                  </button>
                </p>
              </CardFooter>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthCard;
