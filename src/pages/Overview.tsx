import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, Shield, BarChart, RefreshCw, Activity, Globe, Monitor } from 'lucide-react';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({
    serverStatus: 'online',
    databaseStatus: 'connected',
    cpuLoad: 23,
    memoryUsage: 67,
    activeUsers: 142,
    uptime: '15 days, 8 hours'
  });
  const [sessionStart] = useState(new Date());
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch user profile from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to mock data for demo
        setProfile({
          name: "Demo User",
          role: "Event Manager",
          email: "demo@company.com",
          lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000)
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Simulate real-time system updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        cpuLoad: Math.max(10, Math.min(90, prev.cpuLoad + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(30, Math.min(95, prev.memoryUsage + (Math.random() - 0.5) * 8)),
        activeUsers: Math.max(50, Math.min(300, prev.activeUsers + Math.floor((Math.random() - 0.5) * 20)))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

  const getSessionDuration = () => {
    const diff = Math.floor((currentTime.getTime() - sessionStart.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
      case 'connected':
        return 'bg-green-500 dark:bg-green-400';
      case 'warning':
        return 'bg-yellow-500 dark:bg-yellow-400';
      case 'offline':
      case 'disconnected':
        return 'bg-red-500 dark:bg-red-400';
      default:
        return 'bg-gray-500 dark:bg-gray-400';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'online':
      case 'connected':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'offline':
      case 'disconnected':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setSystemStats(prev => ({
        ...prev,
        cpuLoad: Math.floor(Math.random() * 80) + 10,
        memoryUsage: Math.floor(Math.random() * 60) + 25,
        activeUsers: Math.floor(Math.random() * 200) + 50
      }));
      setLoading(false);
    }, 1000);
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {getTimeOfDayGreeting()}, {profile?.name || 'User'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome to your dashboard</p>
        </div>

        {/* User Profile Card */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Your account details and session info
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                  <span className="text-gray-900 dark:text-gray-100">{profile?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Role:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">{profile?.role}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                  <span className="text-gray-900 dark:text-gray-100">{profile?.email}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Last Login:</span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 dark:text-green-400">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Status Card */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-gray-900 dark:text-gray-100">
                <div className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  System Status
                </div>
                <button 
                  onClick={refreshData}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} text-gray-600 dark:text-gray-400`} />
                </button>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Real-time system information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Server Status:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${getStatusColor(systemStats.serverStatus)} rounded-full animate-pulse`}></div>
                    <span className={`text-sm capitalize ${getStatusTextColor(systemStats.serverStatus)}`}>
                      {systemStats.serverStatus}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Database:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${getStatusColor(systemStats.databaseStatus)} rounded-full animate-pulse`}></div>
                    <span className={`text-sm capitalize ${getStatusTextColor(systemStats.databaseStatus)}`}>
                      {systemStats.databaseStatus}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300">CPU Load:</span>
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-mono">{systemStats.cpuLoad.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${systemStats.cpuLoad}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Memory Usage:</span>
                    <span className="text-sm text-purple-600 dark:text-purple-400 font-mono">{systemStats.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${systemStats.memoryUsage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Active Users:</span>
                    <span className="text-sm text-green-600 dark:text-green-400 font-bold">{systemStats.activeUsers}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Uptime:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{systemStats.uptime}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time & Environment Card */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Clock className="h-5 w-5" />
                Current Time & Environment
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Real-time information and system details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 p-4 rounded-lg">
                  <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {formatDate(currentTime)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Timezone:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Screen:
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {window.screen.width} × {window.screen.height}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Session:
                    </span>
                    <span className="text-sm text-green-600 dark:text-green-400 font-mono">
                      {getSessionDuration()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Browser:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {navigator.userAgent.split(' ').pop().split('/')[0]}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Language:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {navigator.language}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;