import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronLeft, ChevronRight, Filter, Users, Search } from "lucide-react";

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

  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(20);

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

  // Get available role filter options based on view
  const getRoleFilterOptions = () => {
    if (view === 'viewAllUsers') {
      return [
        { value: 'all', label: 'All Roles' },
        { value: 'attendee', label: 'Attendees' },
        { value: 'organizer', label: 'Organizers' },
        { value: 'admin', label: 'Admins' },
        { value: 'security', label: 'Security' }
      ];
    } else if (view === 'nonAttendees') {
      return [
        { value: 'all', label: 'All Non-Attendees' },
        { value: 'organizer', label: 'Organizers' },
        { value: 'admin', label: 'Admins' },
        { value: 'security', label: 'Security' }
      ];
    }
    return [];
  };

  // Filter and paginate users
  const filteredAndPaginatedUsers = useMemo(() => {
    if (!users) return { paginatedUsers: [], totalUsers: 0, totalPages: 0 };

    // Filter by search term
    let filtered = users.filter(user => 
      user.full_name.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      user.email.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      user.id.toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => 
        user.role.toLowerCase() === roleFilter.toLowerCase()
      );
    }

    const totalUsers = filtered.length;
    const totalPages = Math.ceil(totalUsers / itemsPerPage);
    
    // Paginate
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { paginatedUsers, totalUsers, totalPages };
  }, [users, searchTerm, roleFilter, currentPage, itemsPerPage]);

  // Get role statistics
  const roleStats = useMemo(() => {
    if (!users) return {};
    
    const stats = users.reduce((acc, user) => {
      const role = user.role.toLowerCase();
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return stats;
  }, [users]);

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

  const handleRoleFilterChange = (newFilter: string) => {
    setRoleFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (view === 'viewAllUsers' || view === 'nonAttendees') {
    const { paginatedUsers, totalUsers, totalPages } = filteredAndPaginatedUsers;
    const roleFilterOptions = getRoleFilterOptions();

    return (
      <Card className="w-full p-4 md:p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl md:text-2xl text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Users className="h-6 w-6" />
            {view === 'viewAllUsers' ? 'All Users' : 'Non-Attendees'}
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            {view === 'viewAllUsers' ? 'Manage all users in the system' : 'Manage non-attendee users'}
            {totalUsers > 0 && (
              <span className="ml-2 font-medium">
                ({totalUsers} user{totalUsers !== 1 ? 's' : ''} found)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
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

          {/* Role Statistics */}
          {Object.keys(roleStats).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {Object.entries(roleStats).map(([role, count]) => (
                <div key={role} className="text-center">
                  <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{role}s</div>
                </div>
              ))}
            </div>
          )}

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            {onSearchTermChange && (
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or ID..."
                    value={searchTerm || ''}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                    className={`pl-10 w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                      focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200`}
                  />
                </div>
              </div>
            )}

            {/* Role Filter */}
            {roleFilterOptions.length > 0 && (
              <div className="md:w-48">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={roleFilter}
                    onChange={(e) => handleRoleFilterChange(e.target.value)}
                    className={`pl-10 w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 
                      rounded-md focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200 py-2`}
                  >
                    {roleFilterOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Items per page */}
            <div className="md:w-32">
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className={`w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 
                  rounded-md focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all duration-200 py-2`}
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>

          {/* User List */}
          <div className="space-y-3">
            {isLoading && paginatedUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin inline-block h-8 w-8 border-4 border-current border-t-transparent text-gray-500 rounded-full"></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Loading users...</p>
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || roleFilter !== 'all' ? 
                    'No users found matching your criteria.' : 
                    'No users found.'
                  }
                </p>
                {(searchTerm || roleFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onSearchTermChange?.('');
                      setRoleFilter('all');
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {paginatedUsers.map(user => (
                  <div key={user.id} className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200 relative">
                    <div className="absolute top-3 right-3 flex gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors.gradient} text-white shadow-sm`}>
                        #{user.id}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize
                        ${user.role.toLowerCase() === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          user.role.toLowerCase() === 'organizer' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          user.role.toLowerCase() === 'security' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="pr-32">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{user.full_name}</h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600 dark:text-gray-300"><strong>Email:</strong> {user.email}</p>
                        {user.phone_number && <p className="text-gray-600 dark:text-gray-300"><strong>Phone:</strong> {user.phone_number}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalUsers)} to {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} users
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                        className={`w-8 h-8 p-0 ${currentPage === pageNumber ? colors.gradient : ''}`}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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