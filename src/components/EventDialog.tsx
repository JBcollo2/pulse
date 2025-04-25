import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

const TICKET_TYPES = ["REGULAR", "VIP", "STUDENT", "GROUP_OF_5", "COUPLES", "EARLY_BIRD", "VVIP", "GIVEAWAY"];

export const EventDialog: React.FC<EventDialogProps> = ({ open, onOpenChange }) => {
  const [newEvent, setNewEvent] = useState<EventFormData>({
    name: '',
    description: '',
    date: new Date(),
    end_date: new Date(),
    start_time: '',
    end_time: '',
    location: '',
    image: null,
    ticket_types: []
  });
  const { toast } = useToast();

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

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // First get the user's profile to get the organizer_id
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
      
      // Add organizer_id first
      formData.append('organizer_id', organizer_id.toString());
      
      // Log the data before sending
      console.log('Event data before sending:', newEvent);
      
      
      Object.entries(newEvent).forEach(([key, value]) => {
        if (key === 'image' && value instanceof File) {
          formData.append('file', value);
        } else if (key === 'date' && value instanceof Date) {
          formData.append(key, format(value, 'yyyy-MM-dd'));
        } else if (key === 'end_date' && value instanceof Date) {
          if (format(value, 'yyyy-MM-dd') !== format(newEvent.date, 'yyyy-MM-dd')) {
            formData.append('end_date', format(value, 'yyyy-MM-dd'));
          }
        } else if (key !== 'ticket_types' && typeof value === 'string' && value !== '') {
          formData.append(key, value);
        }
      });

      // First create the event
      const eventResponse = await fetch(`${import.meta.env.VITE_API_URL}/events`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!eventResponse.ok) {
        const errorData = await eventResponse.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to create event');
      }

      const eventData = await eventResponse.json();
      const eventId = eventData.id;

      // Then create ticket types for the event
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
            console.error('Error creating ticket type:', errorData);
            console.error('Request payload:', {
              event_id: eventId,
              type_name: ticketType.type_name,
              price: ticketType.price,
              quantity: ticketType.quantity
            });
            throw new Error(`Failed to create ticket type: ${errorData.message || 'Unknown error'}`);
          }
        }
      }
      
      toast({
        title: "Success",
        description: "Event and ticket types created successfully",
        variant: "default"
      });
      
      onOpenChange(false);
      setNewEvent({
        name: '',
        description: '',
        date: new Date(),
        end_date: new Date(),
        start_time: '',
        end_time: '',
        location: '',
        image: null,
        ticket_types: []
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddEvent} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name</Label>
            <Input
              id="name"
              value={newEvent.name}
              onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <div className="border rounded-md p-2">
                <Calendar
                  mode="single"
                  selected={newEvent.date}
                  onSelect={(date) => date && setNewEvent({...newEvent, date})}
                  required
                  className="w-full"
                />
              </div>
              <div className="mt-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={newEvent.start_time}
                  onChange={(e) => {
                    const time = e.target.value;
                    setNewEvent({...newEvent, start_time: time + ':00'});
                  }}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <div className="border rounded-md p-2">
                <Calendar
                  mode="single"
                  selected={newEvent.end_date}
                  onSelect={(date) => date && setNewEvent({...newEvent, end_date: date})}
                  className="w-full"
                />
              </div>
              <div className="mt-2">
                <Label htmlFor="end_time">End Time (Optional)</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={newEvent.end_time}
                  onChange={(e) => {
                    const time = e.target.value;
                    setNewEvent({...newEvent, end_time: time + ':00'});
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={newEvent.location}
              onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Event Image</Label>
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
            />
            <p className="text-xs text-muted-foreground">Upload event image (PNG, JPG, JPEG, GIF, WEBP)</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Ticket Types</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTicketType}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Ticket Type
              </Button>
            </div>
            
            {newEvent.ticket_types.map((ticket, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 items-end p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={ticket.type_name}
                    onChange={(e) => handleTicketTypeChange(index, 'type_name', e.target.value)}
                  >
                    {TICKET_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ticket.price}
                    onChange={(e) => handleTicketTypeChange(index, 'price', parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={ticket.quantity}
                      onChange={(e) => handleTicketTypeChange(index, 'quantity', parseInt(e.target.value))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTicketType(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Event</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 