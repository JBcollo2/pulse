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
    <div className="relative overflow-hidden rounded-3xl shadow-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      {/* Background Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-10 dark:opacity-5" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")'
        }}
      ></div>

      {/* Event Image Section */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent z-10"></div>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover scale-105"
        />
      </div>

      {/* Content Section */}
      <div className="relative z-10 p-8 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3">
            {description}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 flex flex-col items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600">
              <Calendar className="h-5 w-5 text-purple-500 mb-1" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(date)}</span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-3 flex flex-col items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600">
              <Clock className="h-5 w-5 text-blue-500 mb-1" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{formatTime(time)}</span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-3 flex flex-col items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600">
              <MapPin className="h-5 w-5 text-orange-500 mb-1" />
              <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">{location}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Price and Ticket Info */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {lowestPriceTicket 
                    ? `${lowestPriceTicket.currency_symbol || 'KSh'}${lowestPriceTicket.price.toLocaleString()}`
                    : price
                  }
                </span>
                {lowestPriceTicket && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    starting from
                  </span>
                )}
              </div>
              
              {lowestPriceTicket && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {lowestPriceTicket.type_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      lowestPriceTicket.remaining_quantity > 10 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'
                        : lowestPriceTicket.remaining_quantity > 0
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700'
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
              className={`bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-700 hover:to-green-700 text-white px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 ${
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