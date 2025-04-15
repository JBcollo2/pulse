
import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "./ui/dialog";
import { Mail, Lock, User } from "lucide-react";

interface AuthCardProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthCard: React.FC<AuthCardProps> = ({ isOpen, onClose }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleForm = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 bg-transparent border-none shadow-none">
        <div className="relative [perspective:1000px] w-full h-[550px]">
          <div
            className={cn(
              "absolute w-full h-full transition-all duration-500 [transform-style:preserve-3d]",
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            )}
          >
            {/* Sign In Side */}
            <Card className="absolute w-full h-full [backface-visibility:hidden] p-6 glass-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-gradient">Sign In</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input id="email" placeholder="Enter your email" type="email" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="Enter your password" className="pl-10" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col space-y-4">
                <Button className="w-full bg-pulse-purple hover:bg-pulse-deep-purple">Sign In</Button>
                <p className="text-sm text-muted-foreground text-center">
                  Don't have an account?{" "}
                  <button
                    onClick={toggleForm}
                    className="text-pulse-purple hover:underline font-medium"
                  >
                    Sign Up
                  </button>
                </p>
              </CardFooter>
            </Card>

            {/* Sign Up Side */}
            <Card className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] p-6 glass-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-gradient">Create Account</CardTitle>
                <CardDescription>Enter your details to create your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input id="name" placeholder="Enter your full name" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input id="signup-email" placeholder="Enter your email" type="email" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input id="signup-password" type="password" placeholder="Create a password" className="pl-10" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col space-y-4">
                <Button className="w-full bg-pulse-purple hover:bg-pulse-deep-purple">Sign Up</Button>
                <p className="text-sm text-muted-foreground text-center">
                  Already have an account?{" "}
                  <button
                    onClick={toggleForm}
                    className="text-pulse-purple hover:underline font-medium"
                  >
                    Sign In
                  </button>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthCard;
