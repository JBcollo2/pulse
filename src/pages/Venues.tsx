import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  MapPin, 
  Star, 
  Search, 
  Calendar, 
  Filter,
  Grid,
  List,
  Users,
  Heart,
  Share2,
  Bookmark,
  ChevronRight,
  Loader2,
  Eye,
  Navigation
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

interface Event {
  id: number;
  name: string;
  description: string;
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

interface VenueData {
  location: string;
  events: Event[];
  totalEvents: number;
  amenities: string[];
  avgRating?: number;
}

interface City {
  city: string;
  event_count: number;
  top_amenities: string[];
}

interface APIResponse {
  city: string;
  events: Event[];
  pagination: {
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
  available_filters: {
    locations: string[];
    amenities: string[];
    time_filters: string[];
  };
  filters_applied: {
    city: string;
    location?: string;
    amenity?: string;
    time_filter: string;
  };
}

const VenueCard: React.FC<{
  venue: VenueData;
  onViewDetails: (venue: VenueData) => void;
  onLike: (location: string) => void;
  onShare: (venue: VenueData) => void;
  onBookmark: (location: string) => void;
}> = ({ venue, onViewDetails, onLike, onShare, onBookmark }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onLike(venue.location);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    onBookmark(venue.location);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(venue);
  };

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {venue.events[0]?.image ? (
          <img
            src={venue.events[0].image}
            alt={venue.location}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <span className="text-4xl font-bold text-white opacity-80">
              {venue.location.charAt(0)}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={handleLike}
            className={`p-2 rounded-full backdrop-blur-sm transition-all ${
              isLiked 
                ? 'bg-red-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleBookmark}
            className={`p-2 rounded-full backdrop-blur-sm transition-all ${
              isBookmarked 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-all"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Event Count Badge */}
        <div className="absolute bottom-3 left-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <Calendar className="w-3 h-3" />
          <span className="text-sm font-medium">{venue.totalEvents} Events</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {venue.location}
          </h3>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mt-1">
            <MapPin className="w-4 h-4 mr-1 text-blue-500" />
            <span>{venue.events[0]?.city}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <Users className="w-4 h-4 text-purple-500" />
            <span>{venue.totalEvents} Events</span>
          </div>
          {venue.avgRating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-gray-600 dark:text-gray-300">{venue.avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Amenities */}
        {venue.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {venue.amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs capitalize"
              >
                {amenity}
              </span>
            ))}
            {venue.amenities.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                +{venue.amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        <Button
          onClick={() => onViewDetails(venue)}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all group"
        >
          <span>View Details</span>
          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

const Venues: React.FC = () => {
  const [venues, setVenues] = useState<VenueData[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [amenityFilter, setAmenityFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState<VenueData | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [availableFilters, setAvailableFilters] = useState<{
    locations: string[];
    amenities: string[];
  }>({ locations: [], amenities: [] });
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Get city from URL params
  useEffect(() => {
    const cityParam = searchParams.get('city');
    if (cityParam) {
      setSelectedCity(cityParam);
    }
  }, [searchParams]);

  // Fetch available cities
  const fetchCities = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cities`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch cities');
      
      const data = await response.json();
      setCities(data.cities || []);
      
      // Set default city if none selected
      if (!selectedCity && data.cities && data.cities.length > 0) {
        setSelectedCity(data.cities[0].city);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cities');
    }
  };

  // Fetch events by city and group by location
  const fetchEventsByCity = async (city: string) => {
    if (!city) return;
    
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        location: locationFilter,
        amenity: amenityFilter,
        time_filter: timeFilter,
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/events/city/${encodeURIComponent(city)}?${params}`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch events');

      const data: APIResponse = await response.json();
      
      // Group events by location
      const locationMap: { [key: string]: VenueData } = {};
      
      data.events.forEach((event) => {
        const location = event.location;
        if (!locationMap[location]) {
          locationMap[location] = {
            location,
            events: [],
            totalEvents: 0,
            amenities: [],
            avgRating: 4.0 + Math.random() * 1.5 // Mock rating
          };
        }
        
        locationMap[location].events.push(event);
        locationMap[location].totalEvents++;
        
        // Collect unique amenities
        event.amenities.forEach(amenity => {
          if (!locationMap[location].amenities.includes(amenity)) {
            locationMap[location].amenities.push(amenity);
          }
        });
      });

      setVenues(Object.values(locationMap));
      setAvailableFilters(data.available_filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load venues');
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter venues based on search
  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      const matchesSearch = !searchQuery || 
        venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.events.some(event => 
          event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesSearch;
    });
  }, [venues, searchQuery]);

  // Sort venues based on active tab
  const sortedVenues = useMemo(() => {
    const sorted = [...filteredVenues];
    switch (activeTab) {
      case 'popular':
        return sorted.sort((a, b) => b.totalEvents - a.totalEvents);
      case 'top-rated':
        return sorted.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
      default:
        return sorted;
    }
  }, [filteredVenues, activeTab]);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      fetchEventsByCity(selectedCity);
      setSearchParams({ city: selectedCity });
    }
  }, [selectedCity, locationFilter, amenityFilter, timeFilter]);

  const handleViewDetails = (venue: VenueData) => {
    setSelectedVenue(venue);
  };

  const handleLike = (location: string) => {
    console.log('Liked venue:', location);
  };

  const handleShare = (venue: VenueData) => {
    if (navigator.share) {
      navigator.share({
        title: venue.location,
        text: `Check out ${venue.location} - ${venue.totalEvents} upcoming events!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Venue link copied to clipboard",
      });
    }
  };

  const handleBookmark = (location: string) => {
    console.log('Bookmarked venue:', location);
  };

  const handleViewEvents = (location: string) => {
    navigate(`/events?city=${selectedCity}&location=${encodeURIComponent(location)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <main className="py-8 pt-20">
        <div className="container mx-auto px-4">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
              Venues by City
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover amazing venues and locations hosting events in your city
            </p>
          </div>

          {/* City & Search Section */}
          <div className="mb-8 space-y-6">
            {/* City Selection */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-center">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-500" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                >
                  <option value="">Select City</option>
                  {cities.map(city => (
                    <option key={city.city} value={city.city}>
                      {city.city} ({city.event_count} events)
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search venues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            {selectedCity && (
              <div className="flex flex-wrap gap-3 justify-center">
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="">All Locations</option>
                  {availableFilters.locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>

                <select
                  value={amenityFilter}
                  onChange={(e) => setAmenityFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="">All Amenities</option>
                  {availableFilters.amenities.map(amenity => (
                    <option key={amenity} value={amenity} className="capitalize">{amenity}</option>
                  ))}
                </select>

                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="today">Today</option>
                  <option value="all">All Time</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-1">
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
            )}
          </div>

          {/* Filter Tabs */}
          {selectedCity && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid lg:grid-cols-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <TabsTrigger 
                  value="all"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  All Venues
                </TabsTrigger>
                <TabsTrigger 
                  value="popular"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Popular
                </TabsTrigger>
                <TabsTrigger 
                  value="top-rated"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Top Rated
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {/* Results Info */}
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      {sortedVenues.length} venues found in {selectedCity}
                    </span>
                  </div>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className={`grid gap-6 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                      : 'grid-cols-1 max-w-4xl mx-auto'
                  }`}>
                    {Array(6).fill(0).map((_, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        <Skeleton className="h-48 w-full" />
                        <div className="p-4 space-y-3">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-lg font-medium">{error}</p>
                  </div>
                )}

                {/* Empty State */}
                {!loading && !error && sortedVenues.length === 0 && selectedCity && (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🏢</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      No venues found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {searchQuery || locationFilter || amenityFilter 
                        ? 'Try adjusting your search or filters'
                        : `No venues available in ${selectedCity} at the moment`
                      }
                    </p>
                    {(searchQuery || locationFilter || amenityFilter) && (
                      <Button
                        onClick={() => {
                          setSearchQuery('');
                          setLocationFilter('');
                          setAmenityFilter('');
                        }}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}

                {/* No City Selected */}
                {!loading && !selectedCity && (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🌍</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Select a city to explore venues
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Choose from our available cities to discover amazing venues and events
                    </p>
                  </div>
                )}

                {/* Venues Grid */}
                {!loading && !error && sortedVenues.length > 0 && (
                  <div className={`grid gap-6 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                      : 'grid-cols-1 max-w-4xl mx-auto'
                  }`}>
                    {sortedVenues.map((venue) => (
                      <VenueCard
                        key={venue.location}
                        venue={venue}
                        onViewDetails={handleViewDetails}
                        onLike={handleLike}
                        onShare={handleShare}
                        onBookmark={handleBookmark}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      {/* Venue Details Modal */}
      <Dialog open={!!selectedVenue} onOpenChange={() => setSelectedVenue(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {selectedVenue?.location}
            </DialogTitle>
          </DialogHeader>

          {selectedVenue && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedVenue.events[0]?.city}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{selectedVenue.totalEvents} Events</span>
                    </div>
                    {selectedVenue.avgRating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{selectedVenue.avgRating.toFixed(1)} Rating</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {selectedVenue.amenities.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">Available Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVenue.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm capitalize"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Events */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Upcoming Events</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedVenue.events.map(event => (
                    <div
                      key={event.id}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <h5 className="font-semibold text-gray-900 dark:text-white">{event.name}</h5>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 gap-4 mt-1">
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                        <span>{event.start_time}</span>
                        {event.category && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs">
                            {event.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                        {event.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => handleViewEvents(selectedVenue.location)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  View All Events
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedVenue.location + ', ' + selectedVenue.events[0]?.city)}`;
                    window.open(mapsUrl, '_blank');
                  }}
                  className="flex-1 border-2 border-green-300 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20 rounded-lg"
                >
                  <Navigation className="w-5 h-5 mr-2" />
                  Get Directions
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Styles */}
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
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
      `}</style>
    </div>
  );
};

export default Venues;