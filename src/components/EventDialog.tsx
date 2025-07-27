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

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TICKET_TYPES = ["REGULAR", "VIP", "STUDENT", "GROUP_OF_5", "COUPLES", "EARLY_BIRD", "VVIP", "GIVEAWAY"];

export const EventDialog = ({
  open,
  onOpenChange,
  editingEvent = null,
  onEventCreated
}) => {
  const [categories, setCategories] = useState([]);
  const [existingTicketTypes, setExistingTicketTypes] = useState([]);
  const [newEvent, setNewEvent] = useState({
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
  const [isLoading, setIsLoading] = useState(false);
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

  // Fetch existing ticket types when editing
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
      setExistingTicketTypes([]);
    }
  }, [editingEvent, open]);

  const handleAddTicketType = () => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: [...prev.ticket_types, { type_name: TICKET_TYPES[0], price: 0, quantity: 0 }]
    }));
  };

  const handleRemoveTicketType = (index) => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: prev.ticket_types.filter((_, i) => i !== index)
    }));
  };

  const handleTicketTypeChange = (index, field, value) => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: prev.ticket_types.map((ticket, i) =>
        i === index ? { ...ticket, [field]: value } : ticket
      )
    }));
  };

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
      
      // Update local state
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

      // Remove from local state
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

  const handleSubmitEvent = async (e) => {
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

      // Handle new ticket types (only for new ones, not updates to existing)
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
            throw new Error(`Failed to create ticket type: ${errorData.message || 'Unknown error'}`);
          }
        }
      }

      toast({
        title: "Success",
        description: `Event ${isEditing ? 'updated' : 'created'} successfully`,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
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

          {/* Existing Ticket Types Section (only shown when editing) */}
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
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Cancel
            </Button>
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

// Component for handling existing ticket type rows
const ExistingTicketTypeRow = ({ ticket, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    type_name: ticket.type_name,
    price: ticket.price,
    quantity: ticket.quantity
  });
  const [isLoading, setIsLoading] = useState(false);

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

  const handleCancel = () => {
    setEditData({
      type_name: ticket.type_name,
      price: ticket.price,
      quantity: ticket.quantity
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this ticket type?')) {
      await onDelete(ticket.id);
    }
  };

  if (isEditing) {
    return (
      <div className="grid grid-cols-3 gap-4 items-end p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
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
        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-300">Quantity</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              value={editData.quantity}
              onChange={(e) => setEditData({...editData, quantity: parseInt(e.target.value)})}
              required
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
              className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40"
            >
              {isLoading ? '...' : 'Save'}
            </Button>
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
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 items-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
      <div className="space-y-1">
        <Label className="text-gray-500 dark:text-gray-400 text-xs">Type</Label>
        <p className="text-gray-800 dark:text-gray-200 font-medium">{ticket.type_name}</p>
      </div>
      <div className="space-y-1">
        <Label className="text-gray-500 dark:text-gray-400 text-xs">Price</Label>
        <p className="text-gray-800 dark:text-gray-200 font-medium">${ticket.price}</p>
      </div>
      <div className="space-y-1">
        <Label className="text-gray-500 dark:text-gray-400 text-xs">Quantity</Label>
        <div className="flex gap-2 items-center">
          <p className="text-gray-800 dark:text-gray-200 font-medium">{ticket.quantity}</p>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
              className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};