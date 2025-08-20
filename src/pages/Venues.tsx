import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Star, Search, Globe, Calendar, Loader2, TrendingUp, Filter, Eye, Grid, List } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Organizer {
  id: number;
  company_name: string;
  company_logo?: string;
  company_description?: string;
  address?: string;
  website?: string;
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
  };
}

interface GooglePlaceResult {
  description: string;
  photos: string[];
  rating: number;
}

interface NominatimPlace {
  osm_id?: string;
  place_id?: string;
  display_name: string;
  importance?: number;
  address?: {
    city?: string;
    town?: string;
    county?: string;
    country?: string;
    amenity?: string;
    [key: string]: any;
  };
  extratags?: {
    wikidata?: string;
    [key: string]: any;
  };
}

interface EventsApiResponse {
  events: Event[];
  total?: number;
  [key: string]: any;
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
    <motion.div
      className="absolute top-1/3 left-1/4 w-28 h-28 bg-gradient-to-br from-teal-400/8 to-mint-400/8 rounded-full blur-xl"
      animate={{
        x: [0, -60, 0],
        y: [0, 40, 0],
        rotate: [0, 270, 360],
      }}
      transition={{
        duration: 18,
        repeat: Infinity,
        ease: "linear"
      }}
    />
    <motion.div
      className="absolute bottom-60 right-1/3 w-36 h-36 bg-gradient-to-br from-mint-300/6 to-teal-400/6 rounded-full blur-2xl"
      animate={{
        scale: [1, 1.1, 1],
        x: [0, 40, 0],
      }}
      transition={{
        duration: 22,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  </div>
);

const Venues: React.FC = () => {
  const [venues, setVenues] = useState<VenueGroup[]>([]);
  const [allVenues, setAllVenues] = useState<VenueGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedVenue, setSelectedVenue] = useState<VenueGroup | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalVenues, setTotalVenues] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Ref for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Venues per page
  const VENUES_PER_PAGE = 12;

  const fetchWikiImage = async (wikidataId: string): Promise<string | null> => {
    try {
      console.log(`[fetchWikiImage] Fetching image for Wikidata ID: ${wikidataId}`);
      const response = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`);
      const data = await response.json();
      const entity = data.entities[wikidataId];
      const imageClaim = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (imageClaim) {
        const filename = encodeURIComponent(imageClaim.replace(/ /g, '_'));
        const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
        console.log(`[fetchWikiImage] Found image: ${imageUrl}`);
        return imageUrl;
      }
      console.log(`[fetchWikiImage] No image found in claims`);
      return null;
    } catch (error) {
      console.error(`[fetchWikiImage] Error:`, error);
      return null;
    }
  };

  const searchGooglePlaces = async (query: string, organizerId: number): Promise<GooglePlaceResult> => {
    try {
      console.log(`[searchGooglePlaces] Starting search for: "${query}" (Organizer: ${organizerId})`);
      const formattedQuery = encodeURIComponent(query);

      const url = `https://nominatim.openstreetmap.org/search?q=${formattedQuery}&format=json&addressdetails=1&limit=5&extratags=1&bounded=0`;
      console.log(`[searchGooglePlaces] Fetching from: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'EventApp/1.0'
        }
      });
      console.log(`[searchGooglePlaces] Response status: ${response.status}`);
      if (!response.ok) throw new Error('Failed to fetch location data');
      const data: NominatimPlace[] = await response.json();
      console.log(`[searchGooglePlaces] Response data:`, data);
      if (!data || data.length === 0) {
        console.warn(`[searchGooglePlaces] No results found`);
        const fallbackPhoto = `https://placehold.co/400x300/6366f1/ffffff?text=${encodeURIComponent(query.substring(0, 20))}&font=Open+Sans`;
        return {
          description: `${query} is a venue where various events take place throughout the year.`,
          photos: [fallbackPhoto],
          rating: 4.0 + (organizerId % 10) / 10 * 1.5
        };
      }
      let place = data[0];
      const sortedResults = data.sort((a, b) => {
        const aScore = (a.importance || 0) + (a.address ? Object.keys(a.address).length * 0.1 : 0);
        const bScore = (b.importance || 0) + (b.address ? Object.keys(b.address).length * 0.1 : 0);
        return bScore - aScore;
      });

      place = sortedResults[0];
      console.log(`[searchGooglePlaces] Selected place:`, place);
      let description = `${query} is located at ${place.display_name}.`;
      if (place.address) {
        const city = place.address.city || place.address.town || place.address.county || '';
        const country = place.address.country || '';
        if (city || country) {
          description += ` This venue is situated in ${city}${city && country ? ', ' : ''}${country}.`;
        }
        if (place.address.amenity) {
          description += ` This ${place.address.amenity} is`;
        } else {
          description += ' This venue is';
        }
      }
      description += ' known for hosting various events and providing excellent service to attendees.';
      console.log(`[searchGooglePlaces] Description: ${description}`);
      const uniqueString = `${place.osm_id || place.place_id || query}_${organizerId}`;
      const charSum = uniqueString.toString().split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const rating = (charSum % 15) / 10 * 1.5 + 3.5;
      console.log(`[searchGooglePlaces] Rating: ${rating.toFixed(2)}`);
      const wikidataId = place.extratags?.wikidata;
      let photoUrl = `https://placehold.co/400x300/6366f1/ffffff?text=${encodeURIComponent(query.substring(0, 20))}&font=Open+Sans`;
      if (wikidataId) {
        const wikiImage = await fetchWikiImage(wikidataId);
        if (wikiImage) {
          photoUrl = wikiImage;
        }
      }
      if (!wikidataId || photoUrl.includes('placehold.co')) {
        const colors = ['6366f1', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899'];
        const colorIndex = organizerId % colors.length;
        photoUrl = `https://placehold.co/400x300/${colors[colorIndex]}/ffffff?text=${encodeURIComponent(query.substring(0, 20))}&font=Open+Sans`;
      }
      console.log(`[searchGooglePlaces] Final photo URL: ${photoUrl}`);
      return {
        description,
        photos: [photoUrl],
        rating: Math.round(rating * 10) / 10
      };
    } catch (error) {
      console.error('[searchGooglePlaces] Error:', error);
      const colors = ['6366f1', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899'];
      const colorIndex = organizerId % colors.length;
      const fallbackPhoto = `https://placehold.co/400x300/${colors[colorIndex]}/ffffff?text=${encodeURIComponent(query.substring(0, 20))}&font=Open+Sans`;

      return {
        description: `${query} is a popular venue located in the heart of the city. Known for its unique atmosphere and excellent service.`,
        photos: [fallbackPhoto],
        rating: 4.0 + (organizerId % 10) / 10 * 1.5
      };
    }
  };

  // Fetch venues with pagination
  const fetchEvents = useCallback(async (page: number = 1, reset: boolean = false): Promise<void> => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/events?page=${page}&per_page=${VENUES_PER_PAGE}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch events');

      const data: EventsApiResponse = await res.json();
      const events = data.events;

      const venueMap: Record<number, VenueGroup> = {};

      events.forEach((event: Event) => {
        if (!event.organizer) return;
        const orgId = event.organizer.id;

        if (!venueMap[orgId]) {
          venueMap[orgId] = {
            organizer: event.organizer,
            events: [],
          };
        }

        venueMap[orgId].events.push(event);
      });

      const venueGroups: VenueGroup[] = Object.values(venueMap);

      // Fetch location details for venues
      for (let i = 0; i < venueGroups.length; i++) {
        const venue = venueGroups[i];
        if (venue.organizer.address) {
          try {
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }

            const placeDetails = await searchGooglePlaces(venue.organizer.address, venue.organizer.id);
            venue.locationDetails = {
              description: placeDetails.description,
              image: placeDetails.photos[0],
              rating: placeDetails.rating
            };
          } catch (error) {
            console.error(`Error fetching location details for ${venue.organizer.company_name}:`, error);
          }
        }
      }

      if (reset || page === 1) {
        setVenues(venueGroups);
        setAllVenues(venueGroups);
      } else {
        setVenues(prevVenues => {
          const existingIds = new Set(prevVenues.map(venue => venue.organizer.id));
          const newVenues = venueGroups.filter((venue: VenueGroup) => !existingIds.has(venue.organizer.id));
          const updatedVenues = [...prevVenues, ...newVenues];
          setAllVenues(updatedVenues);
          return updatedVenues;
        });
      }

      setTotalVenues(data.total || venueGroups.length);
      setHasMore(venueGroups.length === VENUES_PER_PAGE);
      setCurrentPage(page);

      console.log('Fetched venues:', venueGroups);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      if (reset) {
        setVenues([]);
        setAllVenues([]);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [VENUES_PER_PAGE]);

  // Load more venues
  const loadMoreVenues = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchEvents(currentPage + 1);
    }
  }, [fetchEvents, currentPage, isLoadingMore, hasMore]);

  // Intersection observer for infinite scroll
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

  // Initial fetch
  useEffect(() => {
    fetchEvents(1, true);
  }, []);

  // Filtered venues based on search and tab
  const filteredVenues = useMemo(() => {
    let filtered = allVenues.filter((venue: VenueGroup) =>
      venue.organizer.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (venue.organizer.company_description && venue.organizer.company_description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (venue.organizer.address && venue.organizer.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (venue.locationDetails?.description && venue.locationDetails.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (activeTab === 'trending') {
      filtered = filtered.sort((a, b) => b.events.length - a.events.length);
    }

    return filtered;
  }, [allVenues, searchQuery, activeTab]);

  const handleViewDetails = async (venue: VenueGroup): Promise<void> => {
    setSelectedVenue(venue);

    if (!venue.locationDetails && venue.organizer.address) {
      setIsLoadingDetails(true);
      try {
        const placeDetails = await searchGooglePlaces(venue.organizer.address, venue.organizer.id);

        const updatedVenues = allVenues.map((v: VenueGroup) => {
          if (v.organizer.id === venue.organizer.id) {
            return {
              ...v,
              locationDetails: {
                description: placeDetails.description,
                image: placeDetails.photos[0],
                rating: placeDetails.rating
              }
            };
          }
          return v;
        });

        setVenues(updatedVenues);
        setAllVenues(updatedVenues);

        setSelectedVenue({
          ...venue,
          locationDetails: {
            description: placeDetails.description,
            image: placeDetails.photos[0],
            rating: placeDetails.rating
          }
        });
      } catch (error) {
        console.error('Error fetching place details:', error);
      } finally {
        setIsLoadingDetails(false);
      }
    }
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

  const VenueCard = ({ venue, index }: { venue: VenueGroup; index: number }) => (
    <motion.div
      key={venue.organizer.id}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300/50"
    >
      {/* Venue Image */}
      <div className="relative overflow-hidden h-48">
        {venue.locationDetails?.image ? (
          <img 
            src={venue.locationDetails.image} 
            alt={venue.organizer.company_name} 
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" 
          />
        ) : venue.organizer.company_logo ? (
          <img 
            src={venue.organizer.company_logo} 
            alt={venue.organizer.company_name} 
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" 
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white">
            {venue.organizer.company_name.charAt(0)}
          </div>
        )}
        
        {/* Trending Badge */}
        {venue.events.length >= 5 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 bg-gradient-to-r from-mint-400 to-mint-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Popular</span>
          </motion.div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-6">
        {/* Venue Name */}
        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
          {venue.organizer.company_name}
        </h3>
        
        {/* Rating */}
        {venue.locationDetails?.rating && (
          <div className="mb-3">
            {renderRating(venue.locationDetails.rating)}
          </div>
        )}
        
        {/* Address */}
        {venue.organizer.address && (
          <div className="flex items-start text-sm text-gray-600 dark:text-gray-300 mb-3">
            <MapPin size={16} className="mr-2 flex-shrink-0 mt-0.5 text-blue-500" />
            <span className="line-clamp-2">{venue.organizer.address}</span>
          </div>
        )}
        
        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 text-sm leading-relaxed">
          {venue.locationDetails?.description || venue.organizer.company_description || 'No description available.'}
        </p>
        
        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full border border-blue-200/50 dark:border-blue-700/50"
          >
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {venue.events.length} Event{venue.events.length !== 1 ? 's' : ''}
            </span>
          </motion.div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleViewDetails(venue)}
                className={cn(
                  "w-full bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-600 hover:to-[#0ea372] text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 hover:scale-105 text-lg"
                )}
              >
                View Details
              </Button>
            </DialogTrigger>
            
            
            {/* Dialog Content - Same as before but with updated colors */}
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200/50 dark:border-gray-700/50 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {venue.organizer.company_name}
                </DialogTitle>
              </DialogHeader>
              
              {isLoadingDetails ? (
                <div className="space-y-4 py-4">
                  <Skeleton className="w-full h-48 rounded-xl mb-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                  <div className="flex items-center mb-3">
                    <Skeleton className="w-20 h-4 mr-1 bg-gray-200 dark:bg-gray-700" />
                    <Skeleton className="w-16 h-4 bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="flex items-center mb-3">
                    <Skeleton className="w-4 h-4 mr-2 bg-gray-200 dark:bg-gray-700" />
                    <Skeleton className="w-48 h-4 bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="flex items-center mb-3">
                    <Skeleton className="w-4 h-4 mr-2 bg-gray-200 dark:bg-gray-700" />
                    <Skeleton className="w-48 h-4 bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="w-32 h-5 bg-gray-200 dark:bg-gray-700" />
                    <Skeleton className="w-full h-24 bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <Skeleton className="w-32 h-10 mt-4 bg-gray-200 dark:bg-gray-700" />
                </div>
              ) : (
                <>
                  {selectedVenue?.locationDetails?.image && (
                    <motion.img
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={selectedVenue.locationDetails.image}
                      alt={selectedVenue.organizer.company_name}
                      className="w-full h-48 object-cover rounded-xl mb-4 shadow-lg"
                    />
                  )}
                  
                  {selectedVenue?.locationDetails?.rating && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mb-3"
                    >
                      {renderRating(selectedVenue.locationDetails.rating)}
                    </motion.div>
                  )}
                  
                  {selectedVenue?.organizer.address && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center text-sm mb-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50"
                    >
                      <MapPin size={16} className="mr-2 flex-shrink-0 text-blue-500" />
                      <span>{selectedVenue.organizer.address}</span>
                    </motion.div>
                  )}
                  
                  {selectedVenue?.organizer.website && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center text-sm mb-3 p-3 bg-gradient-to-r from-teal-50 to-mint-50 dark:from-teal-900/20 dark:to-mint-900/20 rounded-xl border border-teal-200/50 dark:border-teal-700/50"
                    >
                      <Globe size={16} className="mr-2 flex-shrink-0 text-teal-500" />
                      <a
                        href={selectedVenue.organizer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 dark:text-teal-400 hover:underline transition-colors duration-300"
                      >
                        {selectedVenue.organizer.website}
                      </a>
                    </motion.div>
                  )}
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 mb-6"
                  >
                    <h4 className="font-bold mb-3 text-lg text-gray-900 dark:text-white flex items-center">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-3"></div>
                      About This Venue
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                      {selectedVenue?.locationDetails?.description ||
                        selectedVenue?.organizer.company_description ||
                        'No description available.'}
                    </p>
                  </motion.div>
                  
                  {selectedVenue && selectedVenue.events.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <h4 className="font-bold mb-4 text-lg text-gray-900 dark:text-white flex items-center">
                        <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-mint-500 rounded-full mr-3"></div>
                        Upcoming Events
                      </h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                        {selectedVenue.events.slice(0, 5).map((event, index) => (
                          <motion.div 
                            key={event.id} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50 hover:shadow-md transition-all duration-300"
                          >
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">{event.name}</h5>
                            <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                              <Calendar size={12} className="mr-2 text-blue-500" />
                              <span>
                                {formatDate(event.date)} • {formatTime(event.start_time)}
                                {event.end_time && ` - ${formatTime(event.end_time)}`}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50"
                  >
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                      onClick={() => handleViewEvents(selectedVenue!.organizer.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View All Events
                    </Button>
                  </motion.div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </motion.div>
  );

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
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Premium Venues
            </motion.h1>
            <motion.p
              className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Discover exceptional venues where unforgettable experiences come to life
            </motion.p>
          </motion.div>

          {/* Search and Controls */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
                <Input
                  type="text"
                  placeholder="Search venues by name, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-4 w-full h-14 text-base border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300/50 dark:hover:border-blue-500/50 focus:border-blue-500 focus:ring-blue-100/50 dark:focus:ring-blue-900/50 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-4">
                <motion.div
                  className="flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-2 shadow-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-xl transition-all duration-300 ${
                      viewMode === 'grid' 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`rounded-xl transition-all duration-300 ${
                      viewMode === 'list' 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </motion.div>

                {/* Filter Status */}
                <motion.div
                  className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <Eye className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    {filteredVenues.length} venues
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-lg">
                <TabsTrigger 
                  value="all" 
                  className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 transition-all duration-300"
                >
                  All Venues
                </TabsTrigger>
                <TabsTrigger 
                  value="trending" 
                  className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-mint-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/25 transition-all duration-300"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Popular Venues
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                {loading ? (
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {Array(12).fill(0).map((_, index) => (
                      <motion.div
                        key={index}
                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-gray-200/50 dark:border-gray-700/50"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Skeleton className="h-48 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                        <div className="p-6">
                          <Skeleton className="h-6 w-48 mb-2 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          <Skeleton className="h-4 w-32 mb-2 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          <Skeleton className="h-4 w-full mb-2 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          <Skeleton className="h-4 w-full mb-2 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          <Skeleton className="h-4 w-full mb-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          <div className="flex justify-between items-center">
                            <Skeleton className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                            <Skeleton className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <>
                    {error && (
                      <motion.div 
                        className="text-center text-red-500 py-8 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="text-4xl mb-2">⚠️</div>
                        <p className="text-lg font-medium">{error}</p>
                      </motion.div>
                    )}
                    
                    {!error && filteredVenues.length === 0 && !loading && (
                      <motion.div 
                        className="text-center py-20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="relative">
                          {/* Animated Background Circle */}
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          >
                            <div className="w-32 h-32 border-2 border-dashed border-blue-300/30 rounded-full"></div>
                          </motion.div>
                          
                          {/* Main Content */}
                          <div className="relative z-10">
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
                              🏛️
                            </motion.div>
                            
                            <motion.h3
                              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                            >
                              No Venues Found
                            </motion.h3>
                            
                            <motion.p
                              className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.3 }}
                            >
                              Try adjusting your search criteria or check back later for new venues.
                            </motion.p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {filteredVenues.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
                        {filteredVenues.map((venue, index) => (
                          <VenueCard key={venue.organizer.id} venue={venue} index={index} />
                        ))}
                      </div>
                    )}

                    {/* Loading More Indicator */}
                    {isLoadingMore && (
                      <motion.div
                        className="flex justify-center items-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Loading more venues...</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Load More Trigger */}
                    <div ref={loadMoreRef} className="h-10 w-full" />

                    {/* End Message */}
                    {!hasMore && filteredVenues.length > 0 && (
                      <motion.div
                        className="text-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full border border-blue-200/50 dark:border-blue-700/50 shadow-lg">
                          <span className="text-2xl mr-3">🏛️</span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            You've explored all {filteredVenues.length} amazing venues!
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="trending">
                {loading ? (
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {Array(12).fill(0).map((_, index) => (
                      <motion.div
                        key={index}
                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-gray-200/50 dark:border-gray-700/50"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Skeleton className="h-48 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                        <div className="p-6">
                          <Skeleton className="h-6 w-48 mb-2 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          <Skeleton className="h-4 w-32 mb-2 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          <Skeleton className="h-4 w-full mb-2 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          <Skeleton className="h-4 w-full mb-2 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          <Skeleton className="h-4 w-full mb-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          <div className="flex justify-between items-center">
                            <Skeleton className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                            <Skeleton className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <>
                    {error && (
                      <motion.div 
                        className="text-center text-red-500 py-8 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="text-4xl mb-2">⚠️</div>
                        <p className="text-lg font-medium">{error}</p>
                      </motion.div>
                    )}
                    
                    {!error && filteredVenues.length === 0 && !loading && (
                      <motion.div 
                        className="text-center py-20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="text-8xl mb-6">🔥</div>
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-mint-600 bg-clip-text text-transparent mb-4">
                          No Popular Venues Yet
                        </h3>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                          Check back soon for trending venues with the most events!
                        </p>
                      </motion.div>
                    )}
                    
                    {filteredVenues.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
                        {filteredVenues.map((venue, index) => (
                          <VenueCard key={venue.organizer.id} venue={venue} index={index} />
                        ))}
                      </div>
                    )}

                    {/* Loading More Indicator */}
                    {isLoadingMore && (
                      <motion.div
                        className="flex justify-center items-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                          <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Loading more popular venues...</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Load More Trigger */}
                    <div ref={loadMoreRef} className="h-10 w-full" />

                    {/* End Message */}
                    {!hasMore && filteredVenues.length > 0 && (
                      <motion.div
                        className="text-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-50 to-mint-50 dark:from-teal-900/20 dark:to-mint-900/20 rounded-full border border-teal-200/50 dark:border-teal-700/50 shadow-lg">
                          <span className="text-2xl mr-3">🔥</span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            You've discovered all {filteredVenues.length} popular venues!
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
      
      <Footer />
      
      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgb(59 130 246) transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgb(59 130 246), rgb(6 182 212));
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgb(37 99 235), rgb(8 145 178));
        }
      `}</style>
    </div>
  );
};

export default Venues;