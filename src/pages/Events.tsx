import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import EventsSection from '@/components/EventsSection';
import Footer from '@/components/Footer';
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Grid, List, TrendingUp, Filter, Eye, Calendar, MapPin } from "lucide-react";

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

// Floating background shapes component
const FloatingShapes = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-teal-400/10 to-mint-400/10 rounded-full blur-xl"
      animate={{
        x: [0, 100, 0],
        y: [0, -50, 0],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }}
    />
    <motion.div
      className="absolute top-60 right-20 w-24 h-24 bg-gradient-to-br from-mint-400/10 to-teal-500/10 rounded-full blur-xl"
      animate={{
        x: [0, -80, 0],
        y: [0, 60, 0],
        rotate: [0, -180, -360],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "linear"
      }}
    />
    <motion.div
      className="absolute bottom-40 left-1/3 w-40 h-40 bg-gradient-to-br from-teal-500/5 to-mint-500/5 rounded-full blur-2xl"
      animate={{
        scale: [1, 1.2, 1],
        x: [0, 50, 0],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  </div>
);

// Modern Category Card Component
const CategoryCard = ({ category, eventCount, isActive, onClick, index, isTrending }) => {
  const getCategoryIcon = (categoryName) => {
    // Convert category name to lowercase for consistent matching
    const name = categoryName.toLowerCase();
    
    // Comprehensive icon mapping with keyword-based matching
    const iconMap = {
      // Technology & Digital
      'technology': '💻', 'tech': '💻', 'digital': '💻', 'software': '💻', 'coding': '💻', 
      'programming': '💻', 'ai': '🤖', 'artificial intelligence': '🤖', 'data': '📊', 
      'blockchain': '⛓️', 'cryptocurrency': '₿', 'startup': '🚀', 'innovation': '💡',
      
      // Music & Entertainment
      'music': '🎵', 'concert': '🎤', 'festival': '🎪', 'entertainment': '🎭', 
      'comedy': '😄', 'theater': '🎭', 'dance': '💃', 'singing': '🎤', 'band': '🎸',
      'jazz': '🎺', 'rock': '🎸', 'classical': '🎼', 'opera': '🎭',
      
      // Sports & Fitness
      'sports': '⚽', 'football': '🏈', 'soccer': '⚽', 'basketball': '🏀', 'tennis': '🎾',
      'fitness': '💪', 'gym': '🏋️', 'yoga': '🧘', 'running': '🏃', 'marathon': '🏃',
      'swimming': '🏊', 'cycling': '🚴', 'hiking': '🥾', 'climbing': '🧗',
      
      // Business & Professional
      'business': '💼', 'networking': '🤝', 'conference': '👥', 'seminar': '📊',
      'workshop': '🛠️', 'training': '📚', 'corporate': '🏢', 'marketing': '📢',
      'sales': '💰', 'finance': '💳', 'investing': '📈', 'entrepreneurship': '🚀',
      
      // Arts & Culture
      'art': '🎨', 'painting': '🖼️', 'sculpture': '🗿', 'gallery': '🖼️', 'exhibition': '🏛️',
      'culture': '🏛️', 'museum': '🏛️', 'history': '📜', 'literature': '📚',
      'poetry': '✍️', 'writing': '✍️', 'book': '📖', 'reading': '📚',
      
      // Food & Dining
      'food': '🍽️', 'restaurant': '🍽️', 'cooking': '👨‍🍳', 'culinary': '👨‍🍳',
      'wine': '🍷', 'beer': '🍺', 'coffee': '☕', 'dining': '🍽️', 'cuisine': '🍽️',
      'barbecue': '🔥', 'bakery': '🧁', 'dessert': '🍰', 'vegetarian': '🥗',
      
      // Education & Learning
      'education': '📚', 'school': '🎓', 'university': '🎓', 'learning': '📚',
      'course': '📖', 'lecture': '👨‍🏫', 'academic': '🎓', 'research': '🔬',
      'science': '🔬', 'mathematics': '➕', 'language': '🗣️', 'skill': '🛠️',
      
      // Health & Wellness
      'health': '🏥', 'medical': '⚕️', 'wellness': '💚', 'mental health': '🧠',
      'therapy': '💭', 'nutrition': '🥗', 'diet': '🥗', 'meditation': '🧘',
      'mindfulness': '🧘‍♀️', 'spa': '💆', 'skincare': '✨',
      
      // Travel & Adventure
      'travel': '✈️', 'tourism': '🗺️', 'adventure': '🏔️', 'vacation': '🏖️',
      'cruise': '🚢', 'camping': '⛺', 'backpacking': '🎒', 'road trip': '🚗',
      'flight': '✈️', 'hotel': '🏨', 'resort': '🏖️', 'expedition': '🧭',
      
      // Gaming & Digital Entertainment
      'gaming': '🎮', 'esports': '🕹️', 'video games': '🎮', 'board games': '🎲',
      'card games': '🃏', 'puzzle': '🧩', 'trivia': '🧠', 'quiz': '❓',
      'competition': '🏆', 'tournament': '🏆', 'championship': '👑',
      
      // Fashion & Style
      'fashion': '👗', 'style': '👠', 'clothing': '👕', 'design': '✨',
      'runway': '🚶‍♀️', 'boutique': '👗', 'jewelry': '💎', 'accessories': '👜',
      'beauty': '💄', 'makeup': '💄', 'hair': '💇', 'nail': '💅',
      
      // Photography & Visual Arts
      'photography': '📸', 'photo': '📷', 'camera': '📸', 'visual': '👁️',
      'film': '🎬', 'cinema': '🎬', 'movie': '🍿', 'video': '📹',
      'documentary': '🎥', 'animation': '🎞️', 'graphics': '🖼️',
      
      // Community & Social
      'community': '👥', 'social': '🤝', 'volunteer': '🤲', 'charity': '❤️',
      'fundraising': '💰', 'non-profit': '🤝', 'activism': '✊', 'environment': '🌱',
      'sustainability': '♻️', 'green': '🌿', 'eco': '🌍', 'climate': '🌍',
      
      // Religious & Spiritual
      'religious': '🙏', 'spiritual': '✨', 'prayer': '🙏',
      'church': '⛪', 'temple': '🏛️', 'mosque': '🕌', 'synagogue': '✡️',
      
      // Kids & Family
      'kids': '👶', 'children': '👶', 'family': '👨‍👩‍👧‍👦', 'baby': '👶',
      'parenting': '👪', 'playground': '🎠', 'toys': '🧸', 'cartoon': '🎭',
      
      // Senior & Elderly
      'senior': '👴', 'elderly': '👵', 'retirement': '🏖️', 'mature': '👴',
      
      // Seasonal & Holiday
      'holiday': '🎄', 'christmas': '🎄', 'halloween': '🎃', 'easter': '🐰',
      'valentine': '💝', 'new year': '🎆', 'summer': '☀️', 'winter': '❄️',
      'spring': '🌸', 'autumn': '🍂', 'fall': '🍂',
      
      // Pets & Animals
      'pets': '🐕', 'dogs': '🐕', 'cats': '🐱', 'animals': '🦄',
      'wildlife': '🦅', 'zoo': '🦁', 'veterinary': '🐾',
      
      // Automotive
      'automotive': '🚗', 'cars': '🚗', 'racing': '🏎️', 'motorcycle': '🏍️',
      'truck': '🚛', 'bike': '🚴', 'vehicle': '🚗',
      
      // Real Estate & Home
      'real estate': '🏠', 'home': '🏠', 'interior': '🛋️', 'garden': '🌸',
      'diy': '🔨', 'construction': '🏗️', 'architecture': '🏛️',
      
      // Legal & Government
      'legal': '⚖️', 'law': '⚖️', 'government': '🏛️', 'politics': '🗳️',
      'court': '⚖️', 'justice': '⚖️', 'rights': '✊'
    };

    // Try exact match first
    if (iconMap[name]) {
      return iconMap[name];
    }

    // Try partial matches for compound categories
    for (const [key, icon] of Object.entries(iconMap)) {
      if (name.includes(key) || key.includes(name)) {
        return icon;
      }
    }

    // Fallback icons based on common patterns
    const fallbackPatterns = [
      { pattern: /night|evening|party|club/i, icon: '🌙' },
      { pattern: /outdoor|nature|park|garden/i, icon: '🌳' },
      { pattern: /indoor|venue|hall|center/i, icon: '🏢' },
      { pattern: /live|show|performance|stage/i, icon: '🎪' },
      { pattern: /meet|gathering|group|club/i, icon: '👥' },
      { pattern: /online|virtual|digital|remote/i, icon: '💻' },
      { pattern: /local|neighborhood|community/i, icon: '🏘️' },
      { pattern: /premium|vip|exclusive|luxury/i, icon: '⭐' },
      { pattern: /free|open|public/i, icon: '🆓' },
      { pattern: /international|global|world/i, icon: '🌍' },
      { pattern: /new|fresh|modern|contemporary/i, icon: '✨' },
      { pattern: /traditional|classic|vintage|retro/i, icon: '🏛️' },
      { pattern: /creative|innovative|unique/i, icon: '💡' },
      { pattern: /fun|exciting|adventure/i, icon: '🎉' },
      { pattern: /professional|career|work/i, icon: '💼' },
      { pattern: /casual|relaxed|informal/i, icon: '😊' }
    ];

    // Check fallback patterns
    for (const { pattern, icon } of fallbackPatterns) {
      if (pattern.test(categoryName)) {
        return icon;
      }
    }

    // Ultimate fallback - generate icon based on first letter or random selection
    const genericIcons = ['🎯', '⭐', '🎪', '🎭', '🎨', '🎵', '🎮', '🎊', '🎁', '🔥', '💫', '🌟', '✨', '💎', '🏆'];
    const charCode: number = categoryName && categoryName.length > 0 ? categoryName.charCodeAt(0) : 0;
    const arrayLength: number = genericIcons.length;
    const index: number = Math.abs(charCode) % arrayLength;
    return genericIcons[index];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className="relative group cursor-pointer"
      onClick={() => onClick(category)}
    >
      <div className={`
        relative overflow-hidden rounded-xl p-4 transition-all duration-300
        ${isActive 
          ? 'bg-gradient-to-br from-teal-500 to-mint-500 text-white shadow-lg shadow-teal-500/25' 
          : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-gradient-to-br hover:from-teal-50 hover:to-mint-50 dark:hover:from-teal-900/20 dark:hover:to-mint-900/20'
        }
        border border-gray-200/50 dark:border-gray-700/50 hover:border-teal-300/50
        shadow-sm hover:shadow-lg hover:shadow-teal-500/10
      `}>
        
        {/* Trending Indicator */}
        {isTrending && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Hot</span>
          </motion.div>
        )}

        {/* Category Icon */}
        <motion.div
          className="text-2xl mb-3 filter drop-shadow-sm"
          whileHover={{ scale: 1.2, rotate: 15 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {getCategoryIcon(category)}
        </motion.div>

        {/* Category Name */}
        <h3 className={`
          font-semibold text-sm mb-2 
          ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}
        `}>
          {category}
        </h3>

        {/* Event Count */}
        <div className={`
          flex items-center gap-1 text-xs
          ${isActive ? 'text-teal-100' : 'text-gray-600 dark:text-gray-300'}
        `}>
          <Calendar className="w-3 h-3" />
          <span>{eventCount} events</span>
        </div>

        {/* Hover Gradient Overlay */}
        {!isActive && (
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-mint-500/0 group-hover:from-teal-500/5 group-hover:to-mint-500/5 transition-all duration-300 rounded-xl" />
        )}
      </div>
    </motion.div>
  );
};

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();

  // Ref for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Events per page
  const EVENTS_PER_PAGE = 12;

  // Get category event counts
  const categoryEventCounts = useMemo(() => {
    const counts = {};
    events.forEach(event => {
      if (event.category) {
        counts[event.category] = (counts[event.category] || 0) + 1;
      }
    });
    return counts;
  }, [events]);

  // Get trending categories (top 3 by event count)
  const trendingCategories = useMemo(() => {
    return Object.entries(categoryEventCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([category]) => category);
  }, [categoryEventCounts]);

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    return categories.filter(category =>
      category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  // Memoized filtered events
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
        setEvents(prevEvents => {
          const existingIds = new Set(prevEvents.map(event => event.id));
          const newEvents = data.events.filter((event: Event) => !existingIds.has(event.id));
          return [...prevEvents, ...newEvents];
        });
      }

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

  const loadMoreEvents = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchEvents(currentPage + 1);
    }
  }, [fetchEvents, currentPage, isLoadingMore, hasMore]);

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
        rootMargin: '100px',
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
    fetchEvents(1, true);
  }, [activeCategory]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-mint-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 text-gray-900 dark:text-gray-100 relative">
      <FloatingShapes />
      <Navbar />

      <main className="py-12 pt-24 relative z-10">
        <div className="container mx-auto px-4">
          
          {/* Hero Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-teal-600 via-mint-600 to-teal-800 bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Discover Events
            </motion.h1>
            <motion.p
              className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Explore amazing events happening around you. Find your next adventure!
            </motion.p>
          </motion.div>

          {/* Modern Categories Section */}
          {!isLoading && categories.length > 0 && (
            <motion.div
              className="mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {/* Categories Header with Controls */}
              <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6">
                <div className="text-center lg:text-left">
                  <motion.h2
                    className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-mint-600 bg-clip-text text-transparent mb-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    Event Categories
                  </motion.h2>
                  <motion.p
                    className="text-gray-600 dark:text-gray-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    Browse events by your interests
                  </motion.p>
                </div>

                {/* Search and View Controls */}
                <div className="flex items-center gap-4">
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-64 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 focus:border-teal-400 focus:ring-teal-400/20"
                    />
                  </motion.div>

                  {/* View Mode Toggle */}
                  <motion.div
                    className="flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50 p-1"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`${viewMode === 'grid' ? 'bg-teal-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`${viewMode === 'list' ? 'bg-teal-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Trending Section */}
              {trendingCategories.length > 0 && (
                <motion.div
                  className="mb-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-orange-500 w-5 h-5" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Trending Now</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {trendingCategories.map((category, index) => (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant={activeCategory === category ? "default" : "outline"}
                          className={`rounded-full px-4 py-2 transition-all duration-300 ${
                            activeCategory === category
                              ? 'bg-gradient-to-r from-teal-500 to-mint-500 text-white shadow-lg shadow-teal-500/25'
                              : 'border-orange-300 text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:border-orange-400'
                          }`}
                          onClick={() => handleCategoryClick(category)}
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          {category}
                          <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                            {categoryEventCounts[category]}
                          </span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Categories Grid/List */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${viewMode}-${searchTerm}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className={
                    viewMode === 'grid'
                      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                      : "space-y-4"
                  }
                >
                  {filteredCategories.map((category, index) => (
                    <CategoryCard
                      key={category}
                      category={category}
                      eventCount={categoryEventCounts[category] || 0}
                      isActive={activeCategory === category}
                      onClick={handleCategoryClick}
                      index={index}
                      isTrending={trendingCategories.includes(category)}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Filter Status */}
              <motion.div
                className="mt-8 flex flex-wrap justify-center items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50">
                  <Filter className="w-4 h-4 text-teal-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {activeCategory ? `Filtering by: ${activeCategory}` : `Showing all ${categories.length} categories`}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50">
                  <Eye className="w-4 h-4 text-mint-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {filteredEvents.length} events found
                  </span>
                </div>

                {activeCategory && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveCategory('')}
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-mint-500 text-white rounded-full text-sm font-medium shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 transition-all duration-300"
                  >
                    Clear Filter
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Loading State */}
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
                  className="space-y-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Skeleton className="h-[200px] w-full rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                  <Skeleton className="h-4 w-3/4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                  <Skeleton className="h-4 w-1/2 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                  <Skeleton className="h-4 w-1/3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <>
              {/* Events Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {/* Decorative Divider */}
                <motion.div
                  className="border-t border-gradient-to-r from-transparent via-teal-300 to-transparent dark:via-teal-700 my-12 relative"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.4 }}
                >
                  <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-teal-500 to-mint-500 w-16 h-1 rounded-full shadow-lg shadow-teal-500/50"></div>
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
                        className="flex justify-center items-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50">
                          <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Loading more events...</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Load More Trigger */}
                    <div ref={loadMoreRef} className="h-10 w-full" />

                    {/* End Message */}
                    {!hasMore && filteredEvents.length > 0 && (
                      <motion.div
                        className="text-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-50 to-mint-50 dark:from-teal-900/20 dark:to-mint-900/20 rounded-full border border-teal-200/50 dark:border-teal-700/50">
                          <span className="text-2xl mr-3">🎉</span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            You've discovered all {filteredEvents.length} amazing events!
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <motion.div
                    className="text-center py-20"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="relative">
                      {/* Animated Background Circle */}
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="w-32 h-32 border-2 border-dashed border-teal-300/30 rounded-full"></div>
                      </motion.div>
                      
                      {/* Main Content */}
                      <div className="relative z-10">
                        <motion.div
                          className="text-8xl mb-6 filter drop-shadow-lg"
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ 
                            duration: 4, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          🎭
                        </motion.div>
                        
                        <motion.h3
                          className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-mint-600 bg-clip-text text-transparent mb-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          {activeCategory ? `No events in "${activeCategory}"` : 'No Events Found'}
                        </motion.h3>
                        
                        <motion.p
                          className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          {activeCategory 
                            ? 'Try exploring a different category or check back later for new events.'
                            : 'Check back soon for exciting upcoming events!'
                          }
                        </motion.p>
                        
                        {activeCategory && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                          >
                            <Button
                              onClick={() => setActiveCategory('')}
                              className="bg-gradient-to-r from-teal-500 to-mint-500 hover:from-teal-600 hover:to-mint-600 text-white px-8 py-3 rounded-full font-medium shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 transition-all duration-300"
                            >
                              <Eye className="w-5 h-5 mr-2" />
                              View All Events
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
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