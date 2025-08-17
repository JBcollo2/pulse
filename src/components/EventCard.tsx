import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
  isPast = false
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onLike || isLiking) return;
    try {
      setIsLiking(true);
      await onLike();
      setIsLiked(!isLiked);
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
          <div className="absolute top-2 left-2">
            <Badge className="bg-purple-600 text-white">{category}</Badge>
          </div>
          {showLikes && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 dark:text-gray-300",
                isLiked && "text-purple-500"
              )}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={cn("h-5 w-5", isLiked && "fill-current text-purple-500")} />
            </Button>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-xl font-bold line-clamp-2 mb-3 group-hover:text-purple-600 transition-colors text-gray-900 dark:text-white">
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
            <Button className="w-full bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-600 hover:to-[#059669] hover:scale-105 transition-all text-white px-6 py-6 rounded-xl">
              Get Tickets
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
