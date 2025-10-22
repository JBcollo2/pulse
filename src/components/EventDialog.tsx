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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Trash2, Edit, Star, X, Bot, Sparkles, Wand2, MessageSquare, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

/**
 * Utility function to format Date object to YYYY-MM-DD string format
 */
const formatDate = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Utility function to validate time format and convert to HH:MM
 */
const normalizeTimeFormat = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const timeParts = timeStr.trim().split(':');
  if (timeParts.length < 2) return '';
  const hours = timeParts[0].padStart(2, '0');
  const minutes = timeParts[1].padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Utility function to validate form data
 */
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

// Common amenities list for quick selection
const COMMON_AMENITIES = [
  "Parking", "WiFi", "Sound System", "DJ", "Live Band", "Catering", 
  "Bar Service", "Photography", "Security", "Air Conditioning", 
  "Stage", "Dance Floor", "VIP Area", "Coat Check", "Valet Parking"
];

/**
 * AI Event Creation Assistant Component
 */
const AIEventAssistant = ({ 
  onAICreate, 
  onAIUpdate, 
  isEditing = false, 
  currentEvent = null 
}) => {
  const [conversationInput, setConversationInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [draftData, setDraftData] = useState(null);
  const [activeTab, setActiveTab] = useState('conversation');
  const { toast } = useToast();

  const handleAIConversation = async () => {
    if (!conversationInput.trim()) {
      toast({
        title: "Input required",
        description: "Please describe what you want to create or update",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setAiResponse('');
    
    try {
      const url = isEditing && currentEvent 
        ? `${import.meta.env.VITE_API_URL}/events/${currentEvent.id}?ai_assistant=true&conversational_input=${encodeURIComponent(conversationInput)}`
        : `${import.meta.env.VITE_API_URL}/events?ai_assistant=true&conversational_input=${encodeURIComponent(conversationInput)}`;

      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.draft_created) {
        setDraftData(data);
        setAiResponse(data.conversational_response);
        toast({
          title: "AI Draft Created",
          description: "Your event draft has been created with AI assistance",
          variant: "default"
        });
      } else if (data.updates_proposed) {
        setAiResponse(data.summary);
        setDraftData(data);
        toast({
          title: "AI Update Proposal",
          description: "AI has suggested updates for your event",
          variant: "default"
        });
      } else {
        setAiResponse(data.message || "AI processing completed");
      }
    } catch (error) {
      console.error('AI conversation error:', error);
      toast({
        title: "AI Service Unavailable",
        description: "Please try manual creation or check back later",
        variant: "destructive"
      });
      setAiResponse("I'm having trouble processing your request. Please try manual creation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyAIUpdates = () => {
    if (draftData && isEditing) {
      onAIUpdate?.(draftData.updates_proposed);
    } else if (draftData && !isEditing) {
      onAICreate?.(draftData.draft_id);
    }
  };

  const handleQuickTemplate = (template) => {
    setConversationInput(template);
  };

  const quickTemplates = [
    "Create a tech conference in Nairobi for 500 developers with workshops and networking",
    "I want to organize a music festival with multiple stages and food vendors",
    "Plan a business networking event with keynote speakers and cocktail reception",
    "Create a weekend workshop series for creative professionals",
    "Organize a charity gala dinner with auction and live entertainment"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Bot className="h-6 w-6 text-blue-500" />
        <span>AI Event Assistant</span>
        <Badge variant="outline" className="ml-2">
          <Sparkles className="h-3 w-3 mr-1" />
          Beta
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conversation" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Quick Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversation" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-conversation">
              {isEditing ? "Describe what you want to update:" : "Describe your event:"}
            </Label>
            <Textarea
              id="ai-conversation"
              value={conversationInput}
              onChange={(e) => setConversationInput(e.target.value)}
              placeholder={
                isEditing 
                  ? "e.g., 'Change the date to next month and add VIP tickets...'"
                  : "e.g., 'I want to create a tech conference in Nairobi for 500 people with workshops...'"
              }
              rows={4}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleAIConversation}
            disabled={isProcessing || !conversationInput.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI is thinking...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-2" />
                {isEditing ? 'Generate Update Suggestions' : 'Generate Event Draft'}
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <CardDescription>
            Start with a template and customize it with the AI assistant
          </CardDescription>
          
          <div className="grid gap-2">
            {quickTemplates.map((template, index) => (
              <Card 
                key={index}
                className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-dashed"
                onClick={() => handleQuickTemplate(template)}
              >
                <CardContent className="p-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {template}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {aiResponse && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {aiResponse}
            </p>
            
            {draftData && (
              <div className="mt-4 space-y-3">
                {draftData.suggestions && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Suggestions:</h4>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                      {draftData.suggestions.immediate_actions?.map((action, idx) => (
                        <li key={idx}>• {action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {draftData.completion_status && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Completion:</span>
                    <Badge variant={
                      draftData.completion_status.ready_to_publish ? "default" : "secondary"
                    }>
                      {Math.round(draftData.completion_status.percent_complete)}% Complete
                    </Badge>
                  </div>
                )}

                <Button
                  onClick={handleApplyAIUpdates}
                  size="sm"
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  {isEditing ? 'Apply AI Updates' : 'Continue with AI Draft'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/**
 * AI Event Draft Manager Component
 */
const AIEventDraftManager = ({ draftId, onDraftPublished }) => {
  const [draft, setDraft] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const { toast } = useToast();

  const fetchDraft = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/drafts/${draftId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDraft(data);
      }
    } catch (error) {
      console.error('Error fetching draft:', error);
    }
  };

  const updateDraftField = async (fieldName, value = null, regenerate = false) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/drafts/${draftId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field_name: fieldName,
          value: value,
          regenerate: regenerate
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDraft(data.draft);
        toast({
          title: "Draft Updated",
          description: `Field ${fieldName} has been updated`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error updating draft:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update draft field",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setActiveField(null);
    }
  };

  const publishDraft = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/drafts/${draftId}/publish`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Event Published",
          description: "Your event has been successfully published",
          variant: "default"
        });
        onDraftPublished?.(data.event);
      }
    } catch (error) {
      console.error('Error publishing draft:', error);
      toast({
        title: "Publish Failed",
        description: "Failed to publish event",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (draftId) {
      fetchDraft();
    }
  }, [draftId]);

  if (!draft) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-500" />
          AI Event Draft
        </h3>
        <Badge variant={draft.completion_status?.ready_to_publish ? "default" : "secondary"}>
          {Math.round(draft.completion_status?.percent_complete || 0)}% Complete
        </Badge>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {/* Draft Fields */}
          {[
            { key: 'name', label: 'Event Name', value: draft.draft?.suggested_name },
            { key: 'description', label: 'Description', value: draft.draft?.suggested_description },
            { key: 'category', label: 'Category', value: draft.draft?.suggested_category_id },
            { key: 'date', label: 'Date', value: draft.draft?.suggested_date },
            { key: 'location', label: 'Location', value: draft.draft?.suggested_location },
            { key: 'city', label: 'City', value: draft.draft?.suggested_city }
          ].map((field) => (
            <Card key={field.key} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <Label className="text-sm font-medium">{field.label}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {field.value || 'Not set'}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveField(field.key)}
                    disabled={isLoading}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateDraftField(field.key, null, true)}
                    disabled={isLoading}
                  >
                    <Sparkles className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {activeField === field.key && (
                <div className="mt-3 space-y-2">
                  <Input
                    value={field.value || ''}
                    onChange={(e) => setDraft(prev => ({
                      ...prev,
                      draft: { ...prev.draft, [`suggested_${field.key}`]: e.target.value }
                    }))}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateDraftField(field.key, draft.draft[`suggested_${field.key}`])}
                      disabled={isLoading}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveField(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Review and Actions */}
      {draft.review && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">AI Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {draft.review.warnings?.map((warning, idx) => (
              <div key={idx} className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                <span>⚠️</span>
                <span>{warning}</span>
              </div>
            ))}
            {draft.review.suggestions?.map((suggestion, idx) => (
              <div key={idx} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
                <span>💡</span>
                <span>{suggestion}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button
        onClick={publishDraft}
        disabled={isLoading || !draft.completion_status?.ready_to_publish}
        className="w-full bg-green-500 hover:bg-green-600"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Publishing...
          </>
        ) : (
          'Publish Event'
        )}
      </Button>
    </div>
  );
};

/**
 * Main EventDialog Component with AI Integration
 */
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

  // State for existing ticket types when editing an event
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

  // State for amenity input
  const [currentAmenity, setCurrentAmenity] = useState('');

  // Form validation state
  const [validationErrors, setValidationErrors] = useState([]);

  // AI Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [aiUpdates, setAiUpdates] = useState(null);

  // Toast notification hook for user feedback
  const { toast } = useToast();

  // Determine if we're in editing mode
  const isEditing = !!editingEvent;

  /**
   * Memoized function to fetch categories to prevent unnecessary re-renders
   */
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

  /**
   * Effect: Fetch event categories and ticket types from API on component mount
   */
  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchTicketTypes();
      // Reset AI states when dialog opens
      setShowAIAssistant(false);
      setActiveDraftId(null);
      setAiUpdates(null);
    }
  }, [open, fetchCategories, fetchTicketTypes]);

  /**
   * Effect: Fetch existing ticket types when editing an event
   */
  useEffect(() => {
    const fetchExistingTicketTypes = async () => {
      if (editingEvent?.id) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${editingEvent.id}/ticket-types`, {
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            setExistingTicketTypes(data.ticket_types || []);
          } else {
            console.warn('Failed to fetch existing ticket types');
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
   */
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

  /**
   * Handle AI-assisted creation
   */
  const handleAICreate = (draftId) => {
    setActiveDraftId(draftId);
    setShowAIAssistant(false);
  };

  /**
   * Handle AI-assisted updates
   */
  const handleAIUpdate = (updates) => {
    setAiUpdates(updates);
    setShowAIAssistant(false);
    
    // Apply AI updates to form
    Object.entries(updates).forEach(([field, value]) => {
      handleFieldChange(field, value);
    });

    toast({
      title: "AI Updates Applied",
      description: "AI suggestions have been applied to your event",
      variant: "default"
    });
  };

  /**
   * Handle draft publication
   */
  const handleDraftPublished = (event) => {
    setActiveDraftId(null);
    onEventCreated?.(event);
    onOpenChange(false);
  };

  /**
   * Handle form field changes with validation
   */
  const handleFieldChange = useCallback((field, value) => {
    setNewEvent(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [validationErrors.length]);

  /**
   * Handle adding amenities
   */
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
    } else if (newEvent.amenities.includes(amenityToAdd)) {
      toast({
        title: "Duplicate Amenity",
        description: "This amenity has already been added",
        variant: "destructive"
      });
    }
  }, [currentAmenity, newEvent.amenities, toast]);

  /**
   * Handle removing amenities
   */
  const handleRemoveAmenity = useCallback((amenityToRemove) => {
    setNewEvent(prev => ({
      ...prev,
      amenities: prev.amenities.filter(amenity => amenity !== amenityToRemove)
    }));
  }, []);

  /**
   * Add a new ticket type to the form
   */
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

  /**
   * Remove a ticket type from the form by index
   */
  const handleRemoveTicketType = useCallback((index) => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: prev.ticket_types.filter((_, i) => i !== index)
    }));
  }, []);

  /**
   * Update a specific field of a ticket type by index
   */
  const handleTicketTypeChange = useCallback((index, field, value) => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: prev.ticket_types.map((ticket, i) =>
        i === index ? { ...ticket, [field]: value } : ticket
      )
    }));
  }, []);

  /**
   * Enhanced form submission handler with improved validation and error handling
   */
  const handleSubmitEvent = async () => {
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

  // Determine current view
  const getCurrentView = () => {
    if (activeDraftId) {
      return 'draft';
    } else if (showAIAssistant) {
      return 'ai';
    } else {
      return 'form';
    }
  };

  const currentView = getCurrentView();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {currentView === 'draft' ? 'AI Event Draft' : 
                 currentView === 'ai' ? 'AI Event Assistant' :
                 isEditing ? 'Edit Event' : 'Create New Event'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                {currentView === 'draft' ? 'Review and publish your AI-generated event draft' :
                 currentView === 'ai' ? 'Use AI to create or update your event with natural language' :
                 isEditing ? 'Update your event details and ticket information.' : 'Fill in the details to create a new event with ticket types.'}
              </DialogDescription>
            </div>
            
            {currentView === 'form' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAIAssistant(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
              >
                <Bot className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Navigation Breadcrumb */}
        {(currentView === 'ai' || currentView === 'draft') && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <button
              onClick={() => {
                setShowAIAssistant(false);
                setActiveDraftId(null);
              }}
              className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {isEditing ? 'Edit Event' : 'Create Event'}
            </button>
            <span>→</span>
            <span className="text-gray-800 dark:text-gray-200">
              {currentView === 'ai' ? 'AI Assistant' : 'AI Draft'}
            </span>
          </div>
        )}

        {/* AI Draft Manager View */}
        {currentView === 'draft' && (
          <AIEventDraftManager
            draftId={activeDraftId}
            onDraftPublished={handleDraftPublished}
          />
        )}

        {/* AI Assistant View */}
        {currentView === 'ai' && (
          <AIEventAssistant
            onAICreate={handleAICreate}
            onAIUpdate={handleAIUpdate}
            isEditing={isEditing}
            currentEvent={editingEvent}
          />
        )}

        {/* Traditional Form View */}
        {currentView === 'form' && (
          <>
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

            {/* AI Updates Applied Banner */}
            {aiUpdates && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3 mb-4">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <Bot className="h-4 w-4" />
                  <span className="font-medium">AI Updates Applied</span>
                </div>
                <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                  AI suggestions have been applied to your event form
                </p>
              </div>
            )}

            <div className="space-y-4 pt-4">
              {/* ... (rest of your existing form fields remain exactly the same) */}
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

              {/* ... (rest of your existing form fields - amenities, featured, date/time, image, ticket types) */}
              {/* These remain exactly the same as in your original code */}

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
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    isEditing ? 'Update Event' : 'Create Event'
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

/**
 * ExistingTicketTypeRow Component
 * Enhanced version with better UX and error handling
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