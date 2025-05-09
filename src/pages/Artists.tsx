import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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

interface ArtistGroup {
  organizer: Organizer;
  events: Event[];
}

const Artists = () => {
  const [artists, setArtists] = useState<ArtistGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const artistMap: { [id: number]: ArtistGroup } = {};
        events.forEach(event => {
          if (!event.organizer) return;
          const orgId = event.organizer.id;
          if (!artistMap[orgId]) {
            artistMap[orgId] = {
              organizer: event.organizer,
              events: [],
            };
          }
          artistMap[orgId].events.push(event);
        });
        setArtists(Object.values(artistMap));
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      
      <main>
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-6 text-gradient">Artists</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover talented artists performing at our events
          </p>
          {loading && <div className="text-center py-8">Loading artists...</div>}
          {error && <div className="text-center text-red-500 py-8">{error}</div>}
          {!loading && !error && artists.length === 0 && (
            <div className="text-center py-8">No artists found.</div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
            {artists.map(({ organizer, events }) => (
              <div key={organizer.id} className="group hover-scale">
                {organizer.company_logo ? (
                  <img src={organizer.company_logo} alt={organizer.company_name} className="aspect-square rounded-full object-cover mb-4" />
                ) : (
                  <div className="aspect-square rounded-full overflow-hidden mb-4 bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                    {organizer.company_name.charAt(0)}
                  </div>
                )}
                <h3 className="text-lg font-semibold">{organizer.company_name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{organizer.company_description || 'No description available.'}</p>
                <p className="text-sm text-muted-foreground mt-2">{events.length} Event{events.length !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Artists;