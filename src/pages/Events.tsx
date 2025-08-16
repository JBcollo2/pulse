import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import EventsSection from '@/components/EventsSection';
import Footer from '@/components/Footer';
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Event {
  id: number;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  image: string | null;
  organizer_id: number;
  featured: boolean;
  likes_count: number;
  category: string | null;
  organizer: {
    id: number;
    company_name: string;
    company_description: string;
  };
}

interface Category {
  name: string;
  id?: number;
}

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

  // Events per page
  const EVENTS_PER_PAGE = 12;

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

  const fetchEvents = useCallback(async (page: number = 1, reset: boolean = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const categoryParam = activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : '';
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/events?page=${page}&per_page=${EVENTS_PER_PAGE}${categoryParam}`,
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
        if (reset) setEvents([]);
        return;
      }

      if (reset || page === 1) {
        setEvents(data.events);
      } else {
        // Append new events, avoiding duplicates
        setEvents(prevEvents => {
          const existingIds = new Set(prevEvents.map(event => event.id));
          const newEvents = data.events.filter((event: Event) => !existingIds.has(event.id));
          return [...prevEvents, ...newEvents];
        });
      }

      // Update pagination info
      setTotalEvents(data.total || data.events.length);
      setHasMore(data.events.length === EVENTS_PER_PAGE && (data.total ? events.length + data.events.length < data.total : true));
      setCurrentPage(page);

    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events. Please try again later.",
        variant: "destructive"
      });
      if (reset) setEvents([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [toast, activeCategory, events.length, EVENTS_PER_PAGE]);

  // Load more events
  const loadMoreEvents = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchEvents(currentPage + 1);
    }
  }, [fetchEvents, currentPage, isLoadingMore, hasMore]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore) {
          loadMoreEvents();
        }
      },
      {
        root: null,
        rootMargin: '100px', // Start loading 100px before reaching the target
        threshold: 0.1,
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loadMoreEvents, hasMore, isLoadingMore]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchEvents(1, true); // Reset and fetch first page
  }, [activeCategory]); // Re-fetch when category changes

  const handleCategoryClick = useCallback((category: string) => {
    setActiveCategory(prev => category === prev ? '' : category);
    setCurrentPage(1);
    setHasMore(true);
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
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Discover amazing events happening around you
            </motion.p>

            {/* Event Counter */}
            {!isLoading && filteredEvents.length > 0 && (
              <motion.div
                className="text-sm text-gray-500 dark:text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                Showing {filteredEvents.length} of {totalEvents} events
                {activeCategory && (
                  <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full text-xs">
                    {activeCategory}
                  </span>
                )}
              </motion.div>
            )}
          </motion.div>

          {isLoading ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {[...Array(9)].map((_, index) => (
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
                      showTabs={false}
                      showSearch={false}
                    />

                    {/* Loading More Indicator */}
                    {isLoadingMore && (
                      <motion.div
                        className="flex justify-center items-center py-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading more events...</span>
                      </motion.div>
                    )}

                    {/* Load More Trigger (invisible) */}
                    <div ref={loadMoreRef} className="h-10 w-full" />

                    {/* End of Events Message */}
                    {!hasMore && filteredEvents.length > 0 && (
                      <motion.div
                        className="text-center py-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                          <span className="text-gray-600 dark:text-gray-300">
                            🎉 You've seen all {filteredEvents.length} events!
                          </span>
                        </div>
                      </motion.div>
                    )}
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
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
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