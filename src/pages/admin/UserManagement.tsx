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

  // Color configuration matching the navigation color grid
  const viewColors = {
    registerAdmin: {
      primary: 'indigo',
      gradient: 'from-indigo-500 to-purple-600',
      button: 'bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700',
      accent: 'border-indigo-500 dark:border-indigo-400',
      focus: 'focus:ring-indigo-500 focus:border-indigo-500',
      text: 'text-indigo-600 dark:text-indigo-400'
    },
    registerSecurity: {
      primary: 'red',
      gradient: 'from-red-500 to-pink-600',
      button: 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700',
      accent: 'border-red-500 dark:border-red-400',
      focus: 'focus:ring-red-500 focus:border-red-500',
      text: 'text-red-600 dark:text-red-400'
    },
    registerOrganizer: {
      primary: 'yellow',
      gradient: 'from-yellow-500 to-orange-600',
      button: 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700',
      accent: 'border-yellow-500 dark:border-yellow-400',
      focus: 'focus:ring-yellow-500 focus:border-yellow-500',
      text: 'text-yellow-600 dark:text-yellow-400'
    },
    viewAllUsers: {
      primary: 'green',
      gradient: 'from-green-500 to-emerald-600',
      button: 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700',
      accent: 'border-green-500 dark:border-green-400',
      focus: 'focus:ring-green-500 focus:border-green-500',
      text: 'text-green-600 dark:text-green-400'
    },
    nonAttendees: {
      primary: 'orange',
      gradient: 'from-orange-500 to-red-600',
      button: 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700',
      accent: 'border-orange-500 dark:border-orange-400',
      focus: 'focus:ring-orange-500 focus:border-orange-500',
      text: 'text-orange-600 dark:text-orange-400'
    }
  };

  const currentColors = viewColors[view];

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
      <Card className={`w-full p-4 md:p-6 bg-white dark:bg-gray-800 border-2 ${currentColors.accent} shadow-lg`}>
        <CardHeader className="space-y-1">
          <div className={`inline-flex items-center gap-2 mb-2`}>
            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${currentColors.gradient}`}></div>
            <CardTitle className={`text-xl md:text-2xl ${currentColors.text}`}>
              {view === 'viewAllUsers' ? 'All Users' : 'Non-Attendees'}
            </CardTitle>
          </div>
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
            <Alert variant="default" className={`bg-gradient-to-r ${currentColors.gradient} bg-opacity-10 border-2 ${currentColors.accent} ${currentColors.text}`}>
              <AlertDescription className="font-medium">{successMessage}</AlertDescription>
            </Alert>
          )}

          {onSearchTermChange && (
            <div className="mb-4">
              <Input
                placeholder="Search by email..."
                value={searchTerm || ''}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 ${currentColors.focus}`}
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
                <div key={user.id} className={`border-2 ${currentColors.accent} p-4 rounded-lg shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200`}>
                  <div className={`w-full h-1 bg-gradient-to-r ${currentColors.gradient} rounded-full mb-3`}></div>
                  <p className="text-gray-800 dark:text-gray-200"><strong>ID:</strong> {user.id}</p>
                  <p className="text-gray-800 dark:text-gray-200"><strong>Name:</strong> {user.full_name}</p>
                  <p className="text-gray-800 dark:text-gray-200"><strong>Email:</strong> {user.email}</p>
                  <p className="text-gray-800 dark:text-gray-200"><strong>Role:</strong> <span className={`font-semibold ${currentColors.text}`}>{user.role}</span></p>
                  {user.phone_number && <p className="text-gray-800 dark:text-gray-200"><strong>Phone:</strong> {user.phone_number}</p>}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full p-4 md:p-6 bg-white dark:bg-gray-800 border-2 ${currentColors.accent} shadow-lg`}>
      <CardHeader className="space-y-1">
        <div className={`inline-flex items-center gap-2 mb-2`}>
          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${currentColors.gradient}`}></div>
          <CardTitle className={`text-xl md:text-2xl ${currentColors.text}`}>
            {view === 'registerAdmin' ? 'Register New Admin' : view === 'registerSecurity' ? 'Register New Security' : 'Register New Organizer'}
          </CardTitle>
        </div>
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
          <Alert variant="default" className={`bg-gradient-to-r ${currentColors.gradient} bg-opacity-10 border-2 ${currentColors.accent} ${currentColors.text}`}>
            <AlertDescription className="font-medium">{successMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === 'registerOrganizer' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="user_id" className={`${currentColors.text} font-medium`}>User ID</Label>
                <Input
                  id="user_id"
                  type="text"
                  value={formData.user_id}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 ${currentColors.focus}`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company_name" className={`${currentColors.text} font-medium`}>Company Name</Label>
                <Input
                  id="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 ${currentColors.focus}`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company_description" className={`${currentColors.text} font-medium`}>Company Description</Label>
                <Input
                  id="company_description"
                  type="text"
                  value={formData.company_description}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 ${currentColors.focus}`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website" className={`${currentColors.text} font-medium`}>Website</Label>
                <Input
                  id="website"
                  type="text"
                  value={formData.website}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 ${currentColors.focus}`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="business_registration_number" className={`${currentColors.text} font-medium`}>Business Registration Number</Label>
                <Input
                  id="business_registration_number"
                  type="text"
                  value={formData.business_registration_number}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 ${currentColors.focus}`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tax_id" className={`${currentColors.text} font-medium`}>Tax ID</Label>
                <Input
                  id="tax_id"
                  type="text"
                  value={formData.tax_id}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 ${currentColors.focus}`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address" className={`${currentColors.text} font-medium`}>Address</Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 ${currentColors.focus}`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company_logo" className={`${currentColors.text} font-medium`}>Company Logo</Label>
                <Input
                  id="company_logo"
                  type="file"
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 ${currentColors.focus}`}
                />
              </div>
            </>
          )}
          {(view === 'registerAdmin' || view === 'registerSecurity') && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="full_name" className={`${currentColors.text} font-medium`}>Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder={view === 'registerAdmin' ? "John Kamau" : "Jane Agesa"}
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 ${currentColors.focus}`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className={`${currentColors.text} font-medium`}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={view === 'registerAdmin' ? "john@example.com" : "jane@example.com"}
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 ${currentColors.focus}`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone_number" className={`${currentColors.text} font-medium`}>Phone Number</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="07xxxxxxxx"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 ${currentColors.focus}`}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className={`${currentColors.text} font-medium`}>Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 ${currentColors.focus}`}
                />
              </div>
            </>
          )}
          <Button 
            type="submit" 
            className={`w-full ${currentColors.button} text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] font-medium`}
            disabled={isLoading}
          >
            <div className="flex items-center justify-center gap-2">
              <div className={`w-2 h-2 rounded-full bg-white`}></div>
              {view === 'registerAdmin' ? 'Register Admin' : view === 'registerSecurity' ? 'Register Security User' : 'Register Organizer'}
            </div>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserManagement;