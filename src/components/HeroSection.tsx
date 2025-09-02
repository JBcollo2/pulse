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

  const fallbackSlides: Slide[] = [
    {
      image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMJA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      title: 'Discover Amazing Events',
      subtitle: 'Find and book tickets for the best events in Kenya',
      accent: 'Coming Soon',
      eventId: 0
    },
    {
      image: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?ixlib=rb-4.0.3&ixid=M3wxMJA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events?featured=true&per_page=10&sort_by=featured&sort_order=desc`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data = await response.json();
      const eventsWithPrices = data.events?.map(async (event: Event) => {
        try {
          const priceResponse = await fetch(`${import.meta.env.VITE_API_URL}/ticket-types/lowest-price/${event.id}`, {
            method: 'GET',
            credentials: 'include'
          });
          if (priceResponse.ok) {
            const priceData = await priceResponse.json();
            return {
              ...event,
              lowestPrice: priceData.lowest_price,
              currency: priceData.currency
            };
          }
        } catch (err) {
          console.error(`Error fetching price for event ${event.id}:`, err);
        }
        return event;
      });

      const resolvedEvents = await Promise.all(eventsWithPrices);
      const limitedEvents = resolvedEvents.filter((event: Event) => event.image && event.image.trim() !== '').slice(0, 8);
      setEvents(limitedEvents);

    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
      setEvents([]); // Ensure events are empty to show fallback
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const slides = events.length > 0 ? events : fallbackSlides;
    if (!isPlaying || slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [events.length, isPlaying]);

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
    } else {
      alert(`Searching for: ${searchQuery.trim()}`);
    }
  };

  const togglePlayback = () => setIsPlaying(!isPlaying);
  const goToSlide = (index: number) => setCurrentSlide(index);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const formatPrice = (price?: number, currency?: string) => {
    if (price === undefined) return 'Price loading...';
    if (price === 0) return 'Free';
    if (currency === 'KES') {
      return `KES ${price.toLocaleString()}`;
    }
    return `${currency} ${price.toLocaleString()}`;
  };

  return (
    <div className="w-full">
      <div className="relative overflow-hidden w-full bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 min-h-[500px]">
        {/* Background Slides */}
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            >
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${slide.image})`,
                  filter: 'brightness(0.6) contrast(1.2) saturate(1.1)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-blue-900/40 to-green-900/60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          ))}
        </div>

        {/* Slide Controls */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20 flex items-center gap-2">
          <button
            onClick={togglePlayback}
            className="w-8 h-8 md:w-9 md:h-9 bg-black/20 backdrop-blur-sm border border-white/20 text-white hover:bg-black/30 rounded-full transition-all duration-300 flex items-center justify-center"
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={prevSlide}
            className="w-8 h-8 md:w-9 md:h-9 bg-black/20 backdrop-blur-sm border border-white/20 text-white hover:bg-black/30 rounded-full transition-all duration-300 flex items-center justify-center"
            aria-label="Previous slide"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          
          <button
            onClick={nextSlide}
            className="w-8 h-8 md:w-9 md:h-9 bg-black/20 backdrop-blur-sm border border-white/20 text-white hover:bg-black/30 rounded-full transition-all duration-300 flex items-center justify-center"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full w-full min-h-[500px]">
          <div className="flex-1 flex flex-col justify-center p-4 md:p-8 lg:p-12">
            <div className="w-full max-w-4xl">
              {/* Accent Badge */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white/90 text-sm font-medium">
                  {isLoadingEvents ? 'Loading Events...' : slides[currentSlide]?.accent || 'Events'}
                </div>
                {slides[currentSlide] && (
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white/90 text-sm font-medium">
                    {formatPrice(slides[currentSlide].lowestPrice, slides[currentSlide].currency)}
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                <span className="bg-gradient-to-r from-white via-blue-100 to-green-100 bg-clip-text text-transparent">
                  {slides[currentSlide]?.title || 'Discover Amazing Events'}
                </span>
              </h1>
              <p className="text-white/90 text-base md:text-lg lg:text-xl mb-6 max-w-3xl leading-relaxed font-light">
                {slides[currentSlide]?.subtitle || 'Find and book tickets for the best events'}
              </p>
              
              {/* Search Bar */}
              <div className="mb-6 max-w-lg">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Search for events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-20 py-3 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 text-white placeholder-white/60 focus:bg-white/15 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-300 text-base focus:outline-none"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-xl px-4 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm"
                  >
                    Search
                  </button>
                </form>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => alert('Navigating to /events')}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl px-6 py-3 text-base flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  Browse Events
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;