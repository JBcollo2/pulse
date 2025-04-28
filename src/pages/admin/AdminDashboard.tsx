import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Users, CalendarDays, DollarSign, CheckCircle } from 'lucide-react';
import AdminNavigation from './AdminNavigation';
import UserManagement from './UserManagement';
import SystemReports from './SystemReports';
import RecentEvents from './RecentEvents';
import AdminStats from './AdminStats';

const AdminDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'reports' | 'events' | 'nonAttendees' | 'registerAdmin' | 'registerSecurity' | 'viewAllUsers'>('reports');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const { toast } = useToast();

  const handleFetchError = async (response: Response) => {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
    } catch (jsonError) {
      console.error('Failed to parse error response:', jsonError);
    }
    setError(errorMessage);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const handleRegister = async (data: any) => {
    setIsLoading(true);
    setError('');
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
    setError('');
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

  const fetchAllUsers = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const endpoint = currentView === 'nonAttendees' 
        ? '/admin/users/non-attendees'
        : '/auth/users';
        
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('An unexpected error occurred while fetching users.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while fetching users.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === 'viewAllUsers' || currentView === 'nonAttendees') {
      fetchAllUsers();
    }
  }, [currentView]);

  const handleViewChange = (view: string) => {
    setCurrentView(view as any);
  };

  return (
    <div className="min-h-screen bg-background">
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
                users={users}
                isLoading={isLoading}
                error={error}
                successMessage={successMessage}
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