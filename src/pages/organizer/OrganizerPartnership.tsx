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
  TrendingUp, Activity, Package, Upload, X, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Partner, RecentCollaboration, Collaboration, Event, PartnersResponse,
  PartnerDetailsResponse, CollaborationsResponse, COLLABORATION_TYPES,
  SORT_OPTIONS, ALLOWED_FILE_TYPES, MAX_FILE_SIZE,EventsResponse
} from "@/lib/types";

const OrganizerPartnership: React.FC = () => {
  // --- State Variables ---
  const [partners, setPartners] = useState<Partner[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('company_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [activeTab, setActiveTab] = useState('partners');
  // Collaboration pagination
  const [collabCurrentPage, setCollabCurrentPage] = useState(1);
  const [collabTotalPages, setCollabTotalPages] = useState(1);
  // Partner details pagination
  const [partnerDetailsPage, setPartnerDetailsPage] = useState(1);
  const [partnerDetailsTotalPages, setPartnerDetailsTotalPages] = useState(1);
  // Loading states
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [isLoadingCollaborations, setIsLoadingCollaborations] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingPartnerDetails, setIsLoadingPartnerDetails] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Dialog states
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [isCollaborationDialogOpen, setIsCollaborationDialogOpen] = useState(false);
  const [isPartnerDetailsDialogOpen, setIsPartnerDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'partner' | 'collaboration', id: number } | null>(null);
  // Form states
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
      collaboration_type: 'Partner',
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
        include_inactive: includeInactive.toString(),
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
      const data: PartnersResponse = await response.json();
      setPartners(data.partners);
      setTotalPages(data.pagination.pages);
      setTotalItems(data.pagination.total);
    } catch (err) {
      handleError("Failed to fetch partners", err);
    } finally {
      setIsLoadingPartners(false);
    }
  }, [currentPage, sortBy, sortOrder, includeInactive, searchQuery, handleError]);

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
      const data: CollaborationsResponse = await response.json();
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
        time_filter: 'all', // Get all events (past, present, future) for collaboration management
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
      
      // Handle both possible response formats
      const eventsList = data.events || [];
      
      console.log('Fetched events:', eventsList); // Debug log to check what's being returned
      
      setEvents(eventsList);
    } catch (err) {
      console.error('Error fetching events:', err); // Debug log
      handleError("Failed to fetch events", err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [handleError]);
  const createPartner = useCallback(async () => {
    setIsCreating(true);
    try {
      const formData = new FormData();
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
        body.append('company_name', partnerForm.company_name);
        if (partnerForm.company_description) body.append('company_description', partnerForm.company_description);
        if (partnerForm.website_url) body.append('website_url', partnerForm.website_url);
        if (partnerForm.contact_email) body.append('contact_email', partnerForm.contact_email);
        if (partnerForm.contact_person) body.append('contact_person', partnerForm.contact_person);
        body.append('file', selectedFile);
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(partnerForm);
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
        url = `${import.meta.env.VITE_API_URL}/api/partners/${itemToDelete.id}`;
      } else {
        const collaboration = collaborations.find(c => c.id === itemToDelete.id);
        if (!collaboration) throw new Error('Collaboration not found');
        url = `${import.meta.env.VITE_API_URL}/api/partners/events/${collaboration.event_id}/collaborations/${itemToDelete.id}`;
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
    return partners.filter(partner =>
      includeInactive || partner.is_active
    );
  }, [partners, includeInactive]);

  const paginationInfo = useMemo(() => {
    return {
      showing: `${(currentPage - 1) * 10 + 1}-${Math.min(currentPage * 10, totalItems)}`,
      total: totalItems
    };
  }, [currentPage, totalItems]);

  // --- Component Render ---
  return (
    <div className={cn("min-h-screen p-4 md:p-6 lg:p-8 dark:bg-gray-900 dark:text-gray-200 bg-gray-50 text-gray-800")}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-[#10b981] bg-clip-text text-transparent">
              Partnership Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your partners and event collaborations
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => fetchPartners()}
              variant="outline"
              size="sm"
              disabled={isLoadingPartners}
              className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingPartners && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}
        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 dark:bg-gray-700 dark:border-gray-600 bg-gray-200 border-gray-300 rounded-lg p-1">
            <TabsTrigger
              value="partners"
              className="dark:data-[state=active]:bg-[#10b981] dark:data-[state=active]:text-white data-[state=active]:bg-[#10b981] data-[state=active]:text-white dark:text-gray-200 text-gray-800 rounded-md transition-all duration-300 font-medium"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Partners ({partners.length})
            </TabsTrigger>
            <TabsTrigger
              value="collaborations"
              className="dark:data-[state=active]:bg-[#10b981] dark:data-[state=active]:text-white data-[state=active]:bg-[#10b981] data-[state=active]:text-white dark:text-gray-200 text-gray-800 rounded-md transition-all duration-300 font-medium"
            >
              <Handshake className="h-4 w-4 mr-2" />
              Collaborations
            </TabsTrigger>
          </TabsList>
          {/* Partners Tab */}
          <TabsContent value="partners" className="mt-6">
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                      <Users className="h-5 w-5" />
                      Partner Companies
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400 text-gray-600">
                      Manage your partner companies and their details
                    </CardDescription>
                  </div>
                  <Dialog open={isPartnerDialogOpen} onOpenChange={handlePartnerDialogClose}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={resetPartnerForm}
                        className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Partner
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="dark:text-gray-200 text-gray-800">
                          {editingPartner ? 'Edit Partner' : 'Add New Partner'}
                        </DialogTitle>
                        <DialogDescription className="dark:text-gray-400 text-gray-600">
                          {editingPartner ? 'Update partner information' : 'Add a new partner company to your network'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="company_name" className="dark:text-gray-200 text-gray-800">
                            Company Name *
                          </Label>
                          <Input
                            id="company_name"
                            value={partnerForm.company_name}
                            onChange={(e) => setPartnerForm(prev => ({ ...prev, company_name: e.target.value }))}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            placeholder="Enter company name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company_description" className="dark:text-gray-200 text-gray-800">
                            Description
                          </Label>
                          <Textarea
                            id="company_description"
                            value={partnerForm.company_description}
                            onChange={(e) => setPartnerForm(prev => ({ ...prev, company_description: e.target.value }))}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            placeholder="Brief description of the company"
                            rows={3}
                          />
                        </div>
                        {/* Logo Upload Section */}
                        <div className="space-y-2">
                          <Label className="dark:text-gray-200 text-gray-800">
                            Company Logo
                          </Label>
                          <div className="space-y-4">
                            {/* File Upload */}
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileSelect}
                                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
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
                                  className="dark:bg-gray-700 dark:text-gray-200"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            {/* Preview */}
                            {filePreview && (
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 border rounded-lg overflow-hidden dark:border-gray-600">
                                  <img
                                    src={filePreview}
                                    alt="New logo preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  New logo selected
                                </div>
                              </div>
                            )}
                            {/* Current logo preview for editing (only show if no new file selected) */}
                            {editingPartner?.logo_url && !filePreview && (
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 border rounded-lg overflow-hidden dark:border-gray-600">
                                  <img
                                    src={editingPartner.logo_url}
                                    alt="Current logo"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Current logo
                                </div>
                              </div>
                            )}
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Supported formats: PNG, JPG, JPEG, GIF, WEBP (Max 5MB)
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contact_person" className="dark:text-gray-200 text-gray-800">
                              Contact Person
                            </Label>
                            <Input
                              id="contact_person"
                              value={partnerForm.contact_person}
                              onChange={(e) => setPartnerForm(prev => ({ ...prev, contact_person: e.target.value }))}
                              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                              placeholder="Contact person name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contact_email" className="dark:text-gray-200 text-gray-800">
                              Contact Email
                            </Label>
                            <Input
                              id="contact_email"
                              type="email"
                              value={partnerForm.contact_email}
                              onChange={(e) => setPartnerForm(prev => ({ ...prev, contact_email: e.target.value }))}
                              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                              placeholder="contact@company.com"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website_url" className="dark:text-gray-200 text-gray-800">
                            Website URL
                          </Label>
                          <Input
                            id="website_url"
                            value={partnerForm.website_url}
                            onChange={(e) => setPartnerForm(prev => ({ ...prev, website_url: e.target.value }))}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            placeholder="https://company.com"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            resetPartnerForm();
                            setIsPartnerDialogOpen(false);
                          }}
                          className="dark:bg-gray-700 dark:text-gray-200"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={editingPartner ? updatePartner : createPartner}
                          disabled={isCreating || isUpdating || !partnerForm.company_name}
                          className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] text-white"
                        >
                          {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          {editingPartner ? 'Update' : 'Create'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row gap-4 pt-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                      placeholder="Search partners..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-gray-100 border-gray-300 text-gray-800"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-[180px] dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {SORT_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSortOrderToggle}
                      className="dark:bg-gray-700 dark:text-gray-200"
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="includeInactive"
                    checked={includeInactive}
                    onCheckedChange={checked => setIncludeInactive(checked === true)}
                    className="dark:border-gray-500"
                  />
                  <Label htmlFor="includeInactive" className="text-sm dark:text-gray-200 text-gray-800">
                    Include inactive partners
                  </Label>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingPartners ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
                    <span className="ml-2 text-gray-500 dark:text-gray-400">Loading partners...</span>
                  </div>
                ) : filteredPartners.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {searchQuery ? 'No partners found matching your search' : 'No partners found'}
                    </p>
                    <Dialog open={isPartnerDialogOpen} onOpenChange={handlePartnerDialogClose}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={resetPartnerForm}
                          className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Partner
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Pagination Info */}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {paginationInfo.showing} of {paginationInfo.total} partners
                    </div>
                    {/* Partners Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPartners.map((partner) => (
                        <Card
                          key={partner.id}
                          className={cn(
                            "shadow-md hover:shadow-lg transition-all duration-300",
                            "dark:bg-gray-700 dark:border-gray-600 bg-white border-gray-200",
                            !partner.is_active && "opacity-60 border-dashed"
                          )}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {partner.logo_url ? (
                                    <img
                                      src={partner.logo_url}
                                      alt={`${partner.company_name} logo`}
                                      className="w-8 h-8 rounded object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded flex items-center justify-center">
                                      <Building2 className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg truncate dark:text-gray-200 text-gray-800">
                                      {partner.company_name}
                                    </CardTitle>
                                    {!partner.is_active && (
                                      <span className="text-xs text-red-500 font-medium">Inactive</span>
                                    )}
                                  </div>
                                </div>
                                {partner.company_description && (
                                  <CardDescription className="dark:text-gray-400 text-gray-600 line-clamp-2">
                                    {partner.company_description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="p-2 rounded-lg dark:bg-gray-600 bg-gray-100">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Collaborations</p>
                                <p className="text-lg font-bold text-[#10b981]">
                                  {partner.total_collaborations || 0}
                                </p>
                              </div>
                              <div className="p-2 rounded-lg dark:bg-gray-600 bg-gray-100">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Since</p>
                                <p className="text-sm font-medium dark:text-gray-200 text-gray-800">
                                  {new Date(partner.created_at).getFullYear()}
                                </p>
                              </div>
                            </div>
                            {partner.contact_person && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="dark:text-gray-300 text-gray-700 truncate">
                                  {partner.contact_person}
                                </span>
                              </div>
                            )}
                            {partner.contact_email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span className="dark:text-gray-300 text-gray-700 truncate">
                                  {partner.contact_email}
                                </span>
                              </div>
                            )}
                            {partner.website_url && (
                              <div className="flex items-center gap-2 text-sm">
                                <Globe className="h-4 w-4 text-gray-500" />
                                <a
                                  href={partner.website_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="dark:text-blue-400 text-blue-600 hover:underline truncate flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {partner.website_url.replace(/^https?:\/\//, '')}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                            {/* Recent Collaborations */}
                            {partner.recent_collaborations && partner.recent_collaborations.length > 0 && (
                              <div className="pt-2 border-t dark:border-gray-600 border-gray-200">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
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
                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewPartnerDetails(partner);
                                }}
                                className="flex-1 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePartnerEdit(partner);
                                }}
                                className="flex-1 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConfirm('partner', partner.id);
                                }}
                                className="flex-1 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 bg-red-50 text-red-600 hover:bg-red-100"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                {partner.is_active ? 'Deactivate' : 'Delete'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 pt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage <= 1}
                          className="dark:bg-gray-700 dark:text-gray-200"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-500 dark:text-gray-400 px-4">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage >= totalPages}
                          className="dark:bg-gray-700 dark:text-gray-200"
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
          <TabsContent value="collaborations" className="mt-6">
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                      <Handshake className="h-5 w-5" />
                      Event Collaborations
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400 text-gray-600">
                      Manage partnerships for specific events
                    </CardDescription>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <Select
                      value={selectedEvent?.id.toString() || ''}
                      onValueChange={(value) => {
                        const event = events.find(e => e.id.toString() === value);
                        setSelectedEvent(event || null);
                        setCollabCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full md:w-[250px] dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id.toString()}>
                            <div className="flex flex-col">
                              <span>{event.name}</span>
                              {event.date && (
                                <span className="text-xs text-gray-500">
                                  {new Date(event.date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
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
                            className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Collaboration
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] dark:bg-gray-800 dark:border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="dark:text-gray-200 text-gray-800">
                              {editingCollaboration ? 'Edit Collaboration' : 'Add Event Collaboration'}
                            </DialogTitle>
                            <DialogDescription className="dark:text-gray-400 text-gray-600">
                              {editingCollaboration
                                ? `Update collaboration for ${selectedEvent.name}`
                                : `Add a partner collaboration to ${selectedEvent.name}`}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {!editingCollaboration && (
                              <div className="space-y-2">
                                <Label className="dark:text-gray-200 text-gray-800">Partner *</Label>
                                <Select
                                  value={collaborationForm.partner_id}
                                  onValueChange={(value) => setCollaborationForm(prev => ({ ...prev, partner_id: value }))}
                                >
                                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                                    <SelectValue placeholder="Select a partner" />
                                  </SelectTrigger>
                                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                                    {partners.filter(p => p.is_active).map((partner) => (
                                      <SelectItem key={partner.id} value={partner.id.toString()}>
                                        <div className="flex items-center gap-2">
                                          {partner.logo_url ? (
                                            <img
                                              src={partner.logo_url}
                                              alt={`${partner.company_name} logo`}
                                              className="w-4 h-4 rounded object-cover"
                                            />
                                          ) : (
                                            <Building2 className="w-4 h-4 text-gray-500" />
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
                              <Label className="dark:text-gray-200 text-gray-800">Collaboration Type *</Label>
                              <Select
                                value={collaborationForm.collaboration_type}
                                onValueChange={(value) => setCollaborationForm(prev => ({ ...prev, collaboration_type: value }))}
                              >
                                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                                  {COLLABORATION_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      <div className="flex items-center gap-2">
                                        <type.icon className={cn("h-4 w-4", type.color)} />
                                        {type.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="dark:text-gray-200 text-gray-800">Description</Label>
                              <Textarea
                                value={collaborationForm.description}
                                onChange={(e) => setCollaborationForm(prev => ({ ...prev, description: e.target.value }))}
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                placeholder="Describe the collaboration..."
                                rows={3}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="dark:text-gray-200 text-gray-800">Display Order</Label>
                                <Input
                                  type="number"
                                  value={collaborationForm.display_order}
                                  onChange={(e) => setCollaborationForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                  min="0"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="dark:text-gray-200 text-gray-800">Visibility</Label>
                                <div className="flex items-center space-x-2 pt-2">
                                  <Checkbox
                                    checked={collaborationForm.show_on_event_page}
                                    onCheckedChange={(checked) => setCollaborationForm(prev => ({ ...prev, show_on_event_page: Boolean(checked) }))}
                                    className="dark:border-gray-500"
                                  />
                                  <Label className="text-sm dark:text-gray-200 text-gray-800">
                                    Show on event page
                                  </Label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                resetCollaborationForm();
                                setIsCollaborationDialogOpen(false);
                              }}
                              className="dark:bg-gray-700 dark:text-gray-200"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={editingCollaboration ? updateCollaboration : createCollaboration}
                              disabled={isCreating || isUpdating || (!editingCollaboration && !collaborationForm.partner_id)}
                              className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] text-white"
                            >
                              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              {editingCollaboration ? 'Update' : 'Add'} Collaboration
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedEvent ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Select an event to view and manage collaborations
                    </p>
                    {events.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No events available. Create an event first to add collaborations.
                      </p>
                    )}
                  </div>
                ) : isLoadingCollaborations ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
                    <span className="ml-2 text-gray-500 dark:text-gray-400">Loading collaborations...</span>
                  </div>
                ) : collaborations.length === 0 ? (
                  <div className="text-center py-12">
                    <Handshake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No collaborations found for {selectedEvent.name}
                    </p>
                    <Dialog open={isCollaborationDialogOpen} onOpenChange={handleCollaborationDialogClose}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            resetCollaborationForm();
                            setCollaborationForm(prev => ({ ...prev, event_id: selectedEvent.id.toString() }));
                          }}
                          className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Collaboration
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Event Info Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-600 p-4 rounded-lg border dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold dark:text-gray-200 text-gray-800">
                            {selectedEvent.name}
                          </h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {selectedEvent.date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(selectedEvent.date).toLocaleDateString()}
                              </div>
                            )}
                            {selectedEvent.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {selectedEvent.location}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#10b981]">
                            {collaborations.length}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Collaborations</p>
                        </div>
                      </div>
                    </div>
                    {/* Collaborations List */}
                    <div className="grid gap-4">
                      {collaborations.map((collaboration) => {
                        const partner = partners.find(p => p.id === collaboration.partner_id);
                        const collabType = COLLABORATION_TYPES.find(t => t.value === collaboration.collaboration_type);
                        return (
                          <Card
                            key={collaboration.id}
                            className="dark:bg-gray-700 dark:border-gray-600 bg-white border-gray-200 hover:shadow-lg transition-all duration-300"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                  {/* Partner Logo/Icon */}
                                  <div className="flex-shrink-0">
                                    {partner?.logo_url ? (
                                      <img
                                        src={partner.logo_url}
                                        alt={`${partner.company_name} logo`}
                                        className="w-12 h-12 rounded-lg object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  {/* Collaboration Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="text-lg font-semibold dark:text-gray-200 text-gray-800 truncate">
                                        {partner?.company_name || 'Unknown Partner'}
                                      </h4>
                                      {collabType && (
                                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-full">
                                          <collabType.icon className={cn("h-3 w-3", collabType.color)} />
                                          <span className="text-xs font-medium dark:text-gray-200 text-gray-700">
                                            {collabType.label}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {collaboration.description && (
                                      <p className="text-sm dark:text-gray-400 text-gray-600 mb-3 line-clamp-2">
                                        {collaboration.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                      <div className="flex items-center gap-1">
                                        <Package className="h-4 w-4" />
                                        Order: {collaboration.display_order}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {collaboration.show_on_event_page ? (
                                          <>
                                            <Eye className="h-4 w-4" />
                                            <span>Visible</span>
                                          </>
                                        ) : (
                                          <>
                                            <EyeOff className="h-4 w-4" />
                                            <span>Hidden</span>
                                          </>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(collaboration.created_at).toLocaleDateString()}
                                      </div>
                                    </div>
                                    {/* Partner Quick Info */}
                                    {partner && (
                                      <div className="flex items-center gap-4 mt-3 pt-3 border-t dark:border-gray-600 border-gray-200">
                                        {partner.contact_person && (
                                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            <User className="h-3 w-3" />
                                            {partner.contact_person}
                                          </div>
                                        )}
                                        {partner.contact_email && (
                                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            <Mail className="h-3 w-3" />
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
                                            <Globe className="h-3 w-3" />
                                            Website
                                            <ExternalLink className="h-2 w-2" />
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {/* Action Buttons */}
                                <div className="flex gap-2 ml-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCollaborationEdit(collaboration)}
                                    className="dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteConfirm('collaboration', collaboration.id)}
                                    className="dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 bg-red-50 text-red-600 hover:bg-red-100"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    {/* Collaboration Pagination */}
                    {collabTotalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 pt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCollabCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={collabCurrentPage <= 1}
                          className="dark:bg-gray-700 dark:text-gray-200"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-500 dark:text-gray-400 px-4">
                          Page {collabCurrentPage} of {collabTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCollabCurrentPage(prev => Math.min(prev + 1, collabTotalPages))}
                          disabled={collabCurrentPage >= collabTotalPages}
                          className="dark:bg-gray-700 dark:text-gray-200"
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
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 dark:text-gray-200 text-gray-800">
                {selectedPartner?.logo_url ? (
                  <img
                    src={selectedPartner.logo_url}
                    alt={`${selectedPartner.company_name} logo`}
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-gray-500" />
                )}
                {selectedPartner?.company_name}
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400 text-gray-600">
                Complete partner information and collaboration history
              </DialogDescription>
            </DialogHeader>
            {selectedPartner && (
              <div className="space-y-6">
                {/* Partner Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="dark:bg-gray-700 dark:border-gray-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm dark:text-gray-200 text-gray-800">Partner Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedPartner.company_description && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</p>
                          <p className="text-sm dark:text-gray-300 text-gray-700">{selectedPartner.company_description}</p>
                        </div>
                      )}
                      {selectedPartner.contact_person && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="dark:text-gray-300 text-gray-700">{selectedPartner.contact_person}</span>
                        </div>
                      )}
                      {selectedPartner.contact_email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="dark:text-gray-300 text-gray-700">{selectedPartner.contact_email}</span>
                        </div>
                      )}
                      {selectedPartner.website_url && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 text-gray-500" />
                          <a
                            href={selectedPartner.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dark:text-blue-400 text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {selectedPartner.website_url.replace(/^https?:\/\//, '')}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="dark:bg-gray-700 dark:border-gray-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm dark:text-gray-200 text-gray-800">Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 rounded-lg dark:bg-gray-600 bg-gray-100">
                          <p className="text-2xl font-bold text-[#10b981]">
                            {selectedPartner.total_collaborations || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total Collaborations</p>
                        </div>
                        <div className="text-center p-3 rounded-lg dark:bg-gray-600 bg-gray-100">
                          <p className="text-2xl font-bold text-blue-500">
                            {selectedPartner.collaboration_stats?.active_collaborations || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Partnership Since</p>
                        <p className="text-sm dark:text-gray-300 text-gray-700">
                          {new Date(selectedPartner.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</p>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", selectedPartner.is_active ? "bg-green-500" : "bg-red-500")} />
                          <span className="text-sm dark:text-gray-300 text-gray-700">
                            {selectedPartner.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      {selectedPartner.collaboration_stats?.collaboration_types && selectedPartner.collaboration_stats.collaboration_types.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Collaboration Types</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedPartner.collaboration_stats.collaboration_types.map((type, index) => {
                              const collabType = COLLABORATION_TYPES.find(t => t.value === type);
                              return (
                                <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-full">
                                  {collabType && <collabType.icon className={cn("h-3 w-3", collabType.color)} />}
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
                {/* Collaboration History */}
                <Card className="dark:bg-gray-700 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-sm dark:text-gray-200 text-gray-800">Collaboration History</CardTitle>
                    <CardDescription className="dark:text-gray-400 text-gray-600">
                      All collaborations with this partner
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPartnerDetails ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-[#10b981]" />
                        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading...</span>
                      </div>
                    ) : selectedPartner.collaborations && selectedPartner.collaborations.length > 0 ? (
                      <div className="space-y-3">
                        {selectedPartner.collaborations.map((collaboration, index) => {
                          const collabType = COLLABORATION_TYPES.find(t => t.value === collaboration.collaboration_type);
                          return (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg dark:bg-gray-600 bg-gray-50">
                              <div className="flex items-center gap-3">
                                {collabType && <collabType.icon className={cn("h-4 w-4", collabType.color)} />}
                                <div>
                                  <p className="text-sm font-medium dark:text-gray-200 text-gray-800">
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
                                    <Eye className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <EyeOff className="h-3 w-3 text-gray-400" />
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
                        {/* Partner Details Pagination */}
                        {partnerDetailsTotalPages > 1 && (
                          <div className="flex justify-center items-center gap-2 pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPartnerDetailsPage(prev => Math.max(prev - 1, 1));
                                if (selectedPartner) fetchPartnerDetails(selectedPartner.id, Math.max(partnerDetailsPage - 1, 1));
                              }}
                              disabled={partnerDetailsPage <= 1}
                              className="dark:bg-gray-600 dark:text-gray-200"
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-gray-500 dark:text-gray-400 px-4">
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
                              className="dark:bg-gray-600 dark:text-gray-200"
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Handshake className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No collaboration history found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsPartnerDetailsDialogOpen(false)}
                className="dark:bg-gray-700 dark:text-gray-200"
              >
                Close
              </Button>
              {selectedPartner && (
                <Button
                  onClick={() => {
                    setIsPartnerDetailsDialogOpen(false);
                    handlePartnerEdit(selectedPartner);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Partner
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px] dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 dark:text-gray-200 text-gray-800">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400 text-gray-600">
                {itemToDelete?.type === 'partner'
                  ? 'Are you sure you want to delete this partner? This action cannot be undone and will remove all associated collaborations.'
                  : 'Are you sure you want to delete this collaboration? This action cannot be undone.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setItemToDelete(null);
                }}
                className="dark:bg-gray-700 dark:text-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={deleteItem}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete {itemToDelete?.type === 'partner' ? 'Partner' : 'Collaboration'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OrganizerPartnership;
