
import React from 'react';
import Navbar from '@/components/Navbar';
import EventsSection from '@/components/EventsSection';
import Footer from '@/components/Footer';

const Events = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      
      <main>
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-6 text-gradient">Events</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover amazing events happening around you
          </p>
          <EventsSection />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Events;
