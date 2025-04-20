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
  };
}

const Organizer = () => {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrganizer, setNewOrganizer] = useState({
    user_id: '',
    company_name: '',
    company_description: '',
    website: '',
    business_registration_number: '',
    tax_id: '',
    address: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchOrganizers();
    fetchUsers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/organizers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      // Filter out users who are already organizers
      const nonOrganizerUsers = data.filter((user: User) => user.role !== 'ORGANIZER');
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/admin/register-organizer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newOrganizer)
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
        address: ''
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
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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
              <Select
                value={newOrganizer.user_id}
                onValueChange={(value) => setNewOrganizer({...newOrganizer, user_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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