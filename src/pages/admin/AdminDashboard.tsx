import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Users, CalendarDays, DollarSign, CheckCircle, BarChart2, Activity, UserPlus, Shield } from 'lucide-react';
import AdminNavigation from './AdminNavigation';
import UserManagement from './UserManagement';
import SystemReports from './SystemReports';
import RecentEvents from './RecentEvents';
import { debounce } from 'lodash';
import { cn } from "@/lib/utils";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone_number?: string;
}

const AdminDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'reports' | 'events' | 'nonAttendees' | 'registerAdmin' | 'registerSecurity' | 'viewAllUsers'>('reports');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const getHeaderContent = () => {
    switch (currentView) {
      case 'reports':
        return {
          title: "System Reports",
          description: "View analytics and insights into platform activity.",
          icon: <BarChart2 className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-blue-500 to-blue-700"
        };
      case 'events':
        return {
          title: "Recent Events",
          description: "Monitor and manage recent event activities.",
          icon: <CalendarDays className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-purple-500 to-purple-700"
        };
      case 'viewAllUsers':
        return {
          title: "All Users",
          description: "View and manage all registered users on the platform.",
          icon: <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-green-500 to-green-700"
        };
      case 'nonAttendees':
        return {
          title: "Non-Attendees",
          description: "Track users who have not attended events.",
          icon: <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-orange-500 to-orange-700"
        };
      case 'registerAdmin':
        return {
          title: "Register New Admin",
          description: "Create new administrative user accounts.",
          icon: <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-indigo-500 to-indigo-700"
        };
      case 'registerSecurity':
        return {
          title: "Register Security User",
          description: "Create new security personnel accounts.",
          icon: <Shield className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-red-500 to-red-700"
        };
      default:
        return {
          title: "Dashboard Overview",
          description: "Welcome to your admin control panel.",
          icon: <Activity className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-gray-500 to-gray-700"
        };
    }
  };

  const headerContent = getHeaderContent();

  const handleFetchError = useCallback(async (response: Response) => {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
    } catch (jsonError) {
      console.error('Failed to parse error response:', jsonError);
    }
    setError(errorMessage);
    setAllUsers([]);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  }, [toast]);

  const handleRegister = async (data: any) => {
    setIsLoading(true);
    setError(undefined);
    setSuccessMessage('');
    try {
      const endpoint = currentView === 'registerAdmin'
        ? '/auth/admin/register-admin'
        : '/auth/admin/register-security';

      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const result = await response.json();
      setSuccessMessage(result.msg || `${currentView === 'registerAdmin' ? 'Admin' : 'Security user'} registered successfully.`);
      toast({
        title: "Success",
        description: result.msg || `${currentView === 'registerAdmin' ? 'Admin' : 'Security user'} registered successfully.`,
        variant: "default",
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred during registration.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred during registration.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setError(undefined);
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      setSuccessMessage('Logout successful.');
      toast({
        title: "Success",
        description: "Logout successful.",
        variant: "default",
      });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      setError('An unexpected error occurred while logging out.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while logging out.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    setSuccessMessage('');
    try {
      const endpoint = currentView === 'nonAttendees'
        ? '/admin/users/non-attendees'
        : '/admin/users';

      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const data = await response.json();

      let flattenedUsers: User[] = [];
      if (data && typeof data === 'object') {
        if (Array.isArray(data.admins)) flattenedUsers = flattenedUsers.concat(data.admins);
        if (Array.isArray(data.organizers)) flattenedUsers = flattenedUsers.concat(data.organizers);
        if (Array.isArray(data.security)) flattenedUsers = flattenedUsers.concat(data.security);
        if (Array.isArray(data.attendees)) flattenedUsers = flattenedUsers.concat(data.attendees);
      } else {
        console.warn("Unexpected data format from fetchAllUsers:", data);
        flattenedUsers = [];
      }

      setAllUsers(flattenedUsers);

    } catch (err) {
      console.error('Fetch users error:', err);
      setError('An unexpected error occurred while fetching users.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while fetching users.',
        variant: "destructive",
      });
      setAllUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentView, toast, handleFetchError]);

  const handleSearchUsers = useCallback(async (email: string) => {
    console.log("Executing handleSearchUsers with term:", email);
    setIsLoading(true);
    setError(undefined);
    setSuccessMessage('');
    try {
      const endpoint = `/admin/users/search?email=${encodeURIComponent(email)}`;

      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setAllUsers(data);
      } else {
        console.warn("Unexpected data format from search endpoint:", data);
        setAllUsers([]);
      }

    } catch (err) {
      console.error('Search error:', err);
      setError('An unexpected error occurred while searching.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while searching.',
        variant: "destructive",
      });
      setAllUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, handleFetchError]);

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      console.log("Debounced search triggered for term:", term);
      handleSearchUsers(term);
    }, 500),
    [handleSearchUsers]
  );

  const handleUserManagementSearchChange = (term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);

    if (term === '') {
      console.log("Search term cleared, clearing users state.");
      setAllUsers([]);
    }
  };

  const handleViewChange = (view: 'reports' | 'events' | 'nonAttendees' | 'registerAdmin' | 'registerSecurity' | 'viewAllUsers') => {
    setCurrentView(view);
    if (view !== 'viewAllUsers' && view !== 'nonAttendees') {
      setSearchTerm('');
      setAllUsers([]);
      debouncedSearch.cancel();
    }
    setError(undefined);
    setSuccessMessage('');
  };

  useEffect(() => {
    if ((currentView === 'viewAllUsers' || currentView === 'nonAttendees')) {
      if (!searchTerm) {
        console.log("useEffect: Fetching all users due to view change and empty search.");
        fetchAllUsers();
      } else {
        console.log("useEffect: Fetching search results due to view change and existing search term.");
        handleSearchUsers(searchTerm);
      }
    }

    return () => {
      console.log("useEffect cleanup: Canceling debounced search.");
      debouncedSearch.cancel();
    };
  }, [currentView, searchTerm, fetchAllUsers, handleSearchUsers, debouncedSearch]);

  const filteredUsers = allUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-950 dark:via-gray-900 dark:to-gray-850 text-gray-800 dark:text-white overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 dark:opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>

      <div className="relative z-10 flex min-h-screen">
        <div className="fixed top-0 left-0 h-full w-72 flex-shrink-0 z-50">
          <AdminNavigation
            currentView={currentView}
            onViewChange={handleViewChange}
            onLogout={handleLogout}
            isLoading={isLoading}
          />
        </div>

        <div className="flex-1 ml-72 p-4 md:p-8">
          <Card className={cn(
            "mb-8 p-6 md:p-8 rounded-xl shadow-lg border-none overflow-hidden",
            "bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-60 dark:bg-opacity-40",
            `bg-gradient-to-r ${headerContent.gradient} text-white`
          )}>
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-full bg-white bg-opacity-20 dark:bg-opacity-10 shadow-inner transition-transform duration-300 hover:scale-105">
                {headerContent.icon}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
                  {headerContent.title}
                </h1>
                <p className="text-lg md:text-xl font-light opacity-90">
                  {headerContent.description}
                </p>
              </div>
            </div>
          </Card>

          {currentView === 'reports' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white/70 dark:bg-gray-800/70 border-none rounded-xl shadow-md backdrop-blur-md transform hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Total Users
                  </CardTitle>
                  <div className="relative group">
                    <Users className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:rotate-6 transition-transform duration-300" />
                    <span className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-max text-xs bg-black text-white rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Total users
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="animate-pulse h-8 bg-gray-300 rounded-md" />
                  ) : (
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">12,345</div>
                  )}
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" /> +20.1% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-gray-800/70 border-none rounded-xl shadow-md backdrop-blur-md transform hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Events Held
                  </CardTitle>
                  <div className="relative group">
                    <CalendarDays className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform duration-300" />
                    <span className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-max text-xs bg-black text-white rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Events held
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="animate-pulse h-8 bg-gray-300 rounded-md" />
                  ) : (
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">2,150</div>
                  )}
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" /> +180 since last year
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-gray-800/70 border-none rounded-xl shadow-md backdrop-blur-md transform hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Total Revenue
                  </CardTitle>
                  <div className="relative group">
                    <DollarSign className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:animate-pulse transition-all duration-300" />
                    <span className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-max text-xs bg-black text-white rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Total revenue
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="animate-pulse h-8 bg-gray-300 rounded-md" />
                  ) : (
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">$45,231.89</div>
                  )}
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" /> +19% from last month
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="space-y-6">
            {currentView === 'reports' && (
              <SystemReports />
            )}
            {currentView === 'events' && (
              <RecentEvents/>
            )}

            {(currentView === 'nonAttendees' || currentView === 'viewAllUsers') && (
              <UserManagement
                view={currentView}
                onRegister={handleRegister}
                users={filteredUsers}
                isLoading={isLoading}
                error={error}
                successMessage={successMessage}
                searchTerm={searchTerm}
                onSearchTermChange={handleUserManagementSearchChange}
              />
            )}

            {currentView === 'registerAdmin' && (
              <UserManagement
                view="registerAdmin"
                onRegister={handleRegister}
                isLoading={isLoading}
                error={error}
                successMessage={successMessage}
              />
            )}
            {currentView === 'registerSecurity' && (
              <UserManagement
                view="registerSecurity"
                onRegister={handleRegister}
                isLoading={isLoading}
                error={error}
                successMessage={successMessage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
