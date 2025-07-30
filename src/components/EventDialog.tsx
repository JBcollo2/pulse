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
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Trash2, Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Utility function to format Date object to YYYY-MM-DD string format
 * Used for API calls that expect date strings in this format
 */
const formatDate = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Predefined ticket types available for events
const TICKET_TYPES = ["REGULAR", "VIP", "STUDENT", "GROUP_OF_5", "COUPLES", "EARLY_BIRD", "VVIP", "GIVEAWAY"];

/**
 * Main EventDialog Component
 * A modal dialog for creating new events or editing existing ones
 * 
 * Props:
 * - open: boolean - Controls dialog visibility
 * - onOpenChange: function - Callback when dialog open state changes
 * - editingEvent: object|null - Event data when editing, null when creating new
 * - onEventCreated: function - Callback when event is successfully created/updated
 */
export const EventDialog = ({
  open,
  onOpenChange,
  editingEvent = null,
  onEventCreated
}) => {
  // State for storing event categories fetched from API
  const [categories, setCategories] = useState([]);
  
  // State for existing ticket types when editing an event
  const [existingTicketTypes, setExistingTicketTypes] = useState([]);
  
  // Main form state for new event data
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    date: new Date(),           // Event start date
    end_date: new Date(),       // Event end date
    start_time: '',             // Event start time (HH:MM format)
    end_time: '',               // Event end time (HH:MM format)
    location: '',
    image: null,                // File object for event image
    ticket_types: [],           // Array of new ticket types to be created
    category_id: null           // Selected category ID
  });
  
  // Loading state for form submission
  const [isLoading, setIsLoading] = useState(false);
  
  // Toast notification hook for user feedback
  const { toast } = useToast();

  // Determine if we're in editing mode
  const isEditing = !!editingEvent;

  /**
   * Effect: Fetch event categories from API on component mount
   * Categories are used in the category dropdown selection
   */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
          credentials: 'include' // Include cookies for authentication
        });

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data.categories);
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

  /**
   * Effect: Fetch existing ticket types when editing an event
   * This allows users to see and modify existing ticket types
   */
  useEffect(() => {
    const fetchExistingTicketTypes = async () => {
      if (editingEvent && editingEvent.id) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${editingEvent.id}/ticket-types`, {
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            setExistingTicketTypes(data.ticket_types || []);
          }
        } catch (error) {
          console.error('Error fetching existing ticket types:', error);
        }
      }
    };

    fetchExistingTicketTypes();
  }, [editingEvent]);

  /**
   * Effect: Initialize form data based on editing mode
   * - When editing: populate form with existing event data
   * - When creating: reset form to default values
   */
  useEffect(() => {
    if (editingEvent) {
      // Helper function to parse date strings
      const parseDate = (dateStr) => {
        if (!dateStr) return new Date();
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? new Date() : date;
      };

      // Populate form with existing event data for editing
      setNewEvent({
        name: editingEvent.name || '',
        description: editingEvent.description || '',
        date: parseDate(editingEvent.date),
        end_date: editingEvent.end_date ? parseDate(editingEvent.end_date) : parseDate(editingEvent.date),
        start_time: editingEvent.start_time || '',
        end_time: editingEvent.end_time || '',
        location: editingEvent.location || '',
        image: null, // Always null for editing (user can upload new image)
        ticket_types: [], // Start with empty array for new ticket types
        category_id: editingEvent.category_id || null
      });
    } else {
      // Reset form for creating new event
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
      setExistingTicketTypes([]);
    }
  }, [editingEvent, open]);

  /**
   * Add a new ticket type to the form
   * Creates a new ticket type with default values
   */
  const handleAddTicketType = () => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: [...prev.ticket_types, { type_name: TICKET_TYPES[0], price: 0, quantity: 0 }]
    }));
  };

  /**
   * Remove a ticket type from the form by index
   */
  const handleRemoveTicketType = (index) => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: prev.ticket_types.filter((_, i) => i !== index)
    }));
  };

  /**
   * Update a specific field of a ticket type by index
   */
  const handleTicketTypeChange = (index, field, value) => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: prev.ticket_types.map((ticket, i) =>
        i === index ? { ...ticket, [field]: value } : ticket
      )
    }));
  };

  /**
   * Update an existing ticket type via API call
   * Used for modifying ticket types that already exist in the database
   */
  const handleUpdateExistingTicketType = async (ticketTypeId, updatedData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ticket-types/${ticketTypeId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update ticket type');
      }

      const responseData = await response.json();
      
      // Update local state to reflect changes immediately
      setExistingTicketTypes(prev => 
        prev.map(ticket => 
          ticket.id === ticketTypeId 
            ? { ...ticket, ...updatedData }
            : ticket
        )
      );

      toast({
        title: "Success",
        description: "Ticket type updated successfully",
        variant: "default"
      });

      return responseData;
    } catch (error) {
      console.error('Error updating ticket type:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket type",
        variant: "destructive"
      });
      throw error;
    }
  };

  /**
   * Delete an existing ticket type via API call
   * Removes ticket type from database and updates local state
   */
  const handleDeleteExistingTicketType = async (ticketTypeId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ticket-types/${ticketTypeId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete ticket type');
      }

      // Remove from local state immediately
      setExistingTicketTypes(prev => prev.filter(ticket => ticket.id !== ticketTypeId));

      toast({
        title: "Success",
        description: "Ticket type deleted successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting ticket type:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete ticket type",
        variant: "destructive"
      });
    }
  };

  /**
   * Main form submission handler - FIXED VERSION
   * Handles both creating new events and updating existing ones
   */
  const handleSubmitEvent = async () => {
    setIsLoading(true);
    try {
      // For editing, we don't need to fetch organizer profile again
      // since we already have the event and it belongs to the current user
      let organizer_id = null;
      
      if (!isEditing) {
        // Only fetch organizer profile for new events
        const profileResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
          credentials: 'include'
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile');
        }

        const profileData = await profileResponse.json();
        organizer_id = profileData.organizer_profile?.id;

        if (!organizer_id) {
          throw new Error('Organizer profile not found');
        }
      }

      // Prepare form data for file upload (multipart/form-data)
      const formData = new FormData();
      
      // Add organizer_id for new events only
      if (!isEditing && organizer_id) {
        formData.append('organizer_id', organizer_id.toString());
      }

      // Add basic event fields - only add if they have values
      if (newEvent.name && newEvent.name.trim() !== '') {
        formData.append('name', newEvent.name.trim());
      }

      if (newEvent.description && newEvent.description.trim() !== '') {
        formData.append('description', newEvent.description.trim());
      }

      if (newEvent.location && newEvent.location.trim() !== '') {
        formData.append('location', newEvent.location.trim());
      }

      // Handle category - convert to string and check for valid values
      if (newEvent.category_id !== null && newEvent.category_id !== undefined && newEvent.category_id !== '') {
        formData.append('category_id', newEvent.category_id.toString());
      }

      // Handle dates - always add date, only add end_date if different
      if (newEvent.date instanceof Date && !isNaN(newEvent.date.getTime())) {
        formData.append('date', formatDate(newEvent.date));
      }

      if (newEvent.end_date instanceof Date && 
          !isNaN(newEvent.end_date.getTime()) &&
          formatDate(newEvent.end_date) !== formatDate(newEvent.date)) {
        formData.append('end_date', formatDate(newEvent.end_date));
      }

      // Handle times - FIXED: Validate and format time properly
      if (newEvent.start_time && newEvent.start_time.trim() !== '') {
        const startTime = newEvent.start_time.trim();
        // Validate HH:MM format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime)) {
          throw new Error('Invalid start time format. Please use HH:MM format (e.g., 14:30)');
        }
        formData.append('start_time', startTime);
      }

      if (newEvent.end_time && newEvent.end_time.trim() !== '') {
        const endTime = newEvent.end_time.trim();
        // Validate HH:MM format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(endTime)) {
          throw new Error('Invalid end time format. Please use HH:MM format (e.g., 16:30)');
        }
        formData.append('end_time', endTime);
      }

      // Additional validation: Check if start time is before end time (for same day events)
      if (newEvent.start_time && newEvent.end_time && 
          formatDate(newEvent.date) === formatDate(newEvent.end_date)) {
        const startTime = newEvent.start_time.trim();
        const endTime = newEvent.end_time.trim();
        
        if (startTime >= endTime) {
          throw new Error('Start time must be before end time for same-day events');
        }
      }

      // Handle file upload
      if (newEvent.image instanceof File) {
        formData.append('file', newEvent.image);
      }

      let eventResponse;
      let eventId;

      // Debug: Log what we're sending (remove in production)
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      // Create or update event based on mode
      if (isEditing && editingEvent) {
        // Update existing event
        eventResponse = await fetch(`${import.meta.env.VITE_API_URL}/events/${editingEvent.id}`, {
          method: 'PUT',
          credentials: 'include',
          body: formData
        });
        eventId = editingEvent.id;
      } else {
        // Create new event
        eventResponse = await fetch(`${import.meta.env.VITE_API_URL}/events`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
      }

      if (!eventResponse.ok) {
        const errorData = await eventResponse.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || errorData.message || `Failed to ${isEditing ? 'update' : 'create'} event`);
      }

      // Get event data from response
      const eventData = await eventResponse.json();
      
      // For new events, get the ID from response
      if (!isEditing) {
        eventId = eventData.event?.id || eventData.id;
      }

      // Create new ticket types (not updates to existing ones)
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
              price: parseFloat(ticketType.price) || 0,
              quantity: parseInt(ticketType.quantity) || 0
            })
          });

          if (!ticketTypeResponse.ok) {
            const errorData = await ticketTypeResponse.json();
            throw new Error(`Failed to create ticket type: ${errorData.message || 'Unknown error'}`);
          }
        }
      }

      // Show success message
      toast({
        title: "Success",
        description: `Event ${isEditing ? 'updated' : 'created'} successfully`,
        variant: "default"
      });

      // Close dialog and notify parent component
      onOpenChange(false);
      
      // Return the updated event data to parent
      const updatedEventData = isEditing 
        ? { ...editingEvent, ...eventData.event } 
        : eventData.event || eventData;
        
      onEventCreated?.(updatedEventData);

      // Reset form state
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
  // Render the dialog UI
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700">
        {/* Dialog Header */}
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>
        
        {/* Dialog Content */}
        <div className="space-y-4 pt-4">
          {/* Event Name Field */}
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

          {/* Event Description Field */}
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

          {/* Category Selection Field */}
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

          {/* Date and Time Fields - Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date and Time Column */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Start Date</Label>
              <div className="border rounded-md p-2 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 flex justify-center">
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
            
            {/* End Date and Time Column */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">End Date</Label>
              <div className="border rounded-md p-2 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 flex justify-center">
                <Calendar
                  mode="single"
                  selected={newEvent.date}
                  onSelect={(date) => date && setNewEvent({...newEvent, date})}
                  required
                  className="text-gray-800 dark:text-gray-200 [&_td]:text-gray-800 dark:[&_td]:text-gray-200 [&_th]:text-gray-500 dark:[&_th]:text-gray-400 [&_div.rdp-day_selected]:bg-purple-500 dark:[&_div.rdp-day_selected]:bg-purple-600 dark:[&_div.rdp-day_selected]:text-white [&_button.rdp-button:hover]:bg-gray-100 dark:[&_button.rdp-button:hover]:bg-gray-600 [&_button.rdp-button:focus-visible]:ring-blue-500 dark:[&_button.rdp-button:focus-visible]:ring-offset-gray-800 [&_div.rdp-nav_button]:dark:text-gray-200 [&_div.rdp-nav_button:hover]:dark:bg-gray-600"
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

          {/* Location Field */}
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

          {/* Image Upload Field */}
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
              className="block w-full text-sm text-gray-800 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-green-500 file:text-white hover:file:from-blue-600 hover:file:to-green-600 file:cursor-pointer file:transition-all file:duration-200 file:shadow-md hover:file:shadow-lg file:transform hover:file:scale-105 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800 overflow-hidden"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Upload event image (PNG, JPG, JPEG, GIF, WEBP)</p>
          </div>
          {/* Existing Ticket Types Section - Only shown when editing */}
          {isEditing && existingTicketTypes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 dark:text-gray-300">Existing Ticket Types</Label>
              </div>

              {existingTicketTypes.map((ticket) => (
                <ExistingTicketTypeRow
                  key={ticket.id}
                  ticket={ticket}
                  onUpdate={handleUpdateExistingTicketType}
                  onDelete={handleDeleteExistingTicketType}
                />
              ))}
            </div>
          )}

          {/* New Ticket Types Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-700 dark:text-gray-300">
                {isEditing ? 'Add New Ticket Types' : 'Ticket Types'}
              </Label>
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

            {/* Render new ticket types being added */}
            {newEvent.ticket_types.map((ticket, index) => (
              <div key={index} className="grid grid-cols-1 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                {/* First Row: Type, Price, Quantity */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Ticket Type Selection */}
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
                  
                  {/* Ticket Price */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ticket.price || ''}
                      onChange={(e) => handleTicketTypeChange(index, 'price', parseFloat(e.target.value) || 0)}
                      required
                      placeholder="0.00"
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    />
                  </div>
                  
                  {/* Ticket Quantity */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Quantity</Label>
                    <Input
                      type="number"
                      min="0"
                      value={ticket.quantity || ''}
                      onChange={(e) => handleTicketTypeChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      required
                      placeholder="Enter quantity"
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    />
                  </div>
                </div>
                
                {/* Second Row: Remove Button (centered) */}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTicketType(index)}
                    className="text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Ticket Type
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex justify-end space-x-2">
            {/* Cancel Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Cancel
            </Button>
            
            {/* Submit Button - Create or Update */}
            <Button
              type="button"
              onClick={handleSubmitEvent}
              disabled={isLoading}
              className={`bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  {/* Loading Spinner */}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * ExistingTicketTypeRow Component
 * Displays existing ticket types with inline editing capability
 * Used when editing an event to show and modify existing ticket types
 * 
 * Props:
 * - ticket: object - The ticket type data
 * - onUpdate: function - Callback to update ticket type
 * - onDelete: function - Callback to delete ticket type
 */
const ExistingTicketTypeRow = ({ ticket, onUpdate, onDelete }) => {
  // State to control edit mode for this ticket type
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for editing ticket type data
  const [editData, setEditData] = useState({
    type_name: ticket.type_name,
    price: ticket.price,
    quantity: ticket.quantity
  });
  
  // Loading state for update operations
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Save changes to the ticket type
   * Calls parent update function and exits edit mode on success
   */
  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdate(ticket.id, editData);
      setIsEditing(false);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancel editing and revert changes
   * Resets edit data to original values
   */
  const handleCancel = () => {
    setEditData({
      type_name: ticket.type_name,
      price: ticket.price,
      quantity: ticket.quantity
    });
    setIsEditing(false);
  };

  /**
   * Delete ticket type with confirmation
   * Shows browser confirmation dialog before deletion
   */
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this ticket type?')) {
      await onDelete(ticket.id);
    }
  };

  // Render edit mode interface
  if (isEditing) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        {/* First Row: Type, Price, Quantity */}
        <div className="grid grid-cols-3 gap-4">
          {/* Ticket Type Dropdown */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Type</Label>
            <select
              className="w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              value={editData.type_name}
              onChange={(e) => setEditData({...editData, type_name: e.target.value})}
            >
              {TICKET_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          {/* Price Input */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Price</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={editData.price}
              onChange={(e) => setEditData({...editData, price: parseFloat(e.target.value)})}
              required
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            />
          </div>
          
          {/* Quantity Input */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Quantity</Label>
            <Input
              type="number"
              min="0"
              value={editData.quantity}
              onChange={(e) => setEditData({...editData, quantity: parseInt(e.target.value)})}
              required
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            />
          </div>
        </div>
        
        {/* Second Row: Action Buttons (centered) */}
        <div className="flex justify-center gap-2">
          {/* Save Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
          {/* Cancel Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Render view mode interface (default state)
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
      {/* First Row: Type, Price, Quantity */}
      <div className="grid grid-cols-3 gap-4">
        {/* Display Ticket Type */}
        <div className="space-y-1">
          <Label className="text-gray-500 dark:text-gray-400 text-xs">Type</Label>
          <p className="text-gray-800 dark:text-gray-200 font-medium">{ticket.type_name}</p>
        </div>
        
        {/* Display Price */}
        <div className="space-y-1">
          <Label className="text-gray-500 dark:text-gray-400 text-xs">Price</Label>
          <p className="text-gray-800 dark:text-gray-200 font-medium">${ticket.price}</p>
        </div>
        
        {/* Display Quantity */}
        <div className="space-y-1">
          <Label className="text-gray-500 dark:text-gray-400 text-xs">Quantity</Label>
          <p className="text-gray-800 dark:text-gray-200 font-medium">{ticket.quantity}</p>
        </div>
      </div>
      
      {/* Second Row: Action Buttons (centered) */}
      <div className="flex justify-center gap-2">
        {/* Edit Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        {/* Delete Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
};