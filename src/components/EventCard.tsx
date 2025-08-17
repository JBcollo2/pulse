import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
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
}

// Stylish Like Button Component (embedded in EventCard)
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
        bg-gradient-to-r from-blue-500 to-emerald-500 
        hover:from-blue-600 hover:to-emerald-600
        text-white rounded-full shadow-lg hover:shadow-xl
        transition-all duration-300 ease-out
        transform hover:scale-105 active:scale-95
        text-sm font-medium
        ${className}
      `}
      whileHover={{ 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
      }}
      whileTap={{ scale: 0.95 }}
      disabled={isAnimating}
    >
      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-full"
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
            ${isLiked ? 'fill-white text-white' : 'text-white'}
          `}
        />
      </motion.div>
      
      {/* Like count with bounce animation */}
      <motion.span
        className="relative z-10"
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
              className="absolute text-blue-300 pointer-events-none"
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
      
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
        initial={{ x: '-100%', opacity: 0 }}
        animate={{ x: '100%', opacity: [0, 1, 0] }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          repeatDelay: 3,
          ease: "easeInOut" 
        }}
      />
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
  isPast = false
}) => {
  const [isLiking, setIsLiking] = useState(false);

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

  return (
    <Link to={`/event/${id}`} className="group block">
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="relative">
          <img
            src={image}
            alt={title}
            className="w-full h-48 object-cover"
          />
          {showLikes && (
            <div className="absolute top-2 right-2">
              <StylishLikeButton
                likes={likesCount}
                onLike={handleLike}
              />
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-xl font-bold line-clamp-2 mb-3 transition-colors text-gray-900 dark:text-white">
            {title}
          </h3>

          <div className="space-y-2 mb-5">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="text-sm">{date}</span>
            </div>

            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Clock className="h-4 w-4 mr-2" />
              <span className="text-sm">{time}</span>
            </div>

            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="text-sm line-clamp-1">{location}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900 dark:text-white">{price}</span>
            <Button className="bg-gradient-to-r from-blue-500 to-[#10b981] text-white px-6 py-6 rounded-xl">
              Get Tickets
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;