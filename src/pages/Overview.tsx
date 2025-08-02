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

  // Fetch user profile from real API
  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try multiple profile endpoints
      const endpoints = ['/auth/profile', '/user/me', '/auth/user'];
      let profileData = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
            credentials: 'include'
          });

          if (response.ok) {
            profileData = await response.json();
            break;
          } else if (response.status === 401) {
            throw new Error('Authentication expired. Please log in again.');
          } else if (response.status === 403) {
            throw new Error('Access denied. You do not have permission to access this resource.');
          } else {
            const errorData = await response.json().catch(() => ({}));
            lastError = new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
          }
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      if (!profileData) {
        throw lastError || new Error('Unable to fetch user profile from any endpoint');
      }

      // Normalize profile data structure
      const normalizedProfile = {
        id: profileData.id || profileData.user_id || profileData.userId,
        name: profileData.full_name || profileData.fullName || profileData.name || profileData.displayName,
        email: profileData.email || profileData.emailAddress,
        role: profileData.role || profileData.userRole || profileData.user_role,
        avatar: profileData.avatar || profileData.profilePicture || profileData.image,
        lastLogin: profileData.last_login || profileData.lastLogin || profileData.lastLoginAt || profileData.loginTime,
        isActive: profileData.is_active !== undefined ? profileData.is_active : profileData.isActive,
        permissions: profileData.permissions || [],
        department: profileData.department,
        joinDate: profileData.join_date || profileData.joinDate || profileData.created_at || profileData.createdAt,
        phoneNumber: profileData.phone_number || profileData.phoneNumber || profileData.phone
      };

      setProfile(normalizedProfile);
      setUserRole(normalizedProfile.role);
    } catch (error) {
      setError(`Profile Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch statistics from real API
  const fetchStats = useCallback(async () => {
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stats`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const statsData = await response.json();
      setStats(statsData);
    } catch (error) {
      setError(`Statistics Error: ${error.message}`);
      setStats(null);
    }
  }, []);

  // Fetch system health from real API (admin only)
  const fetchSystemHealth = useCallback(async () => {
    if (userRole !== 'ADMIN') {
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/system/health`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const healthData = await response.json();
      setSystemHealth(healthData);
    } catch (error) {
      setSystemHealth(null);
    }
  }, [userRole]);

  // Initial data loading
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Fetch stats after profile is loaded
  useEffect(() => {
    if (userRole) {
      fetchStats();
      if (userRole === 'ADMIN') {
        fetchSystemHealth();
      }
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
        userRole === 'ADMIN' ? fetchSystemHealth() : Promise.resolve()
      ]);
    } catch (error) {
      // Handle error silently
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {platformStats?.totalEvents || 0}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Total Events</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Events available on platform</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {platformStats?.upcomingEvents || 0}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Upcoming Events</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Events happening soon</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'organizer':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/30 border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {organizerStats?.myEvents || 0}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">My Events</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total events created</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {organizerStats?.myUpcomingEvents || 0}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Upcoming</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Future events</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/30 border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(organizerStats?.myRevenue)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Total Revenue</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Earnings from events</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'admin':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/30 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {businessMetrics?.totalUsers || 0}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Total Users</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Registered users</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {businessMetrics?.activeUsers || 0}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Active Users</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Currently active</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/30 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {businessMetrics?.totalEvents || 0}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Total Events</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">All platform events</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/30 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(businessMetrics?.totalRevenue)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Total Revenue</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Platform earnings</p>
                </CardContent>
              </Card>
            </div>

            {/* System Health Card */}
            {(systemHealth || statsSystemHealth) && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Monitor className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const healthData = systemHealth || statsSystemHealth;
                    const systemMetrics = healthData?.system || healthData?.systemHealth;
                    const services = healthData?.services;
                    const overallStatus = healthData?.overall || healthData?.status;
                    
                    return (
                      <div className="space-y-6">
                        {/* Overall Status Display */}
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border">
                          <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Overall System Status:
                          </span>
                          <div className="flex items-center gap-2">
                            <div className={getStatusIndicator(overallStatus)}></div>
                            <span className={`text-sm capitalize font-bold ${getStatusTextColor(overallStatus)}`}>
                              {overallStatus || 'Unknown'}
                            </span>
                          </div>
                        </div>

                        {systemMetrics && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                              <div className={`text-xl font-bold mb-2 ${
                                (systemMetrics.cpu || systemMetrics.cpuLoad) > 80 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : (systemMetrics.cpu || systemMetrics.cpuLoad) > 60 
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-green-600 dark:text-green-400'
                              }`}>
                                {(systemMetrics.cpu || systemMetrics.cpuLoad)}%
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">CPU Usage</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                              <div className={`text-xl font-bold mb-2 ${
                                (systemMetrics.memory || systemMetrics.memoryUsage) > 80 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : (systemMetrics.memory || systemMetrics.memoryUsage) > 60 
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-green-600 dark:text-green-400'
                              }`}>
                                {(systemMetrics.memory || systemMetrics.memoryUsage)}%
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Memory Usage</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                              <div className={`text-xl font-bold mb-2 ${
                                (systemMetrics.disk || systemMetrics.diskUsage) > 80 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : (systemMetrics.disk || systemMetrics.diskUsage) > 60 
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-green-600 dark:text-green-400'
                              }`}>
                                {(systemMetrics.disk || systemMetrics.diskUsage)}%
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Disk Usage</div>
                            </div>
                          </div>
                        )}
                        
                        {services && (
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Database:</span>
                                <div className="flex items-center gap-2">
                                  <div className={getStatusIndicator(services.database)}></div>
                                  <span className={`text-sm capitalize font-medium ${getStatusTextColor(services.database)}`}>
                                    {services.database}
                                  </span>
                                </div>
                              </div>
                              {services.redis !== undefined && (
                                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">Redis:</span>
                                  <div className="flex items-center gap-2">
                                    <div className={getStatusIndicator(services.redis)}></div>
                                    <span className={`text-sm capitalize font-medium ${getStatusTextColor(services.redis)}`}>
                                      {services.redis}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Timestamp */}
                        {healthData?.timestamp && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
                            Last checked: {new Date(healthData.timestamp).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Loading state with better error handling
  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Connecting to server...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {import.meta.env.VITE_API_URL}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if profile loading failed
  if (error && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Connection Failed
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              fetchUserProfile();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Connection
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
            Server: {import.meta.env.VITE_API_URL}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-gray-100 dark:via-blue-300 dark:to-indigo-300 bg-clip-text text-transparent">
              {getTimeOfDayGreeting()}, {profile?.name || 'User'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Welcome to your dashboard</p>
          </div>
          
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="w-full bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-600 hover:to-[#0ea372] text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 hover:scale-105 text-lg"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Error Alert - Only show non-critical errors */}
        {error && profile && (
          <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                >
                  ×
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile and Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* User Profile Card */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Your account details and session info
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                      <span className="text-gray-900 dark:text-gray-100 font-semibold">{profile?.name}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Role:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(profile?.role)}`}>
                        {getRoleDisplayName(profile?.role)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                      <span className="text-gray-900 dark:text-gray-100 text-sm">{profile?.email}</span>
                    </div>
                    {profile?.phoneNumber && (
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span>
                        <span className="text-gray-900 dark:text-gray-100 text-sm">{profile.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                      <div className="flex items-center gap-2">
                        <div className={getStatusIndicator('active')}></div>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {profile?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Session:</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-mono font-bold">
                        {getSessionDuration()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Last Login:</span>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        {profile?.lastLogin ? formatRelativeTime(profile.lastLogin) : 'N/A'}
                      </span>
                    </div>
                    {profile?.joinDate && (
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
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
            {renderRoleSpecificStats()}
          </div>

          {/* Right Column - Time & Environment */}
          <div className="space-y-8">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
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
                  <div className="text-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 p-8 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                    <div className="text-4xl font-mono font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
                      {formatTime(currentTime)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {formatDate(currentTime)}
                    </div>
                  </div>
                  
                  {/* Environment Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Timezone:
                      </span>
                      <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                        {Intl.DateTimeFormat().resolvedOptions().timeZone}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Screen:
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {window.screen.width} × {window.screen.height}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Session Duration:
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-400 font-mono font-bold">
                        {getSessionDuration()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Browser:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {navigator.userAgent.split(' ').pop().split('/')[0]}
                      </span>
                    </div>

                    {/* API Connection Status */}
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
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
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
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

            {/* Platform Information */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Shield className="h-5 w-5" />
                  Platform Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                    <span className="font-medium text-gray-700 dark:text-gray-300">API Version:</span>
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-mono font-bold">
                      {stats?.apiVersion || '2.0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl">
                    <span className="font-medium text-gray-700 dark:text-gray-300">User Role:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userRole)}`}>
                      {getRoleDisplayName(userRole)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Security:</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">Active</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Admin Features */}
        {userRole === 'ADMIN' && stats?.detailed && (
          <div className="space-y-8">
            {/* Revenue Chart */}
            {stats.revenueByMonth && stats.revenueByMonth.length > 0 && (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <TrendingUp className="h-5 w-5" />
                    Monthly Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {stats.revenueByMonth.slice(-6).map((month, index) => (
                      <Card key={month.month} className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 border-0 shadow-lg">
                        <CardContent className="p-4 text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">
                            {formatCurrency(month.revenue)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction Metrics */}
            {stats.transactionMetrics && (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <BarChart className="h-5 w-5" />
                    Transaction Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/30 border-0 shadow-lg">
                      <CardContent className="p-4 text-center">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {stats.transactionMetrics.totalTransactions}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 border-0 shadow-lg">
                      <CardContent className="p-4 text-center">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">
                          {stats.transactionMetrics.successfulTransactions}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Successful</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/30 border-0 shadow-lg">
                      <CardContent className="p-4 text-center">
                        <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                          {stats.transactionMetrics.pendingTransactions}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/30 border-0 shadow-lg">
                      <CardContent className="p-4 text-center">
                        <div className="text-xl font-bold text-red-600 dark:text-red-400 mb-1">
                          {stats.transactionMetrics.failedTransactions}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/30 border-0 shadow-lg">
                      <CardContent className="p-4 text-center">
                        <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                          {stats.transactionMetrics.successRate}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4">
          <p>Dashboard data refreshes automatically. Role-based access controls are active.</p>
          {stats?.lastUpdated && (
            <p className="mt-1">Last updated: {new Date(stats.lastUpdated).toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;