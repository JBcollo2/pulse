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
  TrendingUp, Activity, Package
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Interfaces ---
interface Partner {
  id: number;
  organizer_id: number;
  company_name: string;
  company_description?: string;
  logo_url?: string;
  website_url?: string;
  contact_email?: string;
  contact_person?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_collaborations?: number;
  recent_collaborations?: RecentCollaboration[];
}

interface RecentCollaboration {
  event_id: number;
  event_name: string;
  collaboration_type: string;
  created_at: string;
}

interface Collaboration {
  id: number;
  event_id: number;
  partner_id: number;
  collaboration_type: string;
  description?: string;
  display_order: number;
  show_on_event_page: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  event_name?: string;
  event_date?: string;
  partner_name?: string;
}

interface Event {
  id: number;
  name: string;
  date?: string;
  location?: string;
}

interface PartnersResponse {
  partners: Partner[];
  pagination: {
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
  organizer_id: number;
  filters: {
    include_inactive: boolean;
    sort_by: string;
    sort_order: string;
    search?: string;
  };
}

interface CollaborationsResponse {
  event_id: number;
  event_name: string;
  collaborations: Collaboration[];
  pagination: {
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// --- Constants ---
const COLLABORATION_TYPES = [
  { value: 'PARTNER', label: 'Partner', icon: Handshake, color: 'text-blue-500' },
  { value: 'OFFICIAL_PARTNER', label: 'Official Partner', icon: Star, color: 'text-yellow-500' },
  { value: 'COLLABORATOR', label: 'Collaborator', icon: Users, color: 'text-green-500' },
  { value: 'SUPPORTER', label: 'Supporter', icon: TrendingUp, color: 'text-purple-500' },
  { value: 'MEDIA_PARTNER', label: 'Media Partner', icon: Activity, color: 'text-orange-500' },
];

const SORT_OPTIONS = [
  { value: 'company_name', label: 'Company Name' },
  { value: 'created_at', label: 'Date Created' },
  { value: 'total_collaborations', label: 'Total Collaborations' },
  { value: 'active_status', label: 'Active Status' },
];

// --- Main Component ---
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

  // Loading states
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [isLoadingCollaborations, setIsLoadingCollaborations] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dialog states
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [isCollaborationDialogOpen, setIsCollaborationDialogOpen] = useState(false);
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

  const fetchCollaborations = useCallback(async (eventId?: number) => {
    if (!eventId && !selectedEvent) return;
    
    setIsLoadingCollaborations(true);
    setError(null);
    try {
      const targetEventId = eventId || selectedEvent?.id;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/partners/events/${targetEventId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: CollaborationsResponse = await response.json();
      setCollaborations(data.collaborations);
      
    } catch (err) {
      handleError("Failed to fetch collaborations", err);
    } finally {
      setIsLoadingCollaborations(false);
    }
  }, [selectedEvent, handleError]);

  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setEvents(data.events || []);
      
    } catch (err) {
      handleError("Failed to fetch events", err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [handleError]);

  const createPartner = useCallback(async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/partners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(partnerForm)
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
  }, [partnerForm, resetPartnerForm, fetchPartners, handleError, toast]);

  const updatePartner = useCallback(async () => {
    if (!editingPartner) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/partners/${editingPartner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(partnerForm)
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
      handleError("Failed to update partner", err);
    } finally {
      setIsUpdating(false);
    }
  }, [editingPartner, partnerForm, resetPartnerForm, fetchPartners, handleError, toast]);

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
        fetchCollaborations(selectedEvent.id);
      }
      
    } catch (err) {
      handleError("Failed to create collaboration", err);
    } finally {
      setIsCreating(false);
    }
  }, [collaborationForm, resetCollaborationForm, selectedEvent, fetchCollaborations, handleError, toast]);

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
      } else if (selectedEvent) {
        fetchCollaborations(selectedEvent.id);
      }
      
    } catch (err) {
      handleError(`Failed to delete ${itemToDelete.type}`, err);
    } finally {
      setIsDeleting(false);
    }
  }, [itemToDelete, collaborations, selectedEvent, fetchPartners, fetchCollaborations, handleError, toast]);

  // --- Effects ---
  useEffect(() => {
    fetchPartners();
    fetchEvents();
  }, [fetchPartners, fetchEvents]);

  useEffect(() => {
    if (activeTab === 'collaborations' && selectedEvent) {
      fetchCollaborations(selectedEvent.id);
    }
  }, [activeTab, selectedEvent, fetchCollaborations]);

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
    setIsPartnerDialogOpen(true);
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
                  <Dialog open={isPartnerDialogOpen} onOpenChange={setIsPartnerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={resetPartnerForm}
                        className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Partner
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] dark:bg-gray-800 dark:border-gray-700">
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
                        <div className="space-y-2">
                          <Label htmlFor="logo_url" className="dark:text-gray-200 text-gray-800">
                            Logo URL
                          </Label>
                          <Input
                            id="logo_url"
                            value={partnerForm.logo_url}
                            onChange={(e) => setPartnerForm(prev => ({ ...prev, logo_url: e.target.value }))}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            placeholder="https://company.com/logo.png"
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
                    <Dialog open={isPartnerDialogOpen} onOpenChange={setIsPartnerDialogOpen}>
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
                            "shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer",
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
                      }}
                    >
                      <SelectTrigger className="w-full md:w-[250px] dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id.toString()}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedEvent && (
                      <Dialog open={isCollaborationDialogOpen} onOpenChange={setIsCollaborationDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            onClick={resetCollaborationForm}
                            className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Collaboration
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] dark:bg-gray-800 dark:border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="dark:text-gray-200 text-gray-800">
                              Add Event Collaboration
                            </DialogTitle>
                            <DialogDescription className="dark:text-gray-400 text-gray-600">
                              Add a partner collaboration to {selectedEvent.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
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
                                      {partner.company_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

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
                              onClick={createCollaboration}
                              disabled={isCreating || !collaborationForm.partner_id}
                              className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] text-white"
                            >
                              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Add Collaboration
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
                    <Dialog open={isCollaborationDialogOpen} onOpenChange={setIsCollaborationDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={resetCollaborationForm}
                          className="bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Collaboration
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {collaborations.length} collaboration{collaborations.length !== 1 ? 's' : ''} for {selectedEvent.name}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {collaborations.map((collaboration) => {
                        const collaborationType = COLLABORATION_TYPES.find(t => t.value === collaboration.collaboration_type);
                        const CollabIcon = collaborationType?.icon || Handshake;
                        
                        return (
                          <Card 
                            key={collaboration.id} 
                            className={cn(
                              "shadow-md hover:shadow-lg transition-all duration-300",
                              "dark:bg-gray-700 dark:border-gray-600 bg-white border-gray-200",
                              !collaboration.is_active && "opacity-60 border-dashed"
                            )}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <CollabIcon className={cn("h-6 w-6", collaborationType?.color || "text-gray-500")} />
                                  <div>
                                    <CardTitle className="text-lg dark:text-gray-200 text-gray-800">
                                      {collaboration.partner_name || `Partner ${collaboration.partner_id}`}
                                    </CardTitle>
                                    <CardDescription className="dark:text-gray-400 text-gray-600">
                                      {collaborationType?.label || collaboration.collaboration_type}
                                    </CardDescription>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {collaboration.show_on_event_page ? (
                                    <Eye className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  )}
                                  <span className="text-xs text-gray-500">
                                    Order: {collaboration.display_order}
                                  </span>
                                </div>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="space-y-4">
                              {collaboration.description && (
                                <p className="text-sm dark:text-gray-300 text-gray-700">
                                  {collaboration.description}
                                </p>
                              )}

                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Created: {new Date(collaboration.created_at).toLocaleDateString()}
                              </div>

                              {!collaboration.is_active && (
                                <div className="text-xs text-red-500 font-medium">
                                  Inactive Collaboration
                                </div>
                              )}

                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteConfirm('collaboration', collaboration.id)}
                                  className="flex-1 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 bg-red-50 text-red-600 hover:bg-red-100"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-200 text-gray-800">
                Confirm {itemToDelete?.type === 'partner' ? 'Partner Deactivation' : 'Collaboration Removal'}
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400 text-gray-600">
                {itemToDelete?.type === 'partner' 
                  ? 'This will deactivate the partner and all their active collaborations. This action can be reversed.'
                  : 'This will remove the collaboration from the event. This action cannot be undone.'
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
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
                type="button"
                onClick={deleteItem}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {itemToDelete?.type === 'partner' ? 'Deactivate' : 'Remove'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OrganizerPartnership;