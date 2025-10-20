import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Users, CalendarDays, DollarSign, CheckCircle, BarChart2, Activity, UserPlus, Shield, Menu, X, Tags, Handshake, TrendingUp, FileText, Target, Sparkles } from 'lucide-react';
import AdminNavigation from './AdminNavigation';
import UserManagement from './UserManagement';
import SystemReports from './SystemReports';
import RecentEvents from './RecentEvents';
import CategoryManagement from './CategoryManagement';
import AdminPartnerManagement from './AdminPartner';
import { debounce } from 'lodash';
import { cn } from "@/lib/utils";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone_number?: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  ai_description_enhanced?: boolean;
  ai_suggested_keywords?: string[];
  latest_insight?: {
    insights_text: string;
    stats: any;
    ai_powered: boolean;
  };
}

const AdminDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'reports' | 'events' | 'nonAttendees' | 'registerAdmin' | 'registerSecurity' | 'viewAllUsers' | 'registerOrganizer' | 'manageCategories' | 'adminPartnership'>('reports');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { toast } = useToast();
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Partner management API functions
  const getPartnersOverview = async (params?: any) => {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/partners?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error fetching partners overview:', err);
      throw err;
    }
  };

  const getPartnerDetail = async (partnerId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/partners/${partnerId}?include_ai_insights=true`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error fetching partner detail:', err);
      throw err;
    }
  };

  const getCollaborationsOverview = async (params?: any) => {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/partners/collaborations?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error fetching collaborations overview:', err);
      throw err;
    }
  };

  const getEventCollaborations = async (eventId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/partners/collaborations/event/${eventId}?include_ai_insights=true`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error fetching event collaborations:', err);
      throw err;
    }
  };

  const getRecentCollaborations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/partners/recent?include_ai_insights=true`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error fetching recent collaborations:', err);
      throw err;
    }
  };

  const getInactiveOverview = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/partners/inactive?include_ai_insights=true`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error fetching inactive overview:', err);
      throw err;
    }
  };

  const getPartnershipAnalytics = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/partners/analytics?include_ai_insights=true`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error fetching partnership analytics:', err);
      throw err;
    }
  };

  const processAIQuery = async (query: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/partners/ai/assist`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error processing AI query:', err);
      throw err;
    }
  };

  const analyzePartner = async (partnerId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/partners/${partnerId}/ai/analyze`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error analyzing partner:', err);
      throw err;
    }
  };

  const qualityAudit = async (organizerId?: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/partners/ai/quality-audit`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(organizerId ? { organizer_id: organizerId } : {})
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error running quality audit:', err);
      throw err;
    }
  };

  const getPlatformTrends = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/partners/ai/platform-trends`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error getting platform trends:', err);
      throw err;
    }
  };

  const bulkAnalyzePartners = async (organizerId?: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/partners/ai/bulk-analyze-all`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(organizerId ? { organizer_id: organizerId } : {})
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error running bulk analysis:', err);
      throw err;
    }
  };

  const optimizeCollaboration = async (collaborationId?: number) => {
    try {
      const url = collaborationId 
        ? `${import.meta.env.VITE_API_URL}/api/admin/partners/ai/optimize-collaborations/${collaborationId}`
        : `${import.meta.env.VITE_API_URL}/api/admin/partners/ai/optimize-collaborations`;
        
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error optimizing collaboration:', err);
      throw err;
    }
  };

  const updatePartner = async (partnerId: number, data: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/partners/${partnerId}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error updating partner:', err);
      throw err;
    }
  };

  const deletePartner = async (partnerId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/partners/${partnerId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error deleting partner:', err);
      throw err;
    }
  };

  const getHeaderContent = () => {
    switch (currentView) {
      case 'reports':
        return {
          title: "System Reports",
          description: "Create visually rich reports with detailed charts and analytics. Export in CSV or PDF and convert revenue into your preferred currency.",
          icon: <BarChart2 className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-blue-500 to-blue-700"
        };
      case 'events':
        return {
          title: "Recent Events",
          description: "Monitor and manage recent event activities.",
          icon: <CalendarDays className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-purple-500 to-purple-700"
        };
      case 'viewAllUsers':
        return {
          title: "All Users",
          description: "View and manage all registered users on the platform.",
          icon: <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-green-500 to-green-700"
        };
      case 'nonAttendees':
        return {
          title: "Non-Attendees",
          description: "Track users who have not attended events.",
          icon: <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-orange-500 to-orange-700"
        };
      case 'registerAdmin':
        return {
          title: "Register New Admin",
          description: "Create new administrative user accounts.",
          icon: <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-indigo-500 to-indigo-700"
        };
      case 'registerSecurity':
        return {
          title: "Register Security User",
          description: "Create new security personnel accounts.",
          icon: <Shield className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-red-500 to-red-700"
        };
      case 'registerOrganizer':
        return {
          title: "Register Organizer",
          description: "Convert existing users to organizers with company details.",
          icon: <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-yellow-500 to-yellow-700"
        };
      case 'manageCategories':
        return {
          title: "Manage Categories",
          description: "Create and manage event categories with AI assistance.",
          icon: <Tags className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-pink-500 to-pink-700"
        };
      case 'adminPartnership':
        return {
          title: "Partner Management",
          description: "Comprehensive partner and collaboration management with AI-powered insights and analytics.",
          icon: <Handshake className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-teal-500 to-teal-700"
        };
      default:
        return {
          title: "Dashboard Overview",
          description: "Welcome to your admin control panel.",
          icon: <Activity className="w-8 h-8 md:w-10 md:h-10 text-white" />,
          gradient: "from-gray-500 to-gray-700"
        };
    }
  };

  const headerContent = getHeaderContent();

  const handleFetchError = useCallback(async (response: Response) => {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.msg || errorData.error || JSON.stringify(errorData);
      } else {
        const textData = await response.text();
        errorMessage = textData || errorMessage;
      }
    } catch (jsonError) {
    }
    setError(errorMessage);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  }, [toast]);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories?include_insights=true`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) {
        await handleFetchError(response);
        return;
      }
      const data = await response.json();
      setCategories(data.categories || data || []);
    } catch (err) {
      setError('An unexpected error occurred while fetching categories.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while fetching categories.',
        variant: "destructive",
      });
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, handleFetchError]);

  const handleCreateCategory = async (categoryData: any) => {
    setIsLoading(true);
    setError(undefined);
    setSuccessMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(categoryData)
      });

      if (!response.ok) {
        await handleFetchError(response);
        return { success: false };
      }

      const result = await response.json();

      if (categoryData.action === 'suggest') {
        if (result.suggestion || result.data) {
          const suggestionData = result.suggestion || result.data;
          toast({
            title: "AI Suggestion Generated",
            description: 'Form has been auto-filled with AI suggestions.',
            variant: "default",
          });

          return {
            success: true,
            action: 'suggestion_generated',
            data: {
              name: suggestionData.name || '',
              description: suggestionData.description || '',
              keywords: suggestionData.keywords || []
            }
          };
        }
      }

      if (categoryData.action === 'create') {
        if (result.similar_categories && result.similar_categories.length > 0 && !categoryData.confirm_despite_similar) {
          setError(result.warning || 'Similar categories found. Please review before creating.');
          toast({
            title: "Similar Categories Found",
            description: result.warning || 'Similar categories exist. You can create anyway or modify your category.',
            variant: "destructive",
          });

          return {
            success: false,
            action: 'similar_categories_found',
            data: result.similar_categories,
            warning: result.warning
          };
        }

        if (result.category || result.success || result.msg) {
          const successMsg = result.msg || result.message || 'Category created successfully.';
          setSuccessMessage(successMsg);
          toast({
            title: "Success",
            description: successMsg,
            variant: "default",
          });

          await fetchCategories();

          return {
            success: true,
            action: 'category_created',
            data: result.category
          };
        }
      }

      return { success: true, data: result };

    } catch (err) {
      const errorMsg = 'An unexpected error occurred while creating category.';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (categoryId: number, updateData: any) => {
    setIsLoading(true);
    setError(undefined);
    setSuccessMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        await handleFetchError(response);
        return null;
      }

      const result = await response.json();

      if (updateData.action === 'enhance_description') {
        if (result.enhanced_description || result.data?.enhanced) {
          toast({
            title: "AI Enhancement Generated",
            description: 'Description has been enhanced with AI.',
            variant: "default",
          });

          return {
            success: true,
            action: 'description_enhanced',
            data: {
              enhanced: result.enhanced_description || result.data?.enhanced,
              enhanced_description: result.enhanced_description || result.data?.enhanced
            }
          };
        }
      }

      if (updateData.action === 'generate_keywords') {
        if (result.suggested_keywords || result.data?.suggested) {
          toast({
            title: "AI Keywords Generated",
            description: 'Keywords have been generated with AI.',
            variant: "default",
          });

          return {
            success: true,
            action: 'keywords_generated',
            data: {
              suggested: result.suggested_keywords || result.data?.suggested
            }
          };
        }
      }

      if (updateData.action === 'update' || !updateData.action) {
        const successMsg = result.msg || result.message || 'Category updated successfully.';
        setSuccessMessage(successMsg);
        toast({
          title: "Success",
          description: successMsg,
          variant: "default",
        });

        await fetchCategories();

        return {
          success: true,
          action: 'category_updated',
          data: result.category
        };
      }

      return { success: true, data: result };

    } catch (err) {
      const errorMsg = 'An unexpected error occurred while updating category.';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number, action: string = 'check_impact'): Promise<void> => {
    setIsLoading(true);
    setError(undefined);
    setSuccessMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories/${categoryId}?action=${action}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const result = await response.json();

      if (action === 'check_impact') {
        const affectedEvents = result.affected_events || result.impact?.affected_events || 0;
        toast({
          title: "Impact Analysis Complete",
          description: `This will affect ${affectedEvents} event(s). Confirm to proceed.`,
          variant: affectedEvents > 0 ? "destructive" : "default",
        });
        return;
      }

      if (action === 'confirm_delete') {
        const successMsg = result.msg || result.message || 'Category deleted successfully.';
        setSuccessMessage(successMsg);
        toast({
          title: "Success",
          description: successMsg,
          variant: "default",
        });

        await fetchCategories();
      }

    } catch (err) {
      const errorMsg = 'An unexpected error occurred while deleting category.';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: any) => {
    setIsLoading(true);
    setError(undefined);
    setSuccessMessage('');

    try {
      let endpoint = '';
      let requestBody: any;
      let headers: any = {
        'Accept': 'application/json',
      };
      if (currentView === 'registerAdmin') {
        endpoint = '/auth/admin/register-admin';
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify({
          email: data.email?.trim(),
          phone_number: data.phone_number?.trim(),
          password: data.password,
          full_name: data.full_name?.trim()
        });
      } else if (currentView === 'registerSecurity') {
        endpoint = '/auth/admin/register-security';
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify({
          email: data.email?.trim(),
          phone_number: data.phone_number?.trim(),
          password: data.password,
          full_name: data.full_name?.trim()
        });
      } else if (currentView === 'registerOrganizer') {
        endpoint = '/auth/admin/register-organizer';
        const formData = new FormData();
        formData.append('user_id', data.user_id);
        formData.append('company_name', data.company_name?.trim() || '');
        if (data.company_description) formData.append('company_description', data.company_description.trim());
        if (data.website) formData.append('website', data.website.trim());
        if (data.business_registration_number) formData.append('business_registration_number', data.business_registration_number.trim());
        if (data.tax_id) formData.append('tax_id', data.tax_id.trim());
        if (data.address) formData.append('address', data.address.trim());
        if (data.company_logo) formData.append('company_logo', data.company_logo);

        requestBody = formData;
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: requestBody
      });
      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const result = await response.json();

      const roleLabel = currentView === 'registerAdmin' ? 'Admin' :
                       currentView === 'registerSecurity' ? 'Security user' : 'Organizer';

      const successMsg = result.msg || `${roleLabel} registered successfully.`;
      setSuccessMessage(successMsg);
      toast({
        title: "Success",
        description: successMsg,
        variant: "default",
      });
    } catch (err) {
      const errorMsg = 'An unexpected error occurred during registration.';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setError(undefined);
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) {
        await handleFetchError(response);
        return;
      }
      setSuccessMessage('Logout successful.');
      toast({
        title: "Success",
        description: "Logout successful.",
        variant: "default",
      });
      window.location.href = '/';
    } catch (err) {
      setError('An unexpected error occurred while logging out.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while logging out.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    setSuccessMessage('');
    try {
      const endpoint = currentView === 'nonAttendees'
        ? '/admin/users/non-attendees'
        : '/admin/users';
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) {
        await handleFetchError(response);
        return;
      }
      const data = await response.json();
      let flattenedUsers: User[] = [];
      if (data && typeof data === 'object') {
        if (Array.isArray(data.admins)) flattenedUsers = flattenedUsers.concat(data.admins);
        if (Array.isArray(data.organizers)) flattenedUsers = flattenedUsers.concat(data.organizers);
        if (Array.isArray(data.security)) flattenedUsers = flattenedUsers.concat(data.security);
        if (Array.isArray(data.attendees)) flattenedUsers = flattenedUsers.concat(data.attendees);
      } else {
        flattenedUsers = [];
      }
      setAllUsers(flattenedUsers);
    } catch (err) {
      setError('An unexpected error occurred while fetching users.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while fetching users.',
        variant: "destructive",
      });
      setAllUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentView, toast, handleFetchError]);

  const handleSearchUsers = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(undefined);
    setSuccessMessage('');
    try {
      const endpoint = `/admin/users/search?email=${encodeURIComponent(email)}`;
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) {
        await handleFetchError(response);
        return;
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setAllUsers(data);
      } else {
        setAllUsers([]);
      }
    } catch (err) {
      setError('An unexpected error occurred while searching.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while searching.',
        variant: "destructive",
      });
      setAllUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, handleFetchError]);

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      handleSearchUsers(term);
    }, 500),
    [handleSearchUsers]
  );

  const handleUserManagementSearchChange = (term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
    if (term === '') {
      setAllUsers([]);
    }
  };

  const handleViewChange = (view: 'reports' | 'events' | 'nonAttendees' | 'registerAdmin' | 'registerSecurity' | 'viewAllUsers' | 'registerOrganizer' | 'manageCategories' | 'adminPartnership') => {
    setCurrentView(view);
    if (view !== 'viewAllUsers' && view !== 'nonAttendees') {
      setSearchTerm('');
      setAllUsers([]);
      debouncedSearch.cancel();
    }
    setError(undefined);
    setSuccessMessage('');
  };

  useEffect(() => {
    if ((currentView === 'viewAllUsers' || currentView === 'nonAttendees')) {
      if (!searchTerm) {
        fetchAllUsers();
      } else {
        handleSearchUsers(searchTerm);
      }
    } else if (currentView === 'manageCategories') {
      fetchCategories();
    }
    return () => {
      debouncedSearch.cancel();
    };
  }, [currentView, searchTerm, fetchAllUsers, handleSearchUsers, debouncedSearch, fetchCategories]);

  const filteredUsers = allUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 dark:opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>
      <div className="relative z-10 flex min-h-screen">
        <AdminNavigation
          currentView={currentView}
          onViewChange={handleViewChange}
          onLogout={handleLogout}
          isLoading={isLoading}
          toggleMobileMenu={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="flex-1 ml-0 md:ml-72 p-4 md:p-8">
          <div className={cn(
            "mb-8 p-6 md:p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden",
            "bg-white dark:bg-gray-800",
            `bg-gradient-to-r ${headerContent.gradient} text-white`
          )}>
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-full bg-white bg-opacity-20 dark:bg-opacity-10 shadow-inner transition-transform duration-300 hover:scale-105">
                {headerContent.icon}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
                  {headerContent.title}
                </h1>
                <p className="text-lg md:text-xl font-light opacity-90">
                  {headerContent.description}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {currentView === 'reports' && (
              <div className="space-y-6">
                <SystemReports />
              </div>
            )}
            {currentView === 'events' && (
              <RecentEvents />
            )}
            {currentView === 'manageCategories' && (
              <CategoryManagement
                categories={categories}
                onCreateCategory={handleCreateCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                isLoading={isLoading}
                error={error}
                successMessage={successMessage}
              />
            )}
            {currentView === 'adminPartnership' && (
              <AdminPartnerManagement
                getPartnersOverview={getPartnersOverview}
                getPartnerDetail={getPartnerDetail}
                getCollaborationsOverview={getCollaborationsOverview}
                getEventCollaborations={getEventCollaborations}
                getRecentCollaborations={getRecentCollaborations}
                getInactiveOverview={getInactiveOverview}
                getPartnershipAnalytics={getPartnershipAnalytics}
                processAIQuery={processAIQuery}
                analyzePartner={analyzePartner}
                qualityAudit={qualityAudit}
                getPlatformTrends={getPlatformTrends}
                bulkAnalyzePartners={bulkAnalyzePartners}
                optimizeCollaboration={optimizeCollaboration}
                updatePartner={updatePartner}
                deletePartner={deletePartner}
                isLoading={isLoading}
                error={error}
                successMessage={successMessage}
              />
            )}
            {(currentView === 'nonAttendees' || currentView === 'viewAllUsers') && (
              <UserManagement
                view={currentView}
                onRegister={handleRegister}
                users={filteredUsers}
                isLoading={isLoading}
                error={error}
                successMessage={successMessage}
                searchTerm={searchTerm}
                onSearchTermChange={handleUserManagementSearchChange}
              />
            )}
            {currentView === 'registerAdmin' && (
              <UserManagement
                view="registerAdmin"
                onRegister={handleRegister}
                isLoading={isLoading}
                error={error}
                successMessage={successMessage}
              />
            )}
            {currentView === 'registerSecurity' && (
              <UserManagement
                view="registerSecurity"
                onRegister={handleRegister}
                isLoading={isLoading}
                error={error}
                successMessage={successMessage}
              />
            )}
            {currentView === 'registerOrganizer' && (
              <UserManagement
                view="registerOrganizer"
                onRegister={handleRegister}
                isLoading={isLoading}
                error={error}
                successMessage={successMessage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;