import React, { useState, useEffect } from 'react';
import EventCard from './EventCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar, Flame, Sparkles, Clock } from 'lucide-react';
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
}

const tabs = [
  { id: 'all', label: 'All Events', icon: Sparkles },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'today', label: 'Today', icon: Clock },
  { id: 'upcoming', label: 'Upcoming', icon: Calendar }
];

const EventsSection: React.FC<EventsSectionProps> = ({ events, onLike, showLikes = false }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    filterEvents();
  }, [activeTab, searchQuery, events]);

  const filterEvents = () => {
    let result = events;
    
    // Filter by tab
    if (activeTab === 'trending') {
      result = result.filter(event => event.likes_count > 0);
    } else if (activeTab === 'today') {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter(event => event.date === today);
    } else if (activeTab === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter(event => event.date >= today);
    }
    
    // Filter by search query
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

  return (
    <section className="py-16 px-4 container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold mb-2">Discover Events</h2>
          <p className="text-muted-foreground">Explore the most exciting events around you</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <div className="glass-card dark:glass-card-dark p-1 flex gap-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                className={cn(
                  "flex items-center rounded-lg",
                  activeTab === tab.id && "bg-pulse-purple text-white"
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search events, venues, or categories" 
            className="pl-10 bg-background border-input focus:border-pulse-purple"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="animate-fade-in" style={{ animationDelay: `${event.id * 0.1}s` }}>
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
                category="Event"
                onLike={() => onLike(event.id)}
                likesCount={event.likes_count}
                showLikes={showLikes}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground mb-4">No events found</p>
          <p className="text-sm text-muted-foreground">Try changing your search criteria or check back later for new events.</p>
        </div>
      )}
      
      <div className="flex justify-center mt-12">
        <Button 
          variant="outline" 
          className="border-pulse-purple text-pulse-purple hover:bg-pulse-purple hover:text-white rounded-xl px-8 py-6"
        >
          View All Events
        </Button>
      </div>
    </section>
  );
};

export default EventsSection;
