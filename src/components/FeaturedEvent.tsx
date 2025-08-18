import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Clock, ArrowRight, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  onLike?: () => Promise<void>;
  likesCount?: number;
  isPast?: boolean;
}

interface LowestPriceTicket {
  id: number;
  type_name: string;
  price: number;
  currency: string;
  currency_symbol: string;
  remaining_quantity: number;
}

const FeaturedEvent: React.FC<FeaturedEventProps> = ({
  id,
  title,
  description,
  date,
  time,
  location,
  image,
  price,
  onLike,
  likesCount = 0,
  isPast = false
}) => {
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
        console.log('Featured Event Ticket API Response for event', id, ':', data); // Debug log
        setLowestPriceTicket(data.lowest_price_ticket);
      } else {
        console.error('Failed to fetch ticket data for featured event:', response.status);
      }
    } catch (error) {
      console.error('Error fetching lowest price ticket for featured event:', error);
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

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-lg">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-800/70 z-10"></div>
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
            <div className="bg-gray-800/50 backdrop-blur-md p-3 flex flex-col items-center justify-center rounded-lg border border-white/10">
              <Calendar className="h-5 w-5 text-purple-500 mb-1" />
              <span className="text-sm text-white/80">{formatDate(date)}</span>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-md p-3 flex flex-col items-center justify-center rounded-lg border border-white/10">
              <Clock className="h-5 w-5 text-blue-500 mb-1" />
              <span className="text-sm text-white/80">{formatTime(time)}</span>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-md p-3 flex flex-col items-center justify-center rounded-lg border border-white/10">
              <MapPin className="h-5 w-5 text-orange-500 mb-1" />
              <span className="text-sm text-white/80 line-clamp-1">{location}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Price and Ticket Info */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl lg:text-3xl font-bold text-white">
                  {lowestPriceTicket 
                    ? `${lowestPriceTicket.currency_symbol || 'KSh'}${lowestPriceTicket.price.toLocaleString()}`
                    : price
                  }
                </span>
                {lowestPriceTicket && (
                  <span className="text-sm text-white/60">
                    starting from
                  </span>
                )}
              </div>
              
              {lowestPriceTicket && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-white/80">
                    {lowestPriceTicket.type_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      lowestPriceTicket.remaining_quantity > 10 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : lowestPriceTicket.remaining_quantity > 0
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {lowestPriceTicket.remaining_quantity > 0 
                        ? `${lowestPriceTicket.remaining_quantity} left`
                        : 'Sold out'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Get Tickets Button */}
            <Button 
              className={`bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] text-white px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 ${
                isPast || (lowestPriceTicket && lowestPriceTicket.remaining_quantity === 0) 
                  ? 'cursor-not-allowed' 
                  : 'hover:shadow-blue-500/25'
              }`}
              disabled={isPast || (lowestPriceTicket && lowestPriceTicket.remaining_quantity === 0)}
              asChild={!isPast && !(lowestPriceTicket && lowestPriceTicket.remaining_quantity === 0)}
            >
              {isPast || (lowestPriceTicket && lowestPriceTicket.remaining_quantity === 0) ? (
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  <span>
                    {isPast 
                      ? 'Event Ended' 
                      : 'Sold Out'
                    }
                  </span>
                </div>
              ) : (
                <Link to={`/event/${id}`} className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Get Tickets 
                  <ArrowRight className="ml-1 h-5 w-5" />
                </Link>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedEvent;