import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  is_organizer: boolean;
}

interface Organizer {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  organizer_profile?: {
    company_name: string;
    company_description: string;
    website: string;
    social_media_links: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
    };
    business_registration_number: string;
    tax_id: string;
    address: string;
    events_count: number;
    company_logo?: string;
  };
}

const Organizer = () => {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newOrganizer, setNewOrganizer] = useState({
    user_id: '',
    company_name: '',
    company_description: '',
    website: '',
    business_registration_number: '',
    tax_id: '',
    address: '',
    company_logo: null as File | null
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchOrganizers();
    fetchUsers();
  }, []);

  // Add debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchOrganizers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/organizers`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch organizers');
      }
      
      const data = await response.json();
      setOrganizers(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch organizers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const url = new URL(`${import.meta.env.VITE_API_URL}/auth/users`);
      if (searchQuery) {
        url.searchParams.append('search', searchQuery);
      }

      const response = await fetch(url.toString(), {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      // Filter out users who are already organizers
      const nonOrganizerUsers = data.filter((user: User) => !user.is_organizer);
      setUsers(nonOrganizerUsers);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch users",
        variant: "destructive"
      });
    }
  };

  const handleAddOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      
      // Append all form fields to FormData
      Object.entries(newOrganizer).forEach(([key, value]) => {
        if (key === 'company_logo' && value) {
          formData.append(key, value);
        } else if (value !== null) {
          formData.append(key, value);
        }
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/admin/register-organizer`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to add organizer');
      }

      const data = await response.json();
      setOrganizers([...organizers, data]);
      setNewOrganizer({
        user_id: '',
        company_name: '',
        company_description: '',
        website: '',
        business_registration_number: '',
        tax_id: '',
        address: '',
        company_logo: null
      });
      
      // Refresh users list to remove the newly added organizer
      fetchUsers();
      
      toast({
        title: "Success",
        description: "Organizer added successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add organizer",
        variant: "destructive"
      });
    }
  };

  const handleDeleteOrganizer = async (id: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/organizers/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete organizer');
      }

      setOrganizers(organizers.filter(org => org.id !== id));
      
      // Refresh users list to include the removed organizer
      fetchUsers();
      
      toast({
        title: "Success",
        description: "Organizer deleted successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete organizer",
        variant: "destructive"
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Organizers</h1>
        <Button>Add Organizer</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Organizer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddOrganizer} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="user" className="text-sm font-medium">Select User</label>
              <div className="space-y-2">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2"
                />
                <Select
                  value={newOrganizer.user_id}
                  onValueChange={(value) => setNewOrganizer({...newOrganizer, user_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <span>{user.full_name}</span>
                            <span className="text-sm text-muted-foreground">({user.email})</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        No users found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="companyName" className="text-sm font-medium">Company Name</label>
              <Input
                id="companyName"
                value={newOrganizer.company_name}
                onChange={(e) => setNewOrganizer({...newOrganizer, company_name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="companyDescription" className="text-sm font-medium">Company Description</label>
              <Textarea
                id="companyDescription"
                value={newOrganizer.company_description}
                onChange={(e) => setNewOrganizer({...newOrganizer, company_description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="website" className="text-sm font-medium">Website</label>
                <Input
                  id="website"
                  value={newOrganizer.website}
                  onChange={(e) => setNewOrganizer({...newOrganizer, website: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="businessRegNumber" className="text-sm font-medium">Business Registration Number</label>
                <Input
                  id="businessRegNumber"
                  value={newOrganizer.business_registration_number}
                  onChange={(e) => setNewOrganizer({...newOrganizer, business_registration_number: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="taxId" className="text-sm font-medium">Tax ID</label>
                <Input
                  id="taxId"
                  value={newOrganizer.tax_id}
                  onChange={(e) => setNewOrganizer({...newOrganizer, tax_id: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">Address</label>
              <Textarea
                id="address"
                value={newOrganizer.address}
                onChange={(e) => setNewOrganizer({...newOrganizer, address: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="companyLogo" className="text-sm font-medium">Company Logo</label>
              <Input
                id="companyLogo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setNewOrganizer({...newOrganizer, company_logo: file});
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Upload your company logo (PNG, JPG, JPEG, GIF, WEBP)</p>
            </div>

            <Button type="submit">Add Organizer</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organizer List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizers.map((organizer) => (
                <TableRow key={organizer.id}>
                  <TableCell>
                    {organizer.organizer_profile?.company_logo ? (
                      <img 
                        src={organizer.organizer_profile.company_logo} 
                        alt={`${organizer.organizer_profile.company_name} logo`}
                        className="w-10 h-10 object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-500">No logo</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{organizer.full_name}</TableCell>
                  <TableCell>{organizer.organizer_profile?.company_name}</TableCell>
                  <TableCell>{organizer.email}</TableCell>
                  <TableCell>{organizer.phone_number}</TableCell>
                  <TableCell>{organizer.organizer_profile?.events_count || 0}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteOrganizer(organizer.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Organizer; 