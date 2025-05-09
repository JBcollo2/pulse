import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Skeleton } from "@/components/ui/skeleton";
interface SocialMedia {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
}

interface Organizer {
  id: number;
  company_name: string;
  company_logo?: string;
  company_description?: string;
  media?: SocialMedia;
  address?: string;
  website?: string;
}

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  image?: string;
  organizer: Organizer;
  category?: string;
}

interface ArtistGroup {
  organizer: Organizer;
  events: Event[];
}

const Artists = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<ArtistGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredArtist, setHoveredArtist] = useState<number | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      console.log("Fetching events...");
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/events?page=1&per_page=50`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log("Response received:", res);
        if (!res.ok) throw new Error('Failed to fetch events');
        const data = await res.json();
        console.log("Data fetched:", data);
        const events: Event[] = data.events;
        console.log("Events parsed:", events);

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
        console.log("Artist map created:", artistMap);
        setArtists(Object.values(artistMap));
        console.log("Artists state updated:", Object.values(artistMap));
      } catch (err: any) {
        console.error("Error fetching events:", err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
        console.log("Loading state set to false");
      }
    };
    fetchEvents();
  }, []);

  const handleArtistClick = (organizerId: number) => {
    navigate(`/events?organizer=${organizerId}`);
  };

  // Function to render social media icons
  const renderSocialIcons = (media?: SocialMedia) => {
    if (!media) return null;
    
    return (
      <div className="flex gap-2 mt-2">
        {media.facebook && (
          <a href={media.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
            </svg>
          </a>
        )}
        {media.twitter && (
          <a href={media.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
            </svg>
          </a>
        )}
        {media.instagram && (
          <a href={media.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/>
            </svg>
          </a>
        )}
        {media.linkedin && (
          <a href={media.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
            </svg>
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      
      <main>
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-6 text-gradient">Artists</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover talented artists performing at our events
          </p>
          
          {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
              {Array(8).fill(0).map((_, index) => (
                <div key={index} className="bg-card rounded-lg p-6 shadow-md">
                <div className="flex flex-col items-center text-center">
                    <Skeleton className="w-32 h-32 rounded-full mb-4" />
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-5 w-20 mb-3" />
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-4 w-36 mb-3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </div>
                  </div>
                    </div>
              ))}
                    </div>
          ) : (
            <>
              {error && <div className="text-center text-red-500 py-8">{error}</div>}
              {!error && artists.length === 0 && (
                <div className="text-center py-8">No artists found.</div>
                  )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
                {artists.map(({ organizer, events }) => (
                  <div
                    key={organizer.id}
                    className="relative group cursor-pointer bg-card rounded-lg p-6 shadow-md transition-all duration-300 hover:shadow-xl"
                    onClick={() => handleArtistClick(organizer.id)}
                    onMouseEnter={() => setHoveredArtist(organizer.id)}
                    onMouseLeave={() => setHoveredArtist(null)}
                  >
                    <div className="flex flex-col items-center text-center">
                      {organizer.company_logo ? (
                        <div className="w-32 h-32 mb-4 overflow-hidden rounded-full">
                        <img 
                          src={organizer.company_logo} 
                          alt={organizer.company_name} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                      ) : (
                        <div className="w-32 h-32 rounded-full overflow-hidden mb-4 bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                          {organizer.company_name.charAt(0)}
                      </div>
                    )}
                    
                      <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">{organizer.company_name}</h3>

                      <div className="mt-2 mb-2">
                        <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                          {events.length} Event{events.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {organizer.company_description || 'No description available.'}
                      </p>

                      {renderSocialIcons(organizer.media)}

                      {organizer.website && (
                        <a
                          href={organizer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-primary hover:underline mt-2 inline-block"
                        >
                          Visit website
                        </a>
                )}
              </div>

                    {/* Hover details card */}
                    {hoveredArtist === organizer.id && (
                      <div className="absolute inset-0 bg-background/95 backdrop-blur-sm p-5 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-auto rounded-lg">
                        {organizer.company_logo && (
                          <div className="w-16 h-16 mb-2 mx-auto">
                            <img
                              src={organizer.company_logo}
                              alt={organizer.company_name}
                              className="w-full h-full object-cover rounded-full"
                            />
          </div>
                        )}

                        <h3 className="text-lg font-semibold text-center">{organizer.company_name}</h3>

                        {organizer.company_description && (
                          <p className="text-sm my-2 overflow-auto max-h-24">{organizer.company_description}</p>
                        )}

                        {organizer.address && (
                          <div className="text-xs text-muted-foreground flex items-center mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {organizer.address}
        </div>
                        )}

                        <div className="text-sm font-medium mt-auto mb-1">Recent events:</div>
                        <ul className="text-xs text-muted-foreground space-y-1 mb-2 overflow-y-auto max-h-24">
                          {events.slice(0, 3).map(event => (
                            <li key={event.id} className="flex items-center">
                              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                              {event.name} - {new Date(event.date).toLocaleDateString()}
                            </li>
                          ))}
                          {events.length > 3 && (
                            <li className="text-primary text-xs">+{events.length - 3} more events</li>
                          )}
                        </ul>

                        <div className="mt-auto text-center">
                          <span className="text-xs text-primary">Click to view all events</span>
    </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Artists;