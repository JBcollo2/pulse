import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Loader2,
  Zap,
  Award,
  Camera,
  Music,
  Coffee,
  Wifi,
  Car,
  Utensils,
  ShieldCheck,
  Activity,
  Mail // Added missing Mail import
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface Organizer {
  id: number;
  company_name: string;
  company_logo?: string;
  company_description?: string;
  address?: string;
  website?: string;
  phone?: string;
  email?: string;
  media?: { [key: string]: string };
}

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  image?: string;
  start_time: string;
  end_time?: string;
  category?: string;
  category_id?: number;
  likes_count: number;
  organizer: Organizer;
}

interface VenueGroup {
  organizer: Organizer;
  events: Event[];
  locationDetails?: {
    description?: string;
    image?: string;
    rating?: number;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    amenities?: string[];
    capacity?: number;
    established?: string;
  };
  stats?: {
    totalEvents: number;
    avgRating: number;
    totalVisitors: number;
    popularTimes?: string[];
  };
}

interface LocationFilter {
  city: string;
  area?: string;
  distance?: number;
}

// Floating background shapes component
const FloatingShapes = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-xl"
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
      className="absolute top-60 right-20 w-24 h-24 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-full blur-xl"
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
      className="absolute bottom-40 left-1/3 w-40 h-40 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-2xl"
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

// Modern Venue Card Component with new scroll format
interface VenueCardProps {
  venue: VenueGroup;
  index: number;
  onViewDetails: (venue: VenueGroup) => void;
  onLike: (venueId: number) => void;
  onShare: (venue: VenueGroup) => void;
  onBookmark: (venueId: number) => void;
}

const VenueCard: React.FC<VenueCardProps> = ({ venue, index, onViewDetails, onLike, onShare, onBookmark }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onLike(venue.organizer.id);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    onBookmark(venue.organizer.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(venue);
  };

  const getAmenityIcon = (amenity: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
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
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300/50 dark:hover:border-cyan-400/50"
    >
      {/* Image Section with Overlay */}
      <div className="relative h-64 overflow-hidden">
        {venue.locationDetails?.image || venue.organizer.company_logo ? (
          <div className="relative">
            <img
              src={venue.locationDetails?.image || venue.organizer.company_logo}
              alt={venue.organizer.company_name}
              className={`w-full h-64 object-cover transition-all duration-700 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-800 to-cyan-800 animate-pulse" />
            )}
          </div>
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="text-6xl font-bold text-white/80">
              {venue.organizer.company_name.charAt(0)}
            </span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
              isLiked 
                ? 'bg-red-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleBookmark}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
              isBookmarked 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-all duration-300"
          >
            <Share2 className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Rating Badge */}
        {venue.locationDetails?.rating && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-sm font-semibold">{venue.locationDetails.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Trending Badge */}
        {venue.stats && venue.stats.totalEvents > 10 && (
          <div className="absolute bottom-4 left-4 bg-gradient-to-r from-green-400 to-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs font-medium">Popular</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors duration-300">
            {venue.organizer.company_name}
          </h3>
          {venue.organizer.address && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mt-1">
              <MapPin className="w-4 h-4 mr-1 text-blue-500" />
              <span className="truncate">{venue.organizer.address}</span>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
              <Calendar className="w-4 h-4 text-green-500" />
              <span>{venue.events.length} Events</span>
            </div>
            {venue.locationDetails?.capacity && (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                <Users className="w-4 h-4 text-purple-500" />
                <span>{venue.locationDetails.capacity}+</span>
              </div>
            )}
          </div>
          {venue.locationDetails?.established && (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
              <Award className="w-4 h-4 text-yellow-500" />
              <span>Est. {venue.locationDetails.established}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 leading-relaxed">
          {venue.locationDetails?.description || venue.organizer.company_description || 'A premier venue for unforgettable experiences and events.'}
        </p>

        {/* Amenities */}
        {venue.locationDetails?.amenities && venue.locationDetails.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {venue.locationDetails.amenities.slice(0, 4).map((amenity, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs"
              >
                {getAmenityIcon(amenity)}
                <span className="capitalize">{amenity}</span>
              </div>
            ))}
            {venue.locationDetails.amenities.length > 4 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                +{venue.locationDetails.amenities.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={() => onViewDetails(venue)}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 group"
        >
          <span>Explore Venue</span>
          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
        </Button>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-2xl" />
      </div>
    </motion.div>
  );
};

const Venues: React.FC = () => {
  const [venues, setVenues] = useState<VenueGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState<VenueGroup | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalVenues, setTotalVenues] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const VENUES_PER_PAGE = 12;

  // Mock location data for Nairobi areas
  const nairobiAreas = [
    'Westlands', 'Karen', 'Kilimani', 'Lavington', 'Parklands',
    'Kileleshwa', 'Runda', 'Muthaiga', 'Spring Valley', 'Riverside',
    'Upperhill', 'Hurlingham', 'Kilelelshwa', 'Kasarani', 'Embakasi'
  ];

  // Mock amenities for venues
  const mockAmenities = ['wifi', 'parking', 'food', 'music', 'coffee', 'security', 'activities'];

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied or unavailable');
          // Default to Nairobi coordinates
          setUserLocation({
            lat: -1.286389,
            lng: 36.817223
          });
        }
      );
    }
  }, []);

  const searchGooglePlaces = async (query: string, organizerId: number) => {
    try {
      console.log(`[searchGooglePlaces] Starting search for: "${query}" (Organizer: ${organizerId})`);
      
      // Enhanced mock data generation based on location
      const isNairobiLocation = nairobiAreas.some(area => 
        query.toLowerCase().includes(area.toLowerCase())
      );
      
      const area = nairobiAreas[organizerId % nairobiAreas.length];
      const rating = (3.5 + (organizerId % 15) / 10 * 1.5).toFixed(1);
      const capacity = [50, 100, 200, 500, 1000, 1500][organizerId % 6];
      const established = [2015, 2016, 2017, 2018, 2019, 2020][organizerId % 6];
      
      const colors = ['6366f1', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899'];
      const colorIndex = organizerId % colors.length;
      const photoUrl = `https://placehold.co/400x300/${colors[colorIndex]}/ffffff?text=${encodeURIComponent(query.substring(0, 20))}&font=Open+Sans`;
      
      // Generate random amenities
      const shuffledAmenities = [...mockAmenities].sort(() => 0.5 - Math.random());
      const venueAmenities = shuffledAmenities.slice(0, 3 + (organizerId % 4));
      
      const description = `${query} is a premier venue located in ${area}, Nairobi. This venue offers a unique atmosphere perfect for various events and gatherings. Known for its excellent service and modern facilities, it's a favorite choice for both corporate and social events.`;

      return {
        description,
        photos: [photoUrl],
        rating: parseFloat(rating),
        address: `${query}, ${area}, Nairobi, Kenya`,
        coordinates: {
          lat: -1.286389 + (Math.random() - 0.5) * 0.2,
          lng: 36.817223 + (Math.random() - 0.5) * 0.2
        },
        amenities: venueAmenities,
        capacity,
        established: established.toString()
      };
    } catch (error) {
      console.error('[searchGooglePlaces] Error:', error);
      return {
        description: `${query} is a popular venue located in Nairobi. Known for its unique atmosphere and excellent service.`,
        photos: [`https://placehold.co/400x300/6366f1/ffffff?text=${encodeURIComponent(query.substring(0, 20))}&font=Open+Sans`],
        rating: 4.0 + (organizerId % 10) / 10 * 1.5,
        address: `${query}, Nairobi, Kenya`,
        coordinates: {
          lat: -1.286389,
          lng: 36.817223
        },
        amenities: ['wifi', 'parking', 'food'],
        capacity: 200,
        established: '2018'
      };
    }
  };

  const fetchEvents = async (page = 1, reset = false) => {
    setError(null);
    if (page === 1) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const locationParam = locationFilter ? `&location=${encodeURIComponent(locationFilter)}` : '';
      const res = await fetch(`${import.meta.env.VITE_API_URL}/events?page=${page}&per_page=${VENUES_PER_PAGE * 3}${locationParam}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch events');

      const data = await res.json();
      const events: Event[] = data.events || [];

      // Group events by organizer (venue)
      const venueMap: { [key: number]: VenueGroup } = {};
      events.forEach((event: Event) => {
        if (!event.organizer) return;
        const orgId = event.organizer.id;

        if (!venueMap[orgId]) {
          venueMap[orgId] = {
            organizer: event.organizer,
            events: [],
            stats: {
              totalEvents: 0,
              avgRating: 4.0 + (orgId % 10) / 10 * 1.5,
              totalVisitors: 100 + (orgId % 500) * 10,
              popularTimes: ['Evening', 'Weekend']
            }
          };
        }

        venueMap[orgId].events.push(event);
        venueMap[orgId].stats!.totalEvents++;
      });

      const venueGroups = Object.values(venueMap);

      // Add location details to venues
      for (let i = 0; i < venueGroups.length; i++) {
        const venue = venueGroups[i];
        if (venue.organizer.address) {
          try {
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            const placeDetails = await searchGooglePlaces(
              venue.organizer.company_name, 
              venue.organizer.id
            );
            
            venue.locationDetails = {
              description: placeDetails.description,
              image: placeDetails.photos[0],
              rating: placeDetails.rating,
              address: placeDetails.address,
              coordinates: placeDetails.coordinates,
              amenities: placeDetails.amenities,
              capacity: placeDetails.capacity,
              established: placeDetails.established
            };
          } catch (error) {
            console.error(`Error fetching location details for ${venue.organizer.company_name}:`, error);
          }
        }
      }

      if (reset || page === 1) {
        setVenues(venueGroups.slice(0, VENUES_PER_PAGE));
      } else {
        setVenues(prevVenues => {
          const startIndex = (page - 1) * VENUES_PER_PAGE;
          const endIndex = startIndex + VENUES_PER_PAGE;
          const newVenues = venueGroups.slice(startIndex, endIndex);
          
          const existingIds = new Set(prevVenues.map(v => v.organizer.id));
          const filteredNewVenues = newVenues.filter(v => !existingIds.has(v.organizer.id));
          
          return [...prevVenues, ...filteredNewVenues];
        });
      }

      setTotalVenues(venueGroups.length);
      setHasMore(venueGroups.length > page * VENUES_PER_PAGE);
      setCurrentPage(page);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreVenues = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchEvents(currentPage + 1);
    }
  }, [currentPage, isLoadingMore, hasMore]);

  // Infinite scroll setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore) {
          loadMoreVenues();
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
  }, [loadMoreVenues, hasMore, isLoadingMore]);

  useEffect(() => {
    fetchEvents(1, true);
  }, [locationFilter]);

  // Filter venues based on search and location
  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      const matchesSearch = !searchQuery || 
        venue.organizer.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (venue.organizer.company_description && venue.organizer.company_description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (venue.organizer.address && venue.organizer.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (venue.locationDetails?.description && venue.locationDetails.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [venues, searchQuery]);

  const sortedVenues = useMemo(() => {
    const sorted = [...filteredVenues];
    switch (activeTab) {
      case 'trending':
        return sorted.sort((a, b) => (b.stats?.totalEvents || 0) - (a.stats?.totalEvents || 0));
      case 'top-rated':
        return sorted.sort((a, b) => (b.locationDetails?.rating || 0) - (a.locationDetails?.rating || 0));
      case 'nearby':
        // Simple distance sort (would use real coordinates in production)
        return sorted.sort((a, b) => Math.random() - 0.5);
      default:
        return sorted;
    }
  }, [filteredVenues, activeTab]);

  const handleViewDetails = async (venue: VenueGroup) => {
    setSelectedVenue(venue);
    // Additional details loading would go here
  };

  const handleLike = (venueId: number) => {
    console.log('Liked venue:', venueId);
    // Implement like functionality
  };

  const handleShare = (venue: VenueGroup) => {
    if (navigator.share) {
      navigator.share({
        title: venue.organizer.company_name,
        text: venue.locationDetails?.description || 'Check out this amazing venue!',
        url: window.location.href,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleBookmark = (venueId: number) => {
    console.log('Bookmarked venue:', venueId);
    // Implement bookmark functionality
  };

  const handleViewEvents = (organizerId: number) => {
    navigate(`/events?organizer=${organizerId}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (timeStr: string) => {
    const time = new Date(`1970-01-01T${timeStr}`);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(time);
  };

  const renderRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="fill-yellow-400 text-yellow-400" size={16} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="fill-yellow-400 text-yellow-400" size={16} />);
      } else {
        stars.push(<Star key={i} className="text-gray-300" size={16} />);
      }
    }

    return (
      <div className="flex items-center">
        <div className="flex">{stars}</div>
        <span className="ml-1 text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 text-gray-900 dark:text-gray-100 relative">
      <FloatingShapes />
      <Navbar />
      
      <main className="py-12 pt-24 relative z-10">
        <div className="container mx-auto px-4">
          
          {/* Hero Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 bg-clip-text text-transparent mb-6"
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
              Find the perfect venue for your next event in Nairobi and beyond
            </motion.p>
          </motion.div>

          {/* Search and Filter Section */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between mb-8">
              {/* Search Bar */}
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search venues by name, location, or amenities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-4 text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-cyan-400 focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-cyan-900 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  />
                </div>
              </div>

              {/* Location Filter */}
              <div className="flex gap-3 items-center">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="pl-10 pr-8 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 focus:border-blue-500 rounded-xl transition-all duration-300 appearance-none cursor-pointer"
                  >
                    <option value="">All Areas</option>
                    {nairobiAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-1 shadow-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`${viewMode === 'grid' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`${viewMode === 'list' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid lg:grid-cols-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-1 shadow-lg">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    All Venues
                  </span>
                </TabsTrigger>
                <TabsTrigger 
                  value="trending" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Trending
                  </span>
                </TabsTrigger>
                <TabsTrigger 
                  value="top-rated" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Top Rated
                  </span>
                </TabsTrigger>
                <TabsTrigger 
                  value="nearby" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Nearby
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* Stats Bar */}
              <motion.div
                className="mt-6 flex flex-wrap justify-center items-center gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {locationFilter ? `${filteredVenues.length} venues in ${locationFilter}` : `${filteredVenues.length} venues in Nairobi`}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Live availability
                  </span>
                </div>
                
                {userLocation && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-full border border-green-200/50 dark:border-green-700/50 shadow-lg">
                    <Navigation className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Location enabled
                    </span>
                  </div>
                )}
              </motion.div>

              <TabsContent value="all" className="mt-8">
                {loading ? (
                  <div className={`grid gap-8 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                      : 'grid-cols-1'
                  }`}>
                    {Array(6).fill(0).map((_, index) => (
                      <motion.div
                        key={index}
                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-gray-200/50 dark:border-gray-700/50"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Skeleton className="h-64 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                        <div className="p-6 space-y-4">
                          <Skeleton className="h-6 w-3/4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                          <Skeleton className="h-4 w-1/2 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-16 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                            <Skeleton className="h-6 w-16 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                          </div>
                          <Skeleton className="h-4 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                          <Skeleton className="h-4 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                          <Skeleton className="h-10 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <>
                    {error && (
                      <motion.div 
                        className="text-center text-red-500 py-8 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="text-4xl mb-4">⚠️</div>
                        <p className="text-lg font-medium">{error}</p>
                      </motion.div>
                    )}
                    
                    {!error && sortedVenues.length === 0 && (
                      <motion.div
                        className="text-center py-20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="relative">
                          <motion.div
                            className="text-8xl mb-6 filter drop-shadow-lg"
                            animate={{ 
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, -5, 0]
                            }}
                            transition={{ 
                              duration: 4, 
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            🏢
                          </motion.div>
                          
                          <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
                            No venues found
                          </h3>
                          
                          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                            {searchQuery || locationFilter 
                              ? 'Try adjusting your search or location filters'
                              : 'Check back soon for amazing venues in your area!'
                            }
                          </p>
                          
                          {(searchQuery || locationFilter) && (
                            <Button
                              onClick={() => {
                                setSearchQuery('');
                                setLocationFilter('');
                                setActiveTab('all');
                              }}
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-3 rounded-full font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                            >
                              <Eye className="w-5 h-5 mr-2" />
                              Show All Venues
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Venues Grid */}
                    <div className={`grid gap-8 ${
                      viewMode === 'grid' 
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                        : 'grid-cols-1 max-w-4xl mx-auto'
                    }`}>
                      <AnimatePresence>
                        {sortedVenues.map((venue, index) => (
                          <VenueCard
                            key={venue.organizer.id}
                            venue={venue}
                            index={index}
                            onViewDetails={handleViewDetails}
                            onLike={handleLike}
                            onShare={handleShare}
                            onBookmark={handleBookmark}
                          />
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Loading More Indicator */}
                    {isLoadingMore && (
                      <motion.div
                        className="flex justify-center items-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-3 px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                          <span className="text-gray-600 dark:text-gray-300 font-medium text-lg">Loading more venues...</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Load More Trigger */}
                    <div ref={loadMoreRef} className="h-10 w-full" />

                    {/* End Message */}
                    {!hasMore && sortedVenues.length > 0 && (
                      <motion.div
                        className="text-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full border border-blue-200/50 dark:border-blue-700/50 shadow-lg">
                          <span className="text-2xl mr-3">🎊</span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium text-lg">
                            You've explored all {sortedVenues.length} amazing venues!
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Other tab contents with same structure */}
              <TabsContent value="trending" className="mt-8">
                <div className={`grid gap-8 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1 max-w-4xl mx-auto'
                }`}>
                  <AnimatePresence>
                    {sortedVenues.map((venue, index) => (
                      <VenueCard
                        key={venue.organizer.id}
                        venue={venue}
                        index={index}
                        onViewDetails={handleViewDetails}
                        onLike={handleLike}
                        onShare={handleShare}
                        onBookmark={handleBookmark}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </TabsContent>

              <TabsContent value="top-rated" className="mt-8">
                <div className={`grid gap-8 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1 max-w-4xl mx-auto'
                }`}>
                  <AnimatePresence>
                    {sortedVenues.map((venue, index) => (
                      <VenueCard
                        key={venue.organizer.id}
                        venue={venue}
                        index={index}
                        onViewDetails={handleViewDetails}
                        onLike={handleLike}
                        onShare={handleShare}
                        onBookmark={handleBookmark}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </TabsContent>

              <TabsContent value="nearby" className="mt-8">
                <div className={`grid gap-8 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1 max-w-4xl mx-auto'
                }`}>
                  <AnimatePresence>
                    {sortedVenues.map((venue, index) => (
                      <VenueCard
                        key={venue.organizer.id}
                        venue={venue}
                        index={index}
                        onViewDetails={handleViewDetails}
                        onLike={handleLike}
                        onShare={handleShare}
                        onBookmark={handleBookmark}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      {/* Enhanced Venue Details Modal */}
      <Dialog open={!!selectedVenue} onOpenChange={() => setSelectedVenue(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-0 shadow-2xl">
          <DialogHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {selectedVenue?.organizer.company_name}
                </DialogTitle>
                {selectedVenue?.locationDetails?.address && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    <span>{selectedVenue.locationDetails.address}</span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLike(selectedVenue?.organizer.id || 0)}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Heart className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedVenue && handleShare(selectedVenue)}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBookmark(selectedVenue?.organizer.id || 0)}
                  className="border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="space-y-6 py-6">
              <Skeleton className="w-full h-64 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                  <Skeleton className="h-24 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                  <Skeleton className="h-24 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                </div>
              </div>
            </div>
          ) : selectedVenue && (
            <div className="space-y-8">
              {/* Hero Image */}
              {selectedVenue.locationDetails?.image && (
                <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={selectedVenue.locationDetails.image}
                    alt={selectedVenue.organizer.company_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  
                  {/* Overlay Stats */}
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div className="space-y-2">
                      {selectedVenue.locationDetails?.rating && (
                        <div className="flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full">
                          {renderRating(selectedVenue.locationDetails.rating)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      {selectedVenue.locationDetails?.capacity && (
                        <div className="bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium">{selectedVenue.locationDetails.capacity}+ capacity</span>
                        </div>
                      )}
                      {selectedVenue.locationDetails?.established && (
                        <div className="bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full flex items-center gap-2">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium">Est. {selectedVenue.locationDetails.established}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* About Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                    <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-blue-500" />
                      About This Venue
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {selectedVenue.locationDetails?.description ||
                        selectedVenue.organizer.company_description ||
                        'A premier venue offering exceptional facilities and services for all types of events.'}
                    </p>
                  </div>

                  {/* Amenities */}
                  {selectedVenue.locationDetails?.amenities && selectedVenue.locationDetails.amenities.length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/50">
                      <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-green-500" />
                        Amenities & Features
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedVenue.locationDetails.amenities.map((amenity, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl"
                          >
                            {(() => {
                              const iconMap: { [key: string]: JSX.Element } = {
                                'wifi': <Wifi className="w-5 h-5 text-blue-500" />,
                                'parking': <Car className="w-5 h-5 text-gray-600" />,
                                'food': <Utensils className="w-5 h-5 text-orange-500" />,
                                'music': <Music className="w-5 h-5 text-purple-500" />,
                                'coffee': <Coffee className="w-5 h-5 text-amber-600" />,
                                'security': <ShieldCheck className="w-5 h-5 text-green-500" />,
                                'activities': <Activity className="w-5 h-5 text-red-500" />,
                              };
                              return iconMap[amenity.toLowerCase()] || <Star className="w-5 h-5 text-yellow-500" />;
                            })()}
                            <span className="capitalize font-medium">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Contact Info */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/50">
                    <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-purple-500" />
                      Contact Information
                    </h4>
                    <div className="space-y-4">
                      {selectedVenue.organizer.website && (
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <a
                            href={selectedVenue.organizer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {selectedVenue.organizer.website}
                          </a>
                        </div>
                      )}
                      {selectedVenue.organizer.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-300">{selectedVenue.organizer.phone}</span>
                        </div>
                      )}
                      {selectedVenue.organizer.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-300">{selectedVenue.organizer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upcoming Events */}
                  {selectedVenue && selectedVenue.events.length > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl p-6 border border-orange-200/50 dark:border-orange-700/50">
                      <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-500" />
                        Upcoming Events
                      </h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {selectedVenue.events.slice(0, 5).map(event => (
                          <motion.div
                            key={event.id}
                            className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 cursor-pointer border border-transparent hover:border-orange-200 dark:hover:border-orange-700"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">{event.name}</h5>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 gap-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span>{formatDate(event.date)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-green-500" />
                                <span>
                                  {formatTime(event.start_time)}
                                  {event.end_time && ` - ${formatTime(event.end_time)}`}
                                </span>
                              </div>
                            </div>
                            {event.category && (
                              <div className="mt-2">
                                <span className="inline-block px-2 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                  {event.category}
                                </span>
                              </div>
                            )}
                          </motion.div>
                        ))}
                        {selectedVenue.events.length > 5 && (
                          <div className="text-center pt-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              +{selectedVenue.events.length - 5} more events
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Venue Stats */}
                  {selectedVenue?.stats && (
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                      <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-600" />
                        Venue Statistics
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {selectedVenue.stats.totalEvents}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">Total Events</div>
                        </div>
                        <div className="text-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {selectedVenue.stats.totalVisitors}+
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">Visitors</div>
                        </div>
                      </div>
                      {selectedVenue.stats.popularTimes && (
                        <div className="mt-4">
                          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Popular Times:</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedVenue.stats.popularTimes.map((time, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-300 text-xs rounded-full"
                              >
                                {time}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                <Button
                  onClick={() => handleViewEvents(selectedVenue.organizer.id)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium py-4 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  View All Events
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedVenue.organizer.website) {
                      window.open(selectedVenue.organizer.website, '_blank');
                    }
                  }}
                  className="flex-1 border-2 border-blue-300 dark:border-cyan-400 text-blue-600 dark:text-cyan-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 py-4 rounded-xl transition-all duration-300"
                >
                  <Globe className="w-5 h-5 mr-2" />
                  Visit Website
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const mapsUrl = selectedVenue.locationDetails?.coordinates 
                      ? `https://www.google.com/maps?q=${selectedVenue.locationDetails.coordinates.lat},${selectedVenue.locationDetails.coordinates.lng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedVenue.organizer.address || selectedVenue.organizer.company_name)}`;
                    window.open(mapsUrl, '_blank');
                  }}
                  className="flex-1 border-2 border-green-300 dark:border-green-400 text-green-600 dark:text-green-400 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-50 dark:hover:from-green-900/20 dark:hover:to-green-900/20 py-4 rounded-xl transition-all duration-300"
                >
                  <Navigation className="w-5 h-5 mr-2" />
                  Get Directions
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
      
      {/* Custom Styles */}
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #06b6d4);
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #0891b2);
        }

        /* Gradient animations */
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }

        /* Glass morphism effects */
        .backdrop-blur-sm {
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        
        .backdrop-blur-md {
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        /* Hover effects */
        .group:hover .group-hover\\:scale-110 {
          transform: scale(1.1);
        }
        
        .group:hover .group-hover\\:translate-x-1 {
          transform: translateX(0.25rem);
        }

        /* Custom focus styles */
        .focus\\:ring-blue-100:focus {
          --tw-ring-color: rgb(219 234 254 / 0.5);
        }
        
        .dark .focus\\:ring-cyan-900:focus {
          --tw-ring-color: rgb(22 78 99 / 0.5);
        }
        
        /* Selection styles */
        ::selection {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: white;
        }
        
        ::-moz-selection {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: white;
        }

        /* Loading skeleton animation */
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200px 100%;
          animation: shimmer 1.5s infinite;
        }

        /* Floating animation for background shapes */
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(120deg); }
          66% { transform: translateY(10px) rotate(240deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        /* Pulse animation for trending badges */
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.7); }
          50% { box-shadow: 0 0 0 10px rgba(6, 182, 212, 0); }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }

        /* Modern button hover effects */
        .btn-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3);
        }
        
        .btn-modern:active {
          transform: translateY(0);
        }

        /* Card tilt effect */
        .card-tilt:hover {
          transform: perspective(1000px) rotateX(5deg) rotateY(5deg);
        }
      `}</style>
    </div>
  );
};

export default Venues;