import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Loader2, AlertCircle, Users, Plus, Edit, Trash2, Eye, EyeOff,
  RefreshCw, Globe, Building2, Mail, User, Calendar, MapPin,
  Filter, Search, ChevronDown, ExternalLink, Handshake, Star,
  TrendingUp, Activity, Package, Upload, X, Check, Sparkles,
  Brain, Lightbulb, BarChart3, Target, Zap, Bot, MessageSquare,
  Wand2, Info, HelpCircle, ArrowRight, Copy, ThumbsUp, ThumbsDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Partner, RecentCollaboration, Collaboration, Event, PartnersResponse,
  PartnerDetailsResponse, CollaborationsResponse, COLLABORATION_TYPES,
  SORT_OPTIONS, ALLOWED_FILE_TYPES, MAX_FILE_SIZE, EventsResponse
} from "@/lib/types";

interface ExtendedPartnersResponse extends PartnersResponse {
  empty_database_recommendations?: any[];
}

interface ExtendedPartner extends Partner {
  ai_performance_analysis?: any;
}

interface ExtendedCollaborationsResponse extends CollaborationsResponse {
  ai_recommendations?: any;
  ai_partner_types?: any;
}

interface AISuggestion {
  company_name: string;
  company_description: string;
  suggested_collaboration_types: string[];
  target_audience: string;
  potential_benefits: string;
  engagement_strategies: string[];
  ai_generated: boolean;
}

const OrganizerPartnership: React.FC = () => {
  // --- State Variables ---
  const [partners, setPartners] = useState<Partner[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('company_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('partners');
  const [collabCurrentPage, setCollabCurrentPage] = useState(1);
  const [collabTotalPages, setCollabTotalPages] = useState(1);
  const [partnerDetailsPage, setPartnerDetailsPage] = useState(1);
  const [partnerDetailsTotalPages, setPartnerDetailsTotalPages] = useState(1);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [isLoadingCollaborations, setIsLoadingCollaborations] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingPartnerDetails, setIsLoadingPartnerDetails] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [isCollaborationDialogOpen, setIsCollaborationDialogOpen] = useState(false);
  const [isPartnerDetailsDialogOpen, setIsPartnerDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'partner' | 'collaboration', id: number } | null>(null);
  const [showEmptyDatabaseRecommendations, setShowEmptyDatabaseRecommendations] = useState(false);
  const [emptyDatabaseRecommendations, setEmptyDatabaseRecommendations] = useState<any[]>([]);

  const [partnerForm, setPartnerForm] = useState({
    company_name: '',
    company_description: '',
    logo_url: '',
    website_url: '',
    contact_email: '',
    contact_person: ''
  });

  const [collaborationForm, setCollaborationForm] = useState({
    partner_id: '',
    event_id: '',
    collaboration_type: 'PARTNER',
    description: '',
    display_order: 0,
    show_on_event_page: true
  });

  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editingCollaboration, setEditingCollaboration] = useState<Collaboration | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // --- Helper Functions ---
  const handleError = useCallback((message: string, err?: any) => {
    setError(message);
    toast({
      title: "Error",
      description: err?.message || message,
      variant: "destructive",
    });
  }, [toast]);

  const resetPartnerForm = useCallback(() => {
    setPartnerForm({
      company_name: '',
      company_description: '',
      logo_url: '',
      website_url: '',
      contact_email: '',
      contact_person: ''
    });
    setEditingPartner(null);
    setSelectedFile(null);
    setFilePreview(null);
  }, []);

  const resetCollaborationForm = useCallback(() => {
    setCollaborationForm({
      partner_id: '',
      event_id: '',
      collaboration_type: 'PARTNER',
      description: '',
      display_order: 0,
      show_on_event_page: true
    });
    setEditingCollaboration(null);
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      handleError("Invalid file type. Please select PNG, JPG, JPEG, GIF, or WEBP files only.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      handleError("File too large. Please select a file smaller than 5MB.");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [handleError]);

  // --- API Functions ---
  const fetchPartners = useCallback(async () => {
    setIsLoadingPartners(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '10',
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/partners?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: ExtendedPartnersResponse = await response.json();
      setPartners(data.partners);
      setTotalPages(data.pagination.pages);
      setTotalItems(data.pagination.total);

      if (data.empty_database_recommendations) {
        setEmptyDatabaseRecommendations(data.empty_database_recommendations);
        setShowEmptyDatabaseRecommendations(true);
      }
    } catch (err) {
      handleError("Failed to fetch partners", err);
    } finally {
      setIsLoadingPartners(false);
    }
  }, [currentPage, sortBy, sortOrder, searchQuery, handleError]);

  const fetchPartnerDetails = useCallback(async (partnerId: number, page = 1) => {
    setIsLoadingPartnerDetails(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
      });
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/partners/${partnerId}?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: PartnerDetailsResponse = await response.json();
      setSelectedPartner(data.partner);
      setPartnerDetailsTotalPages(data.pagination.pages);
    } catch (err) {
      handleError("Failed to fetch partner details", err);
    } finally {
      setIsLoadingPartnerDetails(false);
    }
  }, [handleError]);

  const fetchCollaborations = useCallback(async (eventId?: number, page = 1) => {
    if (!eventId && !selectedEvent) return;
    setIsLoadingCollaborations(true);
    setError(null);
    try {
      const targetEventId = eventId || selectedEvent?.id;
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
      });
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/partners/events/${targetEventId}?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: ExtendedCollaborationsResponse = await response.json();
      setCollaborations(data.collaborations);
      setCollabTotalPages(data.pagination.pages);
    } catch (err) {
      handleError("Failed to fetch collaborations", err);
    } finally {
      setIsLoadingCollaborations(false);
    }
  }, [selectedEvent, handleError]);

  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const params = new URLSearchParams({
        dashboard: 'true',
        per_page: '100',
        time_filter: 'all',
      });
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to access events.');
        } else {
          throw new Error(`HTTP ${response.status}: Failed to fetch events`);
        }
      }
      const data: EventsResponse = await response.json();
      const eventsList = data.events || [];
      setEvents(eventsList);
    } catch (err) {
      handleError("Failed to fetch events", err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [handleError]);

  // --- CRUD Operations ---
  const createPartner = useCallback(async () => {
    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append('action', 'create');
      formData.append('company_name', partnerForm.company_name);
      if (partnerForm.company_description) formData.append('company_description', partnerForm.company_description);
      if (partnerForm.website_url) formData.append('website_url', partnerForm.website_url);
      if (partnerForm.contact_email) formData.append('contact_email', partnerForm.contact_email);
      if (partnerForm.contact_person) formData.append('contact_person', partnerForm.contact_person);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/partners`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      const data = await response.json();
      toast({
        title: "Success",
        description: data.message,
        variant: "default",
      });
      resetPartnerForm();
      setIsPartnerDialogOpen(false);
      fetchPartners();
    } catch (err) {
      handleError("Failed to create partner", err);
    } finally {
      setIsCreating(false);
    }
  }, [partnerForm, selectedFile, resetPartnerForm, fetchPartners, handleError, toast]);

  const updatePartner = useCallback(async () => {
    if (!editingPartner) return;
    setIsUpdating(true);
    try {
      let body: any;
      let headers: any = {};

      if (selectedFile) {
        body = new FormData();
        body.append('action', 'update');
        body.append('company_name', partnerForm.company_name);
        if (partnerForm.company_description) body.append('company_description', partnerForm.company_description);
        if (partnerForm.website_url) body.append('website_url', partnerForm.website_url);
        if (partnerForm.contact_email) body.append('contact_email', partnerForm.contact_email);
        if (partnerForm.contact_person) body.append('contact_person', partnerForm.contact_person);
        body.append('file', selectedFile);
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          action: 'update',
          ...partnerForm
        });
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/partners/${editingPartner.id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      const data = await response.json();
      toast({
        title: "Success",
        description: data.message,
        variant: "default",
      });
      resetPartnerForm();
      setIsPartnerDialogOpen(false);
      fetchPartners();
      if (selectedPartner && selectedPartner.id === editingPartner.id) {
        fetchPartnerDetails(editingPartner.id, partnerDetailsPage);
      }
    } catch (err) {
      handleError("Failed to update partner", err);
    } finally {
      setIsUpdating(false);
    }
  }, [editingPartner, partnerForm, selectedFile, resetPartnerForm, fetchPartners, selectedPartner, partnerDetailsPage, fetchPartnerDetails, handleError, toast]);

  const createCollaboration = useCallback(async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/partners/events/${collaborationForm.event_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'add',
          partner_id: parseInt(collaborationForm.partner_id),
          collaboration_type: collaborationForm.collaboration_type,
          description: collaborationForm.description,
          display_order: collaborationForm.display_order,
          show_on_event_page: collaborationForm.show_on_event_page
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      const data = await response.json();
      toast({
        title: "Success",
        description: data.message,
        variant: "default",
      });
      resetCollaborationForm();
      setIsCollaborationDialogOpen(false);
      if (selectedEvent) {
        fetchCollaborations(selectedEvent.id, collabCurrentPage);
      }
    } catch (err) {
      handleError("Failed to create collaboration", err);
    } finally {
      setIsCreating(false);
    }
  }, [collaborationForm, resetCollaborationForm, selectedEvent, collabCurrentPage, fetchCollaborations, handleError, toast]);

  const updateCollaboration = useCallback(async () => {
    if (!editingCollaboration || !selectedEvent) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/partners/events/${selectedEvent.id}/collaborations/${editingCollaboration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'update',
          collaboration_type: collaborationForm.collaboration_type,
          description: collaborationForm.description,
          display_order: collaborationForm.display_order,
          show_on_event_page: collaborationForm.show_on_event_page
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      const data = await response.json();
      toast({
        title: "Success",
        description: data.message,
        variant: "default",
      });
      resetCollaborationForm();
      setIsCollaborationDialogOpen(false);
      fetchCollaborations(selectedEvent.id, collabCurrentPage);
    } catch (err) {
      handleError("Failed to update collaboration", err);
    } finally {
      setIsUpdating(false);
    }
  }, [editingCollaboration, selectedEvent, collaborationForm, resetCollaborationForm, collabCurrentPage, fetchCollaborations, handleError, toast]);

  const deleteItem = useCallback(async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      let url = '';
      if (itemToDelete.type === 'partner') {
        url = `${import.meta.env.VITE_API_URL}/api/partners/${itemToDelete.id}?action=confirm_deactivate`;
      } else {
        const collaboration = collaborations.find(c => c.id === itemToDelete.id);
        if (!collaboration) throw new Error('Collaboration not found');
        url = `${import.meta.env.VITE_API_URL}/api/partners/events/${collaboration.event_id}/collaborations/${itemToDelete.id}?action=confirm_remove`;
      }
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      const data = await response.json();
      toast({
        title: "Success",
        description: data.message,
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      if (itemToDelete.type === 'partner') {
        fetchPartners();
        if (selectedPartner && selectedPartner.id === itemToDelete.id) {
          setIsPartnerDetailsDialogOpen(false);
          setSelectedPartner(null);
        }
      } else if (selectedEvent) {
        fetchCollaborations(selectedEvent.id, collabCurrentPage);
      }
    } catch (err) {
      handleError(`Failed to delete ${itemToDelete.type}`, err);
    } finally {
      setIsDeleting(false);
    }
  }, [itemToDelete, collaborations, selectedEvent, selectedPartner, collabCurrentPage, fetchPartners, fetchCollaborations, handleError, toast]);

  // --- Effects ---
  useEffect(() => {
    fetchPartners();
    fetchEvents();
  }, [fetchPartners, fetchEvents]);

  useEffect(() => {
    if (activeTab === 'collaborations' && selectedEvent) {
      fetchCollaborations(selectedEvent.id, collabCurrentPage);
    }
  }, [activeTab, selectedEvent, collabCurrentPage, fetchCollaborations]);

  // --- Event Handlers ---
  const handlePartnerEdit = useCallback((partner: Partner) => {
    setEditingPartner(partner);
    setPartnerForm({
      company_name: partner.company_name,
      company_description: partner.company_description || '',
      logo_url: partner.logo_url || '',
      website_url: partner.website_url || '',
      contact_email: partner.contact_email || '',
      contact_person: partner.contact_person || ''
    });
    setSelectedFile(null);
    setFilePreview(null);
    setIsPartnerDialogOpen(true);
  }, []);

  const handleCollaborationEdit = useCallback((collaboration: Collaboration) => {
    setEditingCollaboration(collaboration);
    setCollaborationForm({
      partner_id: collaboration.partner_id.toString(),
      event_id: collaboration.event_id.toString(),
      collaboration_type: collaboration.collaboration_type,
      description: collaboration.description || '',
      display_order: collaboration.display_order,
      show_on_event_page: collaboration.show_on_event_page
    });
    setIsCollaborationDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback((type: 'partner' | 'collaboration', id: number) => {
    setItemToDelete({ type, id });
    setIsDeleteDialogOpen(true);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  }, []);

  const handleSortOrderToggle = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1);
  }, []);

  const handleViewPartnerDetails = useCallback((partner: Partner) => {
    setSelectedPartner(partner);
    setPartnerDetailsPage(1);
    fetchPartnerDetails(partner.id, 1);
    setIsPartnerDetailsDialogOpen(true);
  }, [fetchPartnerDetails]);

  const handlePartnerDialogClose = useCallback((open: boolean) => {
    setIsPartnerDialogOpen(open);
    if (!open) {
      resetPartnerForm();
    }
  }, [resetPartnerForm]);

  const handleCollaborationDialogClose = useCallback((open: boolean) => {
    setIsCollaborationDialogOpen(open);
    if (!open) {
      resetCollaborationForm();
    }
  }, [resetCollaborationForm]);

  // --- Memoized Values ---
  const filteredPartners = useMemo(() => {
    return partners;
  }, [partners]);

  const paginationInfo = useMemo(() => {
    return {
      showing: `${((currentPage - 1) * 10) + 1}-${Math.min(currentPage * 10, totalItems)}`,
      total: totalItems
    };
  }, [currentPage, totalItems]);

  // --- Component Render ---
  return (
    <div className={cn("min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 dark:bg-gray-900 dark:text-gray-200 bg-gray-50 text-gray-800 relative")}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          <div className="space-y-1 sm:space-y-2 text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-500 to-[#10b981] bg-clip-text text-transparent">
              Partnership Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Manage your partners and event collaborations
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchPartners}
              variant="outline"
              size="sm"
              disabled={isLoadingPartners}
              className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              <RefreshCw className={cn("h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2", isLoadingPartners && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Empty Database Recommendations */}
        {showEmptyDatabaseRecommendations && emptyDatabaseRecommendations.length > 0 && (
          <Card className="dark:bg-gray-800 dark:border-gray-700 bg-blue-50 border-blue-200">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base dark:text-gray-200 text-gray-800">
                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                Getting Started with Partnerships
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <p className="text-xs sm:text-sm dark:text-gray-300 text-gray-700">
                  I see you're new to partnerships. Here are some recommendations to help you get started:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {emptyDatabaseRecommendations.map((rec, index) => (
                    <div key={index} className="p-2 rounded-lg dark:bg-gray-700 bg-white border dark:border-gray-600 border-blue-200">
                      <h4 className="text-xs font-medium dark:text-gray-200 text-gray-800 mb-1">{rec.title}</h4>
                      <p className="text-xs dark:text-gray-400 text-gray-600">{rec.description}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (rec.title.includes("Local Businesses")) {
                            setPartnerForm({
                              company_name: '',
                              company_description: 'A local business interested in community events',
                              logo_url: '',
                              website_url: '',
                              contact_email: '',
                              contact_person: ''
                            });
                            setIsPartnerDialogOpen(true);
                          } else if (rec.title.includes("Media Partners")) {
                            setPartnerForm({
                              company_name: '',
                              company_description: 'A media company specializing in event promotion',
                              logo_url: '',
                              website_url: '',
                              contact_email: '',
                              contact_person: ''
                            });
                            setIsPartnerDialogOpen(true);
                          }
                        }}
                        className="text-xs dark:text-blue-400 text-blue-600 h-auto p-1 mt-2"
                      >
                        Get Started
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmptyDatabaseRecommendations(false)}
                  className="text-xs dark:text-gray-400 text-gray-500"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 sm:p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-1 sm:gap-2">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            <p className="text-xs sm:text-sm">{error}</p>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 dark:bg-gray-700 dark:border-gray-600 bg-gray-200 border-gray-300 rounded-lg p-1 gap-1">
            <TabsTrigger
              value="partners"
              className="dark:data-[state=active]:bg-[#10b981] dark:data-[state=active]:text-white data-[state=active]:bg-[#10b981] data-[state=active]:text-white dark:text-gray-200 text-gray-800 rounded-md transition-all duration-300 font-medium text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 flex items-center justify-center min-h-[32px] sm:min-h-[40px]"
            >
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Partners ({partners.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="collaborations"
              className="dark:data-[state=active]:bg-[#10b981] dark:data-[state=active]:text-white data-[state=active]:bg-[#10b981] data-[state=active]:text-white dark:text-gray-200 text-gray-800 rounded-md transition-all duration-300 font-medium text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 flex items-center justify-center min-h-[32px] sm:min-h-[40px]"
            >
              <Handshake className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Collaborations</span>
            </TabsTrigger>
          </TabsList>

          {/* Partners Tab */}
          <TabsContent value="partners" className="mt-4 sm:mt-6">
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
              <CardHeader className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-1 sm:gap-2 dark:text-gray-200 text-gray-800 text-lg sm:text-xl">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                      Partner Companies
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400 text-gray-600 text-xs sm:text-sm">
                      Manage your partner companies and their details
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isPartnerDialogOpen} onOpenChange={handlePartnerDialogClose}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={resetPartnerForm}
                          className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] text-white text-xs sm:text-sm"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Add Partner
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-3 sm:pt-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                      placeholder="Search partners..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-8 sm:pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-100 border-gray-300 text-gray-800 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="flex gap-1 sm:gap-2">
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-[140px] sm:w-[180px] dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {SORT_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSortOrderToggle}
                      className="dark:bg-gray-700 dark:text-gray-200 text-xs sm:text-sm p-1 sm:p-2"
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-6">
                {isLoadingPartners ? (
                  <div className="flex items-center justify-center h-32 sm:h-48">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-[#10b981]" />
                    <span className="ml-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Loading partners...</span>
                  </div>
                ) : filteredPartners.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Building2 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-4">
                      {searchQuery ? 'No partners found matching your search' : 'No partners found'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Dialog open={isPartnerDialogOpen} onOpenChange={handlePartnerDialogClose}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={resetPartnerForm}
                            className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] text-white text-xs sm:text-sm"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Add Partner
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Showing {paginationInfo.showing} of {paginationInfo.total} partners
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {filteredPartners.map((partner) => (
                        <Card
                          key={partner.id}
                          className={cn(
                            "shadow-md hover:shadow-lg transition-all duration-300",
                            "dark:bg-gray-700 dark:border-gray-600 bg-white border-gray-200",
                            !partner.is_active && "opacity-60 border-dashed"
                          )}
                        >
                          <CardHeader className="pb-2 sm:pb-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                                  {partner.logo_url ? (
                                    <img
                                      src={partner.logo_url}
                                      alt={`${partner.company_name} logo`}
                                      className="w-6 h-6 sm:w-8 sm:h-8 rounded object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded flex items-center justify-center">
                                      <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-sm sm:text-lg truncate dark:text-gray-200 text-gray-800">
                                      {partner.company_name}
                                    </CardTitle>
                                    {!partner.is_active && (
                                      <span className="text-xs text-red-500 font-medium">Inactive</span>
                                    )}
                                  </div>
                                </div>
                                {partner.company_description && (
                                  <CardDescription className="dark:text-gray-400 text-gray-600 line-clamp-2 text-xs sm:text-sm">
                                    {partner.company_description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                              <div className="p-2 rounded-lg dark:bg-gray-600 bg-gray-100">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Collaborations</p>
                                <p className="text-sm sm:text-lg font-bold text-[#10b981]">
                                  {partner.total_collaborations || 0}
                                </p>
                              </div>
                              <div className="p-2 rounded-lg dark:bg-gray-600 bg-gray-100">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Since</p>
                                <p className="text-xs sm:text-sm font-medium dark:text-gray-200 text-gray-800">
                                  {new Date(partner.created_at).getFullYear()}
                                </p>
                              </div>
                            </div>
                            {partner.contact_person && (
                              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                                <span className="dark:text-gray-300 text-gray-700 truncate">
                                  {partner.contact_person}
                                </span>
                              </div>
                            )}
                            {partner.contact_email && (
                              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                                <span className="dark:text-gray-300 text-gray-700 truncate">
                                  {partner.contact_email}
                                </span>
                              </div>
                            )}
                            {partner.website_url && (
                              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                                <a
                                  href={partner.website_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="dark:text-blue-400 text-blue-600 hover:underline truncate flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {partner.website_url.replace(/^https?:\/\//, '')}
                                  <ExternalLink className="h-2 w-2 sm:h-3 sm:w-3" />
                                </a>
                              </div>
                            )}
                            {partner.recent_collaborations && partner.recent_collaborations.length > 0 && (
                              <div className="pt-2 border-t dark:border-gray-600 border-gray-200">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">
                                  Recent Collaborations
                                </p>
                                <div className="space-y-1">
                                  {partner.recent_collaborations.slice(0, 2).map((collab, index) => (
                                    <div key={index} className="text-xs dark:text-gray-300 text-gray-700 truncate">
                                      • {collab.event_name} ({collab.collaboration_type})
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-1 sm:gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewPartnerDetails(partner);
                                }}
                                className="flex-1 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 text-xs sm:text-sm p-1 sm:p-2"
                              >
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="hidden sm:inline">Details</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePartnerEdit(partner);
                                }}
                                className="flex-1 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 text-xs sm:text-sm p-1 sm:p-2"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConfirm('partner', partner.id);
                                }}
                                className="flex-1 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 bg-red-50 text-red-600 hover:bg-red-100 text-xs sm:text-sm p-1 sm:p-2"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="hidden sm:inline">{partner.is_active ? 'Deactivate' : 'Delete'}</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-1 sm:gap-2 pt-4 sm:pt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage <= 1}
                          className="dark:bg-gray-700 dark:text-gray-200 text-xs sm:text-sm p-1 sm:p-2"
                        >
                          Previous
                        </Button>
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2 sm:px-4">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage >= totalPages}
                          className="dark:bg-gray-700 dark:text-gray-200 text-xs sm:text-sm p-1 sm:p-2"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collaborations Tab */}
          <TabsContent value="collaborations" className="mt-4 sm:mt-6">
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
              <CardHeader className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-1 sm:gap-2 dark:text-gray-200 text-gray-800 text-lg sm:text-xl">
                      <Handshake className="h-4 w-4 sm:h-5 sm:w-5" />
                      Event Collaborations
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400 text-gray-600 text-xs sm:text-sm">
                      Manage partnerships for specific events
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <Select
                      value={selectedEvent ? selectedEvent.id.toString() : ""}
                      onValueChange={(value) => {
                        const event = events.find(e => e.id.toString() === value);
                        setSelectedEvent(event || null);
                        setCollabCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-[220px] dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-xs sm:text-sm">
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {events.map(event => (
                          <SelectItem key={event.id} value={event.id.toString()} className="text-xs sm:text-sm">
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedEvent && (
                      <Dialog open={isCollaborationDialogOpen} onOpenChange={handleCollaborationDialogClose}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => {
                              resetCollaborationForm();
                              setCollaborationForm(prev => ({ ...prev, event_id: selectedEvent.id.toString() }));
                            }}
                            className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] text-white text-xs sm:text-sm"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Add Collaboration
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-6">
                {!selectedEvent ? (
                  <div className="text-center py-8 sm:py-12">
                    <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-4">
                      Select an event to view and manage collaborations
                    </p>
                    {events.length === 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        No events available. Create an event first to add collaborations.
                      </p>
                    )}
                  </div>
                ) : isLoadingCollaborations ? (
                  <div className="flex items-center justify-center h-32 sm:h-48">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-[#10b981]" />
                    <span className="ml-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Loading collaborations...</span>
                  </div>
                ) : collaborations.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Handshake className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-4">
                      No collaborations found for {selectedEvent.name}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Dialog open={isCollaborationDialogOpen} onOpenChange={handleCollaborationDialogClose}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => {
                              resetCollaborationForm();
                              setCollaborationForm(prev => ({ ...prev, event_id: selectedEvent.id.toString() }));
                            }}
                            className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] text-white text-xs sm:text-sm"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Add First Collaboration
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-600 p-3 sm:p-4 rounded-lg border dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold dark:text-gray-200 text-gray-800">
                            {selectedEvent.name}
                          </h3>
                          <div className="flex items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {selectedEvent.date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                {new Date(selectedEvent.date).toLocaleDateString()}
                              </div>
                            )}
                            {selectedEvent.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                {selectedEvent.location}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl sm:text-2xl font-bold text-[#10b981]">
                            {collaborations.length}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Collaborations</p>
                        </div>
                      </div>
                    </div>

                    {/* Guidance for Collaboration */}
                    <Card className="dark:bg-gray-700 dark:border-gray-600 bg-blue-50 border-blue-200">
                      <CardHeader className="pb-2 sm:pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base dark:text-gray-200 text-gray-800">
                          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                          Collaboration Guidance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs sm:text-sm dark:text-gray-300 text-gray-700">
                          Before creating a collaboration, please ensure you have contacted the company or organization for approval and have established a partnership agreement.
                        </p>
                      </CardContent>
                    </Card>

                    <div className="grid gap-3 sm:gap-4">
                      {collaborations.map((collaboration) => {
                        const partner = partners.find(p => p.id === collaboration.partner_id);
                        const collabType = COLLABORATION_TYPES.find(t => t.value === collaboration.collaboration_type);
                        return (
                          <Card
                            key={collaboration.id}
                            className="dark:bg-gray-700 dark:border-gray-600 bg-white border-gray-200 hover:shadow-lg transition-all duration-300"
                          >
                            <CardContent className="p-3 sm:p-6">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                                <div className="flex items-start gap-3 sm:gap-4 flex-1">
                                  <div className="flex-shrink-0">
                                    {partner?.logo_url ? (
                                      <img
                                        src={partner.logo_url}
                                        alt={`${partner.company_name} logo`}
                                        className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                                        <Building2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                                      <h4 className="text-base sm:text-lg font-semibold dark:text-gray-200 text-gray-800 truncate">
                                        {partner?.company_name || 'Unknown Partner'}
                                      </h4>
                                      {collabType && (
                                        <div className="flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 bg-gray-100 dark:bg-gray-600 rounded-full">
                                          <collabType.icon className={cn("h-2 w-2 sm:h-3 sm:w-3", collabType.color)} />
                                          <span className="text-xs font-medium dark:text-gray-200 text-gray-700">
                                            {collabType.label}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {collaboration.description && (
                                      <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                                        {collaboration.description}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                      <div className="flex items-center gap-1">
                                        <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                                        Order: {collaboration.display_order}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {collaboration.show_on_event_page ? (
                                          <>
                                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <span>Visible</span>
                                          </>
                                        ) : (
                                          <>
                                            <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <span>Hidden</span>
                                          </>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                        {new Date(collaboration.created_at).toLocaleDateString()}
                                      </div>
                                    </div>
                                    {partner && (
                                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t dark:border-gray-600 border-gray-200">
                                        {partner.contact_person && (
                                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            <User className="h-2 w-2 sm:h-3 sm:w-3" />
                                            {partner.contact_person}
                                          </div>
                                        )}
                                        {partner.contact_email && (
                                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            <Mail className="h-2 w-2 sm:h-3 sm:w-3" />
                                            {partner.contact_email}
                                          </div>
                                        )}
                                        {partner.website_url && (
                                          <a
                                            href={partner.website_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                          >
                                            <Globe className="h-2 w-2 sm:h-3 sm:w-3" />
                                            Website
                                            <ExternalLink className="h-1.5 w-1.5 sm:h-2 sm:w-2" />
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-0 sm:ml-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCollaborationEdit(collaboration)}
                                    className="flex-1 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 text-xs sm:text-sm p-1 sm:p-2"
                                  >
                                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    <span className="hidden sm:inline">Edit</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteConfirm('collaboration', collaboration.id)}
                                    className="flex-1 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 bg-red-50 text-red-600 hover:bg-red-100 text-xs sm:text-sm p-1 sm:p-2"
                                  >
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    <span className="hidden sm:inline">Delete</span>
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    {collabTotalPages > 1 && (
                      <div className="flex justify-center items-center gap-1 sm:gap-2 pt-4 sm:pt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCollabCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={collabCurrentPage <= 1}
                          className="dark:bg-gray-700 dark:text-gray-200 text-xs sm:text-sm p-1 sm:p-2"
                        >
                          Previous
                        </Button>
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2 sm:px-4">
                          Page {collabCurrentPage} of {collabTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCollabCurrentPage(prev => Math.min(prev + 1, collabTotalPages))}
                          disabled={collabCurrentPage >= collabTotalPages}
                          className="dark:bg-gray-700 dark:text-gray-200 text-xs sm:text-sm p-1 sm:p-2"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Partner Details Dialog */}
        <Dialog open={isPartnerDetailsDialogOpen} onOpenChange={setIsPartnerDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700 p-3 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 sm:gap-3 dark:text-gray-200 text-gray-800 text-lg sm:text-xl">
                {selectedPartner?.logo_url ? (
                  <img
                    src={selectedPartner.logo_url}
                    alt={`${selectedPartner.company_name} logo`}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded object-cover"
                  />
                ) : (
                  <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                )}
                {selectedPartner?.company_name}
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400 text-gray-600 text-sm">
                Complete partner information and collaboration history
              </DialogDescription>
            </DialogHeader>
            {selectedPartner && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Card className="dark:bg-gray-700 dark:border-gray-600 p-3 sm:p-4">
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardTitle className="text-xs sm:text-sm dark:text-gray-200 text-gray-800">Partner Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-3">
                      {selectedPartner.company_description && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</p>
                          <p className="text-xs sm:text-sm dark:text-gray-300 text-gray-700">{selectedPartner.company_description}</p>
                        </div>
                      )}
                      {selectedPartner.contact_person && (
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                          <span className="dark:text-gray-300 text-gray-700">{selectedPartner.contact_person}</span>
                        </div>
                      )}
                      {selectedPartner.contact_email && (
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                          <span className="dark:text-gray-300 text-gray-700">{selectedPartner.contact_email}</span>
                        </div>
                      )}
                      {selectedPartner.website_url && (
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                          <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                          <a
                            href={selectedPartner.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dark:text-blue-400 text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {selectedPartner.website_url.replace(/^https?:\/\//, '')}
                            <ExternalLink className="h-2 w-2 sm:h-3 sm:w-3" />
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="dark:bg-gray-700 dark:border-gray-600 p-3 sm:p-4">
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardTitle className="text-xs sm:text-sm dark:text-gray-200 text-gray-800">Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className="text-center p-2 sm:p-3 rounded-lg dark:bg-gray-600 bg-gray-100">
                          <p className="text-base sm:text-2xl font-bold text-[#10b981]">
                            {selectedPartner.total_collaborations || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total Collaborations</p>
                        </div>
                        <div className="text-center p-2 sm:p-3 rounded-lg dark:bg-gray-600 bg-gray-100">
                          <p className="text-base sm:text-2xl font-bold text-blue-500">
                            {selectedPartner.collaboration_stats?.active_collaborations || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
                        </div>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Partnership Since</p>
                        <p className="text-xs sm:text-sm dark:text-gray-300 text-gray-700">
                          {new Date(selectedPartner.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</p>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full", selectedPartner.is_active ? "bg-green-500" : "bg-red-500")} />
                          <span className="text-xs sm:text-sm dark:text-gray-300 text-gray-700">
                            {selectedPartner.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      {selectedPartner.collaboration_stats?.collaboration_types && selectedPartner.collaboration_stats.collaboration_types.length > 0 && (
                        <div className="space-y-1 sm:space-y-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Collaboration Types</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedPartner.collaboration_stats.collaboration_types.map((type, index) => {
                              const collabType = COLLABORATION_TYPES.find(t => t.value === type);
                              return (
                                <div key={index} className="flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 bg-gray-100 dark:bg-gray-600 rounded-full">
                                  {collabType && <collabType.icon className={cn("h-2 w-2 sm:h-3 sm:w-3", collabType.color)} />}
                                  <span className="text-xs font-medium dark:text-gray-200 text-gray-700">
                                    {collabType?.label || type}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card className="dark:bg-gray-700 dark:border-gray-600 p-3 sm:p-4">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm dark:text-gray-200 text-gray-800">Collaboration History</CardTitle>
                    <CardDescription className="dark:text-gray-400 text-gray-600 text-xs">
                      All collaborations with this partner
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPartnerDetails ? (
                      <div className="flex items-center justify-center h-24 sm:h-32">
                        <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin text-[#10b981]" />
                        <span className="ml-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Loading...</span>
                      </div>
                    ) : selectedPartner.collaborations && selectedPartner.collaborations.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {selectedPartner.collaborations.map((collaboration, index) => {
                          const collabType = COLLABORATION_TYPES.find(t => t.value === collaboration.collaboration_type);
                          return (
                            <div key={index} className="flex items-center justify-between p-2 sm:p-3 rounded-lg dark:bg-gray-600 bg-gray-50">
                              <div className="flex items-center gap-2 sm:gap-3">
                                {collabType && <collabType.icon className={cn("h-3 w-3 sm:h-4 sm:w-4", collabType.color)} />}
                                <div>
                                  <p className="text-xs sm:text-sm font-medium dark:text-gray-200 text-gray-800">
                                    {collaboration.event_name || 'Unknown Event'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {collabType?.label || collaboration.collaboration_type}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {collaboration.event_date
                                    ? new Date(collaboration.event_date).toLocaleDateString()
                                    : new Date(collaboration.created_at).toLocaleDateString()
                                  }
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  {collaboration.show_on_event_page ? (
                                    <Eye className="h-2 w-2 sm:h-3 sm:w-3 text-green-500" />
                                  ) : (
                                    <EyeOff className="h-2 w-2 sm:h-3 sm:w-3 text-gray-400" />
                                  )}
                                  <span className={cn(
                                    "text-xs",
                                    collaboration.is_active
                                      ? "text-green-500 dark:text-green-400"
                                      : "text-red-500 dark:text-red-400"
                                  )}>
                                    {collaboration.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {partnerDetailsTotalPages > 1 && (
                          <div className="flex justify-center items-center gap-1 sm:gap-2 pt-3 sm:pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPartnerDetailsPage(prev => Math.max(prev - 1, 1));
                                if (selectedPartner) fetchPartnerDetails(selectedPartner.id, Math.max(partnerDetailsPage - 1, 1));
                              }}
                              disabled={partnerDetailsPage <= 1}
                              className="dark:bg-gray-600 dark:text-gray-200 text-xs sm:text-sm p-1 sm:p-2"
                            >
                              Previous
                            </Button>
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2 sm:px-4">
                              Page {partnerDetailsPage} of {partnerDetailsTotalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPartnerDetailsPage(prev => Math.min(prev + 1, partnerDetailsTotalPages));
                                if (selectedPartner) fetchPartnerDetails(selectedPartner.id, Math.min(partnerDetailsPage + 1, partnerDetailsTotalPages));
                              }}
                              disabled={partnerDetailsPage >= partnerDetailsTotalPages}
                              className="dark:bg-gray-600 dark:text-gray-200 text-xs sm:text-sm p-1 sm:p-2"
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8">
                        <Handshake className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-1 sm:mb-2" />
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No collaboration history found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            <DialogFooter className="pt-3 sm:pt-4">
              <Button
                variant="outline"
                onClick={() => setIsPartnerDetailsDialogOpen(false)}
                className="dark:bg-gray-700 dark:text-gray-200 text-xs sm:text-sm"
              >
                Close
              </Button>
              {selectedPartner && (
                <Button
                  onClick={() => {
                    setIsPartnerDetailsDialogOpen(false);
                    handlePartnerEdit(selectedPartner);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] text-white text-xs sm:text-sm"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Edit Partner
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px] dark:bg-gray-800 dark:border-gray-700 p-3 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-1 sm:gap-2 dark:text-gray-200 text-gray-800 text-lg sm:text-xl">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400 text-gray-600 text-sm">
                {itemToDelete?.type === 'partner'
                  ? 'Are you sure you want to delete this partner? This action cannot be undone and will remove all associated collaborations.'
                  : 'Are you sure you want to delete this collaboration? This action cannot be undone.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-3 sm:pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setItemToDelete(null);
                }}
                className="dark:bg-gray-700 dark:text-gray-200 text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={deleteItem}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm"
              >
                {isDeleting && <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />}
                Delete {itemToDelete?.type === 'partner' ? 'Partner' : 'Collaboration'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Partner Dialog */}
        <Dialog open={isPartnerDialogOpen} onOpenChange={handlePartnerDialogClose}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700 p-3 sm:p-6">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-200 text-gray-800 text-lg sm:text-xl">
                {editingPartner ? 'Edit Partner' : 'Add New Partner'}
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400 text-gray-600 text-sm">
                {editingPartner ? 'Update partner information' : 'Add a new partner company to your network'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name" className="dark:text-gray-200 text-gray-800 text-sm">
                  Company Name *
                </Label>
                <Input
                  id="company_name"
                  value={partnerForm.company_name}
                  onChange={(e) => setPartnerForm(prev => ({ ...prev, company_name: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-sm"
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_description" className="dark:text-gray-200 text-gray-800 text-sm">
                  Description
                </Label>
                <Textarea
                  id="company_description"
                  value={partnerForm.company_description}
                  onChange={(e) => setPartnerForm(prev => ({ ...prev, company_description: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-sm"
                  placeholder="Brief description of the company"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-200 text-gray-800 text-sm">
                  Company Logo
                </Label>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-sm"
                      />
                    </div>
                    {selectedFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview(null);
                        }}
                        className="dark:bg-gray-700 dark:text-gray-200 p-1 sm:p-2"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                  </div>
                  {filePreview && (
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 border rounded-lg overflow-hidden dark:border-gray-600">
                        <img
                          src={filePreview}
                          alt="New logo preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        New logo selected
                      </div>
                    </div>
                  )}
                  {editingPartner?.logo_url && !filePreview && (
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 border rounded-lg overflow-hidden dark:border-gray-600">
                        <img
                          src={editingPartner.logo_url}
                          alt="Current logo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Current logo
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Supported formats: PNG, JPG, JPEG, GIF, WEBP (Max 5MB)
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person" className="dark:text-gray-200 text-gray-800 text-sm">
                    Contact Person
                  </Label>
                  <Input
                    id="contact_person"
                    value={partnerForm.contact_person}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, contact_person: e.target.value }))}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-sm"
                    placeholder="Contact person name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email" className="dark:text-gray-200 text-gray-800 text-sm">
                    Contact Email
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={partnerForm.contact_email}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, contact_email: e.target.value }))}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-sm"
                    placeholder="contact@company.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website_url" className="dark:text-gray-200 text-gray-800 text-sm">
                  Website URL
                </Label>
                <Input
                  id="website_url"
                  value={partnerForm.website_url}
                  onChange={(e) => setPartnerForm(prev => ({ ...prev, website_url: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-sm"
                  placeholder="https://company.com"
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetPartnerForm();
                  setIsPartnerDialogOpen(false);
                }}
                className="dark:bg-gray-700 dark:text-gray-200 text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={editingPartner ? updatePartner : createPartner}
                disabled={isCreating || isUpdating || !partnerForm.company_name}
                className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] text-white text-xs sm:text-sm"
              >
                {(isCreating || isUpdating) && <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />}
                {editingPartner ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Collaboration Dialog */}
        <Dialog open={isCollaborationDialogOpen} onOpenChange={handleCollaborationDialogClose}>
          <DialogContent className="sm:max-w-[500px] dark:bg-gray-800 dark:border-gray-700 p-3 sm:p-6">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-200 text-gray-800 text-lg sm:text-xl">
                {editingCollaboration ? 'Edit Collaboration' : 'Add Event Collaboration'}
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400 text-gray-600 text-sm">
                {editingCollaboration
                  ? `Update collaboration for ${selectedEvent?.name}`
                  : `Add a partner collaboration to ${selectedEvent?.name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4">
              {!editingCollaboration && (
                <div className="space-y-2">
                  <Label className="dark:text-gray-200 text-gray-800 text-sm">Partner *</Label>
                  <Select
                    value={collaborationForm.partner_id}
                    onValueChange={(value) => setCollaborationForm(prev => ({ ...prev, partner_id: value }))}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-xs sm:text-sm">
                      <SelectValue placeholder="Select a partner" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      {partners.filter(p => p.is_active).map((partner) => (
                        <SelectItem key={partner.id} value={partner.id.toString()} className="text-xs sm:text-sm">
                          <div className="flex items-center gap-1 sm:gap-2">
                            {partner.logo_url ? (
                              <img
                                src={partner.logo_url}
                                alt={`${partner.company_name} logo`}
                                className="w-3 h-3 sm:w-4 sm:h-4 rounded object-cover"
                              />
                            ) : (
                              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                            )}
                            {partner.company_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label className="dark:text-gray-200 text-gray-800 text-sm">Collaboration Type *</Label>
                <Select
                  value={collaborationForm.collaboration_type}
                  onValueChange={(value) => setCollaborationForm(prev => ({ ...prev, collaboration_type: value }))}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {COLLABORATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-xs sm:text-sm">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <type.icon className={cn("h-3 w-3 sm:h-4 sm:w-4", type.color)} />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-200 text-gray-800 text-sm">Description</Label>
                <Textarea
                  value={collaborationForm.description}
                  onChange={(e) => setCollaborationForm(prev => ({ ...prev, description: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-xs sm:text-sm"
                  placeholder="Describe the collaboration..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="dark:text-gray-200 text-gray-800 text-sm">Display Order</Label>
                  <Input
                    type="number"
                    value={collaborationForm.display_order}
                    onChange={(e) => setCollaborationForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-xs sm:text-sm"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-200 text-gray-800 text-sm">Visibility</Label>
                  <div className="flex items-center space-x-1 sm:space-x-2 pt-1 sm:pt-2">
                    <Checkbox
                      checked={collaborationForm.show_on_event_page}
                      onCheckedChange={(checked) => setCollaborationForm(prev => ({ ...prev, show_on_event_page: Boolean(checked) }))}
                      className="dark:border-gray-500 h-3 w-3 sm:h-4 sm:w-4"
                    />
                    <Label className="text-xs sm:text-sm dark:text-gray-200 text-gray-800">
                      Show on event page
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-3 sm:pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetCollaborationForm();
                  setIsCollaborationDialogOpen(false);
                }}
                className="dark:bg-gray-700 dark:text-gray-200 text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={editingCollaboration ? updateCollaboration : createCollaboration}
                disabled={isCreating || isUpdating || (!editingCollaboration && !collaborationForm.partner_id)}
                className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] text-white text-xs sm:text-sm"
              >
                {(isCreating || isUpdating) && <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />}
                {editingCollaboration ? 'Update' : 'Add'} Collaboration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OrganizerPartnership;
