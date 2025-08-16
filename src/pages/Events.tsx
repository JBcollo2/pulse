import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import EventsSection from '@/components/EventsSection';
import Footer from '@/components/Footer';
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

interface Event {
  id: number;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  image: string | null;
  category: string | null;
  category_id: number | null;
  featured: boolean;
  likes_count: number;
  created_at: string | null;
  organizer_id: number; // Required by EventsSection component
  organizer: {
    id: number;
    company_name: string;
    company_logo: string | null;
    media: string | null;
    address: string | null;
    website: string | null;
    company_description: string;
  };
}

interface Category {
  name: string;
  id?: number;
}

const EVENTS_PER_PAGE = 12;

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);
  const { toast } = useToast();
  
  // Ref for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Memoized filtered events to prevent unnecessary recalculations
  const filteredEvents = useMemo(() => {
    if (!Array.isArray(events)) {
      console.error('Events is not an array:', events);
      return [];
    }

    return events.filter(event => {
      const matchesCategory = activeCategory === '' ||
        (event.category && event.category.toLowerCase() === activeCategory.toLowerCase());
      return matchesCategory;
    });
  }, [activeCategory, events]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories.map((category: Category) => category.name));
      } else {
        console.warn('No categories found in response:', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Warning",
        description: "Could not load event categories",
        variant: "destructive"
      });
    }
  }, [toast]);

  const fetchEvents = useCallback(async (page: number = 1, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      // Build query parameters matching your API structure
      const queryParams = new URLSearchParams({
        page: page.toString(),
        per_page: EVENTS_PER_PAGE.toString(),
        time_filter: 'all', // Show all events for public view
        sort_by: 'date',
        sort_order: 'desc' // Show newest events first
      });

      // Add category filter if active (using 'category' for public view)
      if (activeCategory) {
        queryParams.append('category', activeCategory);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/events?${queryParams.toString()}`,
        {
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data = await response.json();
      console.log('Events data:', data);

      if (!data.events || !Array.isArray(data.events)) {
        console.error('Invalid events data structure:', data);
        if (!isLoadMore) {
          setEvents([]);
        }
        return;
      }

      if (isLoadMore) {
        // Append new events to existing ones, avoiding duplicates
        setEvents(prevEvents => {
          const existingIds = new Set(prevEvents.map(event => event.id));
          const newEvents = data.events.filter((event: any) => !existingIds.has(event.id))
            .map((event: any) => ({
              ...event,
              organizer_id: event.organizer.id // Map organizer.id to organizer_id for compatibility
            }));
          return [...prevEvents, ...newEvents];
        });
      } else {
        // Replace events for initial load or category change
        const mappedEvents = data.events.map((event: any) => ({
          ...event,
          organizer_id: event.organizer.id // Map organizer.id to organizer_id for compatibility
        }));
        setEvents(mappedEvents);
      }

      // Update pagination info using API response structure
      setTotalEvents(data.total || 0);
      setHasMore(data.has_next || false); // Use API's has_next property

    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events. Please try again later.",
        variant: "destructive"
      });
      if (!isLoadMore) {
        setEvents([]);
      }
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [activeCategory, toast]);

  // Load more events when intersection observer triggers
  const loadMoreEvents = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchEvents(nextPage, true);
    }
  }, [currentPage, hasMore, isLoadingMore, fetchEvents]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          loadMoreEvents();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px', // Start loading 100px before the element comes into view
      }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef);
    }

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [hasMore, isLoadingMore, loadMoreEvents]);

  // Reset and fetch events when category changes
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchEvents(1, false);
  }, [activeCategory]);

  // Initial load
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCategoryClick = useCallback((category: string) => {
    setActiveCategory(prev => category === prev ? '' : category);
  }, []);

  const handleLike = useCallback(async (eventId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}/like`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to like event: ${response.status}`);
      }

      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId
            ? { ...event, likes_count: event.likes_count + 1 }
            : event
        )
      );

      toast({
        title: "Success",
        description: "Event liked successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error('Error liking event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to like event",
        variant: "destructive"
      });
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />

      <main className="py-12 pt-24 relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Enhanced Header Section */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.h1
              className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-transparent bg-clip-text relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Events
              <motion.div
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: 96 }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Discover amazing events happening around you
            </motion.p>
            {/* Event counter */}
            {totalEvents > 0 && (
              <motion.p
                className="text-sm text-gray-500 dark:text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                Showing {filteredEvents.length} of {totalEvents} events
                {activeCategory && ` in "${activeCategory}"`}
              </motion.p>
            )}
          </motion.div>

          {isLoading ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {[...Array(12)].map((_, index) => (
                <motion.div
                  key={index}
                  className="space-y-4 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Skeleton className="h-[200px] w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700" />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <>
              {/* Enhanced Categories Section */}
              {categories.length > 0 && (
                <motion.div
                  className="mb-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.h2
                    className="text-3xl font-semibold mb-6 text-gray-900 dark:text-white text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    Browse by Category
                  </motion.h2>
                  <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
                    {categories.map((category, index) => (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant={activeCategory === category ? "default" : "outline"}
                          className={`rounded-full text-sm md:text-base px-6 py-3 transition-all duration-300 shadow-md hover:shadow-lg ${
                            activeCategory === category
                              ? 'bg-purple-600 text-white shadow-purple-200 dark:shadow-purple-900'
                              : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400'
                          }`}
                          onClick={() => handleCategoryClick(category)}
                        >
                          {category}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Enhanced Events Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <motion.div
                  className="border-t border-gray-200 dark:border-gray-700 my-12 relative"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.4 }}
                >
                  <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 w-12 h-1 rounded-full"></div>
                </motion.div>

                {filteredEvents.length > 0 ? (
                  <>
                    <EventsSection
                      events={filteredEvents}
                      onLike={handleLike}
                      showLikes={true}
                    />

                    {/* Infinite Scroll Loading Indicator */}
                    <div ref={loadMoreRef} className="flex justify-center items-center py-8">
                      {isLoadingMore && (
                        <motion.div
                          className="flex items-center gap-2 text-purple-600"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="text-lg font-medium">Loading more events...</span>
                        </motion.div>
                      )}
                      {!hasMore && filteredEvents.length > 0 && (
                        <motion.div
                          className="text-center text-gray-500 dark:text-gray-400"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1 max-w-20"></div>
                            <span className="text-sm font-medium">You've reached the end</span>
                            <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1 max-w-20"></div>
                          </div>
                          <p className="text-sm">
                            You've seen all {filteredEvents.length} events
                            {activeCategory && ` in "${activeCategory}"`}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </>
                ) : (
                  <motion.div
                    className="text-center py-16"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="text-6xl mb-4">🎭</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {activeCategory ? `No events in "${activeCategory}"` : 'No Events Found'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {activeCategory 
                        ? 'Try selecting a different category or check back later.'
                        : 'Check back soon for exciting upcoming events!'
                      }
                    </p>
                    {activeCategory && (
                      <Button
                        onClick={() => setActiveCategory('')}
                        variant="outline"
                        className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                      >
                        View All Events
                      </Button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Events;