
import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const HeroSection = () => {
  return (
    <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pulse-purple/20 via-pulse-blue/20 to-pulse-orange/20 animate-pulse-slow"></div>
      
      {/* Animated circles */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-pulse-purple/20 blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-pulse-blue/20 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-pulse-orange/20 blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      
      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in text-gradient">
          Experience Events Like Never Before
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Discover and book tickets for the most exciting events happening around you
        </p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="glass-card flex items-center p-2 gap-2">
            <Search className="text-muted-foreground ml-2" />
            <Input 
              type="text" 
              placeholder="Search events, artists, or venues" 
              className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
            />
            <Button className="bg-pulse-purple hover:bg-pulse-deep-purple rounded-xl">
              Search
            </Button>
          </div>
        </div>
        
        {/* Quick Categories */}
        <div className="flex flex-wrap justify-center gap-3 mt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          {['Concerts', 'Festivals', 'Sports', 'Theater', 'Workshops'].map((category) => (
            <Button key={category} variant="outline" className="rounded-full hover:bg-pulse-purple hover:text-white transition-colors">
              {category}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
