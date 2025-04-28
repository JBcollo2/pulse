import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import EventsSection from '@/components/EventsSection';
import Footer from '@/components/Footer';
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

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

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/events`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data);
        setFilteredEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Error",
          description: "Failed to fetch events",
          variant: "destructive"
        });
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    const filtered = events.filter(event => 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEvents(filtered);
  }, [searchQuery, events]);

  const handleLike = async (eventId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}/like`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to like event');
      }

      // Update the events list with new like count
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, likes_count: event.likes_count + 1 }
            : event
        )
      );

      toast({
        title: "Success",
        description: "Event liked successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error liking event:', error);
      toast({
        title: "Error",
        description: "Failed to like event",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      
      <main>
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-6 text-gradient">Events</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover amazing events happening around you
          </p>
          
          <div className="mb-8">
            <Input
              type="text"
              placeholder="Search events by name, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xl"
            />
          </div>
          
          <EventsSection 
            events={filteredEvents} 
            onLike={handleLike}
            showLikes={true}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Events;
