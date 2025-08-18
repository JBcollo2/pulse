import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, MapPin, Clock, Users, Star, Ticket, Eye, TrendingUp, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image: string;
  price: string;
  category: string;
  onLike?: () => Promise<void>;
  likesCount?: number;
  showLikes?: boolean;
  isPast?: boolean;
  featured?: boolean;
  organizer?: {
    id: number;
    company_name: string;
    company_description?: string;
  };
}

interface LowestPriceTicket {
  id: number;
  type_name: string;
  price: number;
  currency: string;
  currency_symbol: string;
  remaining_quantity: number;
}

const EventCard: React.FC<EventCardProps> = ({
  id,
  title,
  description,
  date,
  time,
  location,
  image,
  price,
  category,
  onLike,
  likesCount = 0,
  showLikes = false,
  isPast = false,
  featured = false,
  organizer
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [lowestPriceTicket, setLowestPriceTicket] = useState<LowestPriceTicket | null>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);

  // Fetch lowest price ticket for this event
  const fetchLowestPriceTicket = useCallback(async () => {
    setIsLoadingTicket(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ticket-types/lowest-price/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Ticket API Response for event', id, ':', data); // Debug log
        setLowestPriceTicket(data.lowest_price_ticket);
      } else {
        console.error('Failed to fetch ticket data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching lowest price ticket:', error);
    } finally {
      setIsLoadingTicket(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLowestPriceTicket();
  }, [fetchLowestPriceTicket]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onLike || isLiking) return;
    
    try {
      setIsLiking(true);
      setIsLiked(!isLiked);
      await onLike();
    } catch (error) {
      console.error('Error liking event:', error);
      setIsLiked(isLiked); // Revert on error
    } finally {
      setIsLiking(false);
    }
  };

  const getCategoryGradient = (category: string) => {
    const gradients = {
      'Technology': 'from-emerald-400 via-teal-400 to-mint-500',
      'Music': 'from-emerald-400 via-teal-400 to-mint-500',
      'Food': 'from-emerald-400 via-teal-400 to-mint-500',
      'Sports': 'from-emerald-400 via-teal-400 to-mint-500',
      'Business': 'from-emerald-400 via-teal-400 to-mint-500',
      'Art': 'from-emerald-400 via-teal-400 to-mint-500',
      'Health': 'from-emerald-400 via-teal-400 to-mint-500',
      'Education': 'from-emerald-400 via-teal-400 to-mint-500',
      default: 'from-emerald-400 via-teal-400 to-mint-500'
    };
    return gradients[category] || gradients.default;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'Technology': '💻',
      'Music': '🎵',
      'Food': '🍽️',
      'Sports': '⚽',
      'Business': '💼',
      'Art': '🎨',
      'Health': '🏥',
      'Education': '📚'
    };
    return icons[category] || '🎯';
  };

  return (
    <Link to={`/event/${id}`} className="group block">
      <motion.div
        className="group relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-800/50"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ 
          y: -8, 
          scale: 1.02,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Gradient Border Animation */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r ${getCategoryGradient(category)} opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500`}
          style={{ padding: '2px' }}
        >
          <div className="w-full h-full bg-white dark:bg-gray-900 rounded-3xl" />
        </motion.div>

        {/* Content Container */}
        <div className="relative z-10 p-0 h-full">
          
          {/* Image Section with Overlays */}
          <div className="relative h-56 overflow-hidden rounded-t-3xl">
            {/* Background Image */}
            <motion.img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            
            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t ${getCategoryGradient(category)} opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />
            
            {/* Dark Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Top Badges */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              {/* Featured Badge */}
              {featured && (
                <motion.div
                  className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getCategoryGradient(category)} shadow-lg backdrop-blur-sm flex items-center gap-1`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                >
                  <Star className="w-3 h-3 fill-current" />
                  FEATURED
                </motion.div>
              )}

              {/* Category Badge */}
              <motion.div
                className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-black/40 backdrop-blur-md border border-white/20 flex items-center gap-1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span>{getCategoryIcon(category)}</span>
                {category}
              </motion.div>
            </div>

            {/* Like Button */}
            {showLikes && (
              <motion.button
                onClick={handleLike}
                disabled={isLiking}
                className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md border border-white/20 transition-all duration-300 ${
                  isLiked 
                    ? 'bg-gradient-to-r from-blue-500 to-[#10b981] text-white shadow-lg scale-110' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
              >
                <Heart 
                  className={`w-4 h-4 transition-all duration-300 ${
                    isLiked ? 'fill-current' : ''
                  }`} 
                />
              </motion.button>
            )}

            {/* Bottom Info Bar */}
            <div className="absolute bottom-4 left-4 right-4">
              <motion.div
                className="flex items-center justify-between"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {/* Date */}
                <div className="flex items-center gap-2 text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">{formatDate(date)}</span>
                </div>

                {/* Likes Count */}
                {showLikes && (
                  <div className="flex items-center gap-1 text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-medium">{likesCount}</span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-4">
            
            {/* Title and Trending Indicator */}
            <div className="flex items-start justify-between gap-3">
              <motion.h3
                className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-all duration-500 line-clamp-2"
                style={{
                  backgroundImage: isHovered ? `linear-gradient(to right, var(--tw-gradient-stops))` : 'none',
                  '--tw-gradient-from': '#10b981',
                  '--tw-gradient-to': '#06d6a0',
                  '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)'
                } as React.CSSProperties}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {title}
              </motion.h3>
              
              {likesCount > 100 && (
                <motion.div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r ${getCategoryGradient(category)} text-white text-xs font-bold flex-shrink-0`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                >
                  <TrendingUp className="w-3 h-3" />
                  HOT
                </motion.div>
              )}
            </div>

            {/* Description */}
            <motion.p
              className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {description}
            </motion.p>

            {/* Event Details */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Time */}
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryGradient(category)} bg-opacity-10`}>
                  <Clock className="w-4 h-4 text-current" />
                </div>
                <span className="text-sm font-medium">{formatTime(time)}</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryGradient(category)} bg-opacity-10`}>
                  <MapPin className="w-4 h-4 text-current" />
                </div>
                <span className="text-sm font-medium truncate">{location}</span>
              </div>

              {/* Organizer */}
              {organizer && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryGradient(category)} bg-opacity-10`}>
                    <Users className="w-4 h-4 text-current" />
                  </div>
                  <span className="text-sm font-medium truncate">{organizer.company_name}</span>
                </div>
              )}
            </motion.div>

            {/* Price and Action Buttons */}
            <motion.div
              className="flex items-center justify-between pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {/* Price and Ticket Info */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {lowestPriceTicket ? `${lowestPriceTicket.price}` : price}
                  </span>
                  {lowestPriceTicket && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      starting from
                    </span>
                  )}
                </div>
                {lowestPriceTicket && (
                  <div className="space-y-1 mt-1">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {lowestPriceTicket.type_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        lowestPriceTicket.remaining_quantity > 10 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : lowestPriceTicket.remaining_quantity > 0
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {lowestPriceTicket.remaining_quantity > 0 
                          ? `${lowestPriceTicket.remaining_quantity} left`
                          : 'Sold out'
                        }
                      </span>
                    </div>
                  </div>
                )}
                {isPast && (
                  <Badge variant="secondary" className="w-fit text-xs mt-1">
                    Past Event
                  </Badge>
                )}
              </div>

              {/* Get Tickets Button - Made Smaller */}
              <motion.button
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 text-sm"
                disabled={isPast || (lowestPriceTicket && lowestPriceTicket.remaining_quantity === 0)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ 
                  boxShadow: `0 15px 30px -8px rgba(59, 130, 246, 0.3)`,
                  y: -1
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Handle ticket purchase
                }}
              >
                <Ticket className="w-4 h-4" />
                <span>
                  {isPast 
                    ? 'Ended' 
                    : (lowestPriceTicket && lowestPriceTicket.remaining_quantity === 0)
                    ? 'Sold Out'
                    : 'Get Tickets'
                  }
                </span>
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Hover Glow Effect */}
        <motion.div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${getCategoryGradient(category)} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10`}
          initial={{ scale: 0.8 }}
          animate={{ scale: isHovered ? 1.1 : 0.8 }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
    </Link>
  );
};

export default EventCard;