
import React, { useState, useEffect } from 'react';
import EventCard from './EventCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar, Flame, Sparkles, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

// Sample event data
const events = [
  {
    id: '1',
    title: 'Summer Music Festival',
    date: 'Sat, Jun 15, 2025',
    time: '2:00 PM',
    location: 'Central Park, New York',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    price: '$49.99',
    category: 'Music',
    trending: true,
    upcoming: true
  },
  {
    id: '2',
    title: 'International Film Festival',
    date: 'Fri, May 23, 2025',
    time: '7:00 PM',
    location: 'Lincoln Center, New York',
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    price: '$24.99',
    category: 'Film',
    trending: true,
    upcoming: true
  },
  {
    id: '3',
    title: 'Tech Conference 2025',
    date: 'Mon, Jul 10, 2025',
    time: '9:00 AM',
    location: 'Convention Center, San Francisco',
    image: 'https://images.unsplash.com/photo-1540304453527-62f979142a17?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    price: '$99.99',
    category: 'Tech',
    upcoming: true
  },
  {
    id: '4',
    title: 'Broadway: Hamilton',
    date: 'Wed, Jun 5, 2025',
    time: '8:00 PM',
    location: 'Richard Rodgers Theatre, NY',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    price: '$199.99',
    category: 'Theater',
    trending: true
  },
  {
    id: '5',
    title: 'Food & Wine Festival',
    date: 'Sat, Aug 12, 2025',
    time: '12:00 PM',
    location: 'Riverfront Park, Chicago',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    price: '$75.00',
    category: 'Food',
    upcoming: true
  },
  {
    id: '6',
    title: 'NBA Finals Game 5',
    date: 'Thu, Jun 19, 2025',
    time: '9:00 PM',
    location: 'Madison Square Garden, NY',
    image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    price: '$350.00',
    category: 'Sports',
    trending: true
  }
];

// Get today's date in format MM/DD/YYYY for comparison
const today = new Date().toLocaleDateString('en-US');

// Add today property to events
const eventsWithToday = events.map(event => {
  const eventDate = new Date(event.date.split(', ')[1]).toLocaleDateString('en-US');
  return {
    ...event,
    today: eventDate === today
  };
});

const tabs = [
  { id: 'all', label: 'All Events', icon: Sparkles },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'today', label: 'Today', icon: Clock },
  { id: 'upcoming', label: 'Upcoming', icon: Calendar }
];

const EventsSection = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [filteredEvents, setFilteredEvents] = useState(eventsWithToday);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    filterEvents();
  }, [activeTab, searchQuery]);

  const filterEvents = () => {
    let result = eventsWithToday;
    
    // Filter by tab
    if (activeTab === 'trending') {
      result = result.filter(event => event.trending);
    } else if (activeTab === 'today') {
      result = result.filter(event => event.today);
    } else if (activeTab === 'upcoming') {
      result = result.filter(event => event.upcoming);
    }
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        event => 
          event.title.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.category.toLowerCase().includes(query)
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
            <div key={event.id} className="animate-fade-in" style={{ animationDelay: `${parseInt(event.id) * 0.1}s` }}>
              <EventCard {...event} />
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
