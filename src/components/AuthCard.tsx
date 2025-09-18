import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Mail, Lock, User, Phone, Sparkles, Shield, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { VisuallyHidden } from './ui/Visually-hidden';

const AuthCard = ({ isOpen, onClose, initialView = 'signin', toast }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, user, isAuthenticated } = useAuth();

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

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Simplified success handler without automatic redirects
  const handleSuccessfulAuth = useCallback(async (userData) => {
    try {
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
      // Update auth state immediately
      loginUser(normalizedUser);
      // Show success message
      const displayName = normalizedUser.full_name || normalizedUser.name || normalizedUser.email;

      // Close the auth modal immediately for better UX
      if (onClose) {
        onClose();
      }
      // Show success toast
      if (toast) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${displayName}!`,
          variant: "default"
        });
      }
      // Trigger auth state change event for cross-component updates
      const authEvent = new CustomEvent('auth-state-changed', {
        detail: {
          user: normalizedUser,
          action: 'login',
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(authEvent);
      // Cross-tab sync (non-blocking)
      setTimeout(() => {
        localStorage.setItem('auth-login', Date.now().toString());
        setTimeout(() => localStorage.removeItem('auth-login'), 100);
      }, 0);
    } catch (error) {
      console.error('Auth success handler error:', error);
      setError('Authentication successful but there was an issue. Please try again.');
    }
  }, [onClose, toast, loginUser]);

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
    setShowPassword(false);
    setShowConfirmPassword(false);
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
        {
          withCredentials: true,
          timeout: 8000
        }
      );
      if (response.status === 200) {
        setSuccessMessage(response.data.msg || 'Token is valid. You can now reset your password.');
        setTokenValidated(true);
      }
    } catch (error) {
      let errorMessage = 'Invalid or expired reset token. Please request a new password reset.';
      if (axios.isAxiosError(error) && error.response?.data?.msg) {
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

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        signInData,
        {
          withCredentials: true,
          timeout: 8000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      let userData = response.data?.user || response.data;
      if (!userData?.email || !userData?.role) {
        throw new Error('Invalid user data received');
      }
      await handleSuccessfulAuth(userData);
    } catch (error) {
      let errorMessage = 'Sign in failed. Please check your credentials and try again.';
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Connection timeout. Please check your internet connection.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.response?.data?.msg || error.response?.data?.error) {
          errorMessage = error.response.data.msg || error.response.data.error;
        } else if (!error.response) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }
      setError(errorMessage);
      console.error('Sign in error:', error);
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

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        signUpData,
        {
          withCredentials: true,
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      if (response.data.user && response.data.user.role) {
        setSuccessMessage('Account created successfully! You are now logged in.');
        await handleSuccessfulAuth(response.data.user);
      } else {
        setSuccessMessage('Account created successfully! Please sign in to continue.');
        setSignInData(prev => ({ ...prev, email: signUpData.email, password: '' }));
        setTimeout(() => {
          toggleForm('signin');
        }, 2000);
      }
    } catch (error) {
      let errorMessage = 'Registration failed. Please check your information and try again.';
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Connection timeout. Please try again.';
        } else if (error.response?.data?.msg) {
          errorMessage = error.response.data.msg;
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
      await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
        { email: forgotPasswordEmail },
        {
          withCredentials: true,
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      setSuccessMessage('Password reset link sent to your email!');
    } catch (error) {
      let errorMessage = 'Failed to send reset link. Please try again.';
      if (axios.isAxiosError(error) && error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      }
      setError(errorMessage);
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
      await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`,
        { password: newPassword },
        {
          withCredentials: true,
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      setSuccessMessage('Password reset successful! You can now sign in.');
      if (navigate) {
        const basePath = location.pathname.split('/reset-password')[0] || '/';
        navigate(basePath, { replace: true });
      }
      setTimeout(() => {
        toggleForm('signin');
      }, 2000);
    } catch (error) {
      let errorMessage = 'Failed to reset password. Please try again.';
      if (axios.isAxiosError(error) && error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
        if (error.response.status === 400 || error.response.status === 401) {
          setTimeout(() => {
            toggleForm('forgot-password');
            setError('Your reset link has expired or is invalid. Please request a new one.');
          }, 2000);
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      const currentUrl = window.location.href;
      if (typeof Storage !== 'undefined') {
        localStorage.setItem('preAuthUrl', currentUrl);
      }
      setIsLoading(true);
      setError('');
      setSuccessMessage('Redirecting to Google...');
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/login/google`;
    } catch (error) {
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

  // Google OAuth callback handler
  useEffect(() => {
    const handleGoogleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isGoogleCallback = urlParams.get('google_auth') === 'success';
      if (isGoogleCallback) {
        setIsLoading(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/auth/profile`,
            {
              withCredentials: true,
              timeout: 8000
            }
          );
          if (response.data?.role) {
            await handleSuccessfulAuth(response.data);
          } else {
            throw new Error('User profile not found after Google login');
          }
        } catch (error) {
          setError('Google login was successful, but we could not load your profile. Please try signing in again.');
          console.error('Google callback error:', error);
        } finally {
          setIsLoading(false);
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    };
    handleGoogleCallback();
  }, [handleSuccessfulAuth]);

  // Render logic for different auth views
  const renderAuthView = () => {
    switch (currentView) {
      case 'signin':
        return (
          <Card className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="text-center pb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 mb-4">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Welcome Back</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign In</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-gray-700 dark:text-gray-300 font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      value={signInData.email}
                      onChange={handleSignInChange}
                      required
                      className="pl-11 h-12 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-gray-700 dark:text-gray-300 font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      value={signInData.password}
                      onChange={handleSignInChange}
                      required
                      className="pl-11 pr-11 h-12 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <Shield className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {successMessage && (
                  <Alert className="border-green-200 bg-green-50">
                    <Zap className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing In...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <Mail className="mr-2 h-5 w-5 text-blue-500" />
                  Sign in with Google
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pt-6">
              <Button
                variant="link"
                onClick={() => toggleForm('forgot-password')}
                disabled={isLoading}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Forgot your password?
              </Button>
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => toggleForm('signup')}
                  disabled={isLoading}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline"
                >
                  Sign up
                </button>
              </div>
            </CardFooter>
          </Card>
        );

      case 'signup':
        return (
          <Card className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="text-center pb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 mb-4">
                <User className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Join Us</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Account</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Enter your details to create your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-full_name" className="text-gray-700 dark:text-gray-300 font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signup-full_name"
                      value={signUpData.full_name}
                      onChange={handleSignUpChange}
                      required
                      className="pl-11 h-12 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-700 dark:text-gray-300 font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      value={signUpData.email}
                      onChange={handleSignUpChange}
                      required
                      className="pl-11 h-12 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone_number" className="text-gray-700 dark:text-gray-300 font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signup-phone_number"
                      value={signUpData.phone_number}
                      onChange={handleSignUpChange}
                      required
                      className="pl-11 h-12 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
                      placeholder="e.g., 0712345678"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Must be a valid Safaricom number (e.g., 0712345678)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-700 dark:text-gray-300 font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={signUpData.password}
                      onChange={handleSignUpChange}
                      required
                      className="pl-11 pr-11 h-12 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Password must be at least 8 characters long and include both letters and numbers</p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <Shield className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {successMessage && (
                  <Alert className="border-green-200 bg-green-50">
                    <Zap className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <Mail className="mr-2 h-5 w-5 text-blue-500" />
                  Sign up with Google
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pt-6">
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => toggleForm('signin')}
                  disabled={isLoading}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </div>
            </CardFooter>
          </Card>
        );

      case 'forgot-password':
        return (
          <Card className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="text-center pb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 mb-4">
                <Shield className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Password Reset</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Forgot Password</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Enter your email address to receive a password reset link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-gray-700 dark:text-gray-300 font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      className="pl-11 h-12 border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <Shield className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {successMessage && (
                  <Alert className="border-green-200 bg-green-50">
                    <Zap className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending Reset Link...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pt-6">
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => toggleForm('signin')}
                  disabled={isLoading}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </div>
            </CardFooter>
          </Card>
        );

      case 'reset-password':
        return (
          <Card className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="text-center pb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 mb-4">
                <Lock className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Reset Password</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <Shield className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert className="border-green-200 bg-green-50 mb-4">
                  <Zap className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
                </Alert>
              )}

              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-center text-gray-600 dark:text-gray-400">Validating reset link...</p>
                  </div>
                </div>
              )}

              {!isLoading && !tokenValidated && !error && resetTokenFromUrl && (
                <div className="flex items-center justify-center py-8">
                  <p className="text-center text-gray-600 dark:text-gray-400">Please wait while we validate your reset link...</p>
                </div>
              )}

              {!isLoading && tokenValidated && !error && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-gray-700 dark:text-gray-300 font-medium">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pl-11 pr-11 h-12 border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400"
                        placeholder="Enter your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Password must be at least 8 characters long and include both letters and numbers
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-gray-700 dark:text-gray-300 font-medium">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pl-11 pr-11 h-12 border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400"
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-red-500 dark:text-red-400">Passwords do not match</p>
                    )}
                    {newPassword && confirmPassword && newPassword === confirmPassword && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Passwords match
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                    disabled={
                      isLoading ||
                      !newPassword ||
                      !confirmPassword ||
                      newPassword !== confirmPassword ||
                      newPassword.length < 8 ||
                      !(/[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword))
                    }
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Resetting Password...
                      </div>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pt-6">
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => toggleForm('signin')}
                  disabled={isLoading}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </div>
            </CardFooter>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-none">
        <VisuallyHidden>
          <DialogTitle>Authentication</DialogTitle>
          <DialogDescription>Sign in or create an account</DialogDescription>
        </VisuallyHidden>
        {renderAuthView()}
      </DialogContent>
    </Dialog>
  );
};

export default AuthCard;