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

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

export const EventDialog: React.FC<EventDialogProps> = ({ open, onOpenChange }) => {
  const [newEvent, setNewEvent] = useState<EventFormData>({
    name: '',
    description: '',
    date: new Date(),
    end_date: new Date(),
    start_time: '',
    end_time: '',
    location: '',
    image: null
  });
  const { toast } = useToast();

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
      
      // Append all form fields to FormData
      Object.entries(newEvent).forEach(([key, value]) => {
        if (key === 'image' && value instanceof File) {
          formData.append('file', value);
        } else if (key === 'date' && value instanceof Date) {
          formData.append(key, format(value, 'yyyy-MM-dd'));
        } else if (key === 'end_date' && value instanceof Date) {
          if (format(value, 'yyyy-MM-dd') !== format(newEvent.date, 'yyyy-MM-dd')) {
            formData.append('end_date', format(value, 'yyyy-MM-dd'));
          }
        } else if (typeof value === 'string' && value !== '') {
          formData.append(key, value);
        }
      });

      // Log the FormData contents
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/events`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to create event');
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: "Event created successfully",
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
        image: null
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
                    // Add seconds to the time
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
                    // Add seconds to the time
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