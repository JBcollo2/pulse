import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, Shield } from 'lucide-react';

const Overview = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Mock user data - in real app this would come from authentication context/props
  const user = {
    name: "John Doe",
    role: "Event Manager",
    email: "john.doe@company.com",
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">
          {getTimeOfDayGreeting()}, {user.name}
        </h1>
        <p className="text-muted-foreground">Welcome to your dashboard</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Name:</span>
                <span>{user.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Role:</span>
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>{user.role}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Email:</span>
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Last Login:</span>
                <span className="text-sm text-muted-foreground">
                  {user.lastLogin.toLocaleDateString()} at {formatTime(user.lastLogin)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Time
            </CardTitle>
            <CardDescription>Real-time information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-blue-600">
                  {formatTime(currentTime)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {formatDate(currentTime)}
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Timezone:</span>
                  <span className="text-sm">
                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">Session Duration:</span>
                  <span className="text-sm text-muted-foreground">
                    Active since login
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;