import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "./ui/dialog";
import { Mail, Lock, User, Phone, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import axios from 'axios';

interface AuthCardProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthCard: React.FC<AuthCardProps> = ({ isOpen, onClose }) => {
  const [currentView, setCurrentView] = useState<'signin' | 'signup' | 'forgot-password'>('signin');
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });
  const [signUpData, setSignUpData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: ''
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const toggleForm = (view: 'signin' | 'signup' | 'forgot-password') => {
    setCurrentView(view);
    setError('');
    setSuccessMessage('');
  };

  const handleSignInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSignInData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSignUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const fieldName = id.replace('signup-', '');
    
    setSignUpData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const validatePassword = (password: string) => {
    // Password must be at least 8 characters long, contain letters and numbers
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(password);
  };

  const validateSafaricomPhone = (phone: string) => {
    // Simple validation for Safaricom phone numbers
    // This should be a valid Kenyan Safaricom number
    // More complex validation would be done on the backend
    const regex = /^(07\d{8}|01\d{8})$/;
    return regex.test(phone);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        signInData,
        { withCredentials: true }
      );
      
      setSuccessMessage('Login successful!');
      console.log('Sign in successful', response.data);
      
      // Store the token in localStorage or a secure cookie
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
      }
      
      // Close the dialog after a short delay to show the success message
      setTimeout(() => {
        onClose();
        // Optionally refresh the page or update the app state
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || 'Failed to sign in. Please check your credentials.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Error during sign in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validate password
    if (!validatePassword(signUpData.password)) {
      setError('Password must be at least 8 characters long and contain both letters and numbers.');
      return;
    }

    // Validate phone number
    if (!validateSafaricomPhone(signUpData.phone_number)) {
      setError('Please enter a valid Safaricom phone number (e.g., 0712345678).');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        signUpData,
        { withCredentials: true }
      );
      
      setSuccessMessage('Account created successfully! You can now sign in.');
      console.log('Sign up successful', response.data);
      
      // Switch to sign in view after successful registration
      setTimeout(() => {
        toggleForm('signin');
      }, 2000);
      
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.msg || 'Failed to create account. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Error during sign up:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/forgot-password`,
        { email: forgotPasswordEmail }
      );
      
      setSuccessMessage('Password reset link sent to your email!');
      console.log('Password reset requested', response.data);
      
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.msg || 'Failed to request password reset. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Error during password reset request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Redirect to Google OAuth endpoint
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/login/google`;

  
    } catch (error) {
      console.error('Error with Google login:', error);
      setError('Failed to initiate Google login. Please try again.');
    }
  };

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
                    <AlertCircle className="h-4 w-4" />
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
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
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
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
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
                    <AlertCircle className="h-4 w-4" />
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
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
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
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
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
                      <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
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
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
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
                    <AlertCircle className="h-4 w-4" />
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
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthCard;