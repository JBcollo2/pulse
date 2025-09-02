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
      <div className="relative overflow-hidden w-full h-screen min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
        
        {/* Background Slides with Enhanced Visibility */}
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
                  // Improved filters for better image visibility
                  filter: 'brightness(0.9) contrast(1.2) saturate(1.1)',
                  transform: `translateY(${scrollY * 0.3}px) scale(${1 + scrollY * 0.0003})`,
                }}
              />
              {/* Reduced and more strategic overlay gradients */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/30 dark:from-black/40 dark:to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent dark:from-black/50" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/30 dark:from-black/20 dark:to-black/30" />
              {/* Targeted overlay for text readability only on the left side */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/20 to-transparent lg:from-white/50 lg:via-white/15 lg:to-transparent dark:from-black/60 dark:via-black/20" 
                   style={{ width: '60%' }} />
            </div>
          ))}
        </div>

        {/* Enhanced Slide Controls with Better Visibility */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 lg:top-5 lg:right-5 z-20 flex items-center gap-1.5">
          <button
            onClick={togglePlayback}
            className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-black/40 dark:bg-white/30 backdrop-blur-md border border-white/40 dark:border-black/40 text-white dark:text-black hover:bg-black/60 dark:hover:bg-white/40 hover:border-white/60 dark:hover:border-black/60 rounded-full transition-all duration-200 flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-110"
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? 
              <Pause className="w-4 h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" /> : 
              <Play className="w-4 h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" />
            }
          </button>
          
          <button
            onClick={prevSlide}
            className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-black/40 dark:bg-white/30 backdrop-blur-md border border-white/40 dark:border-black/40 text-white dark:text-black hover:bg-black/60 dark:hover:bg-white/40 hover:border-white/60 dark:hover:border-black/60 rounded-full transition-all duration-200 flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronRight className="w-4 h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 rotate-180" />
          </button>
          
          <button
            onClick={nextSlide}
            className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-black/40 dark:bg-white/30 backdrop-blur-md border border-white/40 dark:border-black/40 text-white dark:text-black hover:bg-black/60 dark:hover:bg-white/40 hover:border-white/60 dark:hover:border-black/60 rounded-full transition-all duration-200 flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" />
          </button>
        </div>

        {/* Enhanced Slide Indicators */}
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
              className={`h-2 rounded-full transition-all duration-300 backdrop-blur-sm border ${
                index === currentSlide 
                  ? 'bg-white shadow-lg w-8 md:w-10 lg:w-12 border-white/30 dark:bg-gray-200 dark:border-gray-500' 
                  : 'bg-white/60 hover:bg-white/80 w-2 md:w-2.5 lg:w-3 border-white/30 dark:bg-gray-500 dark:hover:bg-gray-400 dark:border-gray-600'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Content with Better Text Shadow and Backdrop */}
        <div className="relative z-10 flex flex-col h-full w-full px-3 md:px-4 lg:px-5">
          <div 
            className="w-full max-w-4xl pt-16 md:pt-20 lg:pt-24"
            style={{
              transform: `translateY(${scrollY * 0.2}px)`,
              opacity: Math.max(0.4, 1 - scrollY * 0.001),
            }}
          >
            
            {/* Enhanced Status Indicators */}
            <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-5">
              <div className="inline-flex items-center gap-1.5 bg-white/20 dark:bg-black/20 backdrop-blur-lg border border-white/30 dark:border-black/30 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-white dark:text-gray-200 text-xs md:text-sm font-medium shadow-lg">
                {isLoadingEvents ? (
                  <>
                    <div className="w-2.5 h-2.5 bg-white/70 rounded-full animate-pulse"></div>
                    Loading Events...
                  </>
                ) : (
                  slides[currentSlide]?.accent || 'Events'
                )}
              </div>
              
              {slides[currentSlide] && !isLoadingEvents && (
                <div className="inline-flex items-center gap-1.5 bg-green-500/25 dark:bg-green-700/25 backdrop-blur-lg border border-green-400/40 dark:border-green-600/40 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-green-100 dark:text-green-300 text-xs md:text-sm font-medium shadow-lg">
                  <Ticket className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  {formatPrice(slides[currentSlide].lowestPrice, slides[currentSlide].currency)}
                </div>
              )}
              
              {events.length === 0 && !isLoadingEvents && (
                <div className="inline-flex items-center gap-1.5 bg-yellow-500/25 dark:bg-yellow-700/25 backdrop-blur-lg border border-yellow-400/40 dark:border-yellow-600/40 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-yellow-100 dark:text-yellow-300 text-xs md:text-sm font-medium shadow-lg">
                  Preview Mode
                </div>
              )}
            </div>

            {/* Enhanced Main Title with Better Text Shadow */}
            <h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4 leading-tight"
              style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
              }}
            >
              <span className="bg-gradient-to-r from-blue-500 to-green-500 dark:from-white dark:to-green-100 bg-clip-text text-transparent">
                {slides[currentSlide]?.title || 'Discover Amazing Events'}
              </span>
            </h1>
            
            {/* Enhanced Subtitle with Better Text Shadow */}
            <p 
              className="text-gray-700 dark:text-white/95 text-sm sm:text-base md:text-lg lg:text-xl mb-5 md:mb-6 max-w-2xl leading-relaxed font-light"
              style={{
                textShadow: '1px 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.5)',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))'
              }}
            >
              {slides[currentSlide]?.subtitle || 'Find and book tickets for the best events across Kenya'}
            </p>
            
            {/* Enhanced Search Bar */}
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
                  className="w-full pl-9 md:pl-10 pr-16 md:pr-18 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border-2 border-white/80 dark:border-gray-700/80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:bg-white/90 dark:focus:bg-gray-800 focus:border-blue-500 dark:focus:border-green-400 focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-green-400/50 transition-all duration-300 text-xs md:text-sm focus:outline-none shadow-lg"
                />
                <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-3.5 w-3.5 md:h-4 md:w-4" />
                <button
                  onClick={(e) => handleSearch(e as any)}
                  disabled={!searchQuery.trim()}
                  className="absolute right-1.5 md:right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-md md:rounded-lg px-3 md:px-5 py-1 md:py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs md:text-sm"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Enhanced Action Button */}
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
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-lg md:rounded-xl px-4 md:px-6 lg:px-7 py-2 md:py-3 lg:py-3.5 text-sm md:text-base flex items-center justify-center gap-1.5 group backdrop-blur-sm border border-white/20"
              >
                <Ticket className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 group-hover:rotate-12 transition-transform duration-300" />
                {events.length > 0 ? `Browse ${events.length}+ Events` : 'Browse All Events'}
                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;