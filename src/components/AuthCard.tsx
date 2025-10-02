import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Mail, Lock, User, Phone, Sparkles, Shield, Zap, Crown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { VisuallyHidden } from './ui/Visually-hidden';

const AuthCard = ({ isOpen, onClose, initialView = 'signin', toast }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAuth();

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
  const [adminExists, setAdminExists] = useState(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

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

  // Admin Registration state
  const [adminData, setAdminData] = useState({
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

  // Check if admin exists - this determines if we show admin registration option
  const checkAdminExists = useCallback(async () => {
    setCheckingAdmin(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/check-admin`,
        {
          withCredentials: true,
          timeout: 5000
        }
      );
      const exists = response.data.admin_exists || false;
      setAdminExists(exists);
      
      // If no admin exists and we're not already on admin registration, prompt user
      if (!exists && currentView === 'signin') {
        setCurrentView('admin-registration');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      // On error, assume admin exists to be safe
      setAdminExists(true);
    } finally {
      setCheckingAdmin(false);
    }
  }, [currentView]);

  // Check admin status on component mount
  useEffect(() => {
    checkAdminExists();
  }, [checkAdminExists]);

  const handleSuccessfulAuth = useCallback(async (userData) => {
    try {
      const normalizedUser = {
        id: userData.id || userData.user_id,
        name: userData.name || userData.full_name || userData.username,
        email: userData.email,
        role: userData.role,
        full_name: userData.full_name,
        phone_number: userData.phone_number,
        ai_enabled: userData.ai_enabled !== undefined ? userData.ai_enabled : true,
        ai_language_preference: userData.ai_language_preference || 'en',
        ai_notification_preference: userData.ai_notification_preference !== undefined ? userData.ai_notification_preference : true,
        ...userData
      };
      
      loginUser(normalizedUser);
      
      const displayName = normalizedUser.full_name || normalizedUser.name || normalizedUser.email;
      
      if (onClose) {
        onClose();
      }
      
      if (toast) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${displayName}!`,
          variant: "default"
        });
      }
      
      const authEvent = new CustomEvent('auth-state-changed', {
        detail: {
          user: normalizedUser,
          action: 'login',
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(authEvent);
      
      setTimeout(() => {
        localStorage.setItem('auth-login', Date.now().toString());
        setTimeout(() => localStorage.removeItem('auth-login'), 100);
      }, 0);
    } catch (error) {
      console.error('Auth success handler error:', error);
      setError('Authentication successful but there was an issue. Please try again.');
    }
  }, [onClose, toast, loginUser]);

  const resetFormStates = useCallback(() => {
    setError('');
    setSuccessMessage('');
    setIsLoading(false);
    setTokenValidated(false);
    setSignInData({ email: '', password: '' });
    setSignUpData({ full_name: '', email: '', phone_number: '', password: '' });
    setAdminData({ full_name: '', email: '', phone_number: '', password: '' });
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
        { withCredentials: true, timeout: 8000 }
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
      setTimeout(() => toggleForm('forgot-password'), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [toggleForm]);

  useEffect(() => {
    if (resetTokenFromUrl) {
      setCurrentView('reset-password');
      setToken(resetTokenFromUrl);
      validateResetToken(resetTokenFromUrl);
    }
  }, [resetTokenFromUrl, validateResetToken]);

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
          headers: { 'Content-Type': 'application/json' }
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
    } finally {
      setIsLoading(false);
    }
  };

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
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      setSuccessMessage('Account created successfully! Signing you in...');
      
      // Auto sign in after registration
      setTimeout(async () => {
        try {
          const loginResponse = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/login`,
            { email: signUpData.email, password: signUpData.password },
            { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
          );
          
          await handleSuccessfulAuth(loginResponse.data?.user || loginResponse.data);
        } catch (loginError) {
          setSignInData({ email: signUpData.email, password: '' });
          toggleForm('signin');
        }
      }, 1500);
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
      setIsLoading(false);
    }
  };

  const handleAdminChange = (e) => {
    const { id, value } = e.target;
    const field = id.replace('admin-', '');
    setAdminData(prev => ({ ...prev, [field]: value }));
  };

  const handleAdminRegistration = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/register-first-admin`,
        adminData,
        {
          withCredentials: true,
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      setSuccessMessage('First admin registered successfully! Signing you in...');
      setAdminExists(true);
      
      // Auto sign in after admin registration
      setTimeout(async () => {
        try {
          const loginResponse = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/login`,
            { email: adminData.email, password: adminData.password },
            { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
          );
          
          await handleSuccessfulAuth(loginResponse.data?.user || loginResponse.data);
        } catch (loginError) {
          setSignInData({ email: adminData.email, password: '' });
          toggleForm('signin');
        }
      }, 1500);
    } catch (error) {
      let errorMessage = 'Admin registration failed. Please check your information and try again.';
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Connection timeout. Please try again.';
        } else if (error.response?.data?.msg) {
          errorMessage = error.response.data.msg;
        } else if (error.response?.status === 403) {
          errorMessage = 'Admin already exists. First admin registration is no longer available.';
          setAdminExists(true);
          setTimeout(() => toggleForm('signin'), 2000);
        }
      }
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
        { email: forgotPasswordEmail },
        { withCredentials: true, timeout: 10000, headers: { 'Content-Type': 'application/json' } }
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
    if (!(/[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword))) {
      setError('Password must contain both letters and numbers.');
      setIsLoading(false);
      return;
    }
    
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`,
        { password: newPassword },
        { withCredentials: true, timeout: 10000, headers: { 'Content-Type': 'application/json' } }
      );
      setSuccessMessage('Password reset successful! You can now sign in.');
      if (navigate) {
        const basePath = location.pathname.split('/reset-password')[0] || '/';
        navigate(basePath, { replace: true });
      }
      setTimeout(() => toggleForm('signin'), 2000);
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
        toast({ title: "Error", description: errorMsg, variant: "destructive" });
      } else {
        setError(errorMsg);
      }
    }
  };

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
            { withCredentials: true, timeout: 8000 }
          );
          if (response.data?.role) {
            await handleSuccessfulAuth(response.data);
          } else {
            throw new Error('User profile not found after Google login');
          }
        } catch (error) {
          setError('Google login was successful, but we could not load your profile. Please try signing in again.');
        } finally {
          setIsLoading(false);
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    };
    handleGoogleCallback();
  }, [handleSuccessfulAuth]);

  // Show loading state while checking admin status
  if (checkingAdmin) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-none">
          <VisuallyHidden>
            <DialogTitle>Authentication</DialogTitle>
            <DialogDescription>Checking system status</DialogDescription>
          </VisuallyHidden>
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Checking system status...</p>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  const renderAuthView = () => {
    switch (currentView) {
      case 'admin-registration':
        return (
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white mb-3 shadow-lg mx-auto">
                <Crown className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">System Setup</span>
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-1.5">
                Register First Admin
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                Create the first administrator account
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {adminExists ? (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                  <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-sm text-amber-700 dark:text-amber-300">
                    Admin already exists. Please sign in instead.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleAdminRegistration} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-full_name" className="text-sm">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="admin-full_name"
                        value={adminData.full_name}
                        onChange={handleAdminChange}
                        required
                        className="pl-9 h-9 text-sm"
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-email" className="text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="admin-email"
                        type="email"
                        value={adminData.email}
                        onChange={handleAdminChange}
                        required
                        className="pl-9 h-9 text-sm"
                        placeholder="Enter email"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-phone_number" className="text-sm">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="admin-phone_number"
                        value={adminData.phone_number}
                        onChange={handleAdminChange}
                        required
                        className="pl-9 h-9 text-sm"
                        placeholder="0712345678"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-password" className="text-sm">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        value={adminData.password}
                        onChange={handleAdminChange}
                        required
                        className="pl-9 pr-9 h-9 text-sm"
                        placeholder="Create password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        <p className="font-medium mb-1">AI Features Enabled</p>
                        <p className="text-blue-600 dark:text-blue-400">Your account will have AI-powered recommendations and notifications enabled by default.</p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <Shield className="w-4 h-4" />
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  )}
                  {successMessage && (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 py-2">
                      <Zap className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-sm text-green-700 dark:text-green-300">{successMessage}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button
                    type="submit"
                    className="w-full h-9 text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </div>
                    ) : (
                      <>
                        <Crown className="mr-1.5 h-3.5 w-3.5" />
                        Create Admin Account
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
            {adminExists && (
              <CardFooter className="flex justify-center pt-3 pb-4">
                <button
                  type="button"
                  onClick={() => toggleForm('signin')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Go to Sign In
                </button>
              </CardFooter>
            )}
          </Card>
        );

      case 'signin':
        return (
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white mb-3 shadow-lg mx-auto">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Welcome Back</span>
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent mb-1.5">Sign In</CardTitle>
              <CardDescription className="text-sm">Enter your credentials</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className="text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      value={signInData.email}
                      onChange={handleSignInChange}
                      required
                      className="pl-9 h-9 text-sm"
                      placeholder="Enter email"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password" className="text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      value={signInData.password}
                      onChange={handleSignInChange}
                      required
                      className="pl-9 pr-9 h-9 text-sm"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive" className="py-2">
                    <Shield className="w-4 h-4" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}
                {successMessage && (
                  <Alert className="border-green-200 bg-green-50 py-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-sm text-green-700">{successMessage}</AlertDescription>
                  </Alert>
                )}
                <Button
                  type="submit"
                  className="w-full h-9 text-sm bg-gradient-to-r from-blue-500 to-green-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing In...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or continue with</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 text-sm"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <Mail className="mr-1.5 h-4 w-4 text-blue-500" />
                  Sign in with Google
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 pt-3 pb-4 px-4">
              <Button
                variant="link"
                onClick={() => toggleForm('forgot-password')}
                disabled={isLoading}
                className="text-xs text-blue-600 h-auto p-0"
              >
                Forgot your password?
              </Button>
              <div className="text-center text-xs text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => toggleForm('signup')}
                  disabled={isLoading}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Sign up
                </button>
              </div>
              {!adminExists && (
                <div className="text-center text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600">
                  Need to set up the system?{' '}
                  <button
                    type="button"
                    onClick={() => toggleForm('admin-registration')}
                    disabled={isLoading}
                    className="text-amber-600 font-medium hover:underline"
                  >
                    Register First Admin
                  </button>
                </div>
              )}
            </CardFooter>
          </Card>
        );

      case 'signup':
        return (
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white mb-3 shadow-lg mx-auto">
                <User className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Join Us</span>
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent mb-1.5">Create Account</CardTitle>
              <CardDescription className="text-sm">Enter your details to get started</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-full_name" className="text-sm">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="signup-full_name"
                      value={signUpData.full_name}
                      onChange={handleSignUpChange}
                      required
                      className="pl-9 h-9 text-sm"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      value={signUpData.email}
                      onChange={handleSignUpChange}
                      required
                      className="pl-9 h-9 text-sm"
                      placeholder="Enter email"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-phone_number" className="text-sm">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="signup-phone_number"
                      value={signUpData.phone_number}
                      onChange={handleSignUpChange}
                      required
                      className="pl-9 h-9 text-sm"
                      placeholder="0712345678"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={signUpData.password}
                      onChange={handleSignUpChange}
                      required
                      className="pl-9 pr-9 h-9 text-sm"
                      placeholder="Create password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      <p className="font-medium">AI Features Included</p>
                      <p className="text-blue-600 dark:text-blue-400 mt-0.5">Get personalized event recommendations powered by AI</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="py-2">
                    <Shield className="w-4 h-4" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}
                {successMessage && (
                  <Alert className="border-green-200 bg-green-50 py-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-sm text-green-700">{successMessage}</AlertDescription>
                  </Alert>
                )}
                
                <Button
                  type="submit"
                  className="w-full h-9 text-sm bg-gradient-to-r from-green-500 to-blue-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or continue with</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 text-sm"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <Mail className="mr-1.5 h-4 w-4 text-blue-500" />
                  Sign up with Google
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center pt-3 pb-4">
              <div className="text-center text-xs text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => toggleForm('signin')}
                  disabled={isLoading}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Sign in
                </button>
              </div>
            </CardFooter>
          </Card>
        );

      case 'forgot-password':
        return (
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white mb-3 shadow-lg mx-auto">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Password Reset</span>
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-1.5">Forgot Password</CardTitle>
              <CardDescription className="text-sm">We'll send you a reset link</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email" className="text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      className="pl-9 h-9 text-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive" className="py-2">
                    <Shield className="w-4 h-4" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}
                {successMessage && (
                  <Alert className="border-green-200 bg-green-50 py-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-sm text-green-700">{successMessage}</AlertDescription>
                  </Alert>
                )}
                <Button
                  type="submit"
                  className="w-full h-9 text-sm bg-gradient-to-r from-orange-500 to-red-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center pt-3 pb-4">
              <div className="text-center text-xs text-gray-600 dark:text-gray-400">
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => toggleForm('signin')}
                  disabled={isLoading}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Sign in
                </button>
              </div>
            </CardFooter>
          </Card>
        );

      case 'reset-password':
        return (
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-3 shadow-lg mx-auto">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Reset Password</span>
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-1.5">Reset Password</CardTitle>
              <CardDescription className="text-sm">Enter your new password</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {error && (
                <Alert variant="destructive" className="mb-3 py-2">
                  <Shield className="w-4 h-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert className="mb-3 border-green-200 bg-green-50 py-2">
                  <Zap className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-sm text-green-700">{successMessage}</AlertDescription>
                </Alert>
              )}
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-600">Validating...</p>
                  </div>
                </div>
              )}
              {!isLoading && tokenValidated && !error && (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-sm">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pl-9 pr-9 h-9 text-sm"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password" className="text-sm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pl-9 pr-9 h-9 text-sm"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-red-500">Passwords do not match</p>
                    )}
                    {newPassword && confirmPassword && newPassword === confirmPassword && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Passwords match
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-9 text-sm bg-gradient-to-r from-purple-500 to-pink-500"
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
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Resetting...
                      </div>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex justify-center pt-3 pb-4">
              <div className="text-center text-xs text-gray-600 dark:text-gray-400">
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => toggleForm('signin')}
                  disabled={isLoading}
                  className="text-blue-600 font-medium hover:underline"
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
      <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-none overflow-y-auto max-h-[90vh]">
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