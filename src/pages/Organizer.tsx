import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

interface Organizer {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  events_count: number;
}

const Organizer = () => {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrganizer, setNewOrganizer] = useState({
    name: '',
    email: '',
    phone_number: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/organizers`, {
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

  const handleAddOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/organizers`, {
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
      setNewOrganizer({ name: '', email: '', phone_number: '' });
      
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input
                  id="name"
                  value={newOrganizer.name}
                  onChange={(e) => setNewOrganizer({...newOrganizer, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  type="email"
                  value={newOrganizer.email}
                  onChange={(e) => setNewOrganizer({...newOrganizer, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                <Input
                  id="phone"
                  value={newOrganizer.phone_number}
                  onChange={(e) => setNewOrganizer({...newOrganizer, phone_number: e.target.value})}
                  required
                />
              </div>
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
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizers.map((organizer) => (
                <TableRow key={organizer.id}>
                  <TableCell>{organizer.name}</TableCell>
                  <TableCell>{organizer.email}</TableCell>
                  <TableCell>{organizer.phone_number}</TableCell>
                  <TableCell>{organizer.events_count}</TableCell>
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