import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Heart, Eye, Star, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Note: Replace with your router Link component
import { motion } from 'framer-motion';

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
    company_name: string;
  };
}

// Enhanced Like Button with beautiful animations
const StylishLikeButton: React.FC<{
  likes: number;
  onLike: () => void;
  className?: string;
}> = ({ likes, onLike, className = '' }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsLiked(true);
    onLike();
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  return (
    <motion.button
      onClick={handleLike}
      className={`
        group relative inline-flex items-center gap-2 px-3 py-2 
        bg-white/90 backdrop-blur-sm hover:bg-white
        border border-gray-200/50 hover:border-teal-300/50
        text-gray-700 hover:text-teal-600
        rounded-full shadow-lg hover:shadow-xl
        transition-all duration-300 ease-out
        transform hover:scale-105 active:scale-95
        text-sm font-medium
        ${className}
      `}
      whileHover={{ 
        boxShadow: "0 20px 25px -5px rgba(20, 184, 166, 0.1), 0 10px 10px -5px rgba(20, 184, 166, 0.04)" 
      }}
      whileTap={{ scale: 0.95 }}
      disabled={isAnimating}
    >
      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-mint-500/20 rounded-full"
        initial={{ scale: 0, opacity: 1 }}
        animate={isAnimating ? { scale: 2, opacity: 0 } : { scale: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      
      {/* Heart icon with animation */}
      <motion.div
        className="relative z-10"
        animate={isAnimating ? { 
          scale: [1, 1.3, 1],
          rotate: [0, -10, 0]
        } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Heart 
          className={`
            w-4 h-4 transition-all duration-200
            ${isLiked ? 'fill-teal-500 text-teal-500' : 'text-gray-600'}
          `}
        />
      </motion.div>
      
      {/* Like count with bounce animation */}
      <motion.span
        className="relative z-10 font-semibold"
        animate={isAnimating ? { 
          scale: [1, 1.2, 1],
          y: [0, -2, 0]
        } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {likes}
      </motion.span>
      
      {/* Floating hearts animation */}
      {isAnimating && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-teal-400 pointer-events-none"
              initial={{ 
                scale: 0, 
                x: 0, 
                y: 0, 
                opacity: 1 
              }}
              animate={{ 
                scale: [0, 1, 0], 
                x: [0, (i - 1) * 15], 
                y: [0, -25 - i * 8], 
                opacity: [1, 1, 0] 
              }}
              transition={{ 
                duration: 0.8, 
                delay: i * 0.1,
                ease: "easeOut" 
              }}
            >
              <Heart className="w-2 h-2 fill-current" />
            </motion.div>
          ))}
        </>
      )}
    </motion.button>
  );
};

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
  const [isLiking, setIsLiking] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLike = async () => {
    if (!onLike || isLiking) return;
    try {
      setIsLiking(true);
      await onLike();
    } catch (error) {
      console.error('Error liking event:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    const iconMap = {
      'technology': '💻', 'tech': '💻', 'music': '🎵', 'sports': '⚽', 
      'business': '💼', 'art': '🎨', 'food': '🍽️', 'health': '🏥',
      'travel': '✈️', 'gaming': '🎮', 'fashion': '👗', 'education': '📚'
    };
    
    for (const [key, icon] of Object.entries(iconMap)) {
      if (name.includes(key) || key.includes(name)) {
        return icon;
      }
    }
    return '🎯';
  };

  return (
    <div 
      onClick={() => window.location.href = `/event/${id}`} 
      className="group block cursor-pointer"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`
          relative overflow-hidden rounded-2xl transition-all duration-500
          ${featured 
            ? 'bg-gradient-to-br from-teal-50 via-white to-mint-50 dark:from-teal-900/20 dark:via-gray-800 dark:to-mint-900/20 ring-2 ring-teal-200/50 dark:ring-teal-700/50' 
            : 'bg-white/80 dark:bg-gray-800/80'
          }
          backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50
          hover:border-teal-300/50 dark:hover:border-teal-600/50
          shadow-lg hover:shadow-2xl hover:shadow-teal-500/10
          transform-gpu
        `}
      >
        {/* Featured Badge */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 left-4 z-20 bg-gradient-to-r from-teal-500 to-mint-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
          >
            <Star className="w-3 h-3 fill-current" />
            Featured
          </motion.div>
        )}

        {/* Image Section with Overlay Effects */}
        <div className="relative overflow-hidden">
          <motion.div
            className="relative h-48 overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <img
              src={image || '/api/placeholder/400/200'}
              alt={title}
              className={`w-full h-full object-cover transition-all duration-700 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Loading Placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse" />
            )}
          </motion.div>

          {/* Top Right Actions */}
          <div className="absolute top-3 right-3 flex gap-2">
            {showLikes && (
              <StylishLikeButton
                likes={likesCount}
                onLike={handleLike}
              />
            )}
          </div>

          {/* Category Badge - Bottom Left */}
          <motion.div
            className="absolute bottom-3 left-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Badge className="bg-white/90 backdrop-blur-sm text-gray-800 border-0 shadow-lg hover:bg-white transition-all duration-200 text-xs font-semibold px-3 py-1">
              <span className="mr-1.5">{getCategoryIcon(category)}</span>
              {category}
            </Badge>
          </motion.div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          {/* Title and Description */}
          <div className="space-y-2">
            <motion.h3
              className="text-xl font-bold line-clamp-2 text-gray-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
            >
              {title}
            </motion.h3>
            
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Event Details */}
          <div className="space-y-3">
            <motion.div 
              className="flex items-center text-gray-600 dark:text-gray-300"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-center w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full mr-3 group-hover:bg-teal-200 dark:group-hover:bg-teal-800/50 transition-colors duration-200">
                <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <span className="text-sm font-medium">{date}</span>
            </motion.div>

            <motion.div 
              className="flex items-center text-gray-600 dark:text-gray-300"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-center w-8 h-8 bg-mint-100 dark:bg-mint-900/30 rounded-full mr-3 group-hover:bg-mint-200 dark:group-hover:bg-mint-800/50 transition-colors duration-200">
                <Clock className="h-4 w-4 text-mint-600 dark:text-mint-400" />
              </div>
              <span className="text-sm font-medium">{time}</span>
            </motion.div>

            <motion.div 
              className="flex items-center text-gray-600 dark:text-gray-300"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors duration-200">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium line-clamp-1">{location}</span>
            </motion.div>

            {/* Organizer */}
            {organizer && (
              <motion.div 
                className="flex items-center text-gray-600 dark:text-gray-300"
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full mr-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors duration-200">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-medium line-clamp-1">by {organizer.company_name}</span>
              </motion.div>
            )}
          </div>

          {/* Price and CTA Section */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                {price === 'Free' || price === '$0' ? 'Free Event' : 'Price'}
              </span>
              <span className={`text-lg font-bold ${
                price === 'Free' || price === '$0' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                {price}
              </span>
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="bg-gradient-to-r from-teal-500 to-mint-500 hover:from-teal-600 hover:to-mint-600 text-white px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:shadow-teal-500/25 transition-all duration-300 font-semibold text-sm">
                <span className="mr-2">Get Tickets</span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  →
                </motion.div>
              </Button>
            </motion.div>
          </div>

          {/* Stats Bar */}
          {(showLikes && likesCount > 0) && (
            <motion.div
              className="flex items-center gap-4 pt-2 text-xs text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{Math.floor(likesCount * 12.5)} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{likesCount} likes</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 via-transparent to-mint-500/0 group-hover:from-teal-500/5 group-hover:to-mint-500/5 transition-all duration-500 rounded-2xl pointer-events-none" />
      </motion.div>
    </div>
  );
};

export default EventCard;