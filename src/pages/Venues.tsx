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
  [key: string]: any;
}

const Venues: React.FC = () => {
  const [venues, setVenues] = useState<VenueGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedVenue, setSelectedVenue] = useState<VenueGroup | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    const fetchEvents = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/events?page=1&per_page=50`, {
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

        setVenues(venueGroups);
        console.log('Fetched venues:', venueGroups);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredVenues = venues.filter((venue: VenueGroup) =>
    venue.organizer.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (venue.organizer.company_description && venue.organizer.company_description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (venue.organizer.address && venue.organizer.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (venue.locationDetails?.description && venue.locationDetails.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedVenues = [...filteredVenues].sort((a, b) => b.events.length - a.events.length);

  const handleViewDetails = async (venue: VenueGroup): Promise<void> => {
    setSelectedVenue(venue);

    if (!venue.locationDetails && venue.organizer.address) {
      setIsLoadingDetails(true);
      try {
        const placeDetails = await searchGooglePlaces(venue.organizer.address, venue.organizer.id);

        const updatedVenues = venues.map((v: VenueGroup) => {
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

return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 font-inter">
    <Navbar />
    <main>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">Venues</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Explore our partner venues for your next unforgettable experience
        </p>
        <div className="relative mb-8">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-300" />
          <Input
            type="text"
            placeholder="Search venues by name, description, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xl pl-10 w-full h-12 text-base border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-700">All Venues</TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-700">Trending Venues</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                {Array(6).fill(0).map((_, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                    <Skeleton className="h-48 w-full bg-gray-200 dark:bg-gray-700" />
                    <div className="p-6">
                      <Skeleton className="h-6 w-48 mb-2 bg-gray-200 dark:bg-gray-700" />
                      <Skeleton className="h-4 w-32 mb-2 bg-gray-200 dark:bg-gray-700" />
                      <Skeleton className="h-4 w-full mb-2 bg-gray-200 dark:bg-gray-700" />
                      <Skeleton className="h-4 w-full mb-2 bg-gray-200 dark:bg-gray-700" />
                      <Skeleton className="h-4 w-full mb-4 bg-gray-200 dark:bg-gray-700" />
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-32 bg-gray-200 dark:bg-gray-700" />
                        <Skeleton className="h-6 w-24 bg-gray-200 dark:bg-gray-700" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {error && <div className="text-center text-red-500 py-8">{error}</div>}
                {!error && filteredVenues.length === 0 && (
                  <div className="text-center py-8 text-gray-900 dark:text-white">No venues found.</div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                  {filteredVenues.map((venue) => (
                    <div key={venue.organizer.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
                      {venue.locationDetails?.image ? (
                        <img src={venue.locationDetails.image} alt={venue.organizer.company_name} className="h-48 w-full object-cover" />
                      ) : venue.organizer.company_logo ? (
                        <img src={venue.organizer.company_logo} alt={venue.organizer.company_name} className="h-48 w-full object-cover" />
                      ) : (
                        <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-900 dark:text-white">
                          {venue.organizer.company_name.charAt(0)}
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{venue.organizer.company_name}</h3>
                        {venue.locationDetails?.rating && (
                          <div className="mb-2">
                            {renderRating(venue.locationDetails.rating)}
                          </div>
                        )}
                        {venue.organizer.address && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <MapPin size={16} className="mr-1" />
                            <span>{venue.organizer.address}</span>
                          </div>
                        )}
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                          {venue.locationDetails?.description || venue.organizer.company_description || 'No description available.'}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-900 dark:text-white">
                            {venue.events.length} Upcoming Event{venue.events.length !== 1 ? 's' : ''}
                          </span>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button
                                className="text-purple-600 dark:text-purple-400 hover:underline"
                                onClick={() => handleViewDetails(venue)}
                              >
                                View Details
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                              <DialogHeader>
                                <DialogTitle>{venue.organizer.company_name}</DialogTitle>
                              </DialogHeader>
                              {isLoadingDetails ? (
                                <div className="space-y-4 py-4">
                                  <Skeleton className="w-full h-48 rounded-md mb-4 bg-gray-200 dark:bg-gray-700" />
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
                                        className="text-purple-600 dark:text-purple-400 hover:underline"
                                      >
                                        {selectedVenue.organizer.website}
                                      </a>
                                    </div>
                                  )}
                                  <div className="mt-2 mb-4">
                                    <h4 className="font-medium mb-1">About</h4>
                                    <p className="text-gray-600 dark:text-gray-300">
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
                                          <div key={event.id} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                                            <h5 className="font-medium">{event.name}</h5>
                                            <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
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
                                    className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
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
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                    <Skeleton className="h-48 w-full bg-gray-200 dark:bg-gray-700" />
                    <div className="p-6">
                      <Skeleton className="h-6 w-48 mb-2 bg-gray-200 dark:bg-gray-700" />
                      <Skeleton className="h-4 w-32 mb-2 bg-gray-200 dark:bg-gray-700" />
                      <Skeleton className="h-4 w-full mb-2 bg-gray-200 dark:bg-gray-700" />
                      <Skeleton className="h-4 w-full mb-2 bg-gray-200 dark:bg-gray-700" />
                      <Skeleton className="h-4 w-full mb-4 bg-gray-200 dark:bg-gray-700" />
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-32 bg-gray-200 dark:bg-gray-700" />
                        <Skeleton className="h-6 w-24 bg-gray-200 dark:bg-gray-700" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {error && <div className="text-center text-red-500 py-8">{error}</div>}
                {!error && sortedVenues.length === 0 && (
                  <div className="text-center py-8 text-gray-900 dark:text-white">No venues found.</div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                  {sortedVenues.map((venue) => (
                    <div key={venue.organizer.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
                      {venue.locationDetails?.image ? (
                        <img src={venue.locationDetails.image} alt={venue.organizer.company_name} className="h-48 w-full object-cover" />
                      ) : venue.organizer.company_logo ? (
                        <img src={venue.organizer.company_logo} alt={venue.organizer.company_name} className="h-48 w-full object-cover" />
                      ) : (
                        <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-900 dark:text-white">
                          {venue.organizer.company_name.charAt(0)}
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{venue.organizer.company_name}</h3>
                        {venue.locationDetails?.rating && (
                          <div className="mb-2">
                            {renderRating(venue.locationDetails.rating)}
                          </div>
                        )}
                        {venue.organizer.address && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <MapPin size={16} className="mr-1" />
                            <span>{venue.organizer.address}</span>
                          </div>
                        )}
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                          {venue.locationDetails?.description || venue.organizer.company_description || 'No description available.'}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-900 dark:text-white">
                            {venue.events.length} Upcoming Event{venue.events.length !== 1 ? 's' : ''}
                          </span>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button
                                className="text-purple-600 dark:text-purple-400 hover:underline"
                                onClick={() => handleViewDetails(venue)}
                              >
                                View Details
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                              <DialogHeader>
                                <DialogTitle>{venue.organizer.company_name}</DialogTitle>
                              </DialogHeader>
                              {isLoadingDetails ? (
                                <div className="space-y-4 py-4">
                                  <Skeleton className="w-full h-48 rounded-md mb-4 bg-gray-200 dark:bg-gray-700" />
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
                                        className="text-purple-600 dark:text-purple-400 hover:underline"
                                      >
                                        {selectedVenue.organizer.website}
                                      </a>
                                    </div>
                                  )}
                                  <div className="mt-2 mb-4">
                                    <h4 className="font-medium mb-1">About</h4>
                                    <p className="text-gray-600 dark:text-gray-300">
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
                                          <div key={event.id} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                                            <h5 className="font-medium">{event.name}</h5>
                                            <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
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
                                    className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
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
