import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  MapPin, Search, Calendar, Filter, Grid, List, TrendingUp, Eye,
  Phone, Clock, Users, Heart, Share2, Bookmark, ChevronRight, ChevronLeft, Loader2,
  Award, Building, ArrowUpDown, RefreshCw, Menu, X, Ticket, Tag, ArrowRight,
  Zap, Sparkles, Star, Handshake, UserCheck, Globe, Mail, ExternalLink, Plus
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

// --------- StatsCard ----------
type StatsCardProps = {
  icon: React.ReactElement;
  value: string | number;
  label: string;
  iconColor?: string;
};

const StatsCard: React.FC<StatsCardProps> = ({ icon, value, label, iconColor = 'text-blue-600 dark:text-blue-400' }) => (
  <motion.div
    className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="absolute inset-0 opacity-5 dark:opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }} />
    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
      <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 shadow-lg group-hover:scale-110 transition-transform duration-500 shrink-0">
        {React.cloneElement(icon, { className: `w-4 h-4 sm:w-5 sm:h-5 ${iconColor}` })}
      </div>
      <div className="text-center sm:text-left">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">{value}</div>
        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</div>
      </div>
    </div>
  </motion.div>
);

// ---------- PartnershipCard ----------
type Collaboration = {
  id?: string;
  event_id?: string;
  event_name?: string;
  organizer_name?: string;
  partner?: {
    id?: string;
    company_name?: string;
    company_description?: string;
    partner_type?: string;
    contact_email?: string;
    website_url?: string;
    logo_url?: string;
  };
  status?: string;
  collaboration_type?: string;
  description?: string;
  start_date?: string;
  events?: Array<{
    id?: string;
    event_name?: string;
    organizer_name?: string;
    start_date?: string;
    end_date?: string;
  }>;
};

type PartnershipCardProps = {
  collaboration: Collaboration;
  index: number;
  onViewDetails: (c: Collaboration) => void;
  onViewEvent: (c: Collaboration) => void;
  onShare?: (c: Collaboration) => void;
};

const PartnershipCard: React.FC<PartnershipCardProps> = ({ collaboration, index, onViewDetails, onViewEvent, onShare }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status?: string) => {
    switch (String(status || '').toLowerCase()) {
      case 'active':
        return 'from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 text-green-800 dark:text-green-200';
      case 'pending':
        return 'from-yellow-100 to-yellow-200 dark:from-yellow-900/50 dark:to-yellow-800/50 text-yellow-800 dark:text-yellow-200';
      case 'completed':
        return 'from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-800 dark:text-blue-200';
      default:
        return 'from-gray-100 to-gray-200 dark:from-gray-900/50 dark:to-gray-800/50 text-gray-800 dark:text-gray-200';
    }
  };

  const getPartnerTypeIcon = (type?: string) => {
    switch (String(type || '').toLowerCase()) {
      case 'official partner':
      case 'sponsor':
        return <Award className="w-4 h-4" />;
      case 'collaborator':
      case 'vendor':
        return <Handshake className="w-4 h-4" />;
      case 'media partner':
        return <Globe className="w-4 h-4" />;
      default:
        return <Building className="w-4 h-4" />;
    }
  };

  const getCategoryGradient = () => 'from-blue-500 to-green-500';

  // Create company logo placeholder with C*P format
  const getCompanyLogoPlaceholder = () => {
    const companyName = collaboration.partner?.company_name || 'Company';
    const firstLetter = companyName.charAt(0).toUpperCase();
    const lastLetter = companyName.charAt(companyName.length - 1).toUpperCase();
    return `${firstLetter}*P`; // Always use P as the last letter for "Partner"
  };

  const getCompanyImage = () => {
    if (collaboration.partner?.logo_url && !imageError) {
      return collaboration.partner.logo_url;
    }
    return null; // Return null to trigger the fallback UI
  };

  // Count total events this partner is involved in
  const totalEvents = collaboration.events?.length || 1;
  const hasMultipleEvents = totalEvents > 1;

  return (
    <motion.div
      className="group relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/30 dark:border-gray-800/60 cursor-pointer"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onViewDetails(collaboration)}
    >
      {/* Image/Logo Section */}
      <div className="relative h-48 sm:h-56 overflow-hidden rounded-t-3xl">
        {getCompanyImage() && !imageError ? (
          <motion.img
            src={getCompanyImage()!}
            alt={collaboration.partner?.company_name || 'Company'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          // Enhanced logo placeholder with C*P format
          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-green-500 flex items-center justify-center relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-green-500/10 animate-pulse"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)',
              animation: 'float 6s ease-in-out infinite'
            }}></div>
            
            {/* Logo placeholder with company initials */}
            <div className="flex items-center justify-center gap-2 text-white relative z-10">
              <div className="text-4xl sm:text-5xl font-black drop-shadow-2xl tracking-wider">
                {getCompanyLogoPlaceholder()}
              </div>
            </div>
            
            {/* Company name overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
                <p className="text-white font-bold text-sm truncate">{collaboration.partner?.company_name || 'Partner Company'}</p>
                <p className="text-white/80 text-xs">{collaboration.partner?.partner_type || 'Partner'}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* overlays with better contrast */}
        <div className={`absolute inset-0 bg-gradient-to-t ${getCategoryGradient()} opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* badges with better visibility */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <motion.div
            className={`px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r ${getStatusColor(collaboration.status)} shadow-lg backdrop-blur-md border border-white/30 dark:border-gray-400/30 flex items-center gap-1`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          >
            <Star className="w-3 h-3 fill-current" />
            {String(collaboration.status || 'ACTIVE').toUpperCase()}
          </motion.div>
          {collaboration.partner?.partner_type && (
            <motion.div
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-black/60 backdrop-blur-md border border-white/30 flex items-center gap-1 shadow-lg"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {getPartnerTypeIcon(collaboration.partner.partner_type)}
              {collaboration.partner.partner_type}
            </motion.div>
          )}
        </div>

        {/* Multiple events indicator */}
        {hasMultipleEvents && (
          <div className="absolute top-4 right-4">
            <motion.div
              className="px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 shadow-lg backdrop-blur-md border border-white/30 flex items-center gap-1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
            >
              <Plus className="w-3 h-3" />
              {totalEvents}
            </motion.div>
          </div>
        )}
        
        {/* bottom bar with improved visibility */}
        <div className="absolute bottom-4 left-4 right-4">
          <motion.div
            className="flex items-center justify-between"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 text-white bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-white/30 shadow-lg">
              <Building className="w-4 h-4" />
              <span className="text-sm font-medium">Partnership</span>
            </div>
            <div className="flex items-center gap-2 text-white bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-white/30 shadow-lg">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{formatDate(collaboration.start_date) || 'Ongoing'}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* content section with enhanced hover effects */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Title */}
        <div className="flex items-start justify-between gap-3">
          <motion.h3
            className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight transition-all duration-300 line-clamp-2"
            style={{
              color: isHovered ? 'transparent' : '',
              backgroundImage: isHovered ? 'linear-gradient(to right, #3b82f6, #10b981)' : 'none',
              backgroundClip: isHovered ? 'text' : 'initial',
              WebkitBackgroundClip: isHovered ? 'text' : 'initial',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {collaboration.partner?.company_name || 'Partnership'}
          </motion.h3>
          <motion.div
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-blue-500 to-green-500 opacity-90 text-white text-xs font-bold flex-shrink-0 shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
          >
            <Handshake className="w-3 h-3" />
            PARTNER
          </motion.div>
        </div>

        {/* Enhanced description with multiple events support */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-gray-700 dark:text-gray-200 text-sm line-clamp-2 leading-relaxed">
            {collaboration.description || `Partnership with ${collaboration.event_name}${collaboration.organizer_name ? ` organized by ${collaboration.organizer_name}` : ''}`}
          </p>
          
          {/* Multiple events indicator */}
          {hasMultipleEvents && (
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
              <Calendar className="w-3 h-3" />
              <span>Active in {totalEvents} events</span>
            </div>
          )}
        </motion.div>

        {/* details with better hover visibility */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={`flex items-center gap-3 transition-all duration-300 ${isHovered ? 'text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
            <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryGradient()} ${isHovered ? 'bg-opacity-20' : 'bg-opacity-10'} transition-all duration-300`}>
              <Calendar className="w-4 h-4 text-current" />
            </div>
            <span className="text-sm font-medium truncate">
              {hasMultipleEvents ? `${totalEvents} Events` : collaboration.event_name}
            </span>
          </div>

          {collaboration.partner?.contact_email && (
            <div className={`flex items-center gap-3 transition-all duration-300 ${isHovered ? 'text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
              <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryGradient()} ${isHovered ? 'bg-opacity-20' : 'bg-opacity-10'} transition-all duration-300`}>
                <Mail className="w-4 h-4 text-current" />
              </div>
              <span className="text-sm font-medium truncate">{collaboration.partner.contact_email}</span>
            </div>
          )}

          {collaboration.organizer_name && !hasMultipleEvents && (
            <div className={`flex items-center gap-3 transition-all duration-300 ${isHovered ? 'text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
              <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryGradient()} ${isHovered ? 'bg-opacity-20' : 'bg-opacity-10'} transition-all duration-300`}>
                <Users className="w-4 h-4 text-current" />
              </div>
              <span className="text-sm font-medium truncate">by {collaboration.organizer_name}</span>
            </div>
          )}
        </motion.div>

        {collaboration.partner?.website_url && (
          <motion.div
            className={`flex items-center gap-2 text-sm transition-all duration-300 ${isHovered ? 'text-gray-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-300'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Globe className="w-4 h-4" />
            <a
              href={collaboration.partner.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline truncate transition-colors duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              Visit Website
            </a>
          </motion.div>
        )}

        {/* action buttons with enhanced visibility */}
        <motion.div
          className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-gray-700/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className={`text-xl sm:text-2xl font-bold transition-all duration-300 ${isHovered ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                {collaboration.collaboration_type || collaboration.partner?.partner_type || 'Partner'}
              </span>
            </div>
            <div className="space-y-1 mt-1">
              <div
                className={`text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full w-fit border transition-all duration-300 ${
                  String(collaboration.status || '').toLowerCase() === 'active'
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                }`}
              >
                {collaboration.status || 'Active'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              className="flex items-center justify-center gap-1 sm:gap-2 py-2 px-3 sm:px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 text-xs sm:text-sm"
              whileTap={{ scale: 0.95 }}
              whileHover={{ boxShadow: `0 15px 30px -8px rgba(59, 130, 246, 0.3)`, y: -1 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onViewEvent(collaboration);
              }}
            >
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{hasMultipleEvents ? 'View Events' : 'View Event'}</span>
            </motion.button>
            <motion.button
              className="flex items-center justify-center gap-1 sm:gap-2 py-2 px-3 sm:px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 text-xs sm:text-sm"
              whileTap={{ scale: 0.95 }}
              whileHover={{ boxShadow: `0 15px 30px -8px rgba(59, 130, 246, 0.3)`, y: -1 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onViewDetails(collaboration);
              }}
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Details</span>
              <span className="sm:hidden">Info</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Enhanced hover glow effect */}
      <motion.div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${getCategoryGradient()} opacity-0 group-hover:opacity-[0.15] blur-xl transition-all duration-500 -z-10`}
        initial={{ scale: 0.8 }}
        animate={{ scale: isHovered ? 1.1 : 0.8 }}
        transition={{ duration: 0.5 }}
      />

      {/* CSS for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
      `}</style>
    </motion.div>
  );
};

// ---------------- Main PartnershipsPage ----------------
const PartnershipsPage: React.FC = () => {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedCollaboration, setSelectedCollaboration] = useState<Collaboration | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalPartnerships: 0,
    activeCollaborations: 0,
    totalEvents: 0,
    totalPartners: 0,
  });
  const [filters, setFilters] = useState({ organizer_id: '' });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, duration: 0.4 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease: 'easeOut' } }
  };

  // Fetch collaborations from API (paginated)
  const fetchCollaborations = async (page = 1, reset = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        per_page: '12',
        ...(filters.organizer_id ? { organizer_id: filters.organizer_id } : {})
      });
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE_URL}/api/public/collaborations?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Failed to fetch collaborations');
      }
      const data = await response.json();
      
      // Enhanced processing to group collaborations by partner
      const partnerMap = new Map<string, Collaboration>();
      
      (data.events || []).forEach((event: any) => {
        (event.collaborations || []).forEach((collab: any) => {
          const partnerId = collab.partner?.id || collab.partner?.company_name || 'unknown';
          
          if (partnerMap.has(partnerId)) {
            // Add this event to existing partner collaboration
            const existing = partnerMap.get(partnerId)!;
            existing.events = existing.events || [];
            existing.events.push({
              id: event.event_id,
              event_name: event.event_name,
              organizer_name: event.organizer_name,
              start_date: event.start_date,
              end_date: event.end_date,
            });
          } else {
            // Create new partner collaboration
            partnerMap.set(partnerId, {
              ...collab,
              event_name: event.event_name,
              organizer_name: event.organizer_name,
              event_id: event.event_id,
              events: [{
                id: event.event_id,
                event_name: event.event_name,
                organizer_name: event.organizer_name,
                start_date: event.start_date,
                end_date: event.end_date,
              }]
            });
          }
        });
      });

      const processed = Array.from(partnerMap.values());

      if (reset || page === 1) {
        setCollaborations(processed);
        setCurrentPage(1);
      } else {
        setCollaborations(prev => [...prev, ...processed]);
      }
      setHasMore(Boolean(data.has_next));
      setStats({
        totalPartnerships: processed.length,
        activeCollaborations: processed.filter(c => String(c.status || 'active').toLowerCase() === 'active').length,
        totalEvents: (data.events || []).length,
        totalPartners: processed.length,
      });
      setCurrentPage(page);
    } catch (err) {
      console.error('fetchCollaborations error:', err);
      setError('Failed to load partnerships');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    // initial load (reset on filter change)
    fetchCollaborations(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.organizer_id]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target && target.isIntersecting && hasMore && !isLoadingMore) {
          fetchCollaborations(currentPage + 1, false);
        }
      },
      { root: null, rootMargin: '150px', threshold: 0.05 }
    );
    const node = loadMoreRef.current;
    if (node) observer.observe(node);
    return () => {
      if (node) observer.unobserve(node);
      observer.disconnect();
    };
  }, [currentPage, hasMore, isLoadingMore]);

  const handleViewDetails = (c: Collaboration) => {
    setSelectedCollaboration(c);
  };

  const handleViewEvent = (c: Collaboration) => {
    // If multiple events, navigate to first event or show selection
    const eventId = c.events?.[0]?.id || c.event_id;
    if (eventId) {
      navigate(`/event/${eventId}`);
    }
  };

  const handleShare = (c: Collaboration) => {
    const shareData = {
      title: `Partnership: ${c.partner?.company_name}`,
      text: `Check out this partnership with ${c.event_name}!`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => { /* ignore */ });
    } else {
      navigator.clipboard?.writeText(window.location.href).catch(() => { /* ignore */ });
    }
  };

  const filteredCollaborations = useMemo(() => {
    return collaborations.filter(collab => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(collab.partner?.company_name || '').toLowerCase().includes(q) ||
        String(collab.event_name || '').toLowerCase().includes(q) ||
        String(collab.organizer_name || '').toLowerCase().includes(q) ||
        (collab.events || []).some(event => 
          String(event.event_name || '').toLowerCase().includes(q) ||
          String(event.organizer_name || '').toLowerCase().includes(q)
        )
      );
    });
  }, [collaborations, searchQuery]);

  const sortedCollaborations = useMemo(() => {
    const sorted = [...filteredCollaborations];
    switch (activeTab) {
      case 'active':
        return sorted.filter(c => String(c.status || 'active').toLowerCase() === 'active');
      case 'official_partner':
        return sorted.filter(c => String(c.partner?.partner_type || '').toLowerCase() === 'official partner' || String(c.partner?.partner_type || '').toLowerCase() === 'sponsor');
      case 'collaborator':
        return sorted.filter(c => String(c.partner?.partner_type || '').toLowerCase() === 'collaborator' || String(c.partner?.partner_type || '').toLowerCase() === 'vendor');
      case 'media_partner':
        return sorted.filter(c => String(c.partner?.partner_type || '').toLowerCase() === 'media partner');
      default:
        return sorted;
    }
  }, [filteredCollaborations, activeTab]);

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden transition-all duration-300">
      <div className="absolute inset-0 z-0 opacity-10 dark:opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }} />
      <div className="relative z-10">
        <Navbar />
        <main className="py-6 sm:py-8 lg:py-12 pt-16 sm:pt-20 lg:pt-24 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <motion.div className="mb-8 sm:mb-12" initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12 lg:mb-16">
                <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white mb-4 sm:mb-6 shadow-lg shadow-blue-500/25">
                  <Handshake className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">Event Partnerships & Collaborations</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent leading-tight">
                  Strategic<br />Partnerships
                </h1>
                <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
                  Discover successful partnerships and collaborations that make events extraordinary. Connect with sponsors, vendors, and media partners.
                </p>
                <div className="max-w-xl sm:max-w-2xl mx-auto mb-8 sm:mb-12 px-4">
                  <div className="relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      placeholder="Search partnerships, events, or companies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-4 sm:pr-6 py-3 sm:py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm sm:text-base lg:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-300"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-green-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12 lg:mb-16">
                <StatsCard
                  icon={<Handshake />}
                  value={stats.totalPartnerships}
                  label="Total Partnerships"
                  iconColor="text-blue-600 dark:text-blue-400"
                />
                <StatsCard
                  icon={<UserCheck />}
                  value={stats.activeCollaborations}
                  label="Active Collaborations"
                  iconColor="text-green-600 dark:text-green-400"
                />
                <StatsCard
                  icon={<Calendar />}
                  value={stats.totalEvents}
                  label="Events with Partnerships"
                  iconColor="text-purple-600 dark:text-purple-400"
                />
                <StatsCard
                  icon={<Building />}
                  value={stats.totalPartners}
                  label="Partner Companies"
                  iconColor="text-orange-600 dark:text-orange-400"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                      Active Partnerships
                    </h2>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300">{sortedCollaborations.length} partnerships found</p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchCollaborations(1, true)}
                      disabled={loading}
                      className="border-gray-200 dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 dark:hover:from-blue-900/20 dark:hover:to-green-900/20 transition-all duration-300"
                    >
                      <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                      <span className="sm:hidden">↻</span>
                    </Button>
                  </div>
                </div>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(String(v))} className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-lg">
                    <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 text-xs sm:text-sm">All</TabsTrigger>
                    <TabsTrigger value="active" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 text-xs sm:text-sm">Active</TabsTrigger>
                    <TabsTrigger value="official_partner" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 text-xs sm:text-sm">Official</TabsTrigger>
                    <TabsTrigger value="collaborator" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 text-xs sm:text-sm">Collaborator</TabsTrigger>
                    <TabsTrigger value="media_partner" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 text-xs sm:text-sm">Media</TabsTrigger>
                  </TabsList>
                  <TabsContent value={activeTab} className="mt-4 sm:mt-6">
                    {loading ? (
                      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
                            <div className="h-40 sm:h-48 lg:h-56 w-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700" />
                            <div className="p-4 sm:p-6 space-y-4">
                              <Skeleton className="h-4 sm:h-6 w-3/4 rounded" />
                              <Skeleton className="h-3 sm:h-4 w-1/2 rounded" />
                              <div className="flex gap-2">
                                <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 rounded-full" />
                                <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 rounded-full" />
                              </div>
                              <Skeleton className="h-8 sm:h-10 w-full rounded-xl" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {error && (
                          <div className="text-center py-6 sm:py-8 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl border border-red-200 dark:border-red-800 shadow-lg mx-4">
                            <div className="relative inline-block mb-4">
                              <div className="text-2xl sm:text-3xl animate-bounce">⚠️</div>
                              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-ping" />
                            </div>
                            <p className="text-sm sm:text-base lg:text-lg font-medium text-red-600 dark:text-red-400">{error}</p>
                          </div>
                        )}
                        {!error && sortedCollaborations.length === 0 && (
                          <div className="text-center py-12 sm:py-16 lg:py-20">
                            <div className="relative inline-block mb-4 sm:mb-6">
                              <div className="text-4xl sm:text-6xl lg:text-8xl animate-bounce">🤝</div>
                              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 sm:w-12 lg:w-16 h-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-full blur-sm" />
                            </div>
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">No partnerships found</h3>
                            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 px-4 max-w-md mx-auto">Try adjusting your search or explore different partnership categories</p>
                            <Button
                              onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
                              className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Clear Filters
                            </Button>
                          </div>
                        )}
                        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                          <AnimatePresence>
                            {sortedCollaborations.map((collaboration, index) => (
                              <PartnershipCard
                                key={`${collaboration.id || index}-${collaboration.event_id || 'e'}`}
                                collaboration={collaboration}
                                index={index}
                                onViewDetails={handleViewDetails}
                                onViewEvent={handleViewEvent}
                                onShare={handleShare}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                        {isLoadingMore && (
                          <div className="flex justify-center items-center py-8 sm:py-12">
                            <div className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-lg">
                              <div className="relative">
                                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-500" />
                                <div className="absolute inset-0 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-gradient-to-r from-blue-500 to-green-500 opacity-20 animate-pulse" />
                              </div>
                              <span className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm">Loading more partnerships...</span>
                            </div>
                          </div>
                        )}
                        <div ref={loadMoreRef} className="h-10 w-full" />
                        {!hasMore && sortedCollaborations.length > 0 && (
                          <div className="text-center py-8 sm:py-12">
                            <div className="inline-flex items-center px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-full border border-blue-200/50 dark:border-gray-600 shadow-lg">
                              <Handshake className="w-4 h-4 text-blue-600 dark:text-blue-300 mr-2" />
                              <span className="text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">You've explored all available partnerships!</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </motion.div>
            </motion.div>
          </div>
        </main>
        
        {/* Enhanced Partnership Details Dialog */}
        <Dialog open={!!selectedCollaboration} onOpenChange={(open) => { if (!open) setSelectedCollaboration(null); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl mx-4">
            <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                {selectedCollaboration?.partner?.company_name || 'Partnership Details'}
              </DialogTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30">
                    <Handshake className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <span className="font-medium text-xs sm:text-sm lg:text-base">
                    {selectedCollaboration?.events && selectedCollaboration.events.length > 1 
                      ? `${selectedCollaboration.events.length} Events`
                      : selectedCollaboration?.event_name
                    }
                  </span>
                </div>
                {selectedCollaboration?.organizer_name && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30">
                      <Building className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-300" />
                    </div>
                    <span className="font-medium text-xs sm:text-sm lg:text-base">by {selectedCollaboration.organizer_name}</span>
                  </div>
                )}
              </div>
            </DialogHeader>
            {selectedCollaboration && (
              <div className="space-y-4 sm:space-y-6 pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Partner Details */}
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                      <h4 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25">
                          <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        Partner Information
                      </h4>
                      
                      {/* Enhanced Company Logo Display */}
                      <div className="mb-4 flex justify-center">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-md bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                          {selectedCollaboration.partner?.logo_url ? (
                            <img
                              src={selectedCollaboration.partner.logo_url}
                              alt={selectedCollaboration.partner.company_name}
                              className="w-full h-full object-contain bg-white"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const companyName = selectedCollaboration.partner?.company_name || 'Company';
                                  const firstLetter = companyName.charAt(0).toUpperCase();
                                  parent.innerHTML = `<div class="text-white font-black text-2xl sm:text-3xl tracking-wider">${firstLetter}*P</div>`;
                                }
                              }}
                            />
                          ) : (
                            <div className="text-white font-black text-2xl sm:text-3xl tracking-wider">
                              {(() => {
                                const companyName = selectedCollaboration.partner?.company_name || 'Company';
                                const firstLetter = companyName.charAt(0).toUpperCase();
                                return `${firstLetter}*P`;
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 sm:p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                          <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Company:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm">{selectedCollaboration.partner?.company_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 sm:p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                          <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Type:</span>
                          <span className="font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent text-xs sm:text-sm capitalize">{selectedCollaboration.partner?.partner_type || 'Partner'}</span>
                        </div>
                        {selectedCollaboration.partner?.contact_email && (
                          <div className="flex justify-between items-center p-2 sm:p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                            <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Contact:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm truncate max-w-[150px]">{selectedCollaboration.partner.contact_email}</span>
                          </div>
                        )}
                        {selectedCollaboration.partner?.website_url && (
                          <div className="flex justify-between items-center p-2 sm:p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                            <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Website:</span>
                            <a
                              href={selectedCollaboration.partner.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm flex items-center gap-1"
                            >
                              Visit Site <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        <div className="flex justify-between items-center p-2 sm:p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                          <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${(selectedCollaboration.status || 'active').toLowerCase() === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                            {selectedCollaboration.status || 'Active'}
                          </span>
                        </div>
                        {/* Company Description */}
                        {selectedCollaboration.partner?.company_description && (
                          <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            <h6 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-xs sm:text-sm">About Company:</h6>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{selectedCollaboration.partner.company_description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Event Details with Multiple Events Support */}
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                      <h4 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-white shadow-lg shadow-green-500/25">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        Event Information
                        {selectedCollaboration.events && selectedCollaboration.events.length > 1 && (
                          <span className="ml-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">
                            {selectedCollaboration.events.length} Events
                          </span>
                        )}
                      </h4>
                      
                      {/* Multiple Events List or Single Event */}
                      {selectedCollaboration.events && selectedCollaboration.events.length > 1 ? (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {selectedCollaboration.events.map((event, index) => (
                            <div key={event.id || index} className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1 text-xs sm:text-sm lg:text-base">{event.event_name}</h5>
                                  {event.organizer_name && (
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Organized by {event.organizer_name}</p>
                                  )}
                                  {event.start_date && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {new Date(event.start_date).toLocaleDateString('en-US', { 
                                        weekday: 'short', 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                      {event.end_date && event.end_date !== event.start_date && (
                                        <span> - {new Date(event.end_date).toLocaleDateString('en-US', { 
                                          weekday: 'short', 
                                          month: 'short', 
                                          day: 'numeric'
                                        })}</span>
                                      )}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (event.id) navigate(`/event/${event.id}`);
                                  }}
                                  className="ml-2 text-xs"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1 text-xs sm:text-sm lg:text-base">{selectedCollaboration.event_name}</h5>
                            {selectedCollaboration.organizer_name && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Organized by {selectedCollaboration.organizer_name}</p>
                            )}
                          </div>
                          {selectedCollaboration.collaboration_type && (
                            <div className="flex justify-between items-center p-2 sm:p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                              <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Collaboration Type:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm capitalize">{selectedCollaboration.collaboration_type}</span>
                            </div>
                          )}
                          {selectedCollaboration.description && (
                            <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                              <h6 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-xs sm:text-sm">Partnership Description:</h6>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{selectedCollaboration.description}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                  {selectedCollaboration.partner?.contact_email && (
                    <Button
                      onClick={() => window.open(`mailto:${selectedCollaboration.partner.contact_email}`, '_blank')}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-2 sm:py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 text-xs sm:text-sm lg:text-base"
                    >
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Contact Partner
                    </Button>
                  )}
                  {selectedCollaboration.partner?.website_url && (
                    <Button
                      onClick={() => window.open(selectedCollaboration.partner.website_url, '_blank')}
                      variant="outline"
                      className="flex-1 border-2 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 bg-white dark:bg-gray-800 font-semibold py-2 sm:py-3 rounded-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm lg:text-base"
                    >
                      <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Visit Website
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setSelectedCollaboration(null);
                      handleViewEvent(selectedCollaboration);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-2 sm:py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 text-xs sm:text-sm lg:text-base"
                  >
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    {selectedCollaboration.events && selectedCollaboration.events.length > 1 ? 'View Events' : 'View Event'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare(selectedCollaboration)}
                    className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 dark:hover:from-blue-900/20 dark:hover:to-green-900/20 bg-white dark:bg-gray-800 font-semibold py-2 sm:py-3 rounded-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm lg:text-base"
                  >
                    <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Share Partnership
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Footer />
      </div>
    </div>
  );
};

export default PartnershipsPage;