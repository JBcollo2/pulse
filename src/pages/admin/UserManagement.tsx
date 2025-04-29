import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Removed internal searchTerm state

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

  // Removed filteredUsers and internal filtering logic

  if (view === 'viewAllUsers' || view === 'nonAttendees') {
    return (
      <Card className="w-full p-6 glass-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-gradient">
            {view === 'viewAllUsers' ? 'All Users' : 'Non-Attendees'}
          </CardTitle>
          <CardDescription>
            {view === 'viewAllUsers' ? 'List of all users in the system' : 'List of non-attendee users'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="default" className="bg-green-100 border-green-400 text-green-800">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Add Search Input Field - only render if onSearchTermChange prop is provided */}
          {onSearchTermChange && (
            <div className="mb-4">
              <Input
                placeholder="Search by email..."
                value={searchTerm || ''} // Use the prop value
                onChange={(e) => onSearchTermChange(e.target.value)} // Call the parent handler
              />
            </div>
          )}


          <div className="space-y-2 max-h-96 overflow-y-auto">
            {/* Display users directly - they are already fetched/filtered by the parent */}
            {isLoading && users?.length === 0 ? ( // Show loading only if no users are currently displayed
                 <p className="text-center text-muted-foreground">Loading users...</p>
            ) : users?.length === 0 ? ( // Show no users message if the array is empty after loading
                searchTerm ? ( // Differentiate message if a search term is active
                    <p className="text-center text-muted-foreground">No users found matching "{searchTerm}".</p>
                ) : (
                    <p className="text-center text-muted-foreground">No users found.</p>
                )
            ) : (
                // Map and display the users received as a prop
                users?.map(user => (
                  <div key={user.id} className="border p-4 rounded shadow">
                    <p><strong>ID:</strong> {user.id}</p>
                    <p><strong>Name:</strong> {user.full_name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                    {user.phone_number && <p><strong>Phone:</strong> {user.phone_number}</p>}
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
    <Card className="w-full p-6 glass-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-gradient">
          {view === 'registerAdmin' ? 'Register New Admin' : 'Register New Security'}
        </CardTitle>
        <CardDescription>
          {view === 'registerAdmin' ? 'Create a new administrator account' : 'Create a new security user account'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="default" className="bg-green-100 border-green-400 text-green-800">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              placeholder={view === 'registerAdmin' ? "John Doe" : "Jane Doe"}
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder={view === 'registerAdmin' ? "m@example.com" : "jane@example.com"}
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              type="tel"
              placeholder="07xxxxxxxx"
              value={formData.phone_number}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {view === 'registerAdmin' ? 'Register Admin' : 'Register Security User'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserManagement;