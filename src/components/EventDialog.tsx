import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface Category {
  id: number;
  name: string;
  description: string | null;
}

interface Event {
  id: number;
  name: string;
  description?: string;
  date: string;
  end_date?: string;
  start_time: string;
  end_time?: string;
  location: string;
  image?: string;
  organizer_id: number;
  category_id?: number;
}

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent?: Event | null;
  onEventDeleted?: (eventId: string) => void; // Updated to expect a string
  onEventCreated?: (eventData: Event) => void;
}

interface TicketType {
  type_name: string;
  price: number;
  quantity: number;
}

interface EventFormData {
  name: string;
  description: string;
  date: Date;
  end_date: Date;
  start_time: string;
  end_time: string;
  location: string;
  image: File | null;
  ticket_types: TicketType[];
  category_id: number | null;
}

const TICKET_TYPES = ["REGULAR", "VIP", "STUDENT", "GROUP_OF_5", "COUPLES", "EARLY_BIRD", "VVIP", "GIVEAWAY"];

export const EventDialog: React.FC<EventDialogProps> = ({
  open,
  onOpenChange,
  editingEvent = null,
  onEventDeleted,
  onEventCreated
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newEvent, setNewEvent] = useState<EventFormData>({
    name: '',
    description: '',
    date: new Date(),
    end_date: new Date(),
    start_time: '',
    end_time: '',
    location: '',
    image: null,
    ticket_types: [],
    category_id: null
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const { toast } = useToast();

  const isEditing = !!editingEvent;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data.categories);
        console.log('Fetched categories:', data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: "Error",
          description: "Failed to fetch categories",
          variant: "destructive"
        });
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingEvent) {
      setNewEvent({
        name: editingEvent.name,
        description: editingEvent.description || '',
        date: new Date(editingEvent.date),
        end_date: editingEvent.end_date ? new Date(editingEvent.end_date) : new Date(editingEvent.date),
        start_time: editingEvent.start_time,
        end_time: editingEvent.end_time || '',
        location: editingEvent.location,
        image: null,
        ticket_types: [],
        category_id: editingEvent.category_id || null
      });
    } else {
      setNewEvent({
        name: '',
        description: '',
        date: new Date(),
        end_date: new Date(),
        start_time: '',
        end_time: '',
        location: '',
        image: null,
        ticket_types: [],
        category_id: null
      });
    }
  }, [editingEvent, open]);

  const handleAddTicketType = () => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: [...prev.ticket_types, { type_name: TICKET_TYPES[0], price: 0, quantity: 0 }]
    }));
  };

  const handleRemoveTicketType = (index: number) => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: prev.ticket_types.filter((_, i) => i !== index)
    }));
  };

  const handleTicketTypeChange = (index: number, field: keyof TicketType, value: string | number) => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: prev.ticket_types.map((ticket, i) =>
        i === index ? { ...ticket, [field]: value } : ticket
      )
    }));
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;

    setDeletingEvent(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${editingEvent.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to delete event');
      }

      toast({
        title: "Success",
        description: "Event deleted successfully",
        variant: "default"
      });

      setDeleteDialogOpen(false);
      onOpenChange(false);
      onEventDeleted?.(editingEvent.id.toString()); // Convert number to string
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete event",
        variant: "destructive"
      });
    } finally {
      setDeletingEvent(false);
    }
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const profileResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        credentials: 'include'
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await profileResponse.json();
      const organizer_id = profileData.organizer_profile?.id;

      if (!organizer_id) {
        throw new Error('Organizer profile not found');
      }

      const formData = new FormData();
      formData.append('organizer_id', organizer_id.toString());

      if (newEvent.category_id) {
        formData.append('category_id', newEvent.category_id.toString());
      }

      Object.entries(newEvent).forEach(([key, value]) => {
        if (key === 'image' && value instanceof File) {
          formData.append('file', value);
        } else if (key === 'date' && value instanceof Date) {
          formData.append(key, formatDate(value));
        } else if (key === 'end_date' && value instanceof Date) {
          if (formatDate(value) !== formatDate(newEvent.date)) {
            formData.append('end_date', formatDate(value));
          }
        } else if (key !== 'ticket_types' && typeof value === 'string' && value !== '') {
          formData.append(key, value);
        }
      });

      let eventResponse;
      let eventId;

      if (isEditing && editingEvent) {
        eventResponse = await fetch(`${import.meta.env.VITE_API_URL}/events/${editingEvent.id}`, {
          method: 'PUT',
          credentials: 'include',
          
            
          body: formData
        });
        eventId = editingEvent.id;
      } else {
        eventResponse = await fetch(`${import.meta.env.VITE_API_URL}/events`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        const eventData = await eventResponse.json();
        eventId = eventData.id;
      }

      if (!eventResponse.ok) {
        const errorData = await eventResponse.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} event`);
      }

      if (newEvent.ticket_types.length > 0) {
        for (const ticketType of newEvent.ticket_types) {
          const ticketTypeResponse = await fetch(`${import.meta.env.VITE_API_URL}/ticket-types`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event_id: eventId,
              type_name: ticketType.type_name,
              price: ticketType.price,
              quantity: ticketType.quantity
            })
          });

          if (!ticketTypeResponse.ok) {
            const errorData = await ticketTypeResponse.json();
            throw new Error(`Failed to create/update ticket type: ${errorData.message || 'Unknown error'}`);
          }
        }
      }

      toast({
        title: "Success",
        description: `Event and ticket types ${isEditing ? 'updated' : 'created'} successfully`,
        variant: "default"
      });

      onOpenChange(false);
      if (isEditing && editingEvent) {
        onEventCreated?.(editingEvent);
      } else {
        onEventCreated?.({
          id: eventId,
          name: newEvent.name,
          description: newEvent.description,
          date: formatDate(newEvent.date),
          end_date: formatDate(newEvent.end_date),
          start_time: newEvent.start_time,
          end_time: newEvent.end_time,
          location: newEvent.location,
          organizer_id: organizer_id,
          category_id: newEvent.category_id || undefined
        });
      }

      setNewEvent({
        name: '',
        description: '',
        date: new Date(),
        end_date: new Date(),
        start_time: '',
        end_time: '',
        location: '',
        image: null,
        ticket_types: [],
        category_id: null
      });
 } catch (error) {
    console.error(`Error ${isEditing ? 'updating' : 'creating'} event:`, error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} event`,
      variant: "destructive"
    });
  } finally {
    setIsLoading(false); 
  }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {isEditing ? 'Edit Event' : 'Create New Event'}
              </DialogTitle>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="bg-white dark:bg-gray-700 border-red-200 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-500 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Event
                </Button>
              )}
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmitEvent} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Event Name</Label>
              <Input
                id="name"
                value={newEvent.name}
                onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                required
                className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                required
                className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-700 dark:text-gray-300">Category</Label>
              <Select
                value={newEvent.category_id?.toString() || ''}
                onValueChange={(value) => setNewEvent({...newEvent, category_id: value ? parseInt(value) : null})}
              >
                <SelectTrigger
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent
                  className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-lg z-50 rounded-md py-1"
                >
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-gray-900 dark:focus:text-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Start Date</Label>
                <div className="border rounded-md p-2 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <Calendar
                    mode="single"
                    selected={newEvent.date}
                    onSelect={(date) => date && setNewEvent({...newEvent, date})}
                    required
                    className="w-full text-gray-800 dark:text-gray-200 [&_td]:text-gray-800 dark:[&_td]:text-gray-200 [&_th]:text-gray-500 dark:[&_th]:text-gray-400 [&_div.rdp-day_selected]:bg-purple-500 dark:[&_div.rdp-day_selected]:bg-purple-600 dark:[&_div.rdp-day_selected]:text-white [&_button.rdp-button:hover]:bg-gray-100 dark:[&_button.rdp-button:hover]:bg-gray-600 [&_button.rdp-button:focus-visible]:ring-blue-500 dark:[&_button.rdp-button:focus-visible]:ring-offset-gray-800 [&_div.rdp-nav_button]:dark:text-gray-200 [&_div.rdp-nav_button:hover]:dark:bg-gray-600"
                  />
                </div>
                <div className="mt-2">
                  <Label htmlFor="start_time" className="text-gray-700 dark:text-gray-300">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={newEvent.start_time}
                    onChange={(e) => {
                      const time = e.target.value;
                      setNewEvent({...newEvent, start_time: time});
                    }}
                    required
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">End Date</Label>
                <div className="border rounded-md p-2 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <Calendar
                    mode="single"
                    selected={newEvent.end_date}
                    onSelect={(date) => date && setNewEvent({...newEvent, end_date: date})}
                    className="w-full text-gray-800 dark:text-gray-200 [&_td]:text-gray-800 dark:[&_td]:text-gray-200 [&_th]:text-gray-500 dark:[&_th]:text-gray-400 [&_div.rdp-day_selected]:bg-purple-500 dark:[&_div.rdp-day_selected]:bg-purple-600 dark:[&_div.rdp-day_selected]:text-white [&_button.rdp-button:hover]:bg-gray-100 dark:[&_button.rdp-button:hover]:bg-gray-600 [&_button.rdp-button:focus-visible]:ring-blue-500 dark:[&_button.rdp-button:focus-visible]:ring-offset-gray-800 [&_div.rdp-nav_button]:dark:text-gray-200 [&_div.rdp-nav_button:hover]:dark:bg-gray-600"
                  />
                </div>
                <div className="mt-2">
                  <Label htmlFor="end_time" className="text-gray-700 dark:text-gray-300">End Time (Optional)</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={newEvent.end_time}
                    onChange={(e) => {
                      const time = e.target.value;
                      setNewEvent({...newEvent, end_time: time});
                    }}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-gray-700 dark:text-gray-300">Location</Label>
              <Input
                id="location"
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                required
                className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-gray-700 dark:text-gray-300">Event Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setNewEvent({...newEvent, image: file});
                  }
                }}
                className="block w-full text-sm text-gray-800 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-200 hover:file:bg-blue-100 dark:hover:file:bg-blue-800 file:cursor-pointer bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800 overflow-hidden"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Upload event image (PNG, JPG, JPEG, GIF, WEBP)</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 dark:text-gray-300">Ticket Types</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTicketType}
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ticket Type
                </Button>
              </div>

              {newEvent.ticket_types.map((ticket, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-end p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Type</Label>
                    <select
                      className="w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                      value={ticket.type_name}
                      onChange={(e) => handleTicketTypeChange(index, 'type_name', e.target.value)}
                    >
                      {TICKET_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ticket.price}
                      onChange={(e) => handleTicketTypeChange(index, 'price', parseFloat(e.target.value))}
                      required
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Quantity</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={ticket.quantity}
                        onChange={(e) => handleTicketTypeChange(index, 'quantity', parseInt(e.target.value))}
                        required
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveTicketType(index)}
                        className="text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
        <Button
                type="submit"
                disabled={isLoading}
                className={`bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Event' : 'Create Event'
                )}
         </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Delete Event
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete "{editingEvent?.name}"? This action cannot be undone and will permanently remove the event and all associated ticket types.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={deletingEvent}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {deletingEvent ? 'Deleting...' : 'Delete Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
