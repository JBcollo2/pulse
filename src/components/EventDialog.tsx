import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Trash2, Edit, Star, X, Bot, User, Sparkles, Send, Check, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Utility functions (keeping the existing ones)
const formatDate = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeTimeFormat = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const timeParts = timeStr.trim().split(':');
  if (timeParts.length < 2) return '';
  const hours = timeParts[0].padStart(2, '0');
  const minutes = timeParts[1].padStart(2, '0');
  return `${hours}:${minutes}`;
};

const validateEventData = (eventData) => {
  const errors = [];
  
  if (!eventData.name?.trim()) {
    errors.push('Event name is required');
  }
  
  if (!eventData.description?.trim()) {
    errors.push('Event description is required');
  }
  
  if (!eventData.city?.trim()) {
    errors.push('City is required');
  }
  
  if (!eventData.location?.trim()) {
    errors.push('Event location is required');
  }
  
  if (eventData.location?.trim() && !eventData.city?.trim()) {
    errors.push('Please enter the city before setting the event location');
  }
  
  if (eventData.amenities && eventData.amenities.length > 5) {
    errors.push('Maximum of 5 amenities allowed per event');
  }
  
  if (!eventData.category_id) {
    errors.push('Event category is required');
  }
  
  if (!eventData.start_time?.trim()) {
    errors.push('Start time is required');
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(eventData.date);
  eventDate.setHours(0, 0, 0, 0);
  
  if (eventDate < today) {
    errors.push('Event date cannot be in the past');
  }
  
  if (eventData.end_date && formatDate(eventData.end_date) !== formatDate(eventData.date)) {
    const endDate = new Date(eventData.end_date);
    endDate.setHours(0, 0, 0, 0);
    
    if (endDate < today) {
      errors.push('Event end date cannot be in the past');
    }
    
    if (endDate < eventDate) {
      errors.push('Event end date cannot be before start date');
    }
  }
  
  if (eventData.start_time && eventData.end_time && 
      formatDate(eventData.date) === formatDate(eventData.end_date)) {
    const startTime = normalizeTimeFormat(eventData.start_time);
    const endTime = normalizeTimeFormat(eventData.end_time);
    
    if (startTime && endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const startTotalMinutes = startHour * 60 + startMin;
      let endTotalMinutes = endHour * 60 + endMin;
      
      if (endTotalMinutes === 0 && startTotalMinutes > 0) {
        endTotalMinutes = 24 * 60;
      }
      
      if (startTotalMinutes >= endTotalMinutes) {
        errors.push('Start time must be before end time for same-day events');
      }
    }
  }
  
  return errors;
};

const COMMON_AMENITIES = [
  "Parking", "WiFi", "Sound System", "DJ", "Live Band", "Catering", 
  "Bar Service", "Photography", "Security", "Air Conditioning", 
  "Stage", "Dance Floor", "VIP Area", "Coat Check", "Valet Parking"
];

const AI_PROMPT_EXAMPLES = [
  "Create a music festival in Nairobi with 5000 attendees",
  "I want to host a tech conference about AI in Mombasa next month",
  "Plan a charity gala dinner with live auction in Kisumu",
  "Organize a product launch event for a new smartphone in Nairobi"
];

export const EventDialog = ({
  open,
  onOpenChange,
  editingEvent = null,
  onEventCreated,
  userRole = null
}) => {
  // State for storing event categories and ticket types fetched from API
  const [categories, setCategories] = useState([]);
  const [availableTicketTypes, setAvailableTicketTypes] = useState([]);
  const [existingTicketTypes, setExistingTicketTypes] = useState([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingTicketTypes, setIsLoadingTicketTypes] = useState(false);

  // Main form state for new event data
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    date: new Date(),
    end_date: new Date(),
    start_time: '',
    end_time: '',
    city: '',
    location: '',
    amenities: [],
    image: null,
    ticket_types: [],
    category_id: null,
    featured: false
  });

  // AI Assistant states
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'ai'
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [aiDraft, setAiDraft] = useState(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiConversationHistory, setAiConversationHistory] = useState([]);
  const [aiDrafts, setAiDrafts] = useState([]);
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);

  // State for amenity input
  const [currentAmenity, setCurrentAmenity] = useState('');

  // Form validation state
  const [validationErrors, setValidationErrors] = useState([]);

  // Toast notification hook for user feedback
  const { toast } = useToast();

  // Determine if we're in editing mode
  const isEditing = !!editingEvent;

  // Fetch categories and ticket types
  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch categories`);
      }

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch categories",
        variant: "destructive"
      });
    } finally {
      setIsLoadingCategories(false);
    }
  }, [toast]);

  const fetchTicketTypes = useCallback(async () => {
    setIsLoadingTicketTypes(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ticket-types`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch ticket types`);
      }

      const data = await response.json();
      const apiTypes = [...new Set(data.ticket_types?.map(t => t.type_name) || [])];
      const fallbackTypes = ["REGULAR", "VIP", "STUDENT", "GROUP_OF_5", "COUPLES", "EARLY_BIRD", "VVIP", "GIVEAWAY"];
      
      const allTypes = [...new Set([...fallbackTypes, ...apiTypes])];
      setAvailableTicketTypes(allTypes);
      
    } catch (error) {
      console.error('Error fetching ticket types:', error);
      setAvailableTicketTypes(["REGULAR", "VIP", "STUDENT", "GROUP_OF_5", "COUPLES", "EARLY_BIRD", "VVIP", "GIVEAWAY"]);
    } finally {
      setIsLoadingTicketTypes(false);
    }
  }, [toast]);

  // Fetch AI drafts
  const fetchAiDrafts = useCallback(async () => {
    setIsLoadingDrafts(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/drafts`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch drafts`);
      }

      const data = await response.json();
      setAiDrafts(data.drafts || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch AI drafts",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDrafts(false);
    }
  }, [toast]);

  // Initialize form data based on editing mode
  useEffect(() => {
    if (editingEvent) {
      const parseDate = (dateStr) => {
        if (!dateStr) return new Date();
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? new Date() : date;
      };

      setNewEvent({
        name: editingEvent.name || '',
        description: editingEvent.description || '',
        date: parseDate(editingEvent.date),
        end_date: editingEvent.end_date ? parseDate(editingEvent.end_date) : parseDate(editingEvent.date),
        start_time: editingEvent.start_time || '',
        end_time: editingEvent.end_time || '',
        city: editingEvent.city || '',
        location: editingEvent.location || '',
        amenities: editingEvent.amenities || [],
        image: null,
        ticket_types: [],
        category_id: editingEvent.category_id || null,
        featured: editingEvent.featured || false
      });
    } else {
      setNewEvent({
        name: '',
        description: '',
        date: new Date(),
        end_date: new Date(),
        start_time: '',
        end_time: '',
        city: '',
        location: '',
        amenities: [],
        image: null,
        ticket_types: [],
        category_id: null,
        featured: false
      });
      setExistingTicketTypes([]);
    }
    
    setValidationErrors([]);
  }, [editingEvent, open]);

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchTicketTypes();
      fetchAiDrafts();
    }
  }, [open, fetchCategories, fetchTicketTypes, fetchAiDrafts]);

  // Handle form field changes
  const handleFieldChange = useCallback((field, value) => {
    setNewEvent(prev => ({ ...prev, [field]: value }));
    
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [validationErrors.length]);

  // Handle AI input submission
  const handleAiSubmit = async () => {
    if (!aiInput.trim()) return;
    
    setIsAiProcessing(true);
    try {
      // Add user message to conversation history
      const userMessage = { role: 'user', content: aiInput };
      setAiConversationHistory(prev => [...prev, userMessage]);
      
      // Call AI assistant API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events?ai_assistant=true&conversational_input=${encodeURIComponent(aiInput)}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: AI assistant request failed`);
      }

      const data = await response.json();
      
      // Add AI response to conversation history
      const aiMessage = { 
        role: 'assistant', 
        content: data.conversational_response || "I've created a draft for your event.",
        draftId: data.draft_id
      };
      setAiConversationHistory(prev => [...prev, aiMessage]);
      
      // Set the AI response and draft
      setAiResponse(data);
      setAiDraft(data.draft_id);
      
      // Refresh drafts list
      fetchAiDrafts();
      
      // Clear input
      setAiInput('');
      
      toast({
        title: "AI Assistant",
        description: "I've created a draft for your event. You can review and edit it before publishing.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error with AI assistant:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get AI assistance",
        variant: "destructive"
      });
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Load a specific draft
  const loadDraft = async (draftId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/drafts/${draftId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch draft`);
      }

      const data = await response.json();
      const draft = data.draft;
      
      // Update form with draft data
      setNewEvent({
        name: draft.suggested_name || '',
        description: draft.suggested_description || '',
        date: draft.suggested_date ? new Date(draft.suggested_date) : new Date(),
        end_date: draft.suggested_end_date ? new Date(draft.suggested_end_date) : new Date(),
        start_time: draft.suggested_start_time || '',
        end_time: draft.suggested_end_time || '',
        city: draft.suggested_city || '',
        location: draft.suggested_location || '',
        amenities: draft.suggested_amenities || [],
        image: null,
        ticket_types: [],
        category_id: draft.suggested_category_id || null,
        featured: false
      });
      
      setSelectedDraftId(draftId);
      setActiveTab('manual');
      
      toast({
        title: "Draft Loaded",
        description: "You can now edit the AI-generated event details",
        variant: "default"
      });
    } catch (error) {
      console.error('Error loading draft:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load draft",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Publish a draft directly
  const publishDraft = async (draftId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/drafts/${draftId}/publish`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to publish draft`);
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: "Event created successfully with AI assistance",
        variant: "default"
      });

      onOpenChange(false);
      onEventCreated?.(data.event);
      
      // Reset form
      setNewEvent({
        name: '',
        description: '',
        date: new Date(),
        end_date: new Date(),
        start_time: '',
        end_time: '',
        city: '',
        location: '',
        amenities: [],
        image: null,
        ticket_types: [],
        category_id: null,
        featured: false
      });
      setValidationErrors([]);
      setSelectedDraftId(null);
    } catch (error) {
      console.error('Error publishing draft:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to publish draft",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update a draft field
  const updateDraftField = async (draftId, fieldName, value) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/drafts/${draftId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          field_name: fieldName,
          value: value
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to update draft`);
      }

      // Refresh drafts
      fetchAiDrafts();
      
      toast({
        title: "Draft Updated",
        description: "Your changes have been saved to the draft",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating draft:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update draft",
        variant: "destructive"
      });
    }
  };

  // Delete a draft
  const deleteDraft = async (draftId) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/drafts/${draftId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to delete draft`);
      }

      // Refresh drafts
      fetchAiDrafts();
      
      toast({
        title: "Draft Deleted",
        description: "The draft has been deleted",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete draft",
        variant: "destructive"
      });
    }
  };

  // Handle adding amenities
  const handleAddAmenity = useCallback((amenity) => {
    const amenityToAdd = amenity || currentAmenity.trim();
    
    if (newEvent.amenities.length >= 5) {
      toast({
        title: "Maximum Limit Reached",
        description: "You can only add a maximum of 5 amenities per event",
        variant: "destructive"
      });
      return;
    }
    
    if (amenityToAdd && !newEvent.amenities.includes(amenityToAdd)) {
      setNewEvent(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityToAdd]
      }));
      setCurrentAmenity('');
      
      // Update draft if we're editing one
      if (selectedDraftId) {
        updateDraftField(selectedDraftId, 'amenities', [...newEvent.amenities, amenityToAdd]);
      }
    } else if (newEvent.amenities.includes(amenityToAdd)) {
      toast({
        title: "Duplicate Amenity",
        description: "This amenity has already been added",
        variant: "destructive"
      });
    }
  }, [currentAmenity, newEvent.amenities, toast, selectedDraftId]);

  // Handle removing amenities
  const handleRemoveAmenity = useCallback((amenityToRemove) => {
    setNewEvent(prev => ({
      ...prev,
      amenities: prev.amenities.filter(amenity => amenity !== amenityToRemove)
    }));
    
    // Update draft if we're editing one
    if (selectedDraftId) {
      updateDraftField(selectedDraftId, 'amenities', newEvent.amenities.filter(amenity => amenity !== amenityToRemove));
    }
  }, [newEvent.amenities, selectedDraftId]);

  // Add a new ticket type to the form
  const handleAddTicketType = useCallback(() => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: [...prev.ticket_types, { 
        type_name: availableTicketTypes[0] || 'REGULAR', 
        price: 0, 
        quantity: 0 
      }]
    }));
  }, [availableTicketTypes]);

  // Remove a ticket type from the form by index
  const handleRemoveTicketType = useCallback((index) => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: prev.ticket_types.filter((_, i) => i !== index)
    }));
  }, []);

  // Update a specific field of a ticket type by index
  const handleTicketTypeChange = useCallback((index, field, value) => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: prev.ticket_types.map((ticket, i) =>
        i === index ? { ...ticket, [field]: value } : ticket
      )
    }));
  }, []);

  // Update an existing ticket type via API call
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

  // Delete an existing ticket type via API call
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

  // Enhanced form submission handler
  const handleSubmitEvent = async () => {
    // If we have a selected draft, publish it directly
    if (selectedDraftId) {
      publishDraft(selectedDraftId);
      return;
    }
    
    // Client-side validation
    const errors = validateEventData(newEvent);
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: errors[0],
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      let organizer_id = null;

      if (!isEditing) {
        const profileResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
          credentials: 'include'
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile. Please log in again.');
        }

        const profileData = await profileResponse.json();
        organizer_id = profileData.organizer_profile?.id;

        if (!organizer_id) {
          throw new Error('Organizer profile not found. Please complete your profile setup.');
        }
      }

      const formData = new FormData();

      if (!isEditing && organizer_id) {
        formData.append('organizer_id', organizer_id.toString());
      }

      // Add form fields with validation
      const fieldsToAdd = [
        { key: 'name', value: newEvent.name?.trim() },
        { key: 'description', value: newEvent.description?.trim() },
        { key: 'city', value: newEvent.city?.trim() },
        { key: 'location', value: newEvent.location?.trim() }
      ];

      fieldsToAdd.forEach(({ key, value }) => {
        if (value) formData.append(key, value);
      });

      if (newEvent.category_id) {
        formData.append('category_id', newEvent.category_id.toString());
      }

      if (newEvent.date instanceof Date && !isNaN(newEvent.date.getTime())) {
        formData.append('date', formatDate(newEvent.date));
      }

      if (newEvent.end_date instanceof Date &&
          !isNaN(newEvent.end_date.getTime()) &&
          formatDate(newEvent.end_date) !== formatDate(newEvent.date)) {
        formData.append('end_date', formatDate(newEvent.end_date));
      }

      // Handle times with proper formatting
      const timeFields = [
        { key: 'start_time', value: newEvent.start_time },
        { key: 'end_time', value: newEvent.end_time }
      ];

      timeFields.forEach(({ key, value }) => {
        if (value?.trim()) {
          const normalizedTime = normalizeTimeFormat(value.trim());
          if (normalizedTime) {
            formData.append(key, normalizedTime);
          }
        }
      });

      // Add amenities as JSON string
      if (newEvent.amenities.length > 0) {
        formData.append('amenities', JSON.stringify(newEvent.amenities));
      }

      // Add featured flag
      if (newEvent.featured) {
        formData.append('featured', 'true');
      }

      // Handle file upload
      if (newEvent.image instanceof File) {
        formData.append('file', newEvent.image);
      }

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
      }

      if (!eventResponse.ok) {
        const errorData = await eventResponse.json();
        
        if (errorData.validation_errors) {
          const errorMessages = Object.values(errorData.validation_errors).flat();
          throw new Error(`Validation errors: ${errorMessages.join(', ')}`);
        }
        
        throw new Error(errorData.error || errorData.message || `Failed to ${isEditing ? 'update' : 'create'} event`);
      }

      const eventData = await eventResponse.json();

      if (!isEditing) {
        eventId = eventData.event?.id || eventData.id;
      }

      // Create new ticket types
      if (newEvent.ticket_types.length > 0) {
        const ticketTypePromises = newEvent.ticket_types.map(async (ticketType) => {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/ticket-types`, {
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

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to create ticket type ${ticketType.type_name}: ${errorData.message || 'Unknown error'}`);
          }
          
          return response.json();
        });

        await Promise.all(ticketTypePromises);
      }

      toast({
        title: "Success",
        description: `Event ${isEditing ? 'updated' : 'created'} successfully`,
        variant: "default"
      });

      onOpenChange(false);

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
        city: '',
        location: '',
        amenities: [],
        image: null,
        ticket_types: [],
        category_id: null,
        featured: false
      });
      setValidationErrors([]);
      setSelectedDraftId(null);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} event:`, {
        error: error.message,
        eventData: newEvent,
        isEditing
      });
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} event`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show validation errors if any
  const showValidationErrors = validationErrors.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {isEditing ? 'Update your event details and ticket information.' : 'Create an event manually or with AI assistance.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Manual Creation
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            {selectedDraftId && (
              <Card className="mb-4 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI-Generated Draft
                  </CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    You're editing an AI-generated draft. Changes will be saved to the draft.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-0">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => publishDraft(selectedDraftId)}
                      disabled={isLoading}
                      className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Publish Draft
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedDraftId(null)}
                      className="text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    >
                      Start Over
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )}

            {/* Validation Errors Display */}
            {showValidationErrors && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mt-4">
                <h4 className="text-red-800 dark:text-red-200 font-medium mb-2">Please fix the following errors:</h4>
                <ul className="text-red-700 dark:text-red-300 text-sm space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4 pt-4">
              {/* Event Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                  Event Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={newEvent.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  required
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                  placeholder="Enter event name..."
                />
              </div>

              {/* Event Description Field */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  required
                  rows={4}
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                  placeholder="Describe your event..."
                />
              </div>

              {/* City and Location Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-gray-700 dark:text-gray-300">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={newEvent.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    required
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    placeholder="Enter city..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-gray-700 dark:text-gray-300">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    required
                    disabled={!newEvent.city?.trim()}
                    className={`bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${
                      !newEvent.city?.trim() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    placeholder={!newEvent.city?.trim() ? "Please enter city first..." : "Enter event location..."}
                  />
                  {!newEvent.city?.trim() && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ Please enter the city before setting the event location
                    </p>
                  )}
                </div>
              </div>

              {/* Category Selection Field */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-700 dark:text-gray-300">
                  Category <span className="text-red-500">*</span>
                </Label>
                {isLoadingCategories ? (
                  <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse"></div>
                ) : (
                  <Select
                    value={newEvent.category_id?.toString() || ''}
                    onValueChange={(value) => handleFieldChange('category_id', value ? parseInt(value) : null)}
                  >
                    <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-lg z-50 rounded-md py-1">
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
                )}
              </div>

              {/* Amenities Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-700 dark:text-gray-300">Amenities</Label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {newEvent.amenities.length}/5 amenities
                  </span>
                </div>
                
                {/* Current Amenities Display */}
                {newEvent.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newEvent.amenities.map((amenity, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700 px-2 py-1 flex items-center gap-1"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => handleRemoveAmenity(amenity)}
                          className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Maximum limit warning */}
                {newEvent.amenities.length >= 5 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-2 mb-2">
                    <p className="text-amber-800 dark:text-amber-200 text-sm">
                      ⚠️ Maximum limit reached. You can only add 5 amenities per event.
                    </p>
                  </div>
                )}

                {/* Add Custom Amenity */}
                {newEvent.amenities.length < 5 && (
                  <>
                    <div className="flex gap-2">
                      <Input
                        value={currentAmenity}
                        onChange={(e) => setCurrentAmenity(e.target.value)}
                        placeholder="Add custom amenity..."
                        className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddAmenity(currentAmenity);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddAmenity(currentAmenity)}
                        disabled={!currentAmenity.trim() || newEvent.amenities.length >= 5}
                        className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Quick Add Common Amenities */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600 dark:text-gray-400">Quick add:</Label>
                      <div className="flex flex-wrap gap-1">
                        {COMMON_AMENITIES.filter(amenity => !newEvent.amenities.includes(amenity)).slice(0, Math.min(8, 5 - newEvent.amenities.length)).map((amenity) => (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => handleAddAmenity(amenity)}
                            disabled={newEvent.amenities.length >= 5}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            + {amenity}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Featured Event Checkbox */}
              {(userRole === 'ADMIN' || userRole === 'ORGANIZER') && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={newEvent.featured}
                      onCheckedChange={(checked) => handleFieldChange('featured', checked)}
                      className="border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <Label 
                      htmlFor="featured" 
                      className="text-gray-700 dark:text-gray-300 flex items-center gap-2 cursor-pointer"
                    >
                      <Star className="h-4 w-4 text-yellow-500" />
                      Mark as featured event
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Featured events will be highlighted and appear at the top of event listings
                  </p>
                </div>
              )}

              {/* Date and Time Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <div className="border rounded-md p-2 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 flex justify-center">
                    <Calendar
                      mode="single"
                      selected={newEvent.date}
                      onSelect={(date) => date && handleFieldChange('date', date)}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      required
                      className="w-full text-gray-800 dark:text-gray-200 [&_td]:text-gray-800 dark:[&_td]:text-gray-200 [&_th]:text-gray-500 dark:[&_th]:text-gray-400 [&_div.rdp-day_selected]:bg-purple-500 dark:[&_div.rdp-day_selected]:bg-purple-600 dark:[&_div.rdp-day_selected]:text-white [&_button.rdp-button:hover]:bg-gray-100 dark:[&_button.rdp-button:hover]:bg-gray-600 [&_button.rdp-button:focus-visible]:ring-blue-500 dark:[&_button.rdp-button:focus-visible]:ring-offset-gray-800 [&_div.rdp-nav_button]:dark:text-gray-200 [&_div.rdp-nav_button:hover]:dark:bg-gray-600"
                    />
                  </div>
                  <div className="mt-2">
                    <Label htmlFor="start_time" className="text-gray-700 dark:text-gray-300">
                      Start Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={newEvent.start_time}
                      onChange={(e) => handleFieldChange('start_time', e.target.value)}
                      required
                      step="60"
                      className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">End Date</Label>
                  <div className="border rounded-md p-2 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 flex justify-center">
                    <Calendar
                      mode="single"
                      selected={newEvent.end_date}
                      onSelect={(date) => date && handleFieldChange('end_date', date)}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const startDate = new Date(newEvent.date);
                        startDate.setHours(0, 0, 0, 0);
                        return date < today || date < startDate;
                      }}
                      className="text-gray-800 dark:text-gray-200 [&_td]:text-gray-800 dark:[&_td]:text-gray-200 [&_th]:text-gray-500 dark:[&_th]:text-gray-400 [&_div.rdp-day_selected]:bg-purple-500 dark:[&_div.rdp-day_selected]:bg-purple-600 dark:[&_div.rdp-day_selected]:text-white [&_button.rdp-button:hover]:bg-gray-100 dark:[&_button.rdp-button:hover]:bg-gray-600 [&_button.rdp-button:focus-visible]:ring-blue-500 dark:[&_button.rdp-button:focus-visible]:ring-offset-gray-800 [&_div.rdp-nav_button]:dark:text-gray-200 [&_div.rdp-nav_button:hover]:dark:bg-gray-600"
                    />
                  </div>
                  <div className="mt-2">
                    <Label htmlFor="end_time" className="text-gray-700 dark:text-gray-300">End Time (Optional)</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={newEvent.end_time}
                      onChange={(e) => handleFieldChange('end_time', e.target.value)}
                      step="60"
                      className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    />
                  </div>
                </div>
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
                      if (file.size > 5 * 1024 * 1024) {
                        toast({
                          title: "File too large",
                          description: "Please select an image smaller than 5MB",
                          variant: "destructive"
                        });
                        return;
                      }
                      handleFieldChange('image', file);
                    }
                  }}
                  className="block w-full text-sm text-gray-800 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-green-500 file:text-white hover:file:from-blue-600 hover:file:to-green-600 file:cursor-pointer file:transition-all file:duration-200 file:shadow-md hover:file:shadow-lg file:transform hover:file:scale-105 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800 overflow-hidden"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Upload event image (PNG, JPG, JPEG, GIF, WEBP) - Max 5MB
                </p>
                {newEvent.image && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Selected: {newEvent.image.name}
                  </p>
                )}
              </div>

              {/* Existing Ticket Types Section - Only shown when editing */}
              {isEditing && existingTicketTypes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700 dark:text-gray-300">Existing Ticket Types</Label>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {existingTicketTypes.length} existing type{existingTicketTypes.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {existingTicketTypes.map((ticket) => (
                    <ExistingTicketTypeRow
                      key={ticket.id}
                      ticket={ticket}
                      onUpdate={handleUpdateExistingTicketType}
                      onDelete={handleDeleteExistingTicketType}
                      availableTicketTypes={availableTicketTypes}
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
                    disabled={isLoadingTicketTypes}
                    className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ticket Type
                  </Button>
                </div>

                {isLoadingTicketTypes && (
                  <div className="text-center py-4">
                    <div className="animate-spin h-6 w-6 border-b-2 border-blue-500 rounded-full mx-auto"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading ticket types...</p>
                  </div>
                )}

                {newEvent.ticket_types.length === 0 && !isLoadingTicketTypes && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 mb-2">No ticket types added yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Click "Add Ticket Type" to create tickets for your event
                    </p>
                  </div>
                )}

                {newEvent.ticket_types.map((ticket, index) => (
                  <div key={index} className="grid grid-cols-1 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300">Type</Label>
                        <select
                          className="w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                          value={ticket.type_name}
                          onChange={(e) => handleTicketTypeChange(index, 'type_name', e.target.value)}
                        >
                          {availableTicketTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300">Price (KSh)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={ticket.price || ''}
                          onChange={(e) => handleTicketTypeChange(index, 'price', parseFloat(e.target.value) || 0)}
                          required
                          placeholder="0"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={ticket.quantity || ''}
                          onChange={(e) => handleTicketTypeChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          required
                          placeholder="Enter quantity"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                        />
                      </div>
                    </div>

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

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmitEvent}
                  disabled={isLoading || showValidationErrors}
                  className={`bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                    isLoading || showValidationErrors ? 'opacity-70 cursor-not-allowed' : ''
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
                      {selectedDraftId ? 'Publishing...' : (isEditing ? 'Updating...' : 'Creating...')}
                    </>
                  ) : (
                    selectedDraftId ? 'Publish Draft' : (isEditing ? 'Update Event' : 'Create Event')
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-500" />
                    AI Event Assistant
                  </CardTitle>
                  <CardDescription>
                    Describe your event in natural language, and I'll help you create it with all the necessary details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai-input" className="text-gray-700 dark:text-gray-300">
                      Describe your event
                    </Label>
                    <Textarea
                      id="ai-input"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="E.g., I want to organize a tech conference in Nairobi next month with 500 attendees, featuring keynote speakers and workshops..."
                      rows={4}
                      className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAiSubmit}
                      disabled={!aiInput.trim() || isAiProcessing}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {isAiProcessing ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4 mr-2 text-white"
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
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Generate Event
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Example prompts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Example prompts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {AI_PROMPT_EXAMPLES.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setAiInput(example)}
                        className="w-full text-left p-2 rounded-md bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Conversation History */}
              {aiConversationHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Conversation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {aiConversationHistory.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {message.content}
                            {message.draftId && (
                              <div className="mt-2 pt-2 border-t border-blue-400 dark:border-gray-600">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => loadDraft(message.draftId)}
                                  className="text-xs"
                                >
                                  Review Draft
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Previous Drafts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Previous Drafts</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={fetchAiDrafts}
                      disabled={isLoadingDrafts}
                    >
                      Refresh
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingDrafts ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin h-6 w-6 border-b-2 border-blue-500 rounded-full"></div>
                    </div>
                  ) : aiDrafts.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No drafts yet. Start a conversation with the AI assistant to create one.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {aiDrafts.map((draft) => (
                        <div
                          key={draft.id}
                          className="flex items-center justify-between p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200">
                              {draft.suggested_name || 'Untitled Event'}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {draft.suggested_city || 'No location'} • {draft.suggested_date ? new Date(draft.suggested_date).toLocaleDateString() : 'No date'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {draft.completion_status || 'Draft'}
                              </Badge>
                              {draft.ai_confidence_score && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">AI confidence:</span>
                                  <Progress value={draft.ai_confidence_score * 100} className="w-16 h-2" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadDraft(draft.id)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => publishDraft(draft.id)}
                            >
                              Publish
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteDraft(draft.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

/**
 * ExistingTicketTypeRow Component
 */
const ExistingTicketTypeRow = ({ ticket, onUpdate, onDelete, availableTicketTypes }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    type_name: ticket.type_name,
    price: ticket.price,
    quantity: ticket.quantity
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (window.confirm(`Are you sure you want to delete the ${ticket.type_name} ticket type? This action cannot be undone.`)) {
      setIsDeleting(true);
      try {
        await onDelete(ticket.id);
      } catch (error) {
        // Error handling is done in parent component
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Type</Label>
            <select
              className="w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              value={editData.type_name}
              onChange={(e) => setEditData({...editData, type_name: e.target.value})}
              disabled={isLoading}
            >
              {availableTicketTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Price (KSh)</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={editData.price}
              onChange={(e) => setEditData({...editData, price: parseFloat(e.target.value) || 0})}
              required
              disabled={isLoading}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Quantity</Label>
            <Input
              type="number"
              min="1"
              value={editData.quantity}
              onChange={(e) => setEditData({...editData, quantity: parseInt(e.target.value) || 0})}
              required
              disabled={isLoading}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            />
          </div>
        </div>

        <div className="flex justify-center gap-2">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
            className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-gray-500 dark:text-gray-400 text-xs">Type</Label>
          <p className="text-gray-800 dark:text-gray-200 font-medium">{ticket.type_name}</p>
        </div>

        <div className="space-y-1">
          <Label className="text-gray-500 dark:text-gray-400 text-xs">Price</Label>
          <p className="text-gray-800 dark:text-gray-200 font-medium">KSh {ticket.price}</p>
        </div>

        <div className="space-y-1">
          <Label className="text-gray-500 dark:text-gray-400 text-xs">Quantity</Label>
          <p className="text-gray-800 dark:text-gray-200 font-medium">{ticket.quantity}</p>
        </div>
      </div>

      <div className="flex justify-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          disabled={isDeleting}
          className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </div>
  );
};