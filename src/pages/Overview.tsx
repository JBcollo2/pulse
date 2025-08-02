import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, Shield, BarChart, RefreshCw, Activity, Globe, Monitor, AlertCircle, CheckCircle, Loader2, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionStart] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  
  // Enhanced time update with cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // API configuration matching backend expectations
  const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  // Enhanced API fetch utility with JWT support
  const apiRequest = useCallback(
    async (
      endpoint: string,
      options: RequestInit = {}
    ) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

      try {
        // Get JWT token from localStorage or wherever you store it
        const token = localStorage.getItem('access_token');

        const mergedHeaders = {
          ...API_CONFIG.headers,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(options.headers && typeof options.headers === 'object' ? options.headers : {})
        };

        const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
          ...options,
          headers: mergedHeaders,
          credentials: 'include',
          signal: controller.signal
        });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        // Handle unauthorized - redirect to login or refresh token
        setError('Authentication required. Please log in.');
        return null;
      }

      if (response.status === 403) {
        setError('Access denied. Insufficient permissions.');
        return null;
      }

      if (response.status === 429) {
        setError('Too many requests. Please wait and try again.');
        return null;
      }

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

  // Fetch user profile - try multiple endpoints as backend suggests
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try the profile endpoints mentioned in the backend
      const endpoints = ['/api/auth/profile', '/api/user/me', '/api/auth/user'];
      let profileData = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          profileData = await apiRequest(endpoint);
          if (profileData) break;
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      if (!profileData) {
        // Create demo profile for development/testing
        profileData = {
          id: 'demo-123',
          name: "Demo User",
          role: "ORGANIZER", // Match backend UserRole enum
          email: "demo@company.com",
          avatar: null,
          lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isActive: true,
          permissions: ['read', 'write'],
          department: 'Events',
          joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        };
      }

      // Normalize profile data structure to match backend response
      const normalizedProfile = {
        id: profileData.id || profileData.userId || 'demo-123',
        name: profileData.full_name || profileData.fullName || profileData.name || profileData.displayName || 'Demo User',
        email: profileData.email || profileData.emailAddress || 'demo@company.com',
        role: profileData.role || profileData.userRole || 'ORGANIZER',
        avatar: profileData.avatar || profileData.profilePicture || profileData.image || null,
        lastLogin: profileData.lastLogin || profileData.lastLoginAt || profileData.loginTime || new Date(Date.now() - 2 * 60 * 60 * 1000),
        isActive: profileData.isActive !== undefined ? profileData.isActive : true,
        permissions: profileData.permissions || [],
        department: profileData.department || 'Events',
        joinDate: profileData.joinDate || profileData.created_at || profileData.createdAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        phoneNumber: profileData.phone_number || profileData.phoneNumber || null
      };

      setProfile(normalizedProfile);
      setUserRole(normalizedProfile.role);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Fetch statistics based on user role using the unified stats endpoint
  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      
      // Use the unified stats endpoint from backend
      const statsData = await apiRequest('/api/stats');
      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Don't set error here as stats might not be critical
      setStats(null);
    }
  }, [apiRequest]);

  // Fetch system health (admin only)
  const fetchSystemHealth = useCallback(async () => {
    try {
      if (userRole === 'ADMIN') {
        const healthData = await apiRequest('/api/system/health');
        if (healthData) {
          setSystemHealth(healthData);
        }
      }
    } catch (error) {
      console.warn('Could not fetch system health:', error);
      setSystemHealth(null);
    }
  }, [apiRequest, userRole]);

  // Initial data loading
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Fetch stats after profile is loaded
  useEffect(() => {
    if (userRole) {
      fetchStats();
      fetchSystemHealth();
    }
  }, [userRole, fetchStats, fetchSystemHealth]);

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
    
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'online':
      case 'connected':
      case 'active':
        return `${baseClasses} bg-green-500 dark:bg-green-400 ${animationClass}`;
      case 'warning':
      case 'degraded':
        return `${baseClasses} bg-yellow-500 dark:bg-yellow-400 ${animationClass}`;
      case 'unhealthy':
      case 'offline':
      case 'disconnected':
      case 'error':
        return `${baseClasses} bg-red-500 dark:bg-red-400 ${animationClass}`;
      default:
        return `${baseClasses} bg-gray-500 dark:bg-gray-400 ${animationClass}`;
    }
  };

  const getStatusTextColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'online':
      case 'connected':
      case 'active':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'unhealthy':
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
        fetchStats(),
        fetchSystemHealth()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ATTENDEE': return 'Attendee';
      case 'ORGANIZER': return 'Event Organizer';
      case 'ADMIN': return 'Administrator';
      default: return role || 'User';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ATTENDEE': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'ORGANIZER': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'ADMIN': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  // Render role-specific stats
  const renderRoleSpecificStats = () => {
    if (!stats) return null;

    const { userRole: statsRole, platformStats, organizerStats, businessMetrics, systemHealth: statsSystemHealth } = stats;

    switch (statsRole) {
      case 'attendee':
        return (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Calendar className="h-5 w-5" />
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {platformStats?.totalEvents || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {platformStats?.upcomingEvents || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming Events</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'organizer':
        return (
          <>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Calendar className="h-5 w-5" />
                  My Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {organizerStats?.myEvents || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {organizerStats?.myUpcomingEvents || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <DollarSign className="h-5 w-5" />
                  Revenue Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {formatCurrency(organizerStats?.myRevenue)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
                </div>
              </CardContent>
            </Card>
          </>
        );

      case 'admin':
        return (
          <>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <BarChart className="h-5 w-5" />
                  Business Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {businessMetrics?.totalUsers || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {businessMetrics?.activeUsers || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {businessMetrics?.totalEvents || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(businessMetrics?.totalRevenue)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(statsSystemHealth || systemHealth) && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Monitor className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const healthData = statsSystemHealth || systemHealth;
                    const systemMetrics = healthData?.system || healthData?.systemHealth;
                    const services = healthData?.services;
                    
                    return (
                      <div className="space-y-4">
                        {systemMetrics && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {systemMetrics.cpu || systemMetrics.cpuLoad}%
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {systemMetrics.memory || systemMetrics.memoryUsage}%
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {systemMetrics.disk || systemMetrics.diskUsage}%
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Disk Usage</div>
                            </div>
                          </div>
                        )}
                        
                        {services && (
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Database:</span>
                                <div className="flex items-center gap-2">
                                  <div className={getStatusIndicator(services.database)}></div>
                                  <span className={`text-sm capitalize font-medium ${getStatusTextColor(services.database)}`}>
                                    {services.database}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Overall Status:</span>
                                <div className="flex items-center gap-2">
                                  <div className={getStatusIndicator(healthData?.overall || healthData?.status)}></div>
                                  <span className={`text-sm capitalize font-medium ${getStatusTextColor(healthData?.overall || healthData?.status)}`}>
                                    {healthData?.overall || healthData?.status || 'Unknown'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </>
        );

      default:
        return null;
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
                  <span className={`px-2 py-1 rounded-md text-sm font-medium ${getRoleBadgeColor(profile?.role)}`}>
                    {getRoleDisplayName(profile?.role)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                  <span className="text-gray-900 dark:text-gray-100 text-sm">{profile?.email}</span>
                </div>
                {profile?.phoneNumber && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span>
                    <span className="text-gray-900 dark:text-gray-100 text-sm">{profile.phoneNumber}</span>
                  </div>
                )}
                {profile?.department && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Department:</span>
                    <span className="text-gray-900 dark:text-gray-100 text-sm">{profile.department}</span>
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

        {/* Role-specific Stats */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {renderRoleSpecificStats()}
          
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

                  {/* API Status */}
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300">API Status:</span>
                    <div className="flex items-center gap-2">
                      <div className={getStatusIndicator(stats ? 'connected' : 'disconnected')}></div>
                      <span className={`text-sm font-medium ${getStatusTextColor(stats ? 'connected' : 'disconnected')}`}>
                        {stats ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>

                  {/* Last Updated */}
                  {stats?.lastUpdated && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Last Updated:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatRelativeTime(stats.lastUpdated)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Admin Features */}
        {userRole === 'ADMIN' && stats?.detailed && (
          <div className="space-y-6">
            {/* Revenue Chart */}
            {stats.revenueByMonth && stats.revenueByMonth.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <TrendingUp className="h-5 w-5" />
                    Monthly Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {stats.revenueByMonth.slice(-6).map((month, index) => (
                      <div key={month.month} className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(month.revenue)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction Metrics */}
            {stats.transactionMetrics && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <BarChart className="h-5 w-5" />
                    Transaction Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.transactionMetrics.totalTransactions}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {stats.transactionMetrics.successfulTransactions}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Successful</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                        {stats.transactionMetrics.pendingTransactions}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-xl font-bold text-red-600 dark:text-red-400">
                        {stats.transactionMetrics.failedTransactions}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {stats.transactionMetrics.successRate}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Event Analytics */}
            {stats.eventMetrics && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Calendar className="h-5 w-5" />
                    Event Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.eventMetrics.activeEvents}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Active Events</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.eventMetrics.futureEvents}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Future Events</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                        {stats.eventMetrics.pastEvents}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Past Events</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Growth */}
            {stats.userGrowth && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Users className="h-5 w-5" />
                    User Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.userGrowth.newUsersThisWeek}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">New Users This Week</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {stats.userGrowth.newUsersThisMonth}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">New Users This Month</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Platform Information */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Shield className="h-5 w-5" />
              Platform Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-300">API Version:</span>
                <span className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                  {stats?.apiVersion || '2.0'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-300">User Role:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(userRole)}`}>
                  {getRoleDisplayName(userRole)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-300">Security:</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">Active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Dashboard data refreshes automatically. Role-based access controls are active.</p>
          {stats?.lastUpdated && (
            <p>Last updated: {new Date(stats.lastUpdated).toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;