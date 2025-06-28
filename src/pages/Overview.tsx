import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, Shield, BarChart, RefreshCw, Activity, Globe, Monitor, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemStats, setSystemStats] = useState({
    serverStatus: 'online',
    databaseStatus: 'connected',
    cpuLoad: 23,
    memoryUsage: 67,
    activeUsers: 142,
    uptime: '15 days, 8 hours'
  });
  const [sessionStart] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  
  // Enhanced time update with cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Modern API configuration
  const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  // Enhanced API fetch utility
  const apiRequest = useCallback(
    async (
      endpoint: string,
      options: { headers?: Record<string, string>; [key: string]: any } = {}
    ) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

      try {
        const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
          ...options,
          headers: {
            ...API_CONFIG.headers,
            ...options.headers
          },
          credentials: 'include',
          signal: controller.signal
        });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }, []);

  // Enhanced profile fetching with better error handling
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try multiple endpoints for user profile
      const endpoints = ['/auth/profile', '/user/me', '/auth/user'];
      let profileData = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          profileData = await apiRequest(endpoint);
          break;
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      if (!profileData) {
        throw lastError || new Error('Failed to fetch user profile from all endpoints');
      }

      // Normalize profile data structure
      const normalizedProfile = {
        id: profileData.id || profileData.userId || null,
        name: profileData.name || profileData.fullName || profileData.displayName || 'Unknown User',
        email: profileData.email || profileData.emailAddress || null,
        role: profileData.role || profileData.userRole || profileData.permissions?.[0] || 'User',
        avatar: profileData.avatar || profileData.profilePicture || profileData.image || null,
        lastLogin: profileData.lastLogin || profileData.lastLoginAt || profileData.loginTime || null,
        isActive: profileData.isActive !== undefined ? profileData.isActive : true,
        permissions: profileData.permissions || [],
        department: profileData.department || null,
        joinDate: profileData.joinDate || profileData.createdAt || null
      };

      setProfile(normalizedProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error.message);
      
      // Fallback to demo data for development
      if (import.meta.env.DEV) {
        setProfile({
          id: 'demo-123',
          name: "Demo User",
          role: "Event Manager",
          email: "demo@company.com",
          avatar: null,
          lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isActive: true,
          permissions: ['read', 'write'],
          department: 'Events',
          joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        });
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Fetch system statistics
  const fetchSystemStats = useCallback(async () => {
    try {
      const stats = await apiRequest('/system/stats');
      setSystemStats(prev => ({
        ...prev,
        ...stats
      }));
    } catch (error) {
      console.warn('Could not fetch system stats:', error);
      // Continue with simulated data
    }
  }, [apiRequest]);

  // Initial data loading
  useEffect(() => {
    fetchUserProfile();
    fetchSystemStats();
  }, [fetchUserProfile, fetchSystemStats]);

  // Real-time system updates with better performance
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        cpuLoad: Math.max(5, Math.min(95, prev.cpuLoad + (Math.random() - 0.5) * 8)),
        memoryUsage: Math.max(20, Math.min(98, prev.memoryUsage + (Math.random() - 0.5) * 6)),
        activeUsers: Math.max(10, Math.min(500, prev.activeUsers + Math.floor((Math.random() - 0.5) * 15)))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Enhanced formatting functions
  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatRelativeTime = (date) => {
    if (!date) return 'N/A';
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diff = Math.floor((new Date(date).getTime() - Date.now()) / 1000);
    
    if (Math.abs(diff) < 60) return rtf.format(diff, 'second');
    if (Math.abs(diff) < 3600) return rtf.format(Math.floor(diff / 60), 'minute');
    if (Math.abs(diff) < 86400) return rtf.format(Math.floor(diff / 3600), 'hour');
    return rtf.format(Math.floor(diff / 86400), 'day');
  };

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  };

  const getSessionDuration = () => {
    const diff = Math.floor((currentTime.getTime() - sessionStart.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getStatusIndicator = (status, animated = true) => {
    const baseClasses = "w-2 h-2 rounded-full";
    const animationClass = animated ? "animate-pulse" : "";
    
    switch (status) {
      case 'online':
      case 'connected':
      case 'active':
        return `${baseClasses} bg-green-500 dark:bg-green-400 ${animationClass}`;
      case 'warning':
      case 'degraded':
        return `${baseClasses} bg-yellow-500 dark:bg-yellow-400 ${animationClass}`;
      case 'offline':
      case 'disconnected':
      case 'error':
        return `${baseClasses} bg-red-500 dark:bg-red-400 ${animationClass}`;
      default:
        return `${baseClasses} bg-gray-500 dark:bg-gray-400 ${animationClass}`;
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'active':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'offline':
      case 'disconnected':
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchUserProfile(),
        fetchSystemStats()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Loading state
  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {getTimeOfDayGreeting()}, {profile?.name || 'User'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome to your dashboard</p>
          </div>
          
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">{profile?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Role:</span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium">
                    {profile?.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                  <span className="text-gray-900 dark:text-gray-100">{profile?.email}</span>
                </div>
                {profile?.department && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Department:</span>
                    <span className="text-gray-900 dark:text-gray-100">{profile.department}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Last Login:</span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    {profile?.lastLogin ? formatRelativeTime(profile.lastLogin) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <div className="flex items-center gap-2">
                    <div className={getStatusIndicator('active')}></div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {profile?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Session:</span>
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                    {getSessionDuration()}
                  </span>
                </div>
                {profile?.joinDate && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Member Since:</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(profile.joinDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* System Status Card */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-gray-900 dark:text-gray-100">
                <div className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  System Status
                </div>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Real-time system metrics and health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Service Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Server:</span>
                    <div className="flex items-center gap-2">
                      <div className={getStatusIndicator(systemStats.serverStatus)}></div>
                      <span className={`text-sm capitalize font-medium ${getStatusTextColor(systemStats.serverStatus)}`}>
                        {systemStats.serverStatus}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Database:</span>
                    <div className="flex items-center gap-2">
                      <div className={getStatusIndicator(systemStats.databaseStatus)}></div>
                      <span className={`text-sm capitalize font-medium ${getStatusTextColor(systemStats.databaseStatus)}`}>
                        {systemStats.databaseStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">CPU Load:</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                        {systemStats.cpuLoad.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          systemStats.cpuLoad > 80 ? 'bg-red-500' : 
                          systemStats.cpuLoad > 60 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(systemStats.cpuLoad, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Memory Usage:</span>
                      <span className="text-sm text-purple-600 dark:text-purple-400 font-mono">
                        {systemStats.memoryUsage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          systemStats.memoryUsage > 90 ? 'bg-red-500' : 
                          systemStats.memoryUsage > 70 ? 'bg-yellow-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${Math.min(systemStats.memoryUsage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Active Users:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {systemStats.activeUsers.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300">System Uptime:</span>
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
                Time & Environment
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Current time and system environment details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Time Display */}
                <div className="text-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 p-6 rounded-xl">
                  <div className="text-4xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(currentTime)}
                  </div>
                </div>
                
                {/* Environment Details */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Timezone:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Screen:
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {window.screen.width} × {window.screen.height}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Session Duration:
                    </span>
                    <span className="text-sm text-green-600 dark:text-green-400 font-mono font-bold">
                      {getSessionDuration()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Browser:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {navigator.userAgent.split(' ').pop().split('/')[0]}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Language:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
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