
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Venues = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      
      <main>
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-6 text-gradient">Venues</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Explore our partner venues for your next unforgettable experience
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {/* Placeholder for venue cards */}
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="h-48 bg-muted animate-pulse"></div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Venue Name {index}</h3>
                  <p className="text-muted-foreground mb-4">Location • Capacity: 500</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium bg-muted px-3 py-1 rounded-full">
                      8 Upcoming Events
                    </span>
                    <button className="text-pulse-purple hover:underline">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Venues;
