import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Loader2, Plus, Users, Handshake, TrendingUp, AlertCircle, CheckCircle, 
  Sparkles, RefreshCw, Lightbulb, Info, X, HelpCircle, BarChart3, Target, 
  FileText, Search, Filter, Eye, Edit, Trash2, Activity, Calendar, Building, 
  Mail, Phone, Globe, Star, ArrowUp, ArrowDown, MoreHorizontal, Send
} from 'lucide-react';
import { cn } from "@/lib/utils";

// Type definitions
interface Partner {
  id: number;
  company_name: string;
  company_description?: string;
  website_url?: string;
  contact_email?: string;
  contact_person?: string;
  logo_url?: string;
  is_active: boolean;
  performance_score?: number;
  created_at: string;
  updated_at: string;
  organizer_id: number;
  organizer?: {
    id: number;
    company_name: string;
  };
  collaborations_count?: number;
  active_collaborations_count?: number;
  latest_ai_insight?: {
    insight_type: string;
    priority: string;
    title: string;
    confidence_score: number;
  };
  ai_description_enhanced?: boolean;
  ai_suggested_keywords?: string[];
}

interface Collaboration {
  id: number;
  partner_id: number;
  event_id: number;
  collaboration_type: string;
  contribution_score?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  partner?: {
    id: number;
    company_name: string;
  };
  event?: {
    id: number;
    name: string;
    date?: string;
    organizer?: {
      company_name: string;
    };
  };
  ai_flag?: {
    type: string;
    message: string;
    action?: string;
  };
}

interface Analytics {
  total_partners: number;
  active_partners: number;
  inactive_partners: number;
  total_collaborations: number;
  active_collaborations: number;
  avg_collaborations_per_partner: number;
  avg_performance_score: number;
  collaboration_type_distribution: Record<string, number>;
  top_performers: Array<{
    id: number;
    company_name: string;
    performance_score: number;
    organizer?: string;
  }>;
  organizer_breakdown: Array<{
    organizer_id: number;
    organizer_name: string;
    partner_count: number;
    avg_performance: number;
  }>;
  platform_health?: {
    overall_health_score: number;
    status: string;
    message: string;
    metrics: {
      partner_utilization: number;
      collaboration_health: number;
      active_partners: number;
      partners_with_active_collabs: number;
      healthy_collaborations: number;
      total_collaborations: number;
    };
  };
  growth_predictions?: {
    historical_data: Array<{
      month: number;
      partners: number;
      collaborations: number;
    }>;
    trend_direction: string;
    predictions_next_month: {
      new_partners: number;
      new_collaborations: number;
    };
    confidence: string;
  };
  quality_metrics?: {
    overall_quality_score: number;
    completeness_metrics: {
      with_description: number;
      with_contact_info: number;
      with_logo: number;
      with_website: number;
    };
    ai_enhancement: {
      ai_enhanced_count: number;
      ai_enhancement_rate: number;
    };
    quality_grade: string;
  };
  strategic_recommendations?: Array<{
    priority: string;
    area: string;
    recommendation: string;
    expected_impact: string;
  }>;
}

interface PlatformInsights {
  total_active_partners: number;
  partners_per_organizer: number;
  new_partners_last_month: number;
  new_collaborations_last_month: number;
  high_performers_count: number;
  low_performers_count: number;
  health_score: number;
}

interface AIQuery {
  query: string;
  response?: any;
  isProcessing?: boolean;
}

interface AdminPartnerManagementProps {
  // API functions would be passed as props
  getPartnersOverview: (params?: any) => Promise<{ 
    partners: Partner[]; 
    total: number; 
    pages: number; 
    current_page: number; 
    has_next: boolean; 
    has_prev: boolean; 
    per_page: number;
    platform_insights?: PlatformInsights 
  }>;
  getPartnerDetail: (partnerId: number) => Promise<{ partner: Partner }>;
  getCollaborationsOverview: (params?: any) => Promise<{ 
    collaborations: Collaboration[]; 
    total: number; 
    pages: number; 
    current_page: number; 
    has_next: boolean; 
    has_prev: boolean; 
    per_page: number;
    collaboration_insights?: any 
  }>;
  getEventCollaborations: (eventId: number) => Promise<{ event: any; collaborations: Collaboration[]; total: number; ai_suggested_partners?: any; optimization_opportunities?: any }>;
  getRecentCollaborations: () => Promise<{ recent_collaborations: Collaboration[]; recent_trends?: any }>;
  getInactiveOverview: () => Promise<{ inactive_partners: Partner[]; inactive_collaborations: Collaboration[]; totals: { inactive_partners: number; inactive_collaborations: number }; ai_reactivation_candidates?: any; deactivation_insights?: any }>;
  getPartnershipAnalytics: () => Promise<{ analytics: Analytics }>;
  processAIQuery: (query: string) => Promise<any>;
  analyzePartner: (partnerId: number) => Promise<any>;
  qualityAudit: (organizerId?: number) => Promise<any>;
  getPlatformTrends: () => Promise<any>;
  bulkAnalyzePartners: (organizerId?: number) => Promise<any>;
  optimizeCollaboration: (collaborationId?: number) => Promise<any>;
  updatePartner: (partnerId: number, data: any) => Promise<any>;
  deletePartner: (partnerId: number) => Promise<any>;
  isLoading?: boolean;
  error?: string;
  successMessage?: string;
}

const AdminPartnerManagement: React.FC<AdminPartnerManagementProps> = ({
  getPartnersOverview,
  getPartnerDetail,
  getCollaborationsOverview,
  getEventCollaborations,
  getRecentCollaborations,
  getInactiveOverview,
  getPartnershipAnalytics,
  processAIQuery,
  analyzePartner,
  qualityAudit,
  getPlatformTrends,
  bulkAnalyzePartners,
  optimizeCollaboration,
  updatePartner,
  deletePartner,
  isLoading = false,
  error,
  successMessage
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('partners');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [platformInsights, setPlatformInsights] = useState<PlatformInsights | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedCollaboration, setSelectedCollaboration] = useState<Collaboration | null>(null);
  const [partnerDetail, setPartnerDetail] = useState<any>(null);
  const [eventCollaborations, setEventCollaborations] = useState<any>(null);
  const [recentCollaborations, setRecentCollaborations] = useState<Collaboration[]>([]);
  const [recentTrends, setRecentTrends] = useState<any>(null);
  const [inactiveOverview, setInactiveOverview] = useState<any>(null);
  const [platformTrends, setPlatformTrends] = useState<any>(null);
  const [bulkAnalysis, setBulkAnalysis] = useState<any>(null);
  const [qualityAuditResults, setQualityAuditResults] = useState<any>(null);
  const [aiQuery, setAiQuery] = useState<AIQuery>({ query: '' });
  const [aiQueryHistory, setAiQueryHistory] = useState<AIQuery[]>([]);
  const [showPartnerDetail, setShowPartnerDetail] = useState(false);
  const [showCollaborationDetail, setShowCollaborationDetail] = useState(false);
  const [showEventCollaborations, setShowEventCollaborations] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showQualityAudit, setShowQualityAudit] = useState(false);
  const [showBulkAnalysis, setShowBulkAnalysis] = useState(false);
  const [showPlatformTrends, setShowPlatformTrends] = useState(false);
  const [showOptimizeDialog, setShowOptimizeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<number | null>(null);
  const [collaborationToOptimize, setCollaborationToOptimize] = useState<number | null>(null);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [pagination, setPagination] = useState({
    partners: { page: 1, perPage: 12, totalPages: 1, hasNext: false, hasPrev: false },
    collaborations: { page: 1, perPage: 12, totalPages: 1, hasNext: false, hasPrev: false }
  });
  const [filters, setFilters] = useState({
    partners: {
      search: '',
      organizerId: '',
      minPerformance: '',
      sortBy: 'id',
      order: 'asc'
    },
    collaborations: {
      search: '',
      status: 'all',
      collaborationType: 'all',
      sortBy: 'id',
      order: 'asc'
    }
  });
  const [showGuide, setShowGuide] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Load data on component mount and tab change
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Load data based on active tab
  const loadData = async () => {
    try {
      switch (activeTab) {
        case 'partners':
          await loadPartners();
          break;
        case 'collaborations':
          await loadCollaborations();
          break;
        case 'analytics':
          await loadAnalytics();
          break;
        case 'recent':
          await loadRecentCollaborations();
          break;
        case 'inactive':
          await loadInactiveOverview();
          break;
        case 'ai':
          // AI tab doesn't load data by default
          break;
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  // Load partners
  const loadPartners = async (page = 1) => {
    try {
      const params = {
        page,
        per_page: pagination.partners.perPage,
        sort_by: filters.partners.sortBy,
        order: filters.partners.order,
        search: filters.partners.search || undefined,
        organizer_id: filters.partners.organizerId ? parseInt(filters.partners.organizerId) : undefined,
        min_performance: filters.partners.minPerformance ? parseFloat(filters.partners.minPerformance) : undefined,
        include_ai_insights: true
      };

      const response = await getPartnersOverview(params);
      setPartners(response.partners);
      setPlatformInsights(response.platform_insights || null);
      setPagination(prev => ({
        ...prev,
        partners: {
          page: response.current_page,
          perPage: response.per_page,
          totalPages: response.pages,
          hasNext: response.has_next,
          hasPrev: response.has_prev
        }
      }));
    } catch (err) {
      console.error('Error loading partners:', err);
    }
  };

  // Load collaborations
  const loadCollaborations = async (page = 1) => {
    try {
      const params = {
        page,
        per_page: pagination.collaborations.perPage,
        sort_by: filters.collaborations.sortBy,
        order: filters.collaborations.order,
        status: filters.collaborations.status !== 'all' ? filters.collaborations.status : undefined,
        collaboration_type: filters.collaborations.collaborationType !== 'all' ? filters.collaborations.collaborationType : undefined,
        include_ai_insights: true
      };

      const response = await getCollaborationsOverview(params);
      setCollaborations(response.collaborations);
      setPagination(prev => ({
        ...prev,
        collaborations: {
          page: response.current_page,
          perPage: response.per_page,
          totalPages: response.pages,
          hasNext: response.has_next,
          hasPrev: response.has_prev
        }
      }));
    } catch (err) {
      console.error('Error loading collaborations:', err);
    }
  };

  // Load analytics
  const loadAnalytics = async () => {
    try {
      const response = await getPartnershipAnalytics();
      setAnalytics(response.analytics);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  // Load recent collaborations
  const loadRecentCollaborations = async () => {
    try {
      const response = await getRecentCollaborations();
      setRecentCollaborations(response.recent_collaborations);
      setRecentTrends(response.recent_trends || null);
    } catch (err) {
      console.error('Error loading recent collaborations:', err);
    }
  };

  // Load inactive overview
  const loadInactiveOverview = async () => {
    try {
      const response = await getInactiveOverview();
      setInactiveOverview(response);
    } catch (err) {
      console.error('Error loading inactive overview:', err);
    }
  };

  // Load partner detail
  const loadPartnerDetail = async (partnerId: number) => {
    try {
      const response = await getPartnerDetail(partnerId);
      setPartnerDetail(response.partner);
      setSelectedPartner(response.partner);
      setShowPartnerDetail(true);
    } catch (err) {
      console.error('Error loading partner detail:', err);
    }
  };

  // Load event collaborations
  const loadEventCollaborations = async (eventId: number) => {
    try {
      const response = await getEventCollaborations(eventId);
      setEventCollaborations(response);
      setShowEventCollaborations(true);
    } catch (err) {
      console.error('Error loading event collaborations:', err);
    }
  };

  // Process AI query
  const processQuery = async () => {
    if (!aiQuery.query.trim()) return;

    const newQuery = { ...aiQuery, isProcessing: true };
    setAiQuery(newQuery);
    setAiQueryHistory(prev => [...prev, newQuery]);

    try {
      const response = await processAIQuery(aiQuery.query);
      setAiQueryHistory(prev => 
        prev.map(q => q === newQuery ? { ...q, response, isProcessing: false } : q)
      );
      setAiQuery({ query: '' });
    } catch (err) {
      setAiQueryHistory(prev => 
        prev.map(q => q === newQuery ? { ...q, response: { error: 'Failed to process query' }, isProcessing: false } : q)
      );
    }
  };

  // Analyze partner with AI
  const analyzePartnerWithAI = async (partnerId: number) => {
    try {
      const response = await analyzePartner(partnerId);
      if (response.analysis) {
        // Update partner detail with new analysis
        if (partnerDetail && partnerDetail.id === partnerId) {
          setPartnerDetail({
            ...partnerDetail,
            ai_performance_analysis: response.analysis,
            benchmark_data: response.analysis.benchmark_data,
            cross_organizer_comparison: response.analysis.cross_organizer_comparison
          });
        }
      }
    } catch (err) {
      console.error('Error analyzing partner:', err);
    }
  };

  // Run quality audit
  const runQualityAudit = async (organizerId?: number) => {
    try {
      const response = await qualityAudit(organizerId);
      setQualityAuditResults(response.audit_results);
      setShowQualityAudit(true);
    } catch (err) {
      console.error('Error running quality audit:', err);
    }
  };

  // Get platform trends
  const getTrends = async () => {
    try {
      const response = await getPlatformTrends();
      setPlatformTrends(response);
      setShowPlatformTrends(true);
    } catch (err) {
      console.error('Error getting platform trends:', err);
    }
  };

  // Run bulk analysis
  const runBulkAnalysis = async (organizerId?: number) => {
    try {
      const response = await bulkAnalyzePartners(organizerId);
      setBulkAnalysis(response.analysis);
      setShowBulkAnalysis(true);
    } catch (err) {
      console.error('Error running bulk analysis:', err);
    }
  };

  // Optimize collaboration
  const optimizeCollab = async (collaborationId?: number) => {
    try {
      const response = await optimizeCollaboration(collaborationId);
      setOptimizationResults(response);
      setShowOptimizeDialog(true);
      
      // Refresh collaborations if we're on that tab
      if (activeTab === 'collaborations') {
        await loadCollaborations(pagination.collaborations.page);
      }
    } catch (err) {
      console.error('Error optimizing collaboration:', err);
    }
  };

  // Delete partner
  const deletePartnerData = async (partnerId: number) => {
    try {
      await deletePartner(partnerId);
      
      // Refresh partners if we're on that tab
      if (activeTab === 'partners') {
        await loadPartners(pagination.partners.page);
      }
      
      // Close detail if it's open
      if (showPartnerDetail && partnerDetail && partnerDetail.id === partnerId) {
        setShowPartnerDetail(false);
        setPartnerDetail(null);
      }
      
      setShowDeleteDialog(false);
      setPartnerToDelete(null);
    } catch (err) {
      console.error('Error deleting partner:', err);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'needs_attention':
        return 'destructive';
      case 'high_performer':
        return 'default';
      default:
        return 'outline';
    }
  };

  // Get performance color
  const getPerformanceColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get performance icon
  const getPerformanceIcon = (score?: number) => {
    if (!score) return null;
    if (score >= 0.8) return <ArrowUp className="w-4 h-4" />;
    if (score >= 0.6) return <TrendingUp className="w-4 h-4" />;
    if (score >= 0.4) return <Activity className="w-4 h-4" />;
    return <ArrowDown className="w-4 h-4" />;
  };

  // Render partner card
  const renderPartnerCard = (partner: Partner) => (
    <Card key={partner.id} className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {partner.logo_url ? (
              <img src={partner.logo_url} alt={partner.company_name} className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                <Building className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{partner.company_name}</CardTitle>
              {partner.organizer && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{partner.organizer.company_name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={partner.is_active ? 'default' : 'secondary'}>
              {partner.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {partner.latest_ai_insight && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {partner.company_description && (
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {partner.company_description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Handshake className="w-4 h-4 text-gray-500" />
              <span>{partner.collaborations_count || 0} Collaborations</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-gray-500" />
              <span>{partner.active_collaborations_count || 0} Active</span>
            </div>
          </div>
          
          {partner.performance_score !== undefined && (
            <div className={`flex items-center gap-1 ${getPerformanceColor(partner.performance_score)}`}>
              {getPerformanceIcon(partner.performance_score)}
              <span className="font-medium">{(partner.performance_score * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Created {formatDate(partner.created_at)}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadPartnerDetail(partner.id)}
              className="h-8 px-2"
            >
              <Eye className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => analyzePartnerWithAI(partner.id)}
              className="h-8 px-2"
            >
              <Sparkles className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setPartnerToDelete(partner.id);
                setShowDeleteDialog(true);
              }}
              className="h-8 px-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render collaboration card
  const renderCollaborationCard = (collaboration: Collaboration) => (
    <Card key={collaboration.id} className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{collaboration.event?.name || 'Unknown Event'}</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {collaboration.partner?.company_name || 'Unknown Partner'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={collaboration.is_active ? 'default' : 'secondary'}>
              {collaboration.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline">{collaboration.collaboration_type}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {collaboration.event?.date && (
          <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(collaboration.event.date)}</span>
          </div>
        )}
        
        {collaboration.event?.organizer && (
          <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
            <Building className="w-4 h-4" />
            <span>{collaboration.event.organizer.company_name}</span>
          </div>
        )}
        
        {collaboration.contribution_score !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Contribution Score</span>
            <div className={`flex items-center gap-1 ${getPerformanceColor(collaboration.contribution_score)}`}>
              {getPerformanceIcon(collaboration.contribution_score)}
              <span className="font-medium">{(collaboration.contribution_score * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
        
        {collaboration.ai_flag && (
          <Alert className={cn(
            "py-2",
            collaboration.ai_flag.type === 'needs_attention' ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20" : 
            collaboration.ai_flag.type === 'high_performer' ? "border-green-200 bg-green-50 dark:bg-green-900/20" : 
            "border-blue-200 bg-blue-50 dark:bg-blue-900/20"
          )}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {collaboration.ai_flag.message}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Created {formatDate(collaboration.created_at)}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadEventCollaborations(collaboration.event_id)}
              className="h-8 px-2"
            >
              <Eye className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCollaborationToOptimize(collaboration.id);
                optimizeCollab(collaboration.id);
              }}
              className="h-8 px-2"
            >
              <Sparkles className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render analytics cards
  const renderAnalyticsCards = () => {
    if (!analytics) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_partners}</div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{analytics.active_partners} active</span>
              <span>•</span>
              <span>{analytics.inactive_partners} inactive</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Collaborations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_collaborations}</div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{analytics.active_collaborations} active</span>
              <span>•</span>
              <span>{analytics.avg_collaborations_per_partner} per partner</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.avg_performance_score * 100).toFixed(0)}%</div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getPerformanceIcon(analytics.avg_performance_score)}
              <span>Platform average</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Platform Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.platform_health ? (analytics.platform_health.overall_health_score).toFixed(0) : 'N/A'}%
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
              {analytics.platform_health && (
                <Badge variant={analytics.platform_health.status === 'excellent' ? 'default' : 
                               analytics.platform_health.status === 'good' ? 'secondary' : 
                               analytics.platform_health.status === 'fair' ? 'outline' : 'destructive'}>
                  {analytics.platform_health.status}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render AI assistant
  const renderAIAssistant = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about partners, collaborations, trends..."
            value={aiQuery.query}
            onChange={(e) => setAiQuery({ ...aiQuery, query: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && processQuery()}
            className="flex-1"
          />
          <Button onClick={processQuery} disabled={!aiQuery.query.trim() || aiQuery.isProcessing}>
            {aiQuery.isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {aiQueryHistory.map((query, index) => (
            <div key={index} className="space-y-2">
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                <p className="text-sm">{query.query}</p>
              </div>
              {query.response && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
                  {query.response.error ? (
                    <p className="text-sm text-red-600">{query.response.error}</p>
                  ) : (
                    <div className="text-sm space-y-2">
                      {query.response.action && (
                        <p className="font-medium">{query.response.action.replace('_', ' ')}</p>
                      )}
                      {query.response.insights && (
                        <div className="space-y-1">
                          {Object.entries(query.response.insights).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize">{key.replace('_', ' ')}:</span>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {query.response.admin_actions && (
                        <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                          <p className="font-medium mb-1">Suggested Actions:</p>
                          <ul className="list-disc list-inside text-xs space-y-1">
                            {Object.entries(query.response.admin_actions).map(([action, description]) => (
                              <li key={action}>{String(description)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick Actions:</p>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" onClick={() => runQualityAudit()}>
              <FileText className="w-3 h-3 mr-1" />
              Quality Audit
            </Button>
            <Button size="sm" variant="outline" onClick={() => getTrends()}>
              <TrendingUp className="w-3 h-3 mr-1" />
              Platform Trends
            </Button>
            <Button size="sm" variant="outline" onClick={() => runBulkAnalysis()}>
              <BarChart3 className="w-3 h-3 mr-1" />
              Bulk Analysis
            </Button>
            <Button size="sm" variant="outline" onClick={() => optimizeCollab()}>
              <Target className="w-3 h-3 mr-1" />
              Optimize All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      
      {/* Quick Guide */}
      {showGuide && (
        <Card className="border-blue-200 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-blue-900 dark:text-blue-100">
                <div className="p-2 rounded-lg bg-blue-500 text-white">
                  <HelpCircle className="w-5 h-5" />
                </div>
                Admin Partner Management Guide
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowGuide(false)}
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">Partners Overview</h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">View all partners across the platform, filter by organizer or performance, and access detailed partner information.</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">Collaborations Management</h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">Monitor all partnerships between events and partners, identify optimization opportunities, and track performance.</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">Analytics & Insights</h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">Access comprehensive analytics, platform health metrics, and AI-powered strategic recommendations.</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">AI Assistant</h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">Use natural language queries to get insights, run quality audits, identify trends, and optimize partnerships.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!showGuide && (
        <Button
          onClick={() => setShowGuide(true)}
          variant="outline"
          size="sm"
          className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Show Guide
        </Button>
      )}
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="partners" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Partners
          </TabsTrigger>
          <TabsTrigger value="collaborations" className="flex items-center gap-2">
            <Handshake className="w-4 h-4" />
            Collaborations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Recent
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-2">
            <X className="w-4 h-4" />
            Inactive
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Assistant
          </TabsTrigger>
        </TabsList>
        
        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Partners Overview</CardTitle>
                <div className="flex items-center gap-2">
                  {platformInsights && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Health: {platformInsights.health_score.toFixed(0)}%
                    </Badge>
                  )}
                  <Button size="sm" variant="outline" onClick={() => runBulkAnalysis()}>
                    <Sparkles className="w-4 h-4 mr-1" />
                    Bulk Analyze
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search partners..."
                      value={filters.partners.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, partners: { ...prev.partners, search: e.target.value } }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={filters.partners.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, partners: { ...prev.partners, sortBy: value } }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">ID</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="active">Status</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="created_at">Created</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.partners.order} onValueChange={(value) => setFilters(prev => ({ ...prev, partners: { ...prev.partners, order: value } }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => loadPartners(1)} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              {isLoading && partners.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {partners.map(renderPartnerCard)}
                </div>
              )}
              
              {partners.length > 0 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {partners.length} of {pagination.partners.totalPages * pagination.partners.perPage} partners
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadPartners(pagination.partners.page - 1)}
                      disabled={!pagination.partners.hasPrev || isLoading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadPartners(pagination.partners.page + 1)}
                      disabled={!pagination.partners.hasNext || isLoading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Collaborations Tab */}
        <TabsContent value="collaborations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collaborations Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search collaborations..."
                      value={filters.collaborations.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, collaborations: { ...prev.collaborations, search: e.target.value } }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={filters.collaborations.status} onValueChange={(value) => setFilters(prev => ({ ...prev, collaborations: { ...prev.collaborations, status: value } }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.collaborations.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, collaborations: { ...prev.collaborations, sortBy: value } }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">ID</SelectItem>
                      <SelectItem value="event_date">Event Date</SelectItem>
                      <SelectItem value="partner_name">Partner Name</SelectItem>
                      <SelectItem value="created_at">Created</SelectItem>
                      <SelectItem value="contribution_score">Contribution</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => loadCollaborations(1)} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              {isLoading && collaborations.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collaborations.map(renderCollaborationCard)}
                </div>
              )}
              
              {collaborations.length > 0 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {collaborations.length} of {pagination.collaborations.totalPages * pagination.collaborations.perPage} collaborations
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadCollaborations(pagination.collaborations.page - 1)}
                      disabled={!pagination.collaborations.hasPrev || isLoading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadCollaborations(pagination.collaborations.page + 1)}
                      disabled={!pagination.collaborations.hasNext || isLoading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {renderAnalyticsCards()}
          
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Partners</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.top_performers.map((partner, index) => (
                      <div key={partner.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{partner.company_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{partner.organizer}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 ${getPerformanceColor(partner.performance_score)}`}>
                          {getPerformanceIcon(partner.performance_score)}
                          <span className="font-medium">{(partner.performance_score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Organizer Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.organizer_breakdown.map((organizer) => (
                      <div key={organizer.organizer_id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{organizer.organizer_name}</p>
                          <Badge variant="outline">{organizer.partner_count} partners</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${organizer.avg_performance * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{(organizer.avg_performance * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        {/* Recent Tab */}
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Collaborations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && recentCollaborations.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCollaborations.map(renderCollaborationCard)}
                  
                  {recentTrends && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Recent Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="font-medium mb-2">Most Common Type</p>
                            <p className="text-2xl font-bold">{recentTrends.most_common_type || 'N/A'}</p>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="font-medium mb-2">Avg Contribution Score</p>
                            <p className="text-2xl font-bold">
                              {recentTrends.avg_contribution_score ? `${(recentTrends.avg_contribution_score * 100).toFixed(0)}%` : 'N/A'}
                            </p>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="font-medium mb-2">Trend Direction</p>
                            <Badge 
                              variant={recentTrends.trend_direction === 'positive' ? 'default' : 'destructive'}
                            >
                              {recentTrends.trend_direction || 'N/A'}
                            </Badge>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="font-medium mb-2">Type Distribution</p>
                            <div className="space-y-1">
                              {Object.entries(recentTrends.type_distribution || {}).map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between text-sm">
                                  <span>{type}</span>
                                  <span>{count as number}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Inactive Tab */}
        <TabsContent value="inactive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inactive Partners & Collaborations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && !inactiveOverview ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : inactiveOverview ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Inactive Partners</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">{inactiveOverview.totals.inactive_partners}</div>
                        <div className="space-y-2">
                          {inactiveOverview.inactive_partners.slice(0, 5).map((partner: Partner) => (
                            <div key={partner.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <span className="text-sm font-medium">{partner.company_name}</span>
                              <Button size="sm" variant="outline" onClick={() => loadPartnerDetail(partner.id)}>
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          {inactiveOverview.inactive_partners.length > 5 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                              And {inactiveOverview.inactive_partners.length - 5} more...
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Inactive Collaborations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">{inactiveOverview.totals.inactive_collaborations}</div>
                        <div className="space-y-2">
                          {inactiveOverview.inactive_collaborations.slice(0, 5).map((collab: Collaboration) => (
                            <div key={collab.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <span className="text-sm font-medium">{collab.event?.name || 'Unknown Event'}</span>
                              <Button size="sm" variant="outline" onClick={() => loadEventCollaborations(collab.event_id)}>
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          {inactiveOverview.inactive_collaborations.length > 5 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                              And {inactiveOverview.inactive_collaborations.length - 5} more...
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {inactiveOverview.ai_reactivation_candidates && inactiveOverview.ai_reactivation_candidates.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-500" />
                          AI Reactivation Candidates
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {inactiveOverview.ai_reactivation_candidates.map((candidate: any, index: number) => (
                            <div key={index} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{candidate.partner_name}</p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{candidate.recommendation}</p>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>Performance Score: {(candidate.performance_score * 100).toFixed(0)}%</span>
                                    <span>Past Collaborations: {candidate.past_collaborations}</span>
                                  </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => loadPartnerDetail(candidate.partner_id)}>
                                  View Details
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No inactive partners or collaborations found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI Assistant Tab */}
        <TabsContent value="ai" className="space-y-4">
          {renderAIAssistant()}
        </TabsContent>
      </Tabs>
      
      {/* Partner Detail Dialog */}
      <Dialog open={showPartnerDetail} onOpenChange={setShowPartnerDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Partner Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about this partner including AI insights and recommendations.
            </DialogDescription>
          </DialogHeader>
          {partnerDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      {partnerDetail.logo_url ? (
                        <img src={partnerDetail.logo_url} alt={partnerDetail.company_name} className="w-16 h-16 rounded object-cover" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <Building className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold">{partnerDetail.company_name}</h3>
                        <Badge variant={partnerDetail.is_active ? 'default' : 'secondary'}>
                          {partnerDetail.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    
                    {partnerDetail.company_description && (
                      <div>
                        <p className="text-sm font-medium mb-1">Description</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{partnerDetail.company_description}</p>
                        {partnerDetail.ai_description_enhanced && (
                          <Badge variant="outline" className="mt-1 flex items-center gap-1 w-fit">
                            <Sparkles className="w-3 h-3" />
                            AI Enhanced
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                      {partnerDetail.website_url && (
                        <div>
                          <p className="text-sm font-medium mb-1">Website</p>
                          <a href={partnerDetail.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            Visit Website
                          </a>
                        </div>
                      )}
                      
                      {partnerDetail.contact_email && (
                        <div>
                          <p className="text-sm font-medium mb-1">Contact Email</p>
                          <a href={`mailto:${partnerDetail.contact_email}`} className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {partnerDetail.contact_email}
                          </a>
                        </div>
                      )}
                      
                      {partnerDetail.contact_person && (
                        <div>
                          <p className="text-sm font-medium mb-1">Contact Person</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {partnerDetail.contact_person}
                          </p>
                        </div>
                      )}
                      
                      {partnerDetail.performance_score !== undefined && (
                        <div>
                          <p className="text-sm font-medium mb-1">Performance Score</p>
                          <div className={`flex items-center gap-1 ${getPerformanceColor(partnerDetail.performance_score)}`}>
                            {getPerformanceIcon(partnerDetail.performance_score)}
                            <span className="font-medium">{(partnerDetail.performance_score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="font-medium mb-1">Created</p>
                        <p className="text-gray-700 dark:text-gray-300">{formatDate(partnerDetail.created_at)}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Last Updated</p>
                        <p className="text-gray-700 dark:text-gray-300">{formatDate(partnerDetail.updated_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Collaboration Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                        <p className="text-2xl font-bold">{partnerDetail.collaborations_count || 0}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Collaborations</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                        <p className="text-2xl font-bold">{partnerDetail.active_collaborations_count || 0}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Active Collaborations</p>
                      </div>
                    </div>
                    
                    {partnerDetail.organizer && (
                      <div>
                        <p className="text-sm font-medium mb-1">Organizer</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{partnerDetail.organizer.company_name}</p>
                      </div>
                    )}
                    
                    {partnerDetail.collaborations && partnerDetail.collaborations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Recent Collaborations</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {partnerDetail.collaborations.slice(0, 5).map((collab: any) => (
                            <div key={collab.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                              <p className="font-medium">{collab.event_title}</p>
                              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>{collab.event_date ? formatDate(collab.event_date) : 'No date'}</span>
                                <Badge variant="outline" className="text-xs">{collab.collaboration_type}</Badge>
                              </div>
                            </div>
                          ))}
                          {partnerDetail.collaborations.length > 5 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                              And {partnerDetail.collaborations.length - 5} more...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {partnerDetail.ai_performance_analysis && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      AI Performance Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {partnerDetail.ai_performance_analysis.strengths && (
                        <div>
                          <p className="font-medium mb-2">Strengths</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {partnerDetail.ai_performance_analysis.strengths.map((strength: string, index: number) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {partnerDetail.ai_performance_analysis.weaknesses && (
                        <div>
                          <p className="font-medium mb-2">Areas for Improvement</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {partnerDetail.ai_performance_analysis.weaknesses.map((weakness: string, index: number) => (
                              <li key={index}>{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {partnerDetail.ai_performance_analysis.recommendations && (
                        <div>
                          <p className="font-medium mb-2">Recommendations</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {partnerDetail.ai_performance_analysis.recommendations.map((rec: string, index: number) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartnerDetail(false)}>
              Close
            </Button>
            {partnerDetail && (
              <Button onClick={() => analyzePartnerWithAI(partnerDetail.id)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze with AI
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Event Collaborations Dialog */}
      <Dialog open={showEventCollaborations} onOpenChange={setShowEventCollaborations}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Collaborations</DialogTitle>
            <DialogDescription>
              All partnerships for this event with AI recommendations and optimization opportunities.
            </DialogDescription>
          </DialogHeader>
          {eventCollaborations && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{eventCollaborations.event.name}</CardTitle>
                  {eventCollaborations.event.date && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(eventCollaborations.event.date)}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {eventCollaborations.event.description}
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Current Collaborations ({eventCollaborations.total})</h3>
                {eventCollaborations.collaborations.map((collab: any) => (
                  <Card key={collab.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{collab.partner.company_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{collab.collaboration_type}</Badge>
                            <Badge variant={collab.is_active ? 'default' : 'secondary'}>
                              {collab.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          {collab.contribution_score !== undefined && (
                            <div className={`flex items-center gap-1 mt-2 ${getPerformanceColor(collab.contribution_score)}`}>
                              {getPerformanceIcon(collab.contribution_score)}
                              <span className="font-medium">{(collab.contribution_score * 100).toFixed(0)}% Contribution</span>
                            </div>
                          )}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => {
                          setCollaborationToOptimize(collab.id);
                          optimizeCollab(collab.id);
                        }}>
                          <Sparkles className="w-4 h-4 mr-1" />
                          Optimize
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {eventCollaborations.ai_suggested_partners && eventCollaborations.ai_suggested_partners.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">AI Suggested Partners</h3>
                  {eventCollaborations.ai_suggested_partners.map((partner: any, index: number) => (
                    <Card key={index} className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{partner.company_name}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{partner.reason}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{partner.suggested_type}</Badge>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                <span className="text-sm font-medium">{(partner.match_score * 100).toFixed(0)}% Match</span>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Add Partner
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventCollaborations(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this partner? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => partnerToDelete && deletePartnerData(partnerToDelete)}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPartnerManagement;