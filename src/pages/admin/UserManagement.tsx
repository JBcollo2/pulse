import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone_number?: string;
}

interface UserManagementProps {
  view: 'registerAdmin' | 'registerSecurity' | 'viewAllUsers' | 'nonAttendees' | 'registerOrganizer';
  onRegister: (data: any) => Promise<void>;
  users?: User[];
  isLoading: boolean;
  error?: string;
  successMessage?: string;
  searchTerm?: string;
  onSearchTermChange?: (term: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({
  view,
  onRegister,
  users,
  isLoading,
  error,
  successMessage,
  searchTerm,
  onSearchTermChange
}) => {
  const [formData, setFormData] = useState({
    user_id: '',
    email: '',
    phone_number: '',
    password: '',
    full_name: '',
    company_name: '',
    company_description: '',
    website: '',
    business_registration_number: '',
    tax_id: '',
    address: '',
    company_logo: null
  });

  // Define color schemes based on view type to match navigation colors
  const getViewColors = (viewType: string) => {
    switch (viewType) {
      case 'registerAdmin':
        return {
          gradient: 'bg-gradient-to-r from-indigo-500 to-purple-500',
          hover: 'hover:from-indigo-600 hover:to-purple-600',
          shadow: 'shadow-lg shadow-indigo-500/25',
          focus: 'focus:ring-indigo-500'
        };
      case 'registerSecurity':
        return {
          gradient: 'bg-gradient-to-r from-red-500 to-pink-500',
          hover: 'hover:from-red-600 hover:to-pink-600',
          shadow: 'shadow-lg shadow-red-500/25',
          focus: 'focus:ring-red-500'
        };
      case 'registerOrganizer':
        return {
          gradient: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          hover: 'hover:from-yellow-600 hover:to-orange-600',
          shadow: 'shadow-lg shadow-yellow-500/25',
          focus: 'focus:ring-yellow-500'
        };
      case 'viewAllUsers':
        return {
          gradient: 'bg-gradient-to-r from-green-500 to-emerald-500',
          hover: 'hover:from-green-600 hover:to-emerald-600',
          shadow: 'shadow-lg shadow-green-500/25',
          focus: 'focus:ring-green-500'
        };
      case 'nonAttendees':
        return {
          gradient: 'bg-gradient-to-r from-orange-500 to-red-500',
          hover: 'hover:from-orange-600 hover:to-red-600',
          shadow: 'shadow-lg shadow-orange-500/25',
          focus: 'focus:ring-orange-500'
        };
      default:
        return {
          gradient: 'bg-gradient-to-r from-blue-500 to-green-500',
          hover: 'hover:from-blue-600 hover:to-green-600',
          shadow: 'shadow-lg shadow-blue-500/25',
          focus: 'focus:ring-blue-500'
        };
    }
  };

  const colors = getViewColors(view);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, files } = e.target;
    if (files) {
      setFormData(prev => ({
        ...prev,
        [id]: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRegister(formData);
  };

  if (view === 'viewAllUsers' || view === 'nonAttendees') {
    return (
      <Card className="w-full p-4 md:p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl md:text-2xl text-gray-800 dark:text-gray-200">
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
                className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                  focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200`}
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
                <div key={user.id} className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200 relative">
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors.gradient} text-white shadow-sm`}>
                      #{user.id}
                    </span>
                  </div>
                  <div className="pr-16">
                    <p className="text-gray-800 dark:text-gray-200"><strong>Name:</strong> {user.full_name}</p>
                    <p className="text-gray-800 dark:text-gray-200"><strong>Email:</strong> {user.email}</p>
                    <p className="text-gray-800 dark:text-gray-200"><strong>Role:</strong> {user.role}</p>
                    {user.phone_number && <p className="text-gray-800 dark:text-gray-200"><strong>Phone:</strong> {user.phone_number}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full p-4 md:p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl md:text-2xl text-gray-800 dark:text-gray-200">
          {view === 'registerAdmin' ? 'Register New Admin' : view === 'registerSecurity' ? 'Register New Security' : 'Register New Organizer'}
        </CardTitle>
        <CardDescription className="text-gray-500 dark:text-gray-400">
          {view === 'registerAdmin' ? 'Create a new administrator account' : view === 'registerSecurity' ? 'Create a new security user account' : 'Create a new organizer account'}
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
          {view === 'registerOrganizer' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="user_id" className="text-gray-800 dark:text-gray-200">User ID</Label>
                <Input
                  id="user_id"
                  type="text"
                  value={formData.user_id}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                    focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company_name" className="text-gray-800 dark:text-gray-200">Company Name</Label>
                <Input
                  id="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                    focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company_description" className="text-gray-800 dark:text-gray-200">Company Description</Label>
                <Input
                  id="company_description"
                  type="text"
                  value={formData.company_description}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                    focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website" className="text-gray-800 dark:text-gray-200">Website</Label>
                <Input
                  id="website"
                  type="text"
                  value={formData.website}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                    focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="business_registration_number" className="text-gray-800 dark:text-gray-200">Business Registration Number</Label>
                <Input
                  id="business_registration_number"
                  type="text"
                  value={formData.business_registration_number}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                    focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tax_id" className="text-gray-800 dark:text-gray-200">Tax ID</Label>
                <Input
                  id="tax_id"
                  type="text"
                  value={formData.tax_id}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                    focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address" className="text-gray-800 dark:text-gray-200">Address</Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                    focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company_logo" className="text-gray-800 dark:text-gray-200">Company Logo</Label>
                <Input
                  id="company_logo"
                  type="file"
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                    focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200`}
                />
              </div>
            </>
          )}
          {(view === 'registerAdmin' || view === 'registerSecurity') && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="full_name" className="text-gray-800 dark:text-gray-200">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder={view === 'registerAdmin' ? "John Kamau" : "Jane Agesa"}
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                    focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-800 dark:text-gray-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={view === 'registerAdmin' ? "john@example.com" : "jane@example.com"}
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                    focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200`}
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
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                    focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-gray-800 dark:text-gray-200">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                    focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200`}
                />
              </div>
            </>
          )}
          <Button 
            type="submit" 
            className={`w-full ${colors.gradient} ${colors.hover} ${colors.shadow} text-white 
              transition-all duration-300 ease-out transform hover:scale-[1.02] 
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              view === 'registerAdmin' ? 'Register Admin' : view === 'registerSecurity' ? 'Register Security User' : 'Register Organizer'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserManagement;