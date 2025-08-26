import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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

// Navbar Toggle Component
const NavbarToggle = () => {
  const [showNavbarOnPage, setShowNavbarOnPage] = useState(false);

  const toggleNavbarVisibility = () => {
    setShowNavbarOnPage(!showNavbarOnPage);
    // Trigger a custom event that the navbar can listen to
    window.dispatchEvent(new CustomEvent('toggleNavbar', { 
      detail: { show: !showNavbarOnPage } 
    }));
  };

  // Listen for navbar state changes
  useEffect(() => {
    const handleNavbarToggle = (event) => {
      setShowNavbarOnPage(event.detail.show);
    };

    window.addEventListener('toggleNavbar', handleNavbarToggle);
    return () => window.removeEventListener('toggleNavbar', handleNavbarToggle);
  }, []);

  return (
    <div className="fixed top-4 left-4 z-50">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleNavbarVisibility}
        className="w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      >
        {showNavbarOnPage ? (
          <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        )}
      </Button>
    </div>
  );
};

// Floating background shapes component
const FloatingShapes = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      className="absolute top-20 left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-xl"
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
      className="absolute top-60 right-20 w-24 h-24 bg-green-500/5 rounded-full blur-xl"
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
      className="absolute bottom-40 left-1/3 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl"
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

// City Selection Component with Pagination
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Select City</h3>
        <span className="text-sm text-gray-500">{filteredCities.length} cities available</span>
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search cities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
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
                className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                  selectedCity === city.city
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="font-medium">{city.city}</div>
                <div className="text-sm text-gray-500">
                  {city.event_count} venues
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {city.top_amenities.slice(0, 3).map((amenity, idx) => (
                    <span key={idx} className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                      {amenity}
                    </span>
                  ))}
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

// Modern Venue Card Component
const VenueCard = ({ venue, index, onViewDetails }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {venue.topEvent?.image ? (
          <img
            src={venue.topEvent.image}
            alt={venue.location}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-4xl font-bold text-white">
              {venue.location.charAt(0)}
            </span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className={`p-2 rounded-full transition-all duration-300 ${
              isLiked 
                ? 'bg-red-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsBookmarked(!isBookmarked);
            }}
            className={`p-2 rounded-full transition-all duration-300 ${
              isBookmarked 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-4 left-4 bg-yellow-400 text-black px-3 py-1 rounded-full flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          <span className="text-sm font-semibold">{venue.avgRating.toFixed(1)}</span>
        </div>

        {/* Events Count */}
        <div className="absolute bottom-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full">
          <span className="text-sm font-medium">{venue.totalEvents} Events</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {venue.location}
          </h3>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mt-1">
            <MapPin className="w-4 h-4 mr-1 text-blue-500" />
            <span>{venue.city}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <Users className="w-4 h-4 text-purple-500" />
            <span>{venue.totalEvents} Events</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <Award className="w-4 h-4 text-yellow-500" />
            <span>{venue.avgRating.toFixed(1)} Rating</span>
          </div>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2">
          {venue.uniqueAmenities.slice(0, 4).map((amenity, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs"
            >
              {getAmenityIcon(amenity)}
              <span className="capitalize">{amenity}</span>
            </div>
          ))}
          {venue.uniqueAmenities.length > 4 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
              +{venue.uniqueAmenities.length - 4} more
            </span>
          )}
        </div>

        {/* Action Button */}
        <Button
          onClick={() => onViewDetails(venue)}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all duration-300"
        >
          <span>Explore Venue</span>
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
      {/* Navbar Toggle Button */}
      <NavbarToggle />
      
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
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Discover Venues
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Find the perfect venues for events in cities worldwide
            </p>
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
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Cities
                  </Button>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                      {selectedCity}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      {venues.length} venues found
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => fetchCityEvents(1, true)}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
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
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Location Filter */}
                  <select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
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
                    className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
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
                    className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="upcoming">Upcoming Events</option>
                    <option value="today">Today</option>
                    <option value="past">Past Events</option>
                    <option value="all">All Events</option>
                  </select>

                  {/* View Toggle */}
                  <div className="flex bg-white dark:bg-gray-800 rounded-lg border p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All Venues</TabsTrigger>
                    <TabsTrigger value="trending">Trending</TabsTrigger>
                    <TabsTrigger value="top-rated">Top Rated</TabsTrigger>
                    <TabsTrigger value="nearby">Popular</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-6">
                    {loading ? (
                      <div className={`grid gap-6 ${
                        viewMode === 'grid' 
                          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                          : 'grid-cols-1 max-w-4xl mx-auto'
                      }`}>
                        {Array(6).fill(0).map((_, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
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
                            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
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
                              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
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
                            <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 rounded-full shadow-lg">
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
                            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full">
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
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Venue Details Modal */}
      <Dialog open={!!selectedVenue} onOpenChange={() => setSelectedVenue(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {selectedVenue?.location}
            </DialogTitle>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <MapPin className="w-4 h-4 text-blue-500" />
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
                    <div className="bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-500" />
                      <span className="font-medium">{selectedVenue.totalEvents} Events</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Venue Info */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Building className="w-5 h-5 text-blue-500" />
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
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Award className="w-5 h-5 text-green-500" />
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
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-500" />
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
                            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
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
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
                
                <Button
                  onClick={() => navigate(`/events?city=${encodeURIComponent(selectedVenue.city)}&location=${encodeURIComponent(selectedVenue.location)}`)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View All Events
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleShare(selectedVenue)}
                  className="flex-1"
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