import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Users, CalendarDays, DollarSign, CheckCircle } from 'lucide-react';
import AdminNavigation from './AdminNavigation';
import UserManagement from './UserManagement';
import SystemReports from './SystemReports';
import RecentEvents from './RecentEvents';
import AdminStats from './AdminStats';
import { debounce } from 'lodash';

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

  const handleViewChange = (view: string) => {
    setCurrentView(view as any);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white">
      <div className="container mx-auto py-6">
        <div className="flex gap-6">
          <div className="w-48 flex-shrink-0">
            <AdminNavigation
              currentView={currentView}
              onViewChange={handleViewChange}
              onLogout={handleLogout}
              isLoading={isLoading}
            />
          </div>
          <div className="flex-1">
            {currentView === 'reports' && (
              <div className="space-y-6">
                <SystemReports />
              </div>
            )}
            {currentView === 'events' && (
              <div className="space-y-6">
                <RecentEvents />
              </div>
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


