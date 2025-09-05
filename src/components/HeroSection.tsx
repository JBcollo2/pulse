import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Play, Pause, Search, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
  id: number;
  name: string;
  description: string;
  image: string;
  category: string;
  city: string;
  location: string;
  featured: boolean;
  lowestPrice?: number;
  currency?: string;
  price_per_ticket?: string | number; // Added this property to fix TypeScript error
}

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  accent: string;
  eventId: number;
  lowestPrice?: number;
  currency?: string;
}

interface HeroSectionProps {
  onSearch?: (query: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState<number>(0);

  // Fallback slides for when no events are available
  const fallbackSlides: Slide[] = [
    {
      image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      title: 'Discover Amazing Events',
      subtitle: 'Find and book tickets for the best events in Kenya',
      accent: 'Coming Soon',
      eventId: 0
    },
    {
      image: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      title: 'Experience Unforgettable Moments',
      subtitle: 'From music festivals to cultural celebrations',
      accent: 'Event Platform',
      eventId: 0
    }
  ];

  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    setError(null);
    
    try {
      // Strategy: Try featured events first, then fallback to regular events
      let eventsList: Event[] = [];
      
      // Step 1: Try to get featured events with images
      const featuredResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/events?featured=true&per_page=8&sort_by=featured&sort_order=desc`, 
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );

      if (featuredResponse.ok) {
        const featuredData = await featuredResponse.json();
        const featuredEvents = featuredData.events || featuredData || [];
        
        if (Array.isArray(featuredEvents)) {
          const eventsWithImages = featuredEvents.filter((event: Event) => 
            event.image && event.image.trim() !== '' && event.image !== 'null'
          );
          eventsList = eventsWithImages.slice(0, 6); // Limit to 6 for performance
        }
      }

      // Step 2: If we don't have enough featured events with images, get regular events
      if (eventsList.length < 4) {
        console.log(`Only ${eventsList.length} featured events found, fetching regular events...`);
        
        const regularResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/events?per_page=20&sort_by=date&sort_order=desc&time_filter=upcoming`, 
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          }
        );

        if (regularResponse.ok) {
          const regularData = await regularResponse.json();
          const regularEvents = regularData.events || regularData || [];
          
          if (Array.isArray(regularEvents)) {
            const moreEventsWithImages = regularEvents.filter((event: Event) => 
              event.image && 
              event.image.trim() !== '' && 
              event.image !== 'null' &&
              !eventsList.some(existing => existing.id === event.id) // Avoid duplicates
            );
            
            // Add more events to reach a minimum of 6 slides
            const neededEvents = Math.max(0, 6 - eventsList.length);
            eventsList = [...eventsList, ...moreEventsWithImages.slice(0, neededEvents)];
          }
        }
      }

      // Step 3: Fetch prices for events (async, non-blocking)
      if (eventsList.length > 0) {
        const eventsWithPrices = await Promise.all(
          eventsList.map(async (event: Event) => {
            try {
              // First attempt: lowest price endpoint (matches your API structure)
              try {
                const priceResponse = await fetch(
                  `${import.meta.env.VITE_API_URL}/ticket-types/lowest-price/${event.id}`, 
                  {
                    method: 'GET',
                    headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}` // Add auth header
                    },
                    credentials: 'include'
                  }
                );
                
                if (priceResponse.ok) {
                  const responseData = await priceResponse.json();
                  console.log(`Price data for event ${event.id}:`, responseData);
                  
                  // Match your API response structure
                  if (responseData.lowest_price_ticket) {
                    const ticket = responseData.lowest_price_ticket;
                    return {
                      ...event,
                      lowestPrice: ticket.price,
                      currency: ticket.currency || 'KES'
                    };
                  }
                }
              } catch (err) {
                console.warn(`Lowest price endpoint failed for event ${event.id}:`, err);
              }

              // Second attempt: try public ticket types endpoint (no auth required)
              try {
                const ticketTypesResponse = await fetch(
                  `${import.meta.env.VITE_API_URL}/events/${event.id}/ticket-types`, 
                  {
                    method: 'GET',
                    headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                  }
                );
                
                if (ticketTypesResponse.ok) {
                  const ticketTypesData = await ticketTypesResponse.json();
                  console.log(`Ticket types data for event ${event.id}:`, ticketTypesData);
                  
                  // Extract lowest price from ticket types
                  const ticketTypes = ticketTypesData.ticket_types || [];
                  if (Array.isArray(ticketTypes) && ticketTypes.length > 0) {
                    const prices = ticketTypes
                      .map(ticket => parseFloat(ticket.price || 0))
                      .filter(price => !isNaN(price) && price >= 0);
                    
                    if (prices.length > 0) {
                      const lowestPrice = Math.min(...prices);
                      console.log(`Calculated lowest price for event ${event.id}: ${lowestPrice}`);
                      return {
                        ...event,
                        lowestPrice: lowestPrice,
                        currency: ticketTypes[0].currency || 'KES'
                      };
                    }
                  }
                }
              } catch (err) {
                console.warn(`Ticket types endpoint failed for event ${event.id}:`, err);
              }

              // Third attempt: check if event already has price data
              if (event.price_per_ticket || event.lowestPrice) {
                const eventPrice = parseFloat(String(event.price_per_ticket || event.lowestPrice || '0'));
                if (!isNaN(eventPrice) && eventPrice >= 0) {
                  console.log(`Using event's existing price for event ${event.id}: ${eventPrice}`);
                  return {
                    ...event,
                    lowestPrice: eventPrice,
                    currency: event.currency || 'KES'
                  };
                }
              }
              
            } catch (priceErr) {
              console.error(`Error fetching price for event ${event.id}:`, priceErr);
            }
            
            // Return event without price data if all attempts fail
            console.log(`No price data available for event ${event.id}`);
            return event;
          })
        );

        setEvents(eventsWithPrices);
        console.log(`Successfully loaded ${eventsWithPrices.length} events with images and prices`);
      } else {
        console.log('No events with images found, using fallback slides');
        setEvents([]);
      }

    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Scroll event listener for animations
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const slides = events.length > 0 ? events : fallbackSlides;
    console.log(`Slideshow: ${slides.length} slides, playing: ${isPlaying}, current: ${currentSlide}`);
    
    if (!isPlaying || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % slides.length;
        console.log(`Slide change: ${prev} -> ${next}`);
        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [events, isPlaying]);

  // Create slides from events or use fallback
  const slides = events.length > 0 ? events.map(event => ({
    image: event.image,
    title: event.name,
    subtitle: `${event.location}, ${event.city}`,
    accent: event.category || 'Event',
    eventId: event.id,
    lowestPrice: event.lowestPrice,
    currency: event.currency
  })) : fallbackSlides;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    } else if (searchQuery.trim()) {
      // If no onSearch prop provided, show alert or redirect
      alert(`Searching for: ${searchQuery.trim()}`);
    }
  };

  const togglePlayback = () => setIsPlaying(!isPlaying);
  const goToSlide = (index: number) => setCurrentSlide(index);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const formatPrice = (price?: number, currency?: string) => {
    if (price === undefined || price === null) return 'Price TBA';
    if (price === 0) return 'Free Entry';
    if (currency === 'KES') {
      return `KES ${price.toLocaleString()}`;
    }
    return `${currency || ''} ${price.toLocaleString()}`;
  };

  return (
    <div className="w-full">
      {/* Full Viewport Hero Section */}
      <div className={cn(
        "relative overflow-hidden w-full h-screen min-h-screen transition-colors duration-500",
        "bg-gray-50 dark:bg-gray-900"
      )}>
        
        {/* Background Slides - Simplified Approach */}
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <div
              key={`slide-${index}-${slide.eventId || 'fallback'}`}
              className={cn(
                "absolute inset-0 transition-all duration-1000 ease-in-out",
                index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              )}
            >
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${slide.image})`,
                  transform: `translateY(${scrollY * 0.3}px) scale(${1 + scrollY * 0.0003})`,
                }}
              />
              {/* Simplified overlay system - similar to AdminReports approach */}
              <div className={cn(
                "absolute inset-0 transition-colors duration-300",
                // Light mode: subtle dark overlay for text readability
                "bg-black/30",
                // Dark mode: slightly lighter overlay
                "dark:bg-black/40"
              )} />
            </div>
          ))}
        </div>

        {/* Slide Controls - Simplified styling */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 lg:top-5 lg:right-5 z-20 flex items-center gap-1.5">
          <button
            onClick={togglePlayback}
            className={cn(
              "w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110",
              "bg-white/90 text-gray-800 border border-white/50 hover:bg-white",
              "dark:bg-gray-800/90 dark:text-white dark:border-gray-700/50 dark:hover:bg-gray-800"
            )}
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? 
              <Pause className="w-4 h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" /> : 
              <Play className="w-4 h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" />
            }
          </button>
          
          <button
            onClick={prevSlide}
            className={cn(
              "w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110",
              "bg-white/90 text-gray-800 border border-white/50 hover:bg-white",
              "dark:bg-gray-800/90 dark:text-white dark:border-gray-700/50 dark:hover:bg-gray-800"
            )}
            aria-label="Previous slide"
          >
            <ChevronRight className="w-4 h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 rotate-180" />
          </button>
          
          <button
            onClick={nextSlide}
            className={cn(
              "w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110",
              "bg-white/90 text-gray-800 border border-white/50 hover:bg-white",
              "dark:bg-gray-800/90 dark:text-white dark:border-gray-700/50 dark:hover:bg-gray-800"
            )}
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" />
          </button>
        </div>

        {/* Slide Indicators - Simplified */}
        <div 
          className="absolute bottom-5 md:bottom-6 lg:bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 md:gap-2.5"
          style={{
            transform: `translateX(-50%) translateY(${scrollY * 0.15}px)`,
            opacity: Math.max(0.4, 1 - scrollY * 0.002),
          }}
        >
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentSlide 
                  ? cn(
                      "w-8 md:w-10 lg:w-12 shadow-lg",
                      "bg-white border border-white/30",
                      "dark:bg-gray-200 dark:border-gray-500"
                    )
                  : cn(
                      "w-2 md:w-2.5 lg:w-3",
                      "bg-white/60 hover:bg-white/80 border border-white/30",
                      "dark:bg-gray-500 dark:hover:bg-gray-400 dark:border-gray-600"
                    )
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Content - Clean text styling */}
        <div className="relative z-10 flex flex-col h-full w-full px-3 md:px-4 lg:px-5">
          <div 
            className="w-full max-w-4xl pt-16 md:pt-20 lg:pt-24"
            style={{
              transform: `translateY(${scrollY * 0.2}px)`,
              opacity: Math.max(0.4, 1 - scrollY * 0.001),
            }}
          >
            
            {/* Status Indicators - Clean styling */}
            <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-5">
              <div className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium shadow-lg",
                "bg-white/90 text-gray-800 border border-white/30",
                "dark:bg-gray-800/90 dark:text-white dark:border-gray-700/30"
              )}>
                {isLoadingEvents ? (
                  <>
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full animate-pulse",
                      "bg-gray-600",
                      "dark:bg-gray-300"
                    )}></div>
                    Loading Events...
                  </>
                ) : (
                  slides[currentSlide]?.accent || 'Events'
                )}
              </div>
              
              {slides[currentSlide] && !isLoadingEvents && (
                <div className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium shadow-lg",
                  "bg-green-100/90 text-green-800 border border-green-200/50",
                  "dark:bg-green-900/80 dark:text-green-200 dark:border-green-800/50"
                )}>
                  <Ticket className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  {formatPrice(slides[currentSlide].lowestPrice, slides[currentSlide].currency)}
                </div>
              )}
              
              {events.length === 0 && !isLoadingEvents && (
                <div className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium shadow-lg",
                  "bg-yellow-100/90 text-yellow-800 border border-yellow-200/50",
                  "dark:bg-yellow-900/80 dark:text-yellow-200 dark:border-yellow-800/50"
                )}>
                  Preview Mode
                </div>
              )}
            </div>

            {/* Main Title - Clean, readable styling */}
            <h1 className={cn(
              "text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 md:mb-4 leading-tight",
              "text-white drop-shadow-lg"
            )}>
              <span className={cn(
                "bg-gradient-to-r bg-clip-text text-transparent drop-shadow-lg",
                "from-blue-400 to-green-400",
                "dark:from-blue-300 dark:to-green-300"
              )}>
                {slides[currentSlide]?.title || 'Discover Amazing Events'}
              </span>
            </h1>
            
            {/* Subtitle - Clean, readable styling */}
            <p className={cn(
              "text-sm sm:text-base md:text-lg lg:text-xl mb-5 md:mb-6 max-w-2xl leading-relaxed font-medium",
              "text-white/95 drop-shadow-md"
            )}>
              {slides[currentSlide]?.subtitle || 'Find and book tickets for the best events across Kenya'}
            </p>
            
            {/* Search Bar - Following AdminReports styling pattern */}
            <div className="mb-6 md:mb-8 w-full max-w-lg">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search events, venues, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch(e as any);
                    }
                  }}
                  className={cn(
                    "w-full pl-9 md:pl-10 pr-16 md:pr-18 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm shadow-xl transition-all duration-300 focus:outline-none focus:ring-2",
                    "bg-white/95 text-gray-900 placeholder-gray-600 border-2 border-white/50 focus:bg-white focus:border-blue-500 focus:ring-blue-500/50",
                    "dark:bg-gray-800/90 dark:text-white dark:placeholder-gray-300 dark:border-gray-700/50 dark:focus:bg-gray-800 dark:focus:border-green-400 dark:focus:ring-green-400/50"
                  )}
                />
                <Search className={cn(
                  "absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4",
                  "text-gray-600",
                  "dark:text-gray-300"
                )} />
                <button
                  onClick={(e) => handleSearch(e as any)}
                  disabled={!searchQuery.trim()}
                  className={cn(
                    "absolute right-1.5 md:right-2 top-1/2 transform -translate-y-1/2 rounded-md md:rounded-lg px-3 md:px-5 py-1 md:py-2 font-medium shadow-lg transition-all duration-300 hover:scale-105 text-xs md:text-sm",
                    "bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white hover:shadow-xl",
                    "disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed",
                    "dark:disabled:from-gray-600 dark:disabled:to-gray-700"
                  )}
                >
                  Search
                </button>
              </div>
            </div>

            {/* Action Button - Clean styling */}
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <button
                onClick={() => {
                  // Navigate to events page or trigger event listing
                  if (onSearch) {
                    onSearch('');
                  } else {
                    // Fallback action
                    window.location.href = '/events';
                  }
                }}
                className={cn(
                  "bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm flex items-center justify-center gap-1 group border border-white/20"
                )}
              >
                <Ticket className="w-3 h-3 md:w-3.5 md:h-3.5 group-hover:rotate-12 transition-transform duration-300" />
                {events.length > 0 ? `Browse ${events.length}+ Events` : 'Browse All Events'}
                <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;