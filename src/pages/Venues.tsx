import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Star, Search, Globe, Calendar } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
interface Organizer {
  id: number;
  company_name: string;
  company_logo?: string;
  company_description?: string;
  address?: string;
  website?: string;
  media?: {[key: string]: string};
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

const Venues = () => {
  const [venues, setVenues] = useState<VenueGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState<VenueGroup | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  
const fetchWikiImage = async (wikidataId) => {
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

const searchGooglePlaces = async (query) => {
  try {
    console.log(`[searchGooglePlaces] Starting search for: "${query}"`);
    const formattedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${formattedQuery}&format=json&addressdetails=1&limit=1&extratags=1`;

    console.log(`[searchGooglePlaces] Fetching from: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EventApp/1.0'
      }
    });

    console.log(`[searchGooglePlaces] Response status: ${response.status}`);

    if (!response.ok) throw new Error('Failed to fetch location data');

    const data = await response.json();
    console.log(`[searchGooglePlaces] Response data:`, data);

    if (!data || data.length === 0) {
      console.warn(`[searchGooglePlaces] No results found`);
      const fallbackPhoto = `https://placehold.co/400x300?text=${formattedQuery}`;
      return {
        description: `${query} is a venue where various events take place throughout the year.`,
        photos: [fallbackPhoto],
        rating: 4.0 + Math.random() * 0.5
      };
    }

    const place = data[0];
    console.log(`[searchGooglePlaces] Selected place:`, place);

    let description = `${query} is located at ${place.display_name}.`;

    if (place.address) {
      const city = place.address.city || place.address.town || place.address.county || '';
      const country = place.address.country || '';
      if (city || country) {
        description += ` This venue is situated in ${city}${city && country ? ', ' : ''}${country}.`;
      }
    }

    description += ' Known for hosting various events and providing excellent service to attendees.';
    console.log(`[searchGooglePlaces] Description: ${description}`);

    const uniqueString = place.osm_id || place.place_id || query;
    const charSum = uniqueString.toString().split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const rating = (charSum % 10) / 10 * 1.5 + 3.5;
    console.log(`[searchGooglePlaces] Rating: ${rating.toFixed(2)}`);

    // Try fetching image from Wiki
    const wikidataId = place.extratags?.wikidata;
    let photoUrl = `https://placehold.co/400x300?text=${formattedQuery}`;

    if (wikidataId) {
      const wikiImage = await fetchWikiImage(wikidataId);
      if (wikiImage) {
        photoUrl = wikiImage;
      }
    }

    console.log(`[searchGooglePlaces] Final photo URL: ${photoUrl}`);

    return {
      description,
      photos: [photoUrl],
      rating
    };
  } catch (error) {
    console.error('[searchGooglePlaces] Error:', error);

    const fallbackPhoto = `https://placehold.co/400x300?text=${encodeURIComponent(query)}`;
    return {
      description: `${query} is a popular venue located in the heart of the city. Known for its unique atmosphere and excellent service.`,
      photos: [fallbackPhoto],
      rating: 4.5 + Math.random() * 0.5
    };
  }
};



  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        // API call to get events
        const res = await fetch(`${import.meta.env.VITE_API_URL}/events?page=1&per_page=50`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) throw new Error('Failed to fetch events');
        
        const data = await res.json();
        const events: Event[] = data.events;
        
        // Group by organizer.id
        const venueMap: { [id: number]: VenueGroup } = {};
        
        events.forEach(event => {
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
        
        const venueGroups = Object.values(venueMap);
        
        // Fetch location details for each venue with an address
        for (const venue of venueGroups) {
          if (venue.organizer.address) {
            try {
              const placeDetails = await searchGooglePlaces(venue.organizer.address);
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
        
        setVenues(venueGroups);
        console.log('Fetched venues:', venueGroups);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  // Filter venues based on search query
  const filteredVenues = venues.filter(venue => 
    venue.organizer.company_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (venue.organizer.company_description && venue.organizer.company_description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (venue.organizer.address && venue.organizer.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (venue.locationDetails?.description && venue.locationDetails.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort venues by number of events (for trending tab)
  const sortedVenues = [...filteredVenues].sort((a, b) => b.events.length - a.events.length);

  const handleViewDetails = async (venue: VenueGroup) => {
    setSelectedVenue(venue);
    
    // If we don't have location details yet and there's an address, fetch them
    if (!venue.locationDetails && venue.organizer.address) {
      setIsLoadingDetails(true);
      try {
        const placeDetails = await searchGooglePlaces(venue.organizer.address);
        
        // Update the venue with location details
        const updatedVenues = venues.map(v => {
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
        
        // Update selected venue
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

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  // Format time for display
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
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      <main>
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-6 text-gradient">Venues</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Explore our partner venues for your next unforgettable experience
          </p>
          
          <div className="relative mb-8">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search venues by name, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xl pl-10"
            />
          </div>
          
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Venues</TabsTrigger>
              <TabsTrigger value="trending">Trending Venues</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                  {Array(6).fill(0).map((_, index) => (
                    <div key={index} className="bg-card rounded-xl overflow-hidden shadow-md">
                      <Skeleton className="h-48 w-full" />
                    <div className="p-6">
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex justify-between items-center">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-6 w-24" />
                        </div>
                      </div>
                    </div>
                                          ))}
                                        </div>
                    ) : (
                <>
                  {error && <div className="text-center text-red-500 py-8">{error}</div>}
                  {!error && filteredVenues.length === 0 && (
                    <div className="text-center py-8">No venues found.</div>
                    )}
                    
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                    {filteredVenues.map((venue) => (
                      <div key={venue.organizer.id} className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                        {venue.locationDetails?.image ? (
                          <img src={venue.locationDetails.image} alt={venue.organizer.company_name} className="h-48 w-full object-cover" />
                        ) : venue.organizer.company_logo ? (
                          <img src={venue.organizer.company_logo} alt={venue.organizer.company_name} className="h-48 w-full object-cover" />
                        ) : (
                          <div className="h-48 bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                            {venue.organizer.company_name.charAt(0)}
                        </div>
                      )}
                      
                        <div className="p-6">
                          <h3 className="text-xl font-semibold mb-2">{venue.organizer.company_name}</h3>

                          {venue.locationDetails?.rating && (
                            <div className="mb-2">
                              {renderRating(venue.locationDetails.rating)}
                        </div>
                      )}
                      
                          {venue.organizer.address && (
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <MapPin size={16} className="mr-1" />
                              <span>{venue.organizer.address}</span>
                            </div>
                          )}
                        
                          <p className="text-muted-foreground mb-4 line-clamp-3">
                            {venue.locationDetails?.description || venue.organizer.company_description || 'No description available.'}
                          </p>

                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium bg-muted px-3 py-1 rounded-full">
                              {venue.events.length} Upcoming Event{venue.events.length !== 1 ? 's' : ''}
                            </span>
                            <Dialog>
                              <DialogTrigger asChild>
                                <button
                                      className="text-pulse-purple hover:underline"
                                  onClick={() => handleViewDetails(venue)}
                                    >
                                  View Details
                                </button>
                              </DialogTrigger>

                              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>{venue.organizer.company_name}</DialogTitle>
                                </DialogHeader>
                                
                                {isLoadingDetails ? (
                                  <div className="space-y-4 py-4">
                                    <Skeleton className="w-full h-48 rounded-md mb-4" />
                                    <div className="flex items-center mb-3">
                                      <Skeleton className="w-20 h-4 mr-1" />
                                      <Skeleton className="w-16 h-4" />
                                    </div>
                                    <div className="flex items-center mb-3">
                                      <Skeleton className="w-4 h-4 mr-2" />
                                      <Skeleton className="w-48 h-4" />
                                    </div>
                                    <div className="flex items-center mb-3">
                                      <Skeleton className="w-4 h-4 mr-2" />
                                      <Skeleton className="w-48 h-4" />
                                    </div>
                                    <div className="space-y-2">
                                      <Skeleton className="w-32 h-5" />
                                      <Skeleton className="w-full h-24" />
                                    </div>
                                    <Skeleton className="w-32 h-10 mt-4" />
                                  </div>
                                ) : (
                                  <>
                                    {selectedVenue?.locationDetails?.image && (
                                      <img
                                        src={selectedVenue.locationDetails.image}
                                        alt={selectedVenue.organizer.company_name}
                                        className="w-full h-48 object-cover rounded-md mb-4"
                                      />
                                )}
                                    {selectedVenue?.locationDetails?.rating && (
                                      <div className="mb-3">
                                        {renderRating(selectedVenue.locationDetails.rating)}
                                      </div>
                                    )}
                                    
                                    {selectedVenue?.organizer.address && (
                                      <div className="flex items-center text-sm mb-3">
                                        <MapPin size={16} className="mr-1 flex-shrink-0" />
                                        <span>{selectedVenue.organizer.address}</span>
                                      </div>
                                    )}
                                    
                                    {selectedVenue?.organizer.website && (
                                      <div className="flex items-center text-sm mb-3">
                                        <Globe size={16} className="mr-1 flex-shrink-0" />
                                        <a
                                          href={selectedVenue.organizer.website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-pulse-purple hover:underline"
                                        >
                                          {selectedVenue.organizer.website}
                                        </a>
                                      </div>
                                    )}
                                    
                                    <div className="mt-2 mb-4">
                                      <h4 className="font-medium mb-1">About</h4>
                                      <p className="text-muted-foreground">
                                        {selectedVenue?.locationDetails?.description ||
                                         selectedVenue?.organizer.company_description ||
                                         'No description available.'}
                                      </p>
                  </div>

                                    {selectedVenue && selectedVenue.events.length > 0 && (
                                      <div className="mt-4">
                                        <h4 className="font-medium mb-2">Upcoming Events</h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                          {selectedVenue.events.slice(0, 5).map(event => (
                                            <div key={event.id} className="p-2 bg-muted rounded-md">
                                              <h5 className="font-medium">{event.name}</h5>
                                              <div className="flex items-center text-xs text-muted-foreground">
                                                <Calendar size={12} className="mr-1" />
                                                <span>
                                                  {formatDate(event.date)} • {formatTime(event.start_time)}
                                                  {event.end_time && ` - ${formatTime(event.end_time)}`}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <button
                                      className="mt-4 bg-pulse-purple text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                                      onClick={() => handleViewEvents(selectedVenue!.organizer.id)}
                                    >
                                      View All Events
                                    </button>
                                  </>
                                )}
                              </DialogContent>
                        </Dialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="trending">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                  {Array(6).fill(0).map((_, index) => (
                    <div key={index} className="bg-card rounded-xl overflow-hidden shadow-md">
                      <Skeleton className="h-48 w-full" />
                      <div className="p-6">
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-4" />
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-6 w-24" />
                      </div>
    </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {error && <div className="text-center text-red-500 py-8">{error}</div>}
                  {!error && sortedVenues.length === 0 && (
                    <div className="text-center py-8">No venues found.</div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                    {sortedVenues.map((venue) => (
                      <div key={venue.organizer.id} className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                        {venue.locationDetails?.image ? (
                          <img src={venue.locationDetails.image} alt={venue.organizer.company_name} className="h-48 w-full object-cover" />
                        ) : venue.organizer.company_logo ? (
                          <img src={venue.organizer.company_logo} alt={venue.organizer.company_name} className="h-48 w-full object-cover" />
                        ) : (
                          <div className="h-48 bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                            {venue.organizer.company_name.charAt(0)}
                          </div>
                        )}

                        <div className="p-6">
                          <h3 className="text-xl font-semibold mb-2">{venue.organizer.company_name}</h3>

                          {venue.locationDetails?.rating && (
                            <div className="mb-2">
                              {renderRating(venue.locationDetails.rating)}
                            </div>
                          )}

                          {venue.organizer.address && (
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <MapPin size={16} className="mr-1" />
                              <span>{venue.organizer.address}</span>
                            </div>
                          )}

                          <p className="text-muted-foreground mb-4 line-clamp-3">
                            {venue.locationDetails?.description || venue.organizer.company_description || 'No description available.'}
                          </p>

                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium bg-muted px-3 py-1 rounded-full">
                              {venue.events.length} Upcoming Event{venue.events.length !== 1 ? 's' : ''}
                            </span>

                            <Dialog>
                              <DialogTrigger asChild>
                                <button
                                  className="text-pulse-purple hover:underline"
                                  onClick={() => handleViewDetails(venue)}
                                >
                                  View Details
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                {/* Same dialog content as in the "all" tab */}
                                <DialogHeader>
                                  <DialogTitle>{venue.organizer.company_name}</DialogTitle>
                                </DialogHeader>

                                {isLoadingDetails ? (
                                  <div className="space-y-4 py-4">
                                    <Skeleton className="w-full h-48 rounded-md mb-4" />
                                    <div className="flex items-center mb-3">
                                      <Skeleton className="w-20 h-4 mr-1" />
                                      <Skeleton className="w-16 h-4" />
                                    </div>
                                    <div className="flex items-center mb-3">
                                      <Skeleton className="w-4 h-4 mr-2" />
                                      <Skeleton className="w-48 h-4" />
                                    </div>
                                    <div className="flex items-center mb-3">
                                      <Skeleton className="w-4 h-4 mr-2" />
                                      <Skeleton className="w-48 h-4" />
                                    </div>
                                    <div className="space-y-2">
                                      <Skeleton className="w-32 h-5" />
                                      <Skeleton className="w-full h-24" />
                                    </div>
                                    <Skeleton className="w-32 h-10 mt-4" />
                                  </div>
                                ) : (
                                  <>
                                    {selectedVenue?.locationDetails?.image && (
                                      <img
                                        src={selectedVenue.locationDetails.image}
                                        alt={selectedVenue.organizer.company_name}
                                        className="w-full h-48 object-cover rounded-md mb-4"
                                      />
                                    )}

                                    {selectedVenue?.locationDetails?.rating && (
                                      <div className="mb-3">
                                        {renderRating(selectedVenue.locationDetails.rating)}
                                      </div>
                                    )}

                                    {selectedVenue?.organizer.address && (
                                      <div className="flex items-center text-sm mb-3">
                                        <MapPin size={16} className="mr-1 flex-shrink-0" />
                                        <span>{selectedVenue.organizer.address}</span>
                                      </div>
                                    )}

                                    {selectedVenue?.organizer.website && (
                                      <div className="flex items-center text-sm mb-3">
                                        <Globe size={16} className="mr-1 flex-shrink-0" />
                                        <a
                                          href={selectedVenue.organizer.website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-pulse-purple hover:underline"
                                        >
                                          {selectedVenue.organizer.website}
                                        </a>
                                      </div>
                                    )}

                                    <div className="mt-2 mb-4">
                                      <h4 className="font-medium mb-1">About</h4>
                                      <p className="text-muted-foreground">
                                        {selectedVenue?.locationDetails?.description ||
                                         selectedVenue?.organizer.company_description ||
                                         'No description available.'}
                                      </p>
                                    </div>

                                    {selectedVenue && selectedVenue.events.length > 0 && (
                                      <div className="mt-4">
                                        <h4 className="font-medium mb-2">Upcoming Events</h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                          {selectedVenue.events.slice(0, 5).map(event => (
                                            <div key={event.id} className="p-2 bg-muted rounded-md">
                                              <h5 className="font-medium">{event.name}</h5>
                                              <div className="flex items-center text-xs text-muted-foreground">
                                                <Calendar size={12} className="mr-1" />
                                                <span>
                                                  {formatDate(event.date)} • {formatTime(event.start_time)}
                                                  {event.end_time && ` - ${formatTime(event.end_time)}`}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <button
                                      className="mt-4 bg-pulse-purple text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                                      onClick={() => handleViewEvents(selectedVenue!.organizer.id)}
                                    >
                                      View All Events
                                    </button>
                                  </>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Venues;