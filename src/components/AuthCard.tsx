import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import * as lucideReact from 'lucide-react';
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

      // Update auth state
      loginUser(normalizedUser);

      // Show success message
      const displayName = normalizedUser.full_name || normalizedUser.name || normalizedUser.email;
      setSuccessMessage(`Welcome back, ${displayName}!`);

      // Close the auth modal
      if (onClose) {
        onClose();
      }

      // Show success toast
      if (toast) {
        toast({
          title: "Login Successful",
          description: `Welcome ${displayName}! You can now access your dashboard.`,
          variant: "default"
        });
      }

      // Trigger auth state change event
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

      console.log('✅ Authentication successful - user can now navigate freely');

    } catch (error) {
      console.error('❌ Error in handleSuccessfulAuth:', error);
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

  // ENHANCED SIGN IN HANDLER with better error handling
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

      console.log('🎉 Authentication successful, updating auth state...');

      // Handle successful login WITHOUT automatic redirect
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

  // ENHANCED SIGN UP HANDLER
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
        setSuccessMessage('Account created successfully! You are now logged in.');
        await handleSuccessfulAuth(response.data.user);
      } else {
        // Traditional flow - user needs to sign in manually
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

      setSuccessMessage('Password reset successful! You can now sign in.');
      console.log('Password reset successful', response.data);

      // Clear the token from the URL
      if (navigate) {
        const basePath = location.pathname.split('/reset-password')[0] || '/';
        navigate(basePath, { replace: true });
      }

      // Switch to sign in view
      setTimeout(() => {
        toggleForm('signin');
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
            await handleSuccessfulAuth(response.data);
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

  // Render logic for different auth views
  const renderAuthView = () => {
    switch (currentView) {
      case 'signin':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Welcome back! Please sign in to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInData.email}
                    onChange={handleSignInChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInData.password}
                    onChange={handleSignInChange}
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {successMessage && (
                  <Alert>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <lucideReact.Mail className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                variant="link"
                onClick={() => toggleForm('forgot-password')}
                disabled={isLoading}
              >
                Forgot your password?
              </Button>
              <Button
                variant="link"
                onClick={() => toggleForm('signup')}
                disabled={isLoading}
              >
                Don't have an account? Sign up
              </Button>
            </CardFooter>
          </Card>
        );

      case 'signup':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Create Account</CardTitle>
              <CardDescription>Enter your details to create your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-full_name">Full Name</Label>
                  <Input
                    id="signup-full_name"
                    value={signUpData.full_name}
                    onChange={handleSignUpChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpData.email}
                    onChange={handleSignUpChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-phone_number">Phone Number</Label>
                  <Input
                    id="signup-phone_number"
                    value={signUpData.phone_number}
                    onChange={handleSignUpChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Must be a valid Safaricom number (e.g., 0712345678)</p>
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpData.password}
                    onChange={handleSignUpChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Password must be at least 8 characters long and include both letters and numbers</p>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {successMessage && (
                  <Alert>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing Up...' : 'Sign Up'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <lucideReact.Mail className="mr-2 h-4 w-4" />
                  Sign up with Google
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                variant="link"
                onClick={() => toggleForm('signin')}
                disabled={isLoading}
              >
                Already have an account? Sign in
              </Button>
            </CardFooter>
          </Card>
        );

      case 'forgot-password':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Forgot Password</CardTitle>
              <CardDescription>Enter your email to receive a password reset link</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {successMessage && (
                  <Alert>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                variant="link"
                onClick={() => toggleForm('signin')}
                disabled={isLoading}
              >
                Remembered your password? Sign in
              </Button>
            </CardFooter>
          </Card>
        );

      case 'reset-password':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}
              {isLoading && <p className="text-center text-muted-foreground">Validating reset link...</p>}
              {!isLoading && !tokenValidated && !error && resetTokenFromUrl && (
                <p className="text-center text-muted-foreground">Please wait while we validate your reset link, or it might be invalid/expired.</p>
              )}
              {!isLoading && tokenValidated && !error && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters long and include both letters and numbers
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-red-500">Passwords do not match</p>
                    )}
                    {newPassword && confirmPassword && newPassword === confirmPassword && (
                      <p className="text-xs text-green-600">Passwords match ✓</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      isLoading ||
                      !newPassword ||
                      !confirmPassword ||
                      newPassword !== confirmPassword ||
                      newPassword.length < 8 ||
                      !(/[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword))
                    }
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                variant="link"
                onClick={() => toggleForm('signin')}
                disabled={isLoading}
              >
                Remembered your password? Sign in
              </Button>
            </CardFooter>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
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
