
import React from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import EventsSection from '@/components/EventsSection';
import FeaturedEvent from '@/components/FeaturedEvent';
import CTASection from '@/components/CTASection';
import TicketPreview from '@/components/TicketPreview';
import Footer from '@/components/Footer';

const Index = () => {
  // Sample featured event data
  const featuredEvent = {
    id: '7',
    title: 'Global Electronic Music Festival',
    description: 'Join the world\'s top DJs and electronic music producers for a night of incredible beats, stunning visuals, and unforgettable experiences.',
    date: 'Sat, Sep 24, 2025',
    time: '8:00 PM - 2:00 AM',
    location: 'Bayfront Park, Miami',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    price: 'Starting from $129.99'
  };

  // Sample ticket data
  const sampleTicket = {
    eventName: 'Summer Music Festival',
    date: 'Sat, Jun 15, 2025',
    time: '2:00 PM - 11:00 PM',
    location: 'Central Park, New York',
    ticketHolder: 'John Doe',
    ticketType: 'VIP Pass',
    ticketId: 'PULSE2025X7891'
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      
      <main>
        <HeroSection />
        
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-10 text-center">Featured Event</h2>
          <FeaturedEvent {...featuredEvent} />
        </div>
        
        <EventsSection />
        
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Digital Tickets, Real Experiences</h2>
              <p className="text-xl text-muted-foreground">
                Our tickets come to life with animations and secure QR codes for easy scanning at venues
              </p>
            </div>
            
            <TicketPreview {...sampleTicket} />
          </div>
        </div>
        
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
