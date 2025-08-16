import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import EventsSection from '@/components/EventsSection';
import Footer from '@/components/Footer';
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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
  const [activeCategory, setActiveCategory] = useState('');
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const { toast } = useToast();

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

  // Memoized events to show based on showAllEvents state
  const eventsToShow = useMemo(() => {
    return showAllEvents ? filteredEvents : filteredEvents.slice(0, 6);
  }, [showAllEvents, filteredEvents]);

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

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data = await response.json();
      console.log('Events data:', data);

      if (!data.events || !Array.isArray(data.events)) {
        console.error('Invalid events data structure:', data);
        setEvents([]);
        return;
      }

      setEvents(data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events. Please try again later.",
        variant: "destructive"
      });
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCategoryClick = useCallback((category: string) => {
    setActiveCategory(prev => category === prev ? '' : category);
    setShowAllEvents(false); // Reset to show limited events when changing category
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

  const handleViewAllEvents = useCallback(() => {
    setShowAllEvents(true);
  }, []);

  const handleShowLess = useCallback(() => {
    setShowAllEvents(false);
    // Scroll to events section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
                      events={eventsToShow}
                      onLike={handleLike}
                      showLikes={true}
                    />

                    {/* View All Events Button */}
                    {!showAllEvents && filteredEvents.length > 6 && (
                      <motion.div
                        className="text-center mt-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                      >
                        <Button
                          onClick={handleViewAllEvents}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                          View All Events ({filteredEvents.length})
                        </Button>
                      </motion.div>
                    )}

                    {/* Show fewer events button when viewing all */}
                    {showAllEvents && filteredEvents.length > 6 && (
                      <motion.div
                        className="text-center mt-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Button
                          onClick={handleShowLess}
                          variant="outline"
                          className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300"
                        >
                          Show Less
                        </Button>
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
                    <p className="text-gray-600 dark:text-gray-300">
                      {activeCategory 
                        ? 'Try selecting a different category or check back later.'
                        : 'Check back soon for exciting upcoming events!'
                      }
                    </p>
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