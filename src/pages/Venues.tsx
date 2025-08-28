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
  X,
  Ticket,
  Tag
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

// Floating background shapes component with blue-cyan gradients
const FloatingShapes = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 via-cyan-400/10 to-blue-500/10 rounded-full blur-xl"
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
      className="absolute top-60 right-20 w-24 h-24 bg-gradient-to-br from-cyan-400/10 via-blue-400/10 to-cyan-500/10 rounded-full blur-xl"
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
      className="absolute bottom-40 left-1/3 w-40 h-40 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-blue-500/5 rounded-full blur-2xl"
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

// City Selection Component with Pagination and updated blue-cyan styling
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
        <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">Select City</h3>
        <span className="text-sm text-gray-500">{filteredCities.length} cities available</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search cities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 focus:border-blue-400 focus:ring-blue-400/20"
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
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50/50 hover:via-cyan-50/50 hover:to-blue-50/50 dark:hover:from-blue-900/10 dark:hover:via-cyan-900/10 dark:hover:to-blue-900/10'
                }`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Gradient border animation for selected city */}
                {selectedCity === city.city && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 opacity-20 rounded-xl"
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
                      <span key={idx} className="text-xs bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
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
                className="border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50"
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
                      className={currentPage === pageNum ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white" : "border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50"}
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
                className="border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50"
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

// Modern Venue Card Component with improved visibility and real API data
const VenueCard = ({ venue, index, onViewDetails }: {
  venue: VenueLocation;
  index: number;
  onViewDetails: (venue: VenueLocation) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getAmenityIcon = (amenity: string) => {
    const iconMap: Record<string, React.ReactNode> = {
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

  const getCategoryGradient = () => {
    return 'from-emerald-400 via-teal-400 to-emerald-500';
  };

  const getCategoryIcon = () => {
    return '🏢';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get the next upcoming event or most recent event for display
  const getDisplayEvent = () => {
    if (!venue.events || venue.events.length === 0) return null;

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Sort events by date
    const sortedEvents = [...venue.events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Find next upcoming event
    const upcomingEvent = sortedEvents.find(event => new Date(event.date).getTime() >= currentDate.getTime());

    // Return upcoming event or the most recent event
    return upcomingEvent || sortedEvents[sortedEvents.length - 1];
  };

  // Get event statistics
  const getEventStats = () => {
    if (!venue.events || venue.events.length === 0) {
      return { upcoming: 0, total: venue.totalEvents || 0, nextEventDate: null };
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const upcoming = venue.events.filter(event => new Date(event.date).getTime() >= currentDate.getTime()).length;
    const nextEvent = venue.events
      .filter(event => new Date(event.date).getTime() >= currentDate.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    return {
      upcoming,
      total: venue.totalEvents || venue.events.length,
      nextEventDate: nextEvent ? nextEvent.date : null
    };
  };

  const displayEvent = getDisplayEvent();
  const eventStats = getEventStats();

  return (
    <motion.div
      className="group relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/30 dark:border-gray-800/60 cursor-pointer"
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
      onClick={() => onViewDetails(venue)}
    >
      {/* Subtle Gradient Border Animation */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${getCategoryGradient()} opacity-0 group-hover:opacity-30 rounded-3xl transition-opacity duration-500`}
        style={{ padding: '1px' }}
      >
        <div className="w-full h-full bg-white dark:bg-gray-900 rounded-3xl" />
      </motion.div>

      {/* Content Container */}
      <div className="relative z-10 p-0 h-full">

        {/* Image Section with Improved Overlays */}
        <div className="relative h-56 overflow-hidden rounded-t-3xl">
          {/* Background Image */}
          {displayEvent?.image ? (
            <motion.img
              src={displayEvent.image}
              alt={venue.location}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 flex items-center justify-center relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-teal-400/10 to-emerald-500/10"
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <span className="text-6xl font-bold text-white relative z-10 drop-shadow-2xl">
                {venue.location.charAt(0)}
              </span>
            </div>
          )}

          {/* Lighter Dark Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            {/* Popular Badge */}
            {venue.totalEvents > 5 && (
              <motion.div
                className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getCategoryGradient()} opacity-90 shadow-lg backdrop-blur-sm flex items-center gap-1`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.9 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              >
                <Star className="w-3 h-3 fill-current" />
                POPULAR
              </motion.div>
            )}
          </div>

          {/* Bottom Info Bar */}
          <div className="absolute bottom-4 left-4 right-4">
            <motion.div
              className="flex items-center justify-between"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {/* Category Badge */}
              <div className="flex items-center gap-2 text-white bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                <span>{getCategoryIcon()}</span>
                <span className="text-sm font-medium">Venue</span>
              </div>

              {/* Events Count with Upcoming */}
              <div className="flex items-center gap-2 text-white bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {eventStats.upcoming > 0 ? `${eventStats.upcoming} upcoming` : `${eventStats.total} events`}
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">

          {/* Title and Trending Indicator */}
          <div className="flex items-start justify-between gap-3">
            <motion.h3
              className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-all duration-500 line-clamp-2"
              style={{
                backgroundImage: isHovered ? `linear-gradient(to right, var(--tw-gradient-stops))` : 'none',
                '--tw-gradient-from': '#10b981',
                '--tw-gradient-to': '#06d6a0',
                '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)'
              } as React.CSSProperties}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {venue.location}
            </motion.h3>

            {eventStats.upcoming > 3 && (
              <motion.div
                className={`flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r ${getCategoryGradient()} opacity-90 text-white text-xs font-bold flex-shrink-0`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
              >
                <TrendingUp className="w-3 h-3" />
                ACTIVE
              </motion.div>
            )}
          </div>

          {/* Description */}
          <motion.p
            className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {venue.city} - {eventStats.total} events hosted at this location
            {eventStats.nextEventDate && (
              <span className="block text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                Next event: {formatDate(eventStats.nextEventDate)}
              </span>
            )}
          </motion.p>

          {/* Event Details */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Location */}
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <span className="text-sm font-medium truncate">{venue.city}</span>
            </div>

            {/* Next Event Date */}
            {displayEvent && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Clock className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <span className="text-sm font-medium">
                  {formatDate(displayEvent.date)}
                  {displayEvent.start_time && ` at ${formatTime(displayEvent.start_time)}`}
                </span>
              </div>
            )}

            {/* Events Count with Status */}
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Users className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <span className="text-sm font-medium">
                {eventStats.total} Total Events
                {eventStats.upcoming > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                    ({eventStats.upcoming} upcoming)
                  </span>
                )}
              </span>
            </div>
          </motion.div>

          {/* Amenities with Improved Visibility */}
          {venue.uniqueAmenities && venue.uniqueAmenities.length > 0 && (
            <motion.div
              className="flex flex-wrap gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {venue.uniqueAmenities.slice(0, 4).map((amenity, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium`}
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
          )}

          {/* Event Category from Latest Event */}
          {displayEvent?.category && (
            <motion.div
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Tag className="w-4 h-4" />
              <span>Latest: {displayEvent.category}</span>
            </motion.div>
          )}

          {/* Action Section */}
          <motion.div
            className="flex items-center justify-between pt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Event Statistics */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {eventStats.total}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  events
                </span>
              </div>
              <div className="space-y-1 mt-1">
                {eventStats.upcoming > 0 && (
                  <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {eventStats.upcoming} upcoming
                  </div>
                )}
              </div>
            </div>

            {/* Explore Venue Button */}
            <motion.button
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-500 hover:to-emerald-500 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 text-sm"
              whileTap={{ scale: 0.95 }}
              whileHover={{
                boxShadow: `0 15px 30px -8px rgba(59, 130, 246, 0.3)`,
                y: -1
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onViewDetails(venue);
              }}
            >
              <Ticket className="w-4 h-4" />
              <span>Explore Venue</span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Subtle Hover Glow Effect */}
      <motion.div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${getCategoryGradient()} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 -z-10`}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 text-gray-900 dark:text-gray-100 relative">
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
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-6"
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
                    className="border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Cities
                  </Button>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
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
                    className="border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50"
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
                        className="pl-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 focus:border-blue-400 focus:ring-blue-400/20"
                      />
                    </div>
                  </div>

                  {/* Location Filter */}
                  <select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 focus:border-blue-400"
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
                    className="px-4 py-2 border rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 focus:border-blue-400"
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
                    className="px-4 py-2 border rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 focus:border-blue-400"
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
                      className={viewMode === 'grid' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : ''}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={viewMode === 'list' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : ''}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                  <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">All Venues</TabsTrigger>
                  <TabsTrigger value="trending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">Trending</TabsTrigger>
                  <TabsTrigger value="top-rated" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">Top Rated</TabsTrigger>
                  <TabsTrigger value="nearby" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">Popular</TabsTrigger>
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
                          <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-4">
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
                            className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 text-white"
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
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-gray-600 dark:text-gray-300">Loading more venues...</span>
                          </div>
                        </div>
                      )}

                      {/* Load More Trigger */}
                      <div ref={loadMoreRef} className="h-10 w-full" />

                      {/* End Message */}
                      {!hasMore && sortedVenues.length > 0 && (
                        <div className="text-center py-12">
                          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-blue-900/20 rounded-full border border-blue-200/50 dark:border-blue-700/50">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {selectedVenue?.location}
            </DialogTitle>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
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
                      <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVenue.avgRating.toFixed(1)}</span>
                    </div>
                    <div className="bg-gray-800/90 dark:bg-gray-700/90 text-white px-4 py-2 rounded-full flex items-center gap-2">
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
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Building className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      Venue Details
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Location:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVenue.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">City:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVenue.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Total Events:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVenue.totalEvents}</span>
                      </div>
                      
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Award className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      Available Amenities
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedVenue.uniqueAmenities.map((amenity, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          {(() => {
                            const iconMap = {
                              'wifi': <Wifi className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                              'parking': <Car className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                              'food': <Utensils className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                              'music': <Music className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                              'coffee': <Coffee className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                              'security': <ShieldCheck className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                              'activities': <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                            };
                            return iconMap[amenity.toLowerCase()] || <Star className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
                          })()}
                          <span className="capitalize text-sm text-gray-700 dark:text-gray-300">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Events - Enhanced for Multiple Events */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        Events at this Venue
                      </h4>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedVenue.events.length > 5 ? `Showing 5 of ${selectedVenue.events.length}` : `${selectedVenue.events.length} events`}
                      </div>
                    </div>
                    
                    {selectedVenue.events.length > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {selectedVenue.events.slice(0, 10).map((event, index) => (
                          <div
                            key={event.id || index}
                            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100 flex-1 mr-2">
                                {event.name}
                              </h5>
                              {event.status && (
                                <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                                  event.status === 'active' 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : event.status === 'completed'
                                    ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                }`}>
                                  {event.status}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 gap-4 mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(event.date).toLocaleDateString()}</span>
                              </div>
                              {event.start_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{event.start_time}</span>
                                </div>
                              )}
                              {event.price_per_ticket && (
                                <div className="flex items-center gap-1">
                                  <span>KES {event.price_per_ticket}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              {event.category && (
                                <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                                  {event.category}
                                </span>
                              )}
                              
                              {(event.total_tickets || event.tickets_available) && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {event.tickets_available && event.total_tickets 
                                    ? `${event.tickets_available}/${event.total_tickets} available`
                                    : event.total_tickets 
                                    ? `${event.total_tickets} tickets`
                                    : `${event.tickets_available} available`
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {selectedVenue.events.length > 10 && (
                          <div className="text-center pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/events?city=${encodeURIComponent(selectedVenue.city)}&location=${encodeURIComponent(selectedVenue.location)}`)}
                              className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              View all {selectedVenue.events.length} events
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No events scheduled at this venue</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => handleGetDirections(selectedVenue)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-600 hover:to-[#0f9b76] text-white"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>

                <Button
                  onClick={() => navigate(`/events?city=${encodeURIComponent(selectedVenue.city)}&location=${encodeURIComponent(selectedVenue.location)}`)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-600 hover:to-[#0f9b76] text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View All Events
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleShare(selectedVenue)}
                  className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
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
