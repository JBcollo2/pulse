import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
  price: string;
  category: string;
}

const EventCard: React.FC<EventCardProps> = ({
  id,
  title,
  date,
  time,
  location,
  image,
  price,
  category
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <Link to={`/event/${id}`} className="block">
      <div 
        className={cn(
          "glass-card overflow-hidden transition-all duration-300 group",
          isHovered && "transform scale-[1.02] shadow-xl"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img 
            src={image} 
            alt={title} 
            className={cn(
              "w-full h-full object-cover transition-transform duration-500",
              isHovered && "scale-110"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          <Badge 
            className="absolute top-4 left-4 bg-pulse-purple hover:bg-pulse-purple text-white animate-fade-in" 
            variant="secondary"
          >
            {category}
          </Badge>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-3 right-3 text-white hover:text-pulse-purple hover:bg-white/10 rounded-full"
            onClick={(e) => {
              e.preventDefault();
              setIsFavorite(!isFavorite);
            }}
          >
            <Heart className={cn("h-5 w-5 transition-all", isFavorite && "fill-pulse-purple text-pulse-purple")} />
          </Button>
        </div>
        
        <div className="p-5">
          <Link to={`/event/${id}`}>
            <h3 className="text-xl font-bold line-clamp-2 mb-3 group-hover:text-pulse-purple transition-colors">
              {title}
            </h3>
          </Link>
          
          <div className="space-y-2 mb-5">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="text-sm">{date}</span>
            </div>
            
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              <span className="text-sm">{time}</span>
            </div>
            
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="text-sm line-clamp-1">{location}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">{price}</span>
            <Button className="bg-pulse-purple hover:bg-pulse-deep-purple transition-all">
              Get Tickets
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
