import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EventCard from './EventCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar, Flame, Sparkles, Clock, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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
  organizer: {
    id: number;
    company_name: string;
    company_description: string;
  };
}

interface EventsSectionProps {
  events: Event[];
  onLike: (eventId: number) => Promise<void>;
  showLikes?: boolean;
  showPastEvents?: boolean;
}

const tabs = [
  { id: 'all', label: 'All Events', icon: Sparkles },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'today', label: 'Today', icon: Clock },
  { id: 'upcoming', label: 'Upcoming', icon: Calendar },
  { id: 'past', label: 'Past Events', icon: History }
];

const EventsSection: React.FC<EventsSectionProps> = ({ 
  events, 
  onLike, 
  showLikes = false,
  showPastEvents = true 
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    filterEvents();
  }, [activeTab, searchQuery, events]);

const filterEvents = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  let result;

  // First separate past and current events
  const pastEvents = events.filter(event => new Date(event.date) < today);
  const currentEvents = events.filter(event => new Date(event.date) >= today);

  // Apply filters based on the active tab
  if (activeTab === 'past') {
    result = pastEvents;
  } else if (activeTab === 'trending') {
    result = currentEvents.filter(event => event.likes_count > 0);
  } else if (activeTab === 'today') {
    result = currentEvents.filter(event => event.date === todayStr);
  } else if (activeTab === 'upcoming') {
    result = currentEvents;
  } else if (activeTab === 'all') {
    result = events; // Include all events
  } else {
    result = currentEvents; // Default to current events
  }

  // Apply search filter if there's a query
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    result = result.filter(
      event =>
        event.name.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
    );
  }

  setFilteredEvents(result);
};

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to events page with search query
    navigate(`/events?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    // Also navigate to events page with the selected tab
    navigate(`/events?tab=${tabId}`);
  };

  const handleViewAll = () => {
    navigate('/events');
  };

  return (
    <section className="py-8 md:py-16 px-4 container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Discover Events</h2>
          <p className="text-sm md:text-base text-muted-foreground">Explore the most exciting events around you</p>
        </div>
        
        <div className="mt-4 md:mt-0 overflow-x-auto">
          <div className="glass-card dark:glass-card-dark p-1 flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                className={cn(
                  "flex items-center rounded-lg text-xs md:text-sm whitespace-nowrap",
                  activeTab === tab.id && "bg-pulse-purple text-white"
                )}
                onClick={() => handleTabClick(tab.id)}
              >
                <tab.icon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 md:mb-8 max-w-md mx-auto">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search events, venues, or categories" 
            className="pl-10 bg-background border-input focus:border-pulse-purple"
            value={searchQuery}
            onChange={handleSearch}
          />
          <Button type="submit" className="sr-only">Search</Button>
        </form>
      </div>
      
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredEvents.map((event, index) => (
            <div key={event.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <EventCard
                id={event.id.toString()}
                title={event.name}
                description={event.description}
                date={new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
                time={`${event.start_time} - ${event.end_time || 'Till Late'}`}
                location={event.location}
                image={event.image || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'}
                price="Starting from $129.99"
                category={activeTab === 'past' ? "Past Event" : "Event"}
                onLike={() => onLike(event.id)}
                likesCount={event.likes_count}
                showLikes={showLikes}
                isPast={activeTab === 'past'}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 md:py-16">
          <p className="text-lg md:text-xl text-muted-foreground mb-3 md:mb-4">No events found</p>
          <p className="text-xs md:text-sm text-muted-foreground">Try changing your search criteria or check back later for new events.</p>
        </div>
      )}
      
      <div className="flex justify-center mt-8 md:mt-12">
        <Button 
          variant="outline" 
          className="border-pulse-purple text-pulse-purple hover:bg-pulse-purple hover:text-white rounded-xl px-6 md:px-8 py-4 md:py-6"
          onClick={handleViewAll}
        >
          View All Events
        </Button>
      </div>
    </section>
  );
};

export default EventsSection;