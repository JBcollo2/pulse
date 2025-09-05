import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Star, Search, Globe, Calendar, TrendingUp, Building,
  ArrowRight, Zap, Users, Award, Coffee, Wifi, Car, Utensils, Sparkles,
  Camera, Clock, Heart, Shield, Music, Palette, Diamond, Crown
} from 'lucide-react';

// Enhanced CityCard Component with modern styling
const CityCard = ({ city, onSelect, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Use Unsplash API for better city images
  const getUnsplashImage = (cityName) => {
    return `https://source.unsplash.com/800x600/?${encodeURIComponent(cityName)},city,skyline`;
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-700 transform hover:scale-[1.02] hover:rotate-1`}
      onClick={() => onSelect(city.city)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      {/* Card Container with Glassmorphism */}
      <div className="relative bg-white/10 dark:bg-gray-900/20 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-700 border border-white/20 dark:border-gray-700/30">
        
        {/* Image Section */}
        <div className="relative h-48 sm:h-52 lg:h-56 overflow-hidden">
          <img
            src={city.image || getUnsplashImage(city.city)}
            alt={city.city}
            className={`w-full h-full object-cover transition-all duration-700 ${
              isHovered ? 'scale-110 brightness-110' : 'scale-100'
            } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 animate-pulse" />
          )}
          
          {/* Dynamic gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-700 ${
            isHovered 
              ? 'opacity-30 from-blue-500/40 via-cyan-500/20 to-transparent' 
              : 'opacity-0'
          }`} />

          {/* Popular badge */}
          {city.popular && (
            <div className="absolute top-4 right-4 z-10">
              <div className="px-3 py-1.5 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-sm border border-white/20">
                <Crown className="w-3.5 h-3.5" />
                <span>POPULAR</span>
                <Sparkles className="w-3 h-3" />
              </div>
            </div>
          )}

          {/* Floating stats */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex flex-col gap-2">
              <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-white text-xs flex items-center gap-1">
                <Camera className="w-3 h-3" />
                <span>4K</span>
              </div>
              <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-white text-xs flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400" />
                <span>4.9</span>
              </div>
            </div>
          </div>

          {/* City info overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="space-y-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 drop-shadow-lg">
                  {city.city}
                </h3>
                <p className="text-white/80 text-sm leading-relaxed drop-shadow">
                  Discover amazing venues in this vibrant city
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-white/90">
                    <Building className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">{city.venues || city.event_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/90">
                    <Calendar className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium">{city.event_count || 0}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">
                  <MapPin className="w-3 h-3" />
                  <span>Explore</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hover overlay effects */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-green-500/10 backdrop-blur-[2px]" />
            
            {/* Animated particles */}
            <div className="absolute top-8 right-8 w-2 h-2 bg-white/60 rounded-full animate-ping" />
            <div className="absolute bottom-12 right-12 w-1 h-1 bg-cyan-400/80 rounded-full animate-pulse" />
            <div className="absolute top-16 left-8 w-1.5 h-1.5 bg-blue-400/70 rounded-full animate-bounce" />
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-4">
          {/* Action button */}
          <button className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 hover:from-blue-600 hover:via-cyan-600 hover:to-green-600 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
            <div className="relative flex items-center justify-center gap-2">
              <span className="font-bold">Explore {city.city}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </div>
          </button>

          {/* Amenities tags */}
          <div className="flex flex-wrap gap-2">
            {(city.top_amenities || ['WiFi', 'Parking', 'Dining']).slice(0, 3).map((amenity, idx) => (
              <span 
                key={idx} 
                className="text-xs bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full border border-blue-200/30 dark:border-blue-700/30 backdrop-blur-sm font-medium"
              >
                {amenity}
              </span>
            ))}
          </div>

          {/* Statistics */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200/20 dark:border-gray-700/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  {Math.floor(Math.random() * 500) + 100}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  {Math.floor(Math.random() * 50) + 10}k
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-700 dark:text-green-400 font-medium">Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced StatsCard Component
const StatsCard = ({ icon, value, label, gradient, delay = 0 }) => (
  <div 
    className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-gray-700/40 hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-rotate-1"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    <div className="relative flex items-center gap-4">
      <div className={`relative p-3 rounded-xl bg-gradient-to-r ${gradient} text-white shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
        {icon}
        <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
          {value}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
          {label}
        </div>
      </div>
    </div>

    {/* Floating effect elements */}
    <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full opacity-0 group-hover:opacity-60 transition-all duration-500 animate-bounce" />
    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full opacity-0 group-hover:opacity-40 transition-all duration-700 animate-pulse" />
  </div>
);

// Enhanced floating background elements
const FloatingShapes = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {/* Primary floating elements */}
    <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 via-cyan-400/10 to-blue-500/10 rounded-full blur-xl animate-pulse" />
    <div className="absolute top-60 right-20 w-24 h-24 bg-gradient-to-br from-cyan-400/10 via-green-400/10 to-cyan-500/10 rounded-full blur-xl animate-bounce" />
    <div className="absolute bottom-40 left-1/3 w-40 h-40 bg-gradient-to-br from-green-500/8 via-emerald-500/8 to-blue-500/8 rounded-full blur-2xl animate-pulse" />
    
    {/* Secondary ambient elements */}
    <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-gradient-to-br from-purple-400/8 via-pink-400/8 to-purple-500/8 rounded-full blur-lg animate-float" />
    <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-gradient-to-br from-orange-400/6 via-yellow-400/6 to-orange-500/6 rounded-full blur-xl animate-float-delayed" />
    
    {/* Animated gradient mesh */}
    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 animate-gradient" />
    </div>
  </div>
);

// Main Landing Page Component
const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalVenues: 0,
    totalEvents: 0,
    activeCities: 0,
    featuredVenues: 0,
  });
  const navigate = useNavigate();

  // Fetch cities and calculate stats
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/cities`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch cities');
        const data = await response.json();
        setCities(data.cities || []);

        // Enhanced stats calculation
        const totalEvents = data.cities.reduce((sum, city) => sum + city.event_count, 0);
        const featuredVenues = data.cities.filter(city => city.popular).length;
        setStats({
          totalVenues: data.cities.length * 8, // More realistic venue count
          totalEvents: totalEvents || 1247, // Fallback number
          activeCities: data.cities.length || 12,
          featuredVenues: featuredVenues || 28,
        });
      } catch (err) {
        setError('Failed to load cities');
        console.error('Error fetching cities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  // Filter cities based on search
  useEffect(() => {
    const filtered = cities.filter(city =>
      city.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCities(filtered);
  }, [searchQuery, cities]);

  const handleCitySelect = (cityName) => {
    navigate(`/venues?city=${encodeURIComponent(cityName)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-cyan-900/10 text-gray-900 dark:text-gray-100 relative overflow-hidden">
      <FloatingShapes />

      <main className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Enhanced Hero Section */}
          <div className="text-center mb-20">
            <div className="relative">
              {/* Floating elements around title */}
              <div className="absolute -top-8 left-1/4 transform -translate-x-1/2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-bounce" />
              </div>
              <div className="absolute -top-4 right-1/4 transform translate-x-1/2">
                <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-green-400 rounded-full animate-pulse" />
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500 bg-clip-text text-transparent mb-6 leading-tight tracking-tight">
                Find Perfect<br />
                <span className="relative">
                  Event Venues
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse" />
                </span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-8 leading-relaxed font-medium">
              Explore thousands of unique venues across cities worldwide and create unforgettable experiences
            </p>
            
            {/* Enhanced search bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 blur-xl" />
                <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 rounded-2xl p-2 shadow-xl">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mr-3 shadow-lg">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search for cities, venues, or locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 py-3 px-2 bg-transparent border-none outline-none text-lg placeholder-gray-500 dark:placeholder-gray-400 text-gray-800 dark:text-gray-200"
                    />
                    <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-600 hover:to-green-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                      <span>Search</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { icon: Shield, text: "Verified Venues", color: "from-blue-500 to-cyan-500" },
                { icon: Zap, text: "Instant Booking", color: "from-cyan-500 to-green-500" },
                { icon: Star, text: "Top Rated", color: "from-green-500 to-emerald-500" },
                { icon: Diamond, text: "Premium Quality", color: "from-purple-500 to-pink-500" }
              ].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-white/30 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className={`p-1.5 bg-gradient-to-r ${badge.color} rounded-full`}>
                    <badge.icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Stats Section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            <StatsCard
              icon={<Building className="w-6 h-6" />}
              value={stats.totalVenues.toLocaleString()}
              label="Premium Venues"
              gradient="from-blue-500 to-blue-600"
              delay={0}
            />
            <StatsCard
              icon={<Calendar className="w-6 h-6" />}
              value={stats.totalEvents.toLocaleString()}
              label="Events Hosted"
              gradient="from-cyan-500 to-cyan-600"
              delay={100}
            />
            <StatsCard
              icon={<MapPin className="w-6 h-6" />}
              value={stats.activeCities}
              label="Active Cities"
              gradient="from-green-500 to-emerald-600"
              delay={200}
            />
            <StatsCard
              icon={<Crown className="w-6 h-6" />}
              value={stats.featuredVenues}
              label="Featured Venues"
              gradient="from-orange-500 to-pink-500"
              delay={300}
            />
          </div>

          {/* Enhanced Cities Grid Section */}
          <div>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white mb-6 shadow-lg">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">Worldwide Coverage</span>
                <Sparkles className="w-4 h-4" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500 bg-clip-text text-transparent mb-4">
                Explore Amazing Cities
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                {filteredCities.length} cities with premium venues available
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto" />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg border border-white/20 dark:border-gray-700/30 animate-pulse">
                    <div className="h-48 w-full bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-700 dark:to-cyan-700" />
                    <div className="p-5 space-y-3">
                      <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-600 rounded-lg" />
                      <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-12 w-full bg-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-700 dark:to-cyan-700 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Oops! Something went wrong</h3>
                <p className="text-gray-600 dark:text-gray-400">{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCities.map((city, index) => (
                  <CityCard
                    key={city.city}
                    city={city}
                    onSelect={handleCitySelect}
                    index={index}
                  />
                ))}
              </div>
            )}

            {/* Call to action */}
            {!loading && !error && filteredCities.length === 0 && searchQuery && (
              <div className="text-center py-20">
                <div className="text-6xl mb-6">🔍</div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                  No cities found matching "{searchQuery}"
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Try searching for popular destinations like Nairobi, Mombasa, or Kisumu
                </p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  View All Cities
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Enhanced Custom Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-8px) rotate(1deg); }
          66% { transform: translateY(-4px) rotate(-1deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-6px) rotate(-0.5deg); }
          66% { transform: translateY(-3px) rotate(0.5deg); }
        }
        
        @keyframes gradient {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-gradient {
          animation: gradient 20s linear infinite;
        }

        /* Enhanced scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(156, 163, 175, 0.1);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #3b82f6, #06b6d4, #10b981);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #2563eb, #0891b2, #059669);
        }

        /* Backdrop blur fallback */
        @supports not (backdrop-filter: blur(20px)) {
          .backdrop-blur-xl {
            background-color: rgba(255, 255, 255, 0.9);
          }
          
          .dark .backdrop-blur-xl {
            background-color: rgba(31, 41, 55, 0.9);
          }
        }

        /* Enhanced transitions */
        * {
          transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform, filter;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 300ms;
        }

        /* Glass morphism effects */
        .glass-effect {
          backdrop-filter: blur(20px) saturate(180%);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .dark .glass-effect {
          background: rgba(31, 41, 55, 0.1);
          border: 1px solid rgba(75, 85, 99, 0.2);
        }

        /* Advanced hover effects */
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hover-lift:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        /* Gradient text animation */
        .gradient-text {
          background: linear-gradient(-45deg, #3b82f6, #06b6d4, #10b981, #3b82f6);
          background-size: 400% 400%;
          animation: gradientShift 4s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* Loading skeleton improvements */
        .skeleton {
          background: linear-gradient(90deg, 
            rgba(255, 255, 255, 0.1) 25%, 
            rgba(255, 255, 255, 0.2) 37%, 
            rgba(255, 255, 255, 0.1) 63%
          );
          background-size: 400% 100%;
          animation: skeleton-loading 1.5s ease-in-out infinite;
        }

        @keyframes skeleton-loading {
          0% { background-position: 100% 50%; }
          100% { background-position: -100% 50%; }
        }

        /* Mobile responsiveness enhancements */
        @media (max-width: 640px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          
          .text-5xl { font-size: 2.5rem; }
          .text-6xl { font-size: 3rem; }
          .text-7xl { font-size: 3.5rem; }
          .text-8xl { font-size: 4rem; }
        }

        /* Enhanced button effects */
        .btn-gradient {
          position: relative;
          overflow: hidden;
          transform: perspective(1px) translateZ(0);
        }

        .btn-gradient::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s;
        }

        .btn-gradient:hover::before {
          left: 100%;
        }

        /* Advanced animation delays */
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }

        /* Image loading effects */
        .image-fade-in {
          opacity: 0;
          transform: scale(1.1);
          transition: all 0.7s ease-out;
        }

        .image-fade-in.loaded {
          opacity: 1;
          transform: scale(1);
        }

        /* Improved focus states for accessibility */
        .focus-ring:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        .dark .focus-ring:focus {
          box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.3);
        }
      `}</style>
      
    </div>
  );
};

export default LandingPage;