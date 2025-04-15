
import React from 'react';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface FeaturedEventProps {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image: string;
  price: string;
}

const FeaturedEvent: React.FC<FeaturedEventProps> = ({
  id,
  title,
  description,
  date,
  time,
  location,
  image,
  price
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-pulse-charcoal/90 to-pulse-charcoal/70 z-10"></div>
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover scale-105 animate-pulse-slow"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 p-8 md:p-12 lg:p-16 flex flex-col h-full min-h-[500px] justify-end">
        <div className="max-w-xl animate-fade-in">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {title}
          </h2>
          
          <p className="text-white/80 mb-6 line-clamp-3">
            {description}
          </p>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-card-dark p-3 flex flex-col items-center justify-center">
              <Calendar className="h-5 w-5 text-pulse-purple mb-1" />
              <span className="text-sm text-white/80">{date}</span>
            </div>
            
            <div className="glass-card-dark p-3 flex flex-col items-center justify-center">
              <Clock className="h-5 w-5 text-pulse-blue mb-1" />
              <span className="text-sm text-white/80">{time}</span>
            </div>
            
            <div className="glass-card-dark p-3 flex flex-col items-center justify-center">
              <MapPin className="h-5 w-5 text-pulse-orange mb-1" />
              <span className="text-sm text-white/80 line-clamp-1">{location}</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-xl font-bold text-white">{price}</span>
            <Button className="bg-pulse-purple hover:bg-pulse-deep-purple text-white px-6 py-6 rounded-xl" asChild>
              <Link to={`/event/${id}`} className="flex items-center gap-2">
                Get Tickets <ArrowRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedEvent;
