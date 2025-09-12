import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  MapPin, Search, Calendar, Filter, Grid, List, TrendingUp, Eye,
  Phone, Clock, Users, Heart, Share2, Bookmark, ChevronRight, ChevronLeft, Loader2,
  Award, Building, ArrowUpDown, RefreshCw, Menu, X, Ticket, Tag, ArrowRight,
  Zap, Sparkles, Star, Handshake, UserCheck, Globe, Mail, ExternalLink
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
  gradient?: string;
};
const StatsCard: React.FC<StatsCardProps> = ({ icon, value, label, gradient = 'bg-gradient-to-br from-blue-500 to-green-500' }) => (
  <motion.div
    className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="absolute inset-0 opacity-5 dark:opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }} />
    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
      <div className={`p-2 sm:p-3 rounded-xl ${gradient} shadow-lg group-hover:rotate-12 transition-transform duration-500 shrink-0`}>
        {React.cloneElement(icon, { className: 'w-5 h-5 text-white' })}
      </div>
      <div className="text-center sm:text-left">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">{value}</div>
        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</div>
      </div>
    </div>
  </motion.div>
);

// ---------- PartnershipCard (Updated to match VenueCard styling) -----------
type Collaboration = any;
type PartnershipCardProps = {
  collaboration: Collaboration;
  index: number;
  onViewDetails: (c: Collaboration) => void;
};

const PartnershipCard: React.FC<PartnershipCardProps> = ({ collaboration, index, onViewDetails }) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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
      {/* Header / Image */}
      <div className="relative h-56 overflow-hidden rounded-t-3xl">
        {collaboration.partner?.logo_url ? (
          <motion.img
            src={collaboration.partner.logo_url}
            alt={collaboration.partner?.company_name || 'Partner'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-green-500/10"
              animate={{ opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <span className="text-6xl font-bold text-white relative z-10 drop-shadow-2xl">
              {collaboration.partner?.company_name?.charAt(0) || 'P'}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          {collaboration.status && (
            <motion.div
              className="px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-green-500 opacity-90 shadow-lg backdrop-blur-sm flex items-center gap-1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.9 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <Star className="w-3 h-3 fill-current" />
              {String(collaboration.status).toUpperCase()}
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <motion.div
            className="flex items-center justify-between"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 text-white bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              <Handshake className="w-4 h-4" />
              <span className="text-sm font-medium">Partnership</span>
            </div>
            {collaboration.start_date && (
              <div className="flex items-center gap-2 text-white bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{formatDate(collaboration.start_date)}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <motion.h3
            className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-all duration-500 line-clamp-2"
            style={{
              backgroundImage: isHovered ? `linear-gradient(to right, var(--tw-gradient-stops))` : 'none',
              '--tw-gradient-from': '#3b82f6',
              '--tw-gradient-to': '#10b981',
              '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)',
            } as React.CSSProperties}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {collaboration.partner?.company_name || 'Partnership'}
          </motion.h3>

          {collaboration.partner?.partner_type && (
            <motion.div
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-blue-500 to-green-500 opacity-90 text-white text-xs font-bold flex-shrink-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
            >
              {getPartnerTypeIcon(collaboration.partner.partner_type)}
              <span className="capitalize">{collaboration.partner.partner_type}</span>
            </motion.div>
          )}
        </div>

        <motion.p
          className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Partnership with {collaboration.event_name}
          {collaboration.organizer_name ? ` organized by ${collaboration.organizer_name}` : ''}
        </motion.p>

        {/* Details */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {collaboration.partner?.contact_email && (
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Mail className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <span className="text-sm font-medium truncate">{collaboration.partner.contact_email}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <UserCheck className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <span className="text-sm font-medium">
              Active Collaboration
              {collaboration.organizer_name && (
                <span className="text-green-600 dark:text-green-400 ml-1">with {collaboration.organizer_name}</span>
              )}
            </span>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="flex items-center justify-between pt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {collaboration.partner?.partner_type || 'Partner'}
              </span>
            </div>
            {collaboration.status && (
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                {collaboration.status}
              </div>
            )}
          </div>

          <motion.button
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 text-sm"
            whileTap={{ scale: 0.95 }}
            whileHover={{ boxShadow: `0 15px 30px -8px rgba(59, 130, 246, 0.3)`, y: -1 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewDetails(collaboration);
            }}
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Details</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500 to-green-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 -z-10"
        initial={{ scale: 0.8 }}
        animate={{ scale: isHovered ? 1.1 : 0.8 }}
        transition={{ duration: 0.5 }}
      />
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

      // Normalize: events -> collaborations
      const processed: Collaboration[] = [];
      (data.events || []).forEach((event: any) => {
        (event.collaborations || []).forEach((collab: any) => {
          processed.push({
            ...collab,
            event_name: event.event_name,
            organizer_name: event.organizer_name,
            event_id: event.event_id,
          });
        });
      });

      if (reset || page === 1) {
        setCollaborations(processed);
        setCurrentPage(1);
      } else {
        setCollaborations(prev => [...prev, ...processed]);
      }
      setHasMore(Boolean(data.has_next));
      setStats({
        totalPartnerships: data.total_collaborations || processed.length,
        activeCollaborations: processed.filter(c => String(c.status).toLowerCase() === 'active').length,
        totalEvents: (data.events || []).length,
        totalPartners: new Set(processed.map(c => c.partner?.id).filter(Boolean)).size,
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
        String(collab.organizer_name || '').toLowerCase().includes(q)
      );
    });
  }, [collaborations, searchQuery]);

  const sortedCollaborations = useMemo(() => {
    const sorted = [...filteredCollaborations];
    switch (activeTab) {
      case 'active':
        return sorted.filter(c => String(c.status).toLowerCase() === 'active');
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

        <main className="py-6 sm:py-8 lg:py-12 pt-20 sm:pt-24 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="mb-8 sm:mb-12" initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12 lg:mb-16">
                <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white mb-4 sm:mb-6 shadow-lg shadow-blue-500/25">
                  <Handshake className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">Event Partnerships & Collaborations</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent leading-tight">
                  Strategic<br />Partnerships
                </h1>

                <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
                  Discover successful partnerships and collaborations that make events extraordinary. Connect with sponsors, vendors, and media partners.
                </p>

                <div className="max-w-2xl mx-auto mb-8 sm:mb-12 px-4">
                  <div className="relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      placeholder="Search partnerships, events, or companies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-4 sm:pr-6 py-3 sm:py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-300"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-green-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12 lg:mb-16">
                <StatsCard icon={<Handshake />} value={stats.totalPartnerships} label="Total Partnerships" gradient="bg-gradient-to-br from-blue-500 to-green-500" />
                <StatsCard icon={<UserCheck />} value={stats.activeCollaborations} label="Active Collaborations" gradient="bg-gradient-to-br from-blue-500 to-green-500" />
                <StatsCard icon={<Calendar />} value={stats.totalEvents} label="Events with Partnerships" gradient="bg-gradient-to-br from-blue-500 to-green-500" />
                <StatsCard icon={<Building />} value={stats.totalPartners} label="Partner Companies" gradient="bg-gradient-to-br from-blue-500 to-green-500" />
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                      Active Partnerships
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{sortedCollaborations.length} partnerships found</p>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                    <Button
                      variant="outline"
                      onClick={() => fetchCollaborations(1, true)}
                      disabled={loading}
                      className="border-gray-200 dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 dark:hover:from-blue-900/20 dark:hover:to-green-900/20 transition-all duration-300"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(String(v))} className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-lg">
                    <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 text-xs sm:text-sm">All</TabsTrigger>
                    <TabsTrigger value="active" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 text-xs sm:text-sm">Active</TabsTrigger>
                    <TabsTrigger value="official_partner" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 text-xs sm:text-sm">Official Partner</TabsTrigger>
                    <TabsTrigger value="collaborator" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 text-xs sm:text-sm">Collaborator</TabsTrigger>
                    <TabsTrigger value="media_partner" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 text-xs sm:text-sm">Media Partner</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-4 sm:mt-6">
                    {loading ? (
                      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
                            <div className="h-40 sm:h-48 lg:h-56 w-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700" />
                            <div className="p-3 sm:p-4 lg:p-6 space-y-4">
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
                              <div className="text-3xl sm:text-4xl animate-bounce">⚠️</div>
                              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-ping" />
                            </div>
                            <p className="text-base sm:text-lg font-medium text-red-600 dark:text-red-400">{error}</p>
                          </div>
                        )}

                        {!error && sortedCollaborations.length === 0 && (
                          <div className="text-center py-12 sm:py-20">
                            <div className="relative inline-block mb-4 sm:mb-6">
                              <div className="text-6xl sm:text-8xl animate-bounce">🤝</div>
                              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 h-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-full blur-sm" />
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">No partnerships found</h3>
                            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 px-4">Try adjusting your search or explore different partnership categories</p>
                            <Button
                              onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
                              className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Clear Filters
                            </Button>
                          </div>
                        )}

                        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          <AnimatePresence>
                            {sortedCollaborations.map((collaboration, index) => (
                              <PartnershipCard
                                key={`${collaboration.id || index}-${collaboration.event_id || 'e'}`}
                                collaboration={collaboration}
                                index={index}
                                onViewDetails={handleViewDetails}
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
                              <span className="text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base">Loading more partnerships...</span>
                            </div>
                          </div>
                        )}

                        <div ref={loadMoreRef} className="h-10 w-full" />

                        {!hasMore && sortedCollaborations.length > 0 && (
                          <div className="text-center py-8 sm:py-12">
                            <div className="inline-flex items-center px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-full border border-blue-200/50 dark:border-gray-600 shadow-lg">
                              <Handshake className="w-4 h-4 text-blue-600 dark:text-blue-300 mr-2" />
                              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">You've explored all available partnerships!</span>
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

        {/* Partnership Details Dialog */}
        <Dialog open={!!selectedCollaboration} onOpenChange={(open) => { if (!open) setSelectedCollaboration(null); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl mx-4">
            <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                {selectedCollaboration?.partner?.company_name || 'Partnership Details'}
              </DialogTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30">
                    <Handshake className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <span className="font-medium text-sm sm:text-base">{selectedCollaboration?.event_name}</span>
                </div>
                {selectedCollaboration?.organizer_name && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30">
                      <Building className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-300" />
                    </div>
                    <span className="font-medium text-sm sm:text-base">by {selectedCollaboration.organizer_name}</span>
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
                      <h4 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25">
                          <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        Partner Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                          <span className="text-gray-600 dark:text-gray-300 text-sm">Company:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{selectedCollaboration.partner?.company_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                          <span className="text-gray-600 dark:text-gray-300 text-sm">Type:</span>
                          <span className="font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent text-sm capitalize">{selectedCollaboration.partner?.partner_type || 'Partner'}</span>
                        </div>
                        {selectedCollaboration.partner?.contact_email && (
                          <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                            <span className="text-gray-600 dark:text-gray-300 text-sm">Contact:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{selectedCollaboration.partner.contact_email}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                          <span className="text-gray-600 dark:text-gray-300 text-sm">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedCollaboration.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                            {selectedCollaboration.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                      <h4 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-white shadow-lg shadow-green-500/25">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        Event Information
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{selectedCollaboration.event_name}</h5>
                          {selectedCollaboration.organizer_name && (
                            <p className="text-sm text-gray-600 dark:text-gray-300">Organized by {selectedCollaboration.organizer_name}</p>
                          )}
                        </div>

                        {selectedCollaboration.collaboration_type && (
                          <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                            <span className="text-gray-600 dark:text-gray-300 text-sm">Collaboration Type:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm capitalize">{selectedCollaboration.collaboration_type}</span>
                          </div>
                        )}

                        {selectedCollaboration.contribution && (
                          <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            <h6 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">Contribution:</h6>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{selectedCollaboration.contribution}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                  {selectedCollaboration.partner?.contact_email && (
                    <Button
                      onClick={() => window.open(`mailto:${selectedCollaboration.partner.contact_email}`, '_blank')}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-2 sm:py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                    >
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Contact Partner
                    </Button>
                  )}

                  <Button
                    onClick={() => navigate(`/events?event_ids=${selectedCollaboration.event_id}`)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-2 sm:py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  >
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    View Event
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleShare(selectedCollaboration)}
                    className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 dark:hover:from-blue-900/20 dark:hover:to-green-900/20 bg-white dark:bg-gray-800 font-semibold py-2 sm:py-3 rounded-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
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
