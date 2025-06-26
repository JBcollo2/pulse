import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Define User type for consistency
interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone_number?: string;
  // Add other user properties if they exist
}

interface UserManagementProps {
  view: 'registerAdmin' | 'registerSecurity' | 'viewAllUsers' | 'nonAttendees';
  onRegister: (data: any) => Promise<void>;
  users?: User[]; // Expects the already fetched/filtered list from parent
  isLoading: boolean;
  error?: string;
  successMessage?: string;
  // Props for search handled by parent (AdminDashboard)
  searchTerm?: string; // Current search term passed down
  onSearchTermChange?: (term: string) => void; // Handler to call when search input changes
}

const UserManagement: React.FC<UserManagementProps> = ({
  view,
  onRegister,
  users, // The list of users (either full or filtered) is passed down
  isLoading,
  error,
  successMessage,
  // Destructure search props
  searchTerm,
  onSearchTermChange // Handler from AdminDashboard
}) => {
  const [formData, setFormData] = useState({
    email: '',
    phone_number: '',
    password: '',
    full_name: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRegister(formData);
  };

  if (view === 'viewAllUsers' || view === 'nonAttendees') {
    return (
      <Card className="w-full p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-gray-800 dark:text-gray-200">
            {view === 'viewAllUsers' ? 'All Users' : 'Non-Attendees'}
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            {view === 'viewAllUsers' ? 'List of all users in the system' : 'List of non-attendee users'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-50 dark:bg-red-900 border-red-500 dark:border-red-700 text-red-800 dark:text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="default" className="bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-700 text-green-800 dark:text-green-200">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {onSearchTermChange && (
            <div className="mb-4">
              <Input
                placeholder="Search by email..."
                value={searchTerm || ''}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              />
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading && users?.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">Loading users...</p>
            ) : users?.length === 0 ? (
              searchTerm ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No users found matching "{searchTerm}".</p>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">No users found.</p>
              )
            ) : (
              users?.map(user => (
                <div key={user.id} className="border border-gray-200 dark:border-gray-700 p-4 rounded shadow bg-white dark:bg-gray-800">
                  <p className="text-gray-800 dark:text-gray-200"><strong>ID:</strong> {user.id}</p>
                  <p className="text-gray-800 dark:text-gray-200"><strong>Name:</strong> {user.full_name}</p>
                  <p className="text-gray-800 dark:text-gray-200"><strong>Email:</strong> {user.email}</p>
                  <p className="text-gray-800 dark:text-gray-200"><strong>Role:</strong> {user.role}</p>
                  {user.phone_number && <p className="text-gray-800 dark:text-gray-200"><strong>Phone:</strong> {user.phone_number}</p>}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Rest of the component for 'registerAdmin' and 'registerSecurity' views
  return (
    <Card className="w-full p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-gray-800 dark:text-gray-200">
          {view === 'registerAdmin' ? 'Register New Admin' : 'Register New Security'}
        </CardTitle>
        <CardDescription className="text-gray-500 dark:text-gray-400">
          {view === 'registerAdmin' ? 'Create a new administrator account' : 'Create a new security user account'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-900 border-red-500 dark:border-red-700 text-red-800 dark:text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="default" className="bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-700 text-green-800 dark:text-green-200">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name" className="text-gray-800 dark:text-gray-200">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              placeholder={view === 'registerAdmin' ? "John Doe" : "Jane Doe"}
              value={formData.full_name}
              onChange={handleChange}
              className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-gray-800 dark:text-gray-200">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder={view === 'registerAdmin' ? "m@example.com" : "jane@example.com"}
              value={formData.email}
              onChange={handleChange}
              className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone_number" className="text-gray-800 dark:text-gray-200">Phone Number</Label>
            <Input
              id="phone_number"
              type="tel"
              placeholder="07xxxxxxxx"
              value={formData.phone_number}
              onChange={handleChange}
              className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-gray-800 dark:text-gray-200">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
            />
          </div>
          <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-900" disabled={isLoading}>
            {view === 'registerAdmin' ? 'Register Admin' : 'Register Security User'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
