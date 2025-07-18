// Import Section
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Globe,
  Users,
  FileSpreadsheet,
  File,
  Search,
  Settings,
  DollarSign,
  Calendar,
  MapPin,
  TrendingUp,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";

// Interface Definitions Section
interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

interface Organizer {
  organizer_id: number;
  name: string;
  email: string;
  phone: string;
  event_count: number;
  metrics: {
    total_tickets_sold: number;
    total_revenue: number;
    total_attendees: number;
    currency: string;
    currency_symbol: string;
  };
}

interface Event {
  event_id: number;
  name: string;
  event_date: string;
  location: string;
  status: string;
  metrics: {
    tickets_sold: number;
    revenue: number;
    attendees: number;
    currency: string;
    currency_symbol: string;
  };
}

interface ExchangeRates {
  base_currency: string;
  rates: { [key: string]: number };
  source: string;
}

// Component Definition Section
const AdminReports: React.FC = () => {
  // State Definitions Section
  const { toast } = useToast();
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  
  // Enhanced selection states
  const [selectedOrganizers, setSelectedOrganizers] = useState<Set<string>>(new Set());
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [selectAllOrganizers, setSelectAllOrganizers] = useState<boolean>(false);
  const [selectAllEvents, setSelectAllEvents] = useState<boolean>(false);
  const [isOrganizersExpanded, setIsOrganizersExpanded] = useState<boolean>(true);
  const [isEventsExpanded, setIsEventsExpanded] = useState<boolean>(true);
  
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [targetCurrencyId, setTargetCurrencyId] = useState<number | null>(null);
  const [reportFormat, setReportFormat] = useState<string>('csv');
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  const [useLatestRates, setUseLatestRates] = useState<boolean>(true);
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState<boolean>(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState<boolean>(false);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [organizerSearch, setOrganizerSearch] = useState<string>('');
  const [eventSearch, setEventSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Filtering Logic Section (moved before useEffect hooks)
  const filteredOrganizers = organizers.filter(org =>
    org.name?.toLowerCase().includes(organizerSearch.toLowerCase()) ||
    org.email?.toLowerCase().includes(organizerSearch.toLowerCase())
  );

  const filteredEvents = events.filter(event => {
    const nameMatch = event.name && event.name.toLowerCase().includes(eventSearch.toLowerCase());
    const locationMatch = event.location && event.location.toLowerCase().includes(eventSearch.toLowerCase());
    return nameMatch || locationMatch;
  });

  // Utility Functions Section
  const handleError = useCallback((message: string, err?: any) => {
    console.error('Operation error:', message, err);
    setError(message);
    toast({
      title: "Error",
      description: err?.message || message,
      variant: "destructive",
    });
  }, [toast]);

  const showSuccess = useCallback((message: string) => {
    console.log('Success:', message);
    setError(null);
    toast({
      title: "Success",
      description: message,
      variant: "default",
    });
  }, [toast]);

  const safeExtractArray = (data: any, key: string, fallback: any[] = []): any[] => {
    if (!data) return fallback;
    if (data[key] && Array.isArray(data[key])) {
      return data[key];
    }
    if (Array.isArray(data)) {
      return data;
    }
    if (typeof data === 'object' && Object.keys(data).length > 0) {
      const firstKey = Object.keys(data)[0];
      if (Array.isArray(data[firstKey])) {
        return data[firstKey];
      }
    }
    return fallback;
  };

  // Selection Management Functions
  const handleOrganizerSelection = useCallback((organizerId: string, checked: boolean) => {
    setSelectedOrganizers(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(organizerId);
      } else {
        newSet.delete(organizerId);
        setSelectAllOrganizers(false);
      }
      return newSet;
    });
  }, []);

  const handleEventSelection = useCallback((eventId: string, checked: boolean) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(eventId);
      } else {
        newSet.delete(eventId);
        setSelectAllEvents(false);
      }
      return newSet;
    });
  }, []);

  const handleSelectAllOrganizers = useCallback((checked: boolean) => {
    setSelectAllOrganizers(checked);
    if (checked) {
      setSelectedOrganizers(new Set(filteredOrganizers.map(org => org.organizer_id.toString())));
    } else {
      setSelectedOrganizers(new Set());
    }
  }, [filteredOrganizers]);

  const handleSelectAllEvents = useCallback((checked: boolean) => {
    setSelectAllEvents(checked);
    if (checked) {
      setSelectedEvents(new Set(filteredEvents.map(event => event.event_id.toString())));
    } else {
      setSelectedEvents(new Set());
    }
  }, [filteredEvents]);

  const clearSelection = useCallback((type: 'organizers' | 'events') => {
    if (type === 'organizers') {
      setSelectedOrganizers(new Set());
      setSelectAllOrganizers(false);
    } else {
      setSelectedEvents(new Set());
      setSelectAllEvents(false);
    }
  }, []);

  // Data Fetching Functions Section
  const fetchOrganizers = useCallback(async () => {
    setIsLoadingOrganizers(true);
    try {
      const url = `${import.meta.env.VITE_API_URL}/admin/organizers`;
      const params = new URLSearchParams();
      if (targetCurrencyId) {
        params.append('currency_id', targetCurrencyId.toString());
      }
      const response = await fetch(`${url}${params.toString() ? `?${params.toString()}` : ''}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        handleError(errorData.message || "Failed to fetch organizers.", errorData);
        return;
      }
      const data = await response.json();
      console.log('Organizers API response:', data);
      const organizersArray = safeExtractArray(data, 'organizers', []);
      setOrganizers(organizersArray);
      showSuccess(`Loaded ${organizersArray.length} organizers successfully`);
    } catch (err) {
      handleError('Failed to fetch organizers', err);
      setOrganizers([]);
    } finally {
      setIsLoadingOrganizers(false);
    }
  }, [handleError, showSuccess, targetCurrencyId]);

  const fetchEvents = useCallback(async (organizerIds: string[]) => {
    if (organizerIds.length === 0) return;
    setIsLoadingEvents(true);
    try {
      const url = `${import.meta.env.VITE_API_URL}/admin/events`;
      const params = new URLSearchParams();
      organizerIds.forEach(id => params.append('organizer_ids', id));
      if (targetCurrencyId) {
        params.append('currency_id', targetCurrencyId.toString());
      }
      const response = await fetch(`${url}?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        handleError(errorData.message || "Failed to fetch events.", errorData);
        return;
      }
      const data = await response.json();
      console.log('Events API response:', data);
      const eventsArray = safeExtractArray(data, 'events', []);
      setEvents(eventsArray);
      showSuccess(`Loaded ${eventsArray.length} events successfully`);
    } catch (err) {
      handleError('Failed to fetch events', err);
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [handleError, showSuccess, targetCurrencyId]);

  const fetchCurrencies = useCallback(async () => {
    setIsLoadingCurrencies(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/list`, {
        credentials: 'include'
      });
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        handleError(errorData.message || "Failed to fetch currencies.", errorData);
        return;
      }
      const data = await response.json();
      console.log('Currencies API response:', data);
      const currenciesArray = safeExtractArray(data, 'data', []);
      setCurrencies(currenciesArray);
      if (!selectedCurrency && currenciesArray.length > 0) {
        const kesCurrency = currenciesArray.find((c: Currency) => c.code === 'KES');
        const usdCurrency = currenciesArray.find((c: Currency) => c.code === 'USD');
        const defaultCurrency = kesCurrency || usdCurrency || currenciesArray[0];
        if (defaultCurrency) {
          setSelectedCurrency(defaultCurrency.code);
          setTargetCurrencyId(defaultCurrency.id);
        }
      }
      showSuccess('Currencies loaded successfully');
    } catch (err) {
      handleError('Failed to fetch currencies', err);
      setCurrencies([]);
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, [handleError, showSuccess, selectedCurrency]);

  const fetchExchangeRates = useCallback(async (baseCurrency: string = 'USD') => {
    setIsLoadingRates(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currency/latest?base=${baseCurrency}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        handleError(errorData.message || "Failed to fetch exchange rates.", errorData);
        return;
      }
      const data = await response.json();
      console.log('Exchange rates API response:', data);
      let ratesData = null;
      if (data && data.data) {
        ratesData = data.data;
      } else if (data && data.rates) {
        ratesData = data;
      }
      setExchangeRates(ratesData);
      showSuccess(`Exchange rates updated for ${baseCurrency}`);
    } catch (err) {
      handleError('Failed to fetch exchange rates', err);
      setExchangeRates(null);
    } finally {
      setIsLoadingRates(false);
    }
  }, [handleError, showSuccess]);

  const generateReport = useCallback(async () => {
    if (selectedOrganizers.size === 0) {
      handleError('Please select at least one organizer');
      return;
    }
    setIsDownloading(true);
    try {
      const params = new URLSearchParams();
      selectedOrganizers.forEach(id => params.append('organizer_ids', id));
      if (selectedEvents.size > 0) {
        selectedEvents.forEach(id => params.append('event_ids', id));
      }
      params.append('format', reportFormat);
      if (targetCurrencyId) {
        params.append('currency_id', targetCurrencyId.toString());
      }
      params.append('include_charts', includeCharts.toString());
      params.append('use_latest_rates', useLatestRates.toString());
      params.append('send_email', sendEmail.toString());
      if (recipientEmail) {
        params.append('recipient_email', recipientEmail);
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        handleError(errorData.message || "Failed to generate report.", errorData);
        return;
      }
      if (response.headers.get('content-type')?.includes('application/json')) {
        const jsonData = await response.json();
        if (jsonData.email_status === 'sent') {
          showSuccess(`Report generated and emailed to ${jsonData.email_recipient}`);
        } else if (jsonData.email_status === 'failed') {
          showSuccess('Report generated but email delivery failed');
        }
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const selectedCount = selectedOrganizers.size;
      const eventCount = selectedEvents.size;
      const fileName = `admin_report_${selectedCount}orgs${eventCount > 0 ? `_${eventCount}events` : ''}_${new Date().toISOString().split('T')[0]}.${reportFormat}`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showSuccess(`${reportFormat.toUpperCase()} report generated and downloaded successfully`);
    } catch (err) {
      handleError('Failed to generate report', err);
    } finally {
      setIsDownloading(false);
    }
  }, [selectedOrganizers, selectedEvents, reportFormat, targetCurrencyId, includeCharts, useLatestRates, sendEmail, recipientEmail, handleError, showSuccess]);

  // useEffect Hooks Section
  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  useEffect(() => {
    if (currencies.length > 0) {
      fetchOrganizers();
    }
  }, [fetchOrganizers, currencies.length]);

  useEffect(() => {
    if (selectedOrganizers.size > 0) {
      fetchEvents(Array.from(selectedOrganizers));
    } else {
      setEvents([]);
      setSelectedEvents(new Set());
    }
  }, [selectedOrganizers, fetchEvents]);

  useEffect(() => {
    if (selectedCurrency && selectedCurrency !== 'USD') {
      fetchExchangeRates('USD');
    }
  }, [selectedCurrency, fetchExchangeRates]);

  useEffect(() => {
    if (selectedCurrency) {
      const currency = currencies.find(c => c.code === selectedCurrency);
      if (currency) {
        setTargetCurrencyId(currency.id);
      }
    }
  }, [selectedCurrency, currencies]);

  useEffect(() => {
    if (targetCurrencyId && organizers.length > 0) {
      fetchOrganizers();
    }
  }, [targetCurrencyId, fetchOrganizers]);

  // Update select all states based on current selections
  useEffect(() => {
    const filteredOrganizerIds = filteredOrganizers.map(org => org.organizer_id.toString());
    const allFilteredSelected = filteredOrganizerIds.length > 0 && 
      filteredOrganizerIds.every(id => selectedOrganizers.has(id));
    setSelectAllOrganizers(allFilteredSelected);
  }, [selectedOrganizers, filteredOrganizers]);

  useEffect(() => {
    const filteredEventIds = filteredEvents.map(event => event.event_id.toString());
    const allFilteredSelected = filteredEventIds.length > 0 && 
      filteredEventIds.every(id => selectedEvents.has(id));
    setSelectAllEvents(allFilteredSelected);
  }, [selectedEvents, filteredEvents]);

 // Playful dots animation
if (isLoadingCurrencies || (isLoadingOrganizers && organizers.length === 0)) {
  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 bg-gray-50">
      <div className="text-center">
        <div className="flex justify-center space-x-2 mb-4">
          <div className="w-3 h-3 bg-[#10b981] rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-[#10b981] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-3 h-3 bg-[#10b981] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Loading initial data...</p>
      </div>
    </div>
  );
}


  // Main Render Section
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 dark:bg-gray-900 dark:text-gray-200 bg-gray-50 text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-[#10b981] dark:text-[#10b981]">
            Admin Reports Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate comprehensive reports for organizers and events
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardContent className="flex items-center space-x-2 p-4">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Selection */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Organizers Selection */}
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setIsOrganizersExpanded(!isOrganizersExpanded)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-[#10b981]" />
                    <span>Select Organizers</span>
                    <Badge variant="secondary" className="ml-2">
                      {selectedOrganizers.size} selected
                    </Badge>
                  </div>
                  {isOrganizersExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CardHeader>
              
              {isOrganizersExpanded && (
                <CardContent className="space-y-4">
                  {/* Search and Controls */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search organizers..."
                        value={organizerSearch}
                        onChange={(e) => setOrganizerSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all-organizers"
                        checked={selectAllOrganizers}
                        onCheckedChange={handleSelectAllOrganizers}
                      />
                      <Label htmlFor="select-all-organizers" className="text-sm font-medium">
                        Select All
                      </Label>
                      {selectedOrganizers.size > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearSelection('organizers')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Organizers List */}
                  <div className="max-h-96 overflow-y-auto border rounded-lg p-4 space-y-3">
                    {isLoadingOrganizers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#10b981]" />
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading organizers...</span>
                      </div>
                    ) : filteredOrganizers.length > 0 ? (
                      filteredOrganizers.map((organizer) => (
                        <div
                          key={organizer.organizer_id}
                          className={cn(
                            "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                            selectedOrganizers.has(organizer.organizer_id.toString())
                              ? "bg-[#10b981]/10 border-[#10b981]/30"
                              : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                          )}
                        >
                          <Checkbox
                            id={`organizer-${organizer.organizer_id}`}
                            checked={selectedOrganizers.has(organizer.organizer_id.toString())}
                            onCheckedChange={(checked) => 
                              handleOrganizerSelection(organizer.organizer_id.toString(), checked as boolean)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium truncate">{organizer.name}</h4>
                              <Badge variant="outline" className="ml-2">
                                {organizer.event_count} events
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {organizer.email}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {organizer.metrics?.currency_symbol || '$'}
                                {organizer.metrics?.total_revenue?.toLocaleString() || '0'}
                              </span>
                              <span className="flex items-center">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {organizer.metrics?.total_tickets_sold?.toLocaleString() || '0'} tickets
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No organizers found matching your search.
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Events Selection */}
            {selectedOrganizers.size > 0 && (
              <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setIsEventsExpanded(!isEventsExpanded)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-[#10b981]" />
                      <span>Select Events (Optional)</span>
                      <Badge variant="secondary" className="ml-2">
                        {selectedEvents.size} selected
                      </Badge>
                    </div>
                    {isEventsExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CardTitle>
                </CardHeader>
                
                {isEventsExpanded && (
                  <CardContent className="space-y-4">
                    {/* Search and Controls */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search events..."
                          value={eventSearch}
                          onChange={(e) => setEventSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select-all-events"
                          checked={selectAllEvents}
                          onCheckedChange={handleSelectAllEvents}
                        />
                        <Label htmlFor="select-all-events" className="text-sm font-medium">
                          Select All
                        </Label>
                        {selectedEvents.size > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => clearSelection('events')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Events List */}
                    <div className="max-h-96 overflow-y-auto border rounded-lg p-4 space-y-3">
                      {isLoadingEvents ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-[#10b981]" />
                          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading events...</span>
                        </div>
                      ) : filteredEvents.length > 0 ? (
                        filteredEvents.map((event) => (
                          <div
                            key={event.event_id}
                            className={cn(
                              "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                              selectedEvents.has(event.event_id.toString())
                                ? "bg-[#10b981]/10 border-[#10b981]/30"
                                : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                            )}
                          >
                            <Checkbox
                              id={`event-${event.event_id}`}
                              checked={selectedEvents.has(event.event_id.toString())}
                              onCheckedChange={(checked) => 
                                handleEventSelection(event.event_id.toString(), checked as boolean)
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium truncate">{event.name}</h4>
                                <Badge 
                                  variant={event.status === 'active' ? 'default' : 'secondary'}
                                  className="ml-2"
                                >
                                  {event.status}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{event.location}</span>
                              </div>
                              <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(event.event_date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <DollarSign className="h-3 w-3 mr-1" />
                            {event.metrics?.currency_symbol || ''}
                            {event.metrics?.revenue?.toLocaleString() || '0'}
                                </span>
                                <span className="flex items-center">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  {event.metrics?.tickets_sold?.toLocaleString() || '0'} tickets
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          {selectedOrganizers.size > 0 
                            ? "No events found for selected organizers." 
                            : "Select organizers to view their events."
                          }
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>

          {/* Right Column - Configuration */}
          <div className="space-y-6">
            
            {/* Report Configuration */}
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-[#10b981]" />
                  <span>Report Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Currency Selection */}
                <div className="space-y-2">
                  <Label htmlFor="currency-select">Currency</Label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger id="currency-select">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.code}>
                          <div className="flex items-center space-x-2">
                            <span>{currency.symbol}</span>
                            <span>{currency.code}</span>
                            <span className="text-gray-500">- {currency.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Report Format */}
                <div className="space-y-2">
                  <Label htmlFor="format-select">Report Format</Label>
                  <Select value={reportFormat} onValueChange={setReportFormat}>
                    <SelectTrigger id="format-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">
                        <div className="flex items-center space-x-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>CSV</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="pdf">
                        <div className="flex items-center space-x-2">
                          <File className="h-4 w-4" />
                          <span>PDF</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="excel">
                        <div className="flex items-center space-x-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>Excel</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-charts" className="text-sm font-medium">
                      Include Charts
                    </Label>
                    <Switch
                      id="include-charts"
                      checked={includeCharts}
                      onCheckedChange={setIncludeCharts}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="latest-rates" className="text-sm font-medium">
                      Use Latest Exchange Rates
                    </Label>
                    <Switch
                      id="latest-rates"
                      checked={useLatestRates}
                      onCheckedChange={setUseLatestRates}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="send-email" className="text-sm font-medium">
                      Send via Email
                    </Label>
                    <Switch
                      id="send-email"
                      checked={sendEmail}
                      onCheckedChange={setSendEmail}
                    />
                  </div>

                  {sendEmail && (
                    <div className="space-y-2">
                      <Label htmlFor="recipient-email">Recipient Email</Label>
                      <Input
                        id="recipient-email"
                        type="email"
                        placeholder="email@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Exchange Rate Info */}
            {exchangeRates && (
              <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-[#10b981]" />
                    <span>Exchange Rates</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchExchangeRates(selectedCurrency)}
                      disabled={isLoadingRates}
                    >
                      {isLoadingRates ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Currency:</span>
                      <span className="font-medium">{exchangeRates.base_currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Source:</span>
                      <span className="font-medium">{exchangeRates.source}</span>
                    </div>
                    {selectedCurrency && selectedCurrency !== exchangeRates.base_currency && (
                      <div className="flex justify-between">
                        <span>1 {exchangeRates.base_currency} =</span>
                        <span className="font-medium">
                          {exchangeRates.rates[selectedCurrency]?.toFixed(4) || 'N/A'} {selectedCurrency}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-[#10b981]" />
                  <span>Selection Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Organizers:</span>
                    <Badge variant="outline">
                      {selectedOrganizers.size}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Events:</span>
                    <Badge variant="outline">
                      {selectedEvents.size > 0 ? selectedEvents.size : 'All'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Currency:</span>
                    <Badge variant="outline">
                      {selectedCurrency}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Format:</span>
                    <Badge variant="outline">
                      {reportFormat.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Report Button */}
            <Button
              onClick={generateReport}
              disabled={selectedOrganizers.size === 0 || isDownloading}
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white"
              size="lg"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;