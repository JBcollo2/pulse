import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Organizer {
  id: number;
  company_name: string;
  company_logo?: string;
  company_description?: string;
}

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  organizer: Organizer;
}

interface VenueGroup {
  organizer: Organizer;
  events: Event[];
}

const Venues = () => {
  const [venues, setVenues] = useState<VenueGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState<VenueGroup | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Replace with your actual API base URL
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
        setVenues(Object.values(venueMap));
      } catch (err: any) {
        setError(err.message  || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Fixed the missing logical operator (||) between filter conditions
  const filteredVenues = venues.filter(venue => 
    venue.organizer.company_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (venue.organizer.company_description && venue.organizer.company_description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedVenues = [...filteredVenues].sort((a, b) => b.events.length - a.events.length);

  const handleViewDetails = (venue: VenueGroup) => {
    setSelectedVenue(venue);
  };

  // Fixed extra closing brace
  const handleViewEvents = (organizerId: number) => {
    navigate(`/events?organizer=${organizerId}`);
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
          <div className="mb-8">
            <Input
              type="text"
              placeholder="Search venues by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xl"
            />
          </div>
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Venues</TabsTrigger>
              <TabsTrigger value="trending">Trending Venues</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              {loading && <div className="text-center py-8">Loading venues...</div>}
              {error && <div className="text-center text-red-500 py-8">{error}</div>}
              {!loading && !error && filteredVenues.length === 0 && (
                <div className="text-center py-8">No venues found.</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                {filteredVenues.map((venue) => (
                  <div key={venue.organizer.id} className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    {venue.organizer.company_logo ? (
                      <img src={venue.organizer.company_logo} alt={venue.organizer.company_name} className="h-48 w-full object-cover" />
                    ) : (
                      <div className="h-48 bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                        {venue.organizer.company_name.charAt(0)}
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{venue.organizer.company_name}</h3>
                      <p className="text-muted-foreground mb-4 line-clamp-3">{venue.organizer.company_description || 'No description available.'}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium bg-muted px-3 py-1 rounded-full">
                          {venue.events.length} Upcoming Event{venue.events.length !== 1 ? 's' : ''}
                        </span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="text-pulse-purple hover:underline" onClick={() => handleViewDetails(venue)}>
                              View Details
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{venue.organizer.company_name}</DialogTitle>
                            </DialogHeader>
                            <p>{venue.organizer.company_description || 'No description available.'}</p>
                            <button className="mt-4 text-pulse-purple hover:underline" onClick={() => handleViewEvents(venue.organizer.id)}>
                              View Events
                            </button>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="trending">
              {loading && <div className="text-center py-8">Loading venues...</div>}
              {error && <div className="text-center text-red-500 py-8">{error}</div>}
              {!loading && !error && sortedVenues.length === 0 && (
                <div className="text-center py-8">No venues found.</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                {sortedVenues.map((venue) => (
                  <div key={venue.organizer.id} className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    {venue.organizer.company_logo ? (
                      <img src={venue.organizer.company_logo} alt={venue.organizer.company_name} className="h-48 w-full object-cover" />
                    ) : (
                      <div className="h-48 bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                        {venue.organizer.company_name.charAt(0)}
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{venue.organizer.company_name}</h3>
                      <p className="text-muted-foreground mb-4 line-clamp-3">{venue.organizer.company_description ||  'No description available.'}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium bg-muted px-3 py-1 rounded-full">
                          {venue.events.length} Upcoming Event{venue.events.length !== 1 ? 's' : ''}
                        </span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="text-pulse-purple hover:underline" onClick={() => handleViewDetails(venue)}>
                              View Details
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{venue.organizer.company_name}</DialogTitle>
                            </DialogHeader>
                            <p>{venue.organizer.company_description || 'No description available.'}</p>
                            <button className="mt-4 text-pulse-purple hover:underline" onClick={() => handleViewEvents(venue.organizer.id)}>
                              View Events
                            </button>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Venues;