import React, { useState, useEffect, useCallback } from 'react';
import { Ticket, ChevronRight, Zap, Bell, Crown, Search, Play, Pause } from 'lucide-react';

interface Event {
  id: number;
  name: string;
  description: string;
  image: string;
  category: string;
  city: string;
  location: string;
  featured: boolean;
}

interface Category {
  id: number;
  name: string;
}

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  accent: string;
  eventName?: string;
}

interface HeroSectionProps {
  onSearch?: (query: string) => void;
}

const AnimatedSection: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {children}
    </div>
  );
};

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fallback slides when no events are available
  const fallbackSlides: Slide[] = [
    {
      image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMJA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      title: 'Discover Amazing Events',
      subtitle: 'Find and book tickets for the best events in Kenya',
      accent: 'Coming Soon'
    },
    {
      image: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?ixlib=rb-4.0.3&ixid=M3wxMJA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
      title: 'Experience Unforgettable Moments',
      subtitle: 'From music festivals to cultural celebrations',
      accent: 'Event Platform'
    }
  ];

  // API function to fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/events?featured=true&per_page=10&sort_by=featured&sort_order=desc`, {
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
      
      // Filter events that have images and featured status
      const eventsWithImages = data.events?.filter((event: Event) => 
        event.image && event.image.trim() !== ''
      ) || [];

      setEvents(eventsWithImages.slice(0, 8)); // Limit to 8 events for performance
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // API function to fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/categories`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Create slides from events data
  const createSlidesFromEvents = useCallback((): Slide[] => {
    if (events.length === 0) return fallbackSlides;

    return events.map((event) => ({
      image: event.image,
      title: event.name,
      subtitle: `${event.location}, ${event.city}`,
      accent: event.category || 'Event',
      eventName: event.name
    }));
  }, [events]);

  const slides = createSlidesFromEvents();

  // Fetch events and categories on component mount
  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, [fetchEvents, fetchCategories]);

  useEffect(() => {
    if (!isPlaying || slides.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [slides.length, isPlaying]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        alert(`Searching for: ${searchQuery.trim()}`);
      }
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNavigation = (path: string) => {
    alert(`Navigating to: ${path}`);
  };

  return (
    <div className="w-full bg-gray-50">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden w-full bg-gradient-to-br from-gray-900 via-blue-900 to-green-900">
        {/* Background Slides with Error Handling */}
        <div className="absolute inset-0" style={{ height: '500px' }}>
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
                onError={(e) => {
                  // Fallback to default image if event image fails to load
                  const target = e.target as HTMLDivElement;
                  target.style.backgroundImage = `url(${fallbackSlides[0].image})`;
                }}
              />
              {/* Enhanced gradient overlay for better visibility */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-blue-900/40 to-green-900/60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          ))}
        </div>

        {/* Slide Controls - More Responsive */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20 flex items-center gap-2">
          <button
            onClick={togglePlayback}
            className="w-8 h-8 md:w-9 md:h-9 bg-black/20 backdrop-blur-sm border border-white/20 text-white hover:bg-black/30 rounded-lg transition-all duration-300 flex items-center justify-center"
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? <Pause className="h-3 w-3 md:h-3.5 md:w-3.5" /> : <Play className="h-3 w-3 md:h-3.5 md:w-3.5" />}
          </button>
          
          <button
            onClick={prevSlide}
            className="w-8 h-8 md:w-9 md:h-9 bg-black/20 backdrop-blur-sm border border-white/20 text-white hover:bg-black/30 rounded-lg transition-all duration-300 flex items-center justify-center"
            aria-label="Previous slide"
          >
            <ChevronRight className="h-3 w-3 md:h-3.5 md:w-3.5 rotate-180" />
          </button>
          
          <button
            onClick={nextSlide}
            className="w-8 h-8 md:w-9 md:h-9 bg-black/20 backdrop-blur-sm border border-white/20 text-white hover:bg-black/30 rounded-lg transition-all duration-300 flex items-center justify-center"
            aria-label="Next slide"
          >
            <ChevronRight className="h-3 w-3 md:h-3.5 md:w-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full w-full min-h-[500px]">
          <div className="flex-1 flex flex-col justify-center p-4 md:p-8 lg:p-12">
            <div className="w-full max-w-4xl">
              {/* Accent Badge with Loading/Error State */}
              <AnimatedSection>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-4 text-white/90 text-sm font-medium">
                  <div className={`w-2 h-2 ${isLoading ? 'bg-yellow-400' : 'bg-gradient-to-r from-blue-400 to-green-400'} rounded-full ${isLoading ? 'animate-bounce' : 'animate-pulse'}`} />
                  {isLoading ? 'Loading Events...' : slides[currentSlide]?.accent || 'Events'}
                </div>
              </AnimatedSection>

              <AnimatedSection>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                  <span className="bg-gradient-to-r from-white via-blue-100 to-green-100 bg-clip-text text-transparent">
                    {slides[currentSlide]?.title || 'Discover Amazing Events'}
                  </span>
                </h1>
                <p className="text-white/90 text-base md:text-lg lg:text-xl mb-6 max-w-3xl leading-relaxed font-light">
                  {slides[currentSlide]?.subtitle || 'Find and book tickets for the best events'}
                </p>
              </AnimatedSection>
              
              {/* Enhanced Search Bar */}
              <AnimatedSection delay={100}>
                <div className="mb-6 max-w-lg">
                  <div className={`relative transition-all duration-300 ${
                    searchFocused ? 'transform scale-105' : ''
                  }`}>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search for events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                        className="w-full pl-12 pr-20 py-3 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 text-white placeholder-white/60 focus:bg-white/15 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-300 text-base focus:outline-none"
                      />
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
                      <button
                        onClick={handleSearch}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-xl px-4 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm"
                      >
                        Search
                      </button>
                    </div>
                    {searchFocused && (
                      <div className="absolute inset-0 -z-10 bg-white/5 rounded-2xl blur-xl transition-all duration-300" />
                    )}
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={200}>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <button 
                    onClick={() => handleNavigation('/events')}
                    className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl px-6 py-3 text-base flex items-center justify-center gap-2"
                  >
                    <Ticket className="h-4 w-4" />
                    Browse Events
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  <button 
                    onClick={() => handleNavigation('/events?featured=true')}
                    className="bg-white/10 backdrop-blur-md text-white font-medium border-2 border-white/30 hover:border-white/50 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-teal-500/20 rounded-xl px-6 py-3 text-base transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Crown className="h-4 w-4" />
                    Featured Events
                  </button>
                </div>
              </AnimatedSection>

              {/* Quick Stats - Dynamic when possible */}
              <AnimatedSection delay={300}>
                <div className="flex flex-wrap items-center gap-4 text-white/80 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span>{events.length > 0 ? `${events.length}+ Events` : '1000+ Events'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    <span>{categories.length > 0 ? `${categories.length}+ Categories` : '50+ Cities'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                    <span>100k+ Customers</span>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>

        {/* Enhanced Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`relative transition-all duration-500 rounded-full overflow-hidden ${
                index === currentSlide ? 'w-8 h-2' : 'w-2 h-2 hover:w-4'
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            >
              <div className={`absolute inset-0 transition-all duration-500 ${
                index === currentSlide 
                  ? 'bg-gradient-to-r from-blue-400 to-green-400' 
                  : 'bg-white/50 hover:bg-white/70'
              }`} />
              {index === currentSlide && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-green-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-green-400 transition-all duration-300 ease-linear"
            style={{
              width: isPlaying ? `${((currentSlide + 1) / slides.length) * 100}%` : '0%',
            }}
          />
        </div>
      </div>

      {/* Enhanced Features Section */}
      <div className="bg-white dark:bg-gray-900 py-12 md:py-16 transition-colors duration-300">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 rounded-full px-6 py-2 mb-6">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                  Why Choose Pulse
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Elevate Your Event Experience
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Join thousands of event enthusiasts who trust our platform for seamless ticket booking
              </p>
            </AnimatedSection>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                title: "Lightning Fast Booking",
                description: "Complete your ticket purchase in under 30 seconds with our streamlined checkout process",
                icon: <Zap className="w-8 h-8 text-white" />,
                gradient: "from-blue-500 to-cyan-500",
                delay: 0
              },
              {
                title: "Smart Notifications",
                description: "Never miss out on your favorite artists or venues with intelligent alerts and recommendations",
                icon: <Bell className="w-8 h-8 text-white" />,
                gradient: "from-cyan-500 to-green-500",
                delay: 100
              },
              {
                title: "VIP Treatment",
                description: "Access exclusive pre-sales, backstage passes, and premium experiences for our community",
                icon: <Crown className="w-8 h-8 text-white" />,
                gradient: "from-green-500 to-emerald-500",
                delay: 200
              }
            ].map((feature, index) => (
              <AnimatedSection key={index} delay={feature.delay}>
                <div className="group cursor-pointer h-full">
                  <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg hover:shadow-2xl dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 text-center border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                    {/* Gradient background effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/10 dark:to-green-900/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    
                    <div className="relative z-10 flex-1 flex flex-col">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 group-hover:shadow-2xl transition-all duration-500 mx-auto bg-gradient-to-r ${feature.gradient} group-hover:scale-110`}>
                        {feature.icon}
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-green-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500">
                        {feature.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed flex-1">
                        {feature.description}
                      </p>
                    </div>
                    
                    {/* Hover indicator */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500 group-hover:w-16" />
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;