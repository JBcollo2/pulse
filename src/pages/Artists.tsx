
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Artists = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      
      <main>
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-6 text-gradient">Artists</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover talented artists performing at our events
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
            {/* Placeholder for artist cards */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
              <div key={index} className="group hover-scale">
                <div className="aspect-square rounded-full overflow-hidden mb-4 bg-muted animate-pulse"></div>
                <h3 className="text-lg font-semibold">Artist Name {index}</h3>
                <p className="text-sm text-muted-foreground">Genre</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Artists;
