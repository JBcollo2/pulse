import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Play, Pause, Search, Ticket } from 'lucide-react';

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
              const priceResponse = await fetch(
                `${import.meta.env.VITE_API_URL}/ticket-types/lowest-price/${event.id}`, 
                {
                  method: 'GET',
                  credentials: 'include'
                }
              );
              
              if (priceResponse.ok) {
                const priceData = await priceResponse.json();
                return {
                  ...event,
                  lowestPrice: priceData.lowest_price,
                  currency: priceData.currency
                };
              }
            } catch (priceErr) {
              // Silently continue without price if price fetch fails
              console.warn(`Could not fetch price for event ${event.id}`);
            }
            return event;
          })
        );

        setEvents(eventsWithPrices);
        console.log(`Successfully loaded ${eventsWithPrices.length} events with images`);
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
      <div className="relative overflow-hidden w-full h-screen min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900">
        
        {/* Background Slides */}
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <div
              key={`slide-${index}-${slide.eventId || 'fallback'}`}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            >
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${slide.image})`,
                  filter: 'brightness(0.7) contrast(1.1) saturate(1.0)'
                }}
              />
              {/* Enhanced overlay gradients for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-blue-900/40 to-green-900/50" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
            </div>
          ))}
        </div>

        {/* Responsive Slide Controls */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 lg:top-8 lg:right-8 z-20 flex items-center gap-2">
          <button
            onClick={togglePlayback}
            className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-black/30 backdrop-blur-sm border border-white/30 text-white hover:bg-black/40 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg"
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? 
              <Pause className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" /> : 
              <Play className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" />
            }
          </button>
          
          <button
            onClick={prevSlide}
            className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-black/30 backdrop-blur-sm border border-white/30 text-white hover:bg-black/40 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 rotate-180" />
          </button>
          
          <button
            onClick={nextSlide}
            className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-black/30 backdrop-blur-sm border border-white/30 text-white hover:bg-black/40 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" />
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 md:bottom-8 lg:bottom-12 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 md:gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white w-8 md:w-10 lg:w-12' 
                  : 'bg-white/50 hover:bg-white/70 w-2 md:w-3 lg:w-3'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Content - Centered Vertically and Horizontally */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-4 md:px-6 lg:px-8">
          <div className="w-full max-w-7xl mx-auto text-center">
            
            {/* Status Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6 md:mb-8">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-4 py-2 md:px-6 md:py-3 text-white/90 text-sm md:text-base font-medium">
                {isLoadingEvents ? (
                  <>
                    <div className="w-3 h-3 bg-white/60 rounded-full animate-pulse"></div>
                    Loading Events...
                  </>
                ) : (
                  slides[currentSlide]?.accent || 'Events'
                )}
              </div>
              
              {slides[currentSlide] && !isLoadingEvents && (
                <div className="inline-flex items-center gap-2 bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-full px-4 py-2 md:px-6 md:py-3 text-green-100 text-sm md:text-base font-medium">
                  <Ticket className="w-3 h-3 md:w-4 md:h-4" />
                  {formatPrice(slides[currentSlide].lowestPrice, slides[currentSlide].currency)}
                </div>
              )}
              
              {events.length === 0 && !isLoadingEvents && (
                <div className="inline-flex items-center gap-2 bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 rounded-full px-4 py-2 md:px-6 md:py-3 text-yellow-100 text-sm md:text-base font-medium">
                  Preview Mode
                </div>
              )}
            </div>

            {/* Main Title - Responsive Typography */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 md:mb-8 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-green-100 bg-clip-text text-transparent">
                {slides[currentSlide]?.title || 'Discover Amazing Events'}
              </span>
            </h1>
            
            {/* Subtitle - Responsive Typography */}
            <p className="text-white/90 text-lg sm:text-xl md:text-2xl lg:text-3xl mb-8 md:mb-12 max-w-4xl mx-auto leading-relaxed font-light px-4">
              {slides[currentSlide]?.subtitle || 'Find and book tickets for the best events across Kenya'}
            </p>
            
            {/* Search Bar - Responsive Width */}
            <div className="mb-8 md:mb-12 w-full max-w-2xl mx-auto">
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
                  className="w-full pl-12 md:pl-14 lg:pl-16 pr-20 md:pr-24 lg:pr-28 py-3 md:py-4 lg:py-5 rounded-2xl md:rounded-3xl bg-white/15 backdrop-blur-md border-2 border-white/25 text-white placeholder-white/60 focus:bg-white/20 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300 text-base md:text-lg lg:text-xl focus:outline-none"
                />
                <Search className="absolute left-4 md:left-5 lg:left-6 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                <button
                  onClick={(e) => handleSearch(e as any)}
                  disabled={!searchQuery.trim()}
                  className="absolute right-2 md:right-3 lg:right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl md:rounded-2xl px-4 md:px-6 lg:px-8 py-2 md:py-3 lg:py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm md:text-base lg:text-lg"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Action Button - Responsive Sizing */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl md:rounded-2xl px-8 md:px-12 lg:px-16 py-4 md:py-5 lg:py-6 text-base md:text-lg lg:text-xl flex items-center justify-center gap-3 group"
              >
                <Ticket className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 group-hover:rotate-12 transition-transform duration-300" />
                {events.length > 0 ? `Browse ${events.length}+ Events` : 'Browse All Events'}
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 md:bottom-12 lg:bottom-16 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="w-6 h-10 md:w-8 md:h-12 border-2 border-white/40 rounded-full flex justify-center">
                <div className="w-1 h-3 md:w-1.5 md:h-4 bg-white/60 rounded-full mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;