import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HeroSectionProps {
  onSearch?: (query: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-orange-500/20">
      {/* Animated circles */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-orange-500/20 blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in text-gray-900 dark:text-white">
          Experience Events Like Never Before
        </h1>

        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Discover and book tickets for the most exciting events happening around you
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <form onSubmit={handleSubmit} className="glass-card flex items-center p-2 gap-2">
            <Search className="text-gray-400 dark:text-gray-300 ml-2" />
            <Input
              type="text"
              placeholder="Search events, artists, or venues"
              className="flex-1 border-none bg-transparent focus:ring-0 focus:ring-offset-0 placeholder:text-gray-400 dark:placeholder:text-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 rounded-xl text-white"
            >
              Search
            </Button>
          </form>
        </div>

        {/* Quick Categories */}
        <div className="flex flex-wrap justify-center gap-3 mt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          {['Concerts', 'Festivals', 'Sports', 'Theater', 'Workshops'].map((category) => (
            <Button key={category} variant="outline" className="rounded-full hover:bg-purple-600 hover:text-white transition-colors border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
              {category}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
