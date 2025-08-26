import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  MapPin,
  Star,
  Search,
  Globe,
  Calendar,
  Filter,
  Grid,
  List,
  TrendingUp,
  Eye,
  Navigation,
  Phone,
  Clock,
  Users,
  Heart,
  Share2,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Award,
  Camera,
  Music,
  Coffee,
  Wifi,
  Car,
  Utensils,
  ShieldCheck,
  Activity,
  Mail,
  Building,
  ArrowUpDown,
  RefreshCw,
  Menu,
  X
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

// Interfaces
interface Event {
  id: number;
  name: string;
  description?: string;
  date: string;
  start_time: string;
  end_time?: string;
  city: string;
  location: string;
  amenities: string[];
  image?: string;
  category?: string;
  featured: boolean;
  organizer: {
    id: number;
    company_name: string;
    company_logo?: string;
    company_description?: string;
  };
  likes_count: number;
}

interface City {
  city: string;
  event_count: number;
  top_amenities: string[];
}

interface VenueLocation {
  location: string;
  city: string;
  events: Event[];
  totalEvents: number;
  uniqueAmenities: string[];
  topEvent?: Event;
  avgRating: number;
}

interface LocationFilters {
  city: string;
  location?: string;
  amenity?: string;
  time_filter: 'upcoming' | 'today' | 'past' | 'all';
  sort_by: 'date' | 'name';
  sort_order: 'asc' | 'desc';
}

// Floating background shapes component with updated gradients
const FloatingShapes = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-400/10 via-teal-400/10 to-mint-500/10 rounded-full blur-xl"
      animate={{
        x: [0, 100, 0],
        y: [0, -50, 0],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }}
    />
    <motion.div
      className="absolute top-60 right-20 w-24 h-24 bg-gradient-to-br from-teal-400/10 via-mint-400/10 to-emerald-500/10 rounded-full blur-xl"
      animate={{
        x: [0, -80, 0],
        y: [0, 60, 0],
        rotate: [0, -180, -360],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "linear"
      }}
    />
    <motion.div
      className="absolute bottom-40 left-1/3 w-40 h-40 bg-gradient-to-br from-mint-500/5 via-teal-500/5 to-emerald-500/5 rounded-full blur-2xl"
      animate={{
        scale: [1, 1.2, 1],
        x: [0, 50, 0],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  </div>
);

// City Selection Component with Pagination and updated styling
const CitySelector = ({ cities, selectedCity, onCitySelect, isLoading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const citiesPerPage = 12;

  const filteredCities = useMemo(() => {
    return cities.filter(city =>
      city.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cities, searchTerm]);

  const totalPages = Math.ceil(filteredCities.length / citiesPerPage);
  const startIndex = (currentPage - 1) * citiesPerPage;
  const currentCities = filteredCities.slice(startIndex, startIndex + citiesPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-600 via-teal-600 to-mint-600 bg-clip-text text-transparent">Select City</h3>
        <span className="text-sm text-gray-500">{filteredCities.length} cities available</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search cities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 focus:border-emerald-400 focus:ring-emerald-400/20"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentCities.map((city) => (
              <motion.button
                key={city.city}
                onClick={() => onCitySelect(city.city)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                  selectedCity === city.city
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 via-teal-50 to-mint-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-mint-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 hover:bg-gradient-to-br hover:from-emerald-50/50 hover:via-teal-50/50 hover:to-mint-50/50 dark:hover:from-emerald-900/10 dark:hover:via-teal-900/10 dark:hover:to-mint-900/10'
                }`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Gradient border animation for selected city */}
                {selectedCity === city.city && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-mint-500 opacity-20 rounded-xl"
                    animate={{ opacity: [0.2, 0.3, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                
                <div className="relative z-10">
                  <div className="font-medium text-gray-900 dark:text-white">{city.city}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {city.event_count} venues
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {city.top_amenities.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} className="text-xs bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" : "border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50"}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Modern Venue Card Component with Event Card styling
const VenueCard = ({ venue, index, onViewDetails }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getAmenityIcon = (amenity) => {
    const iconMap = {
      'wifi': <Wifi className="w-4 h-4" />,
      'parking': <Car className="w-4 h-4" />,
      'food': <Utensils className="w-4 h-4" />,
      'music': <Music className="w-4 h-4" />,
      'coffee': <Coffee className="w-4 h-4" />,
      'security': <ShieldCheck className="w-4 h-4" />,
      'activities': <Activity className="w-4 h-4" />,
    };
    return iconMap[amenity.toLowerCase()] || <Star className="w-4 h-4" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-800/50 cursor-pointer"
      onClick={() => onViewDetails(venue)}
    >
      {/* Gradient Border Animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-mint-500 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500"
        style={{ padding: '2px' }}
      >
        <div className="w-full h-full bg-white dark:bg-gray-900 rounded-3xl" />
      </motion.div>

      {/* Content Container */}
      <div className="relative z-10 p-0 h-full">
        
        {/* Image Section with Overlays */}
        <div className="relative h-56 overflow-hidden rounded-t-3xl">
          {/* Background Image */}
          {venue.topEvent?.image ? (
            <motion.img
              src={venue.topEvent.image}
              alt={venue.location}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-teal-500 to-mint-600 flex items-center justify-center relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-teal-400/20 to-mint-500/20"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <span className="text-6xl font-bold text-white relative z-10 drop-shadow-2xl">
                {venue.location.charAt(0)}
              </span>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 via-teal-500/10 to-mint-500/5 group-hover:from-emerald-500/30 group-hover:via-teal-500/20 group-hover:to-mint-500/10 transition-all duration-500" />
          
          {/* Dark Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            {/* Featured Badge */}
            {venue.totalEvents > 10 && (
              <motion.div
                className="px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-emerald-400 via-teal-400 to-mint-500 shadow-lg backdrop-blur-sm flex items-center gap-1"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              >
                <Star className="w-3 h-3 fill-current" />
                POPULAR
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLiked(!isLiked);
                }}
                className={`p-2 rounded-full backdrop-blur-md border border-white/20 transition-all duration-300 ${
                  isLiked
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-110'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
              >
                <Heart className={`w-4 h-4 transition-all duration-300 ${isLiked ? 'fill-current' : ''}`} />
              </motion.button>
              
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBookmarked(!isBookmarked);
                }}
                className={`p-2 rounded-full backdrop-blur-md border border-white/20 transition-all duration-300 ${
                  isBookmarked
                    ? 'bg-gradient-to-r from-teal-500 to-mint-500 text-white shadow-lg scale-110'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
              >
                <Bookmark className={`w-4 h-4 transition-all duration-300 ${isBookmarked ? 'fill-current' : ''}`} />
              </motion.button>
            </div>
          </div>

          {/* Bottom Info Bar */}
          <div className="absolute bottom-4 left-4 right-4">
            <motion.div
              className="flex items-center justify-between"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {/* Rating */}
              <div className="flex items-center gap-2 text-white bg-black/40 backdrop-blur-md px-3 py-2 rounded-full border border-white/20">
                <Star className="w-4 h-4 fill-current text-yellow-400" />
                <span className="text-sm font-medium">{venue.avgRating.toFixed(1)}</span>
              </div>

              {/* Events Count */}
              <div className="flex items-center gap-2 text-white bg-gradient-to-r from-emerald-500/80 to-teal-500/80 backdrop-blur-md px-3 py-2 rounded-full border border-white/20 shadow-lg">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{venue.totalEvents} Events</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          
          {/* Title and Trending Indicator */}
          <div className="flex items-start justify-between gap-3">
            <motion.h3
              className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:via-teal-600 group-hover:to-mint-600 group-hover:bg-clip-text transition-all duration-500 line-clamp-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {venue.location}
            </motion.h3>
            
            {venue.totalEvents > 20 && (
              <motion.div
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-mint-500 text-white text-xs font-bold flex-shrink-0"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
              >
                <TrendingUp className="w-3 h-3" />
                HOT
              </motion.div>
            )}
          </div>

          {/* Location */}
          <motion.div
            className="flex items-center gap-3 text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-100 via-teal-100 to-mint-100 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-mint-900/20">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium">{venue.city}</span>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex items-center justify-between text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
              <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-100 via-teal-100 to-mint-100 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-mint-900/20">
                <Users className="w-4 h-4 text-teal-600" />
              </div>
              <span className="font-medium">{venue.totalEvents} Events</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
              <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-100 via-teal-100 to-mint-100 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-mint-900/20">
                <Award className="w-4 h-4 text-mint-600" />
              </div>
              <span className="font-medium">{venue.avgRating.toFixed(1)} Rating</span>
            </div>
          </motion.div>

          {/* Amenities */}
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {venue.uniqueAmenities.slice(0, 4).map((amenity, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-mint-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-mint-900/20 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium border border-emerald-200/50 dark:border-emerald-700/50"
              >
                {getAmenityIcon(amenity)}
                <span className="capitalize">{amenity}</span>
              </div>
            ))}
            {venue.uniqueAmenities.length > 4 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                +{venue.uniqueAmenities.length - 4} more
              </span>
            )}
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(venue);
              }}
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-mint-500 hover:from-emerald-600 hover:via-teal-600 hover:to-mint-600 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30"
            >
              <span>Explore Venue</span>
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-400 via-teal-400 to-mint-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10"
        initial={{ scale: 0.8 }}
        animate={{ scale: isHovered ? 1.1 : 0.8 }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  );
};

const Venues = () => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [availableFilters, setAvailableFilters] = useState({
    locations: [],
    amenities: [],
    time_filters: ['upcoming', 'today', 'past', 'all']
  });
  const [filters, setFilters] = useState({
    city: '',
    location: '',
    amenity: '',
    time_filter: 'upcoming',
    sort_by: 'date',
    sort_order: 'asc'
  });

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const loadMoreRef = useRef(null);

  // Fetch cities on component mount
  useEffect(() => {
    fetchCities();
  }, []);

  // Set initial city from URL params
  useEffect(() => {
    const cityFromParams = searchParams.get('city');
    if (cityFromParams && cities.length > 0) {
      setSelectedCity(cityFromParams);
      setFilters(prev => ({ ...prev, city: cityFromParams }));
    }
  }, [cities, searchParams]);

  // Fetch events when city or filters change
  useEffect(() => {
    if (selectedCity) {
      fetchCityEvents(1, true);
    }
  }, [selectedCity, filters.location, filters.amenity, filters.time_filter, filters.sort_by, filters.sort_order]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore && selectedCity) {
          fetchCityEvents(currentPage + 1, false);
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [currentPage, hasMore, isLoadingMore, selectedCity]);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cities`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch cities');

      const data = await response.json();
      setCities(data.cities || []);
    } catch (err) {
      setError('Failed to load cities');
      console.error('Error fetching cities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCityEvents = async (page = 1, reset = false) => {
    if (!selectedCity) return;
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
        ...(filters.location && { location: filters.location }),
        ...(filters.amenity && { amenity: filters.amenity }),
        time_filter: filters.time_filter,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order
      });
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/events/city/${encodeURIComponent(selectedCity)}?${params}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();

      // Group events by location to create venues
      const venueMap = new Map();

      data.events.forEach(event => {
        const key = event.location;
        if (!venueMap.has(key)) {
          venueMap.set(key, {
            location: event.location,
            city: event.city,
            events: [],
            totalEvents: 0,
            uniqueAmenities: new Set(),
            topEvent: null,
            avgRating: 4.0 + Math.random() * 1.0 // Mock rating
          });
        }

        const venue = venueMap.get(key);
        venue.events.push(event);
        venue.totalEvents++;

        // Add amenities
        if (event.amenities) {
          event.amenities.forEach(amenity => venue.uniqueAmenities.add(amenity));
        }

        // Set top event (featured or first)
        if (!venue.topEvent || event.featured) {
          venue.topEvent = event;
        }
      });

      // Convert to array and process
      const processedVenues = Array.from(venueMap.values()).map(venue => ({
        ...venue,
        uniqueAmenities: Array.from(venue.uniqueAmenities)
      }));

      if (reset || page === 1) {
        setVenues(processedVenues);
        setCurrentPage(1);
      } else {
        setVenues(prev => [...prev, ...processedVenues]);
      }
      setCurrentPage(page);
      setHasMore(data.pagination.has_next);
      setAvailableFilters(data.available_filters || {
        locations: [],
        amenities: [],
        time_filters: ['upcoming', 'today', 'past', 'all']
      });
    } catch (err) {
      setError('Failed to load venues');
      console.error('Error fetching city events:', err);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setFilters(prev => ({ ...prev, city }));
    setSearchParams({ city });
    setVenues([]);
    setCurrentPage(1);
    setHasMore(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setVenues([]);
    setCurrentPage(1);
    setHasMore(true);
  };

  const handleViewDetails = (venue) => {
    setSelectedVenue(venue);
  };

  const handleGetDirections = (venue) => {
    const query = encodeURIComponent(`${venue.location}, ${venue.city}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(mapsUrl, '_blank');
  };

  const handleShare = (venue) => {
    const shareData = {
      title: venue.location,
      text: `Check out this venue in ${venue.city}!`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const filteredVenues = useMemo(() => {
    return venues.filter(venue => {
      const matchesSearch = !searchQuery ||
        venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.city.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [venues, searchQuery]);

  const sortedVenues = useMemo(() => {
    const sorted = [...filteredVenues];
    switch (activeTab) {
      case 'trending':
        return sorted.sort((a, b) => b.totalEvents - a.totalEvents);
      case 'top-rated':
        return sorted.sort((a, b) => b.avgRating - a.avgRating);
      case 'nearby':
        return sorted.sort(() => Math.random() - 0.5);
      default:
        return sorted;
    }
  }, [filteredVenues, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 text-gray-900 dark:text-gray-100 relative">
      <Navbar />
      <FloatingShapes />

      <main className="py-12 pt-24 relative z-10">
        <div className="container mx-auto px-4">

          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-mint-600 bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Discover Venues
            </motion.h1>
            <motion.p
              className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Find the perfect venues for events in cities worldwide
            </motion.p>
          </motion.div>

          {/* City Selection */}
          {!selectedCity && (
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <CitySelector
                cities={cities}
                selectedCity={selectedCity}
                onCitySelect={handleCitySelect}
                isLoading={loading}
              />
            </motion.div>
          )}

          {/* City Events Section */}
          {selectedCity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* City Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCity('');
                      setSearchParams({});
                    }}
                    className="border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Cities
                  </Button>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-mint-600 bg-clip-text text-transparent">
                      {selectedCity}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      {venues.length} venues found
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchCityEvents(1, true)}
                    disabled={loading}
                    className="border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-8 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search venues..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                    </div>
                  </div>

                  {/* Location Filter */}
                  <select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 focus:border-emerald-400"
                  >
                    <option value="">All Locations</option>
                    {availableFilters.locations?.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>

                  {/* Amenity Filter */}
                  <select
                    value={filters.amenity}
                    onChange={(e) => handleFilterChange('amenity', e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 focus:border-emerald-400"
                  >
                    <option value="">All Amenities</option>
                    {availableFilters.amenities?.map(amenity => (
                      <option key={amenity} value={amenity}>{amenity}</option>
                    ))}
                  </select>

                  {/* Time Filter */}
                  <select
                    value={filters.time_filter}
                    onChange={(e) => handleFilterChange('time_filter', e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 focus:border-emerald-400"
                  >
                    <option value="upcoming">Upcoming Events</option>
                    <option value="today">Today</option>
                    <option value="past">Past Events</option>
                    <option value="all">All Events</option>
                  </select>

                  {/* View Toggle */}
                  <div className="flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50 p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={viewMode === 'grid' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : ''}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={viewMode === 'list' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : ''}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                  <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">All Venues</TabsTrigger>
                  <TabsTrigger value="trending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">Trending</TabsTrigger>
                  <TabsTrigger value="top-rated" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">Top Rated</TabsTrigger>
                  <TabsTrigger value="nearby" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">Popular</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                  {loading ? (
                    <div className={`grid gap-6 ${
                      viewMode === 'grid'
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        : 'grid-cols-1 max-w-4xl mx-auto'
                    }`}>
                      {Array(6).fill(0).map((_, index) => (
                        <div key={index} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg border border-white/20 dark:border-gray-700/50">
                          <Skeleton className="h-48 w-full" />
                          <div className="p-6 space-y-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <div className="flex gap-2">
                              <Skeleton className="h-6 w-16" />
                              <Skeleton className="h-6 w-16" />
                            </div>
                            <Skeleton className="h-10 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {error && (
                        <div className="text-center text-red-500 py-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                          <div className="text-4xl mb-4">⚠️</div>
                          <p className="text-lg font-medium">{error}</p>
                        </div>
                      )}

                      {!error && sortedVenues.length === 0 && (
                        <div className="text-center py-20">
                          <div className="text-8xl mb-6">🏢</div>
                          <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-mint-600 bg-clip-text text-transparent mb-4">
                            No venues found
                          </h3>
                          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                            Try adjusting your search or filters
                          </p>
                          <Button
                            onClick={() => {
                              setSearchQuery('');
                              setFilters(prev => ({ ...prev, location: '', amenity: '' }));
                            }}
                            className="bg-gradient-to-r from-emerald-500 via-teal-500 to-mint-500 text-white"
                          >
                            Clear Filters
                          </Button>
                        </div>
                      )}

                      {/* Venues Grid */}
                      <div className={`grid gap-6 ${
                        viewMode === 'grid'
                          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                          : 'grid-cols-1 max-w-4xl mx-auto'
                      }`}>
                        <AnimatePresence>
                          {sortedVenues.map((venue, index) => (
                            <VenueCard
                              key={`${venue.location}-${venue.city}`}
                              venue={venue}
                              index={index}
                              onViewDetails={handleViewDetails}
                            />
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* Loading More Indicator */}
                      {isLoadingMore && (
                        <div className="flex justify-center items-center py-12">
                          <div className="flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                            <span className="text-gray-600 dark:text-gray-300">Loading more venues...</span>
                          </div>
                        </div>
                      )}

                      {/* Load More Trigger */}
                      <div ref={loadMoreRef} className="h-10 w-full" />

                      {/* End Message */}
                      {!hasMore && sortedVenues.length > 0 && (
                        <div className="text-center py-12">
                          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-mint-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-mint-900/20 rounded-full border border-emerald-200/50 dark:border-emerald-700/50">
                            <span className="text-gray-700 dark:text-gray-300">
                              You've explored all venues in {selectedCity}!
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />

      {/* Venue Details Modal */}
      <Dialog open={!!selectedVenue} onOpenChange={() => setSelectedVenue(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-mint-600 bg-clip-text text-transparent">
              {selectedVenue?.location}
            </DialogTitle>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>{selectedVenue?.city}</span>
            </div>
          </DialogHeader>

          {selectedVenue && (
            <div className="space-y-6">
              {/* Hero Image */}
              {selectedVenue.topEvent?.image && (
                <div className="relative h-64 rounded-xl overflow-hidden">
                  <img
                    src={selectedVenue.topEvent.image}
                    alt={selectedVenue.location}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                  {/* Stats Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                    <div className="bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{selectedVenue.avgRating.toFixed(1)}</span>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{selectedVenue.totalEvents} Events</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Venue Info */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-mint-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-mint-900/20 rounded-xl p-6 border border-emerald-200/50 dark:border-emerald-700/50">
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Building className="w-5 h-5 text-emerald-500" />
                      Venue Details
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Location:</span>
                        <span className="font-medium">{selectedVenue.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">City:</span>
                        <span className="font-medium">{selectedVenue.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Total Events:</span>
                        <span className="font-medium">{selectedVenue.totalEvents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Rating:</span>
                        <span className="font-medium">{selectedVenue.avgRating.toFixed(1)}/5.0</span>
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="bg-gradient-to-br from-teal-50 via-mint-50 to-emerald-50 dark:from-teal-900/20 dark:via-mint-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-teal-200/50 dark:border-teal-700/50">
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Award className="w-5 h-5 text-teal-500" />
                      Available Amenities
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedVenue.uniqueAmenities.map((amenity, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg"
                        >
                          {(() => {
                            const iconMap = {
                              'wifi': <Wifi className="w-4 h-4 text-blue-500" />,
                              'parking': <Car className="w-4 h-4 text-gray-600" />,
                              'food': <Utensils className="w-4 h-4 text-orange-500" />,
                              'music': <Music className="w-4 h-4 text-purple-500" />,
                              'coffee': <Coffee className="w-4 h-4 text-amber-600" />,
                              'security': <ShieldCheck className="w-4 h-4 text-green-500" />,
                              'activities': <Activity className="w-4 h-4 text-red-500" />,
                            };
                            return iconMap[amenity.toLowerCase()] || <Star className="w-4 h-4 text-yellow-500" />;
                          })()}
                          <span className="capitalize text-sm">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Events */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-mint-50 via-emerald-50 to-teal-50 dark:from-mint-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-mint-200/50 dark:border-mint-700/50">
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-mint-600" />
                      Recent Events
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedVenue.events.slice(0, 5).map(event => (
                        <div
                          key={event.id}
                          className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300"
                        >
                          <h5 className="font-medium text-sm mb-1">{event.name}</h5>
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 gap-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{event.start_time}</span>
                            </div>
                          </div>
                          {event.category && (
                            <span className="inline-block mt-2 px-2 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">
                              {event.category}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => handleGetDirections(selectedVenue)}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>

                <Button
                  onClick={() => navigate(`/events?city=${encodeURIComponent(selectedVenue.city)}&location=${encodeURIComponent(selectedVenue.location)}`)}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-mint-500 hover:from-teal-600 hover:to-mint-600 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View All Events
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleShare(selectedVenue)}
                  className="flex-1 border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Venue
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Venues;