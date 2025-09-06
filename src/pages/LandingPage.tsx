import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Star, Search, Globe, Calendar, TrendingUp, Building,
  ArrowRight, Zap, Users, Award, Coffee, Wifi, Car, Utensils,
  Shield, Music, Activity, Eye, Navigation, Sparkles, Camera,
  Heart, Share2, Filter, Grid, ChevronRight, Loader2
} from 'lucide-react';

// Enhanced CityCard Component with modern styling
const CityCard = ({ city, onSelect, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Use Unsplash for high-quality city images
  const getUnsplashImage = (cityName) => {
    const cleanCityName = cityName.toLowerCase().replace(/\s+/g, '+');
    return `https://source.unsplash.com/800x600/?${cleanCityName}+city+skyline&auto=format&fit=crop`;
  };

  const fallbackImage = `https://source.unsplash.com/800x600/?modern+city+architecture&sig=${index}`;

  return (
    <motion.div
      className="group relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-700 border border-white/30 dark:border-gray-800/60 cursor-pointer"
      onClick={() => onSelect(city.city)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{
        y: -12,
        scale: 1.02,
        transition: { duration: 0.4, ease: "easeOut" }
      }}
    >
      {/* Image Container */}
      <div className="relative h-52 overflow-hidden">
        <motion.img
          src={city.image || getUnsplashImage(city.city)}
          alt={city.city}
          className={`w-full h-full object-cover transition-all duration-700 ${
            isHovered ? 'scale-110 brightness-110' : 'scale-100'
          } ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
        />
        
        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-green-500/20 animate-pulse flex items-center justify-center">
            <Camera className="w-8 h-8 text-white/50" />
          </div>
        )}

        {/* Enhanced gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Trending badge */}
        {city.popular && (
          <motion.div
            className="absolute top-4 right-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          >
            <div className="px-3 py-1.5 bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg shadow-orange-500/30 backdrop-blur-sm border border-white/20">
              <TrendingUp className="w-3 h-3" />
              <span>TRENDING</span>
            </div>
          </motion.div>
        )}

        {/* City info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-lg">
              {city.city}
            </h3>
            
            <div className="flex items-center justify-between text-white/90 mb-4">
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                <Building className="w-4 h-4" />
                <span className="text-sm font-medium">{city.venues || city.event_count || 0} venues</span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{city.event_count} events</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Hover effect overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          initial={false}
        />
      </div>

      {/* Card Content */}
      <div className="p-6 space-y-4">
        {/* Explore Button */}
        <motion.button
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 hover:from-blue-600 hover:via-cyan-600 hover:to-green-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-green-500/40 active:scale-95"
          whileHover={{
            boxShadow: "0 20px 40px -12px rgba(59, 130, 246, 0.4)"
          }}
          whileTap={{ scale: 0.95 }}
        >
          <span>Explore {city.city}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </motion.button>

        {/* Amenities */}
        {(city.top_amenities || []).length > 0 && (
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {city.top_amenities.slice(0, 3).map((amenity, idx) => (
              <span 
                key={idx} 
                className="text-xs bg-gradient-to-r from-blue-50 via-cyan-50 to-green-50 dark:from-blue-900/30 dark:via-cyan-900/30 dark:to-green-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full border border-blue-200/30 dark:border-blue-700/30 font-medium"
              >
                {amenity}
              </span>
            ))}
            {city.top_amenities.length > 3 && (
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 font-medium">
                +{city.top_amenities.length - 3} more
              </span>
            )}
          </motion.div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-gray-600 dark:text-gray-400 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{Math.floor(Math.random() * 1000) + 500}k views</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span>{(4.0 + Math.random() * 1.0).toFixed(1)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <Heart className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating action indicators */}
      <motion.div
        className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={{ scale: 0 }}
        animate={{ scale: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
          <Navigation className="w-4 h-4 text-white" />
        </div>
      </motion.div>
    </motion.div>
  );
};

// Enhanced StatsCard Component
const StatsCard = ({ icon, value, label, gradient, delay = 0 }) => (
  <motion.div
    className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 hover:scale-105 cursor-pointer overflow-hidden relative"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    whileHover={{
      y: -5,
      transition: { duration: 0.3 }
    }}
  >
    {/* Background gradient on hover */}
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
    
    <div className="flex items-center gap-4 relative z-10">
      <motion.div 
        className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg relative overflow-hidden`}
        whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        {icon}
      </motion.div>
      <div>
        <motion.div
          className="text-3xl font-bold text-gray-900 dark:text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: delay + 0.2 }}
        >
          {value}
        </motion.div>
        <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">{label}</div>
      </div>
    </div>
    
    {/* Corner decoration */}
    <div className={`absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br ${gradient} rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
  </motion.div>
);

// Animated background elements
const FloatingElements = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {/* Large floating orbs */}
    <motion.div
      className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-br from-blue-400/10 via-cyan-400/10 to-green-400/10 rounded-full blur-3xl"
      animate={{
        x: [0, 100, 0],
        y: [0, -50, 0],
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }}
    />
    
    <motion.div
      className="absolute top-60 right-20 w-32 h-32 bg-gradient-to-br from-green-400/10 via-blue-400/10 to-cyan-500/10 rounded-full blur-2xl"
      animate={{
        x: [0, -80, 0],
        y: [0, 60, 0],
        scale: [1, 0.8, 1],
        rotate: [0, -180, -360],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "linear"
      }}
    />
    
    <motion.div
      className="absolute bottom-40 left-1/3 w-56 h-56 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-green-500/5 rounded-full blur-3xl"
      animate={{
        scale: [1, 1.3, 1],
        x: [0, 50, 0],
        rotate: [0, 90, 0],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: "linear"
      }}
    />

    {/* Floating particles */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-30"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
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
  const [showAllCities, setShowAllCities] = useState(false);
  const searchRef = useRef(null);
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

        // Calculate enhanced stats
        const totalEvents = data.cities.reduce((sum, city) => sum + city.event_count, 0);
        const featuredVenues = data.cities.filter(city => city.popular).length;
        setStats({
          totalVenues: data.cities.length * 8, // More realistic venue count
          totalEvents,
          activeCities: data.cities.length,
          featuredVenues: Math.max(featuredVenues, Math.floor(data.cities.length * 0.3)),
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // If there's an exact match, navigate to that city
      const exactMatch = cities.find(city => 
        city.city.toLowerCase() === searchQuery.toLowerCase()
      );
      if (exactMatch) {
        handleCitySelect(exactMatch.city);
      }
    }
  };

  const displayedCities = showAllCities ? filteredCities : filteredCities.slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative overflow-hidden transition-colors duration-300">
      <FloatingElements />

      <main className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Enhanced Hero Section */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-6xl md:text-8xl font-bold leading-tight mb-6">
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500 bg-clip-text text-transparent">
                  Discover
                </span>
                <br />
                <span className="bg-gradient-to-r from-green-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Perfect Venues
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed font-light">
                Explore thousands of unique event venues across cities worldwide. 
                From intimate gatherings to grand celebrations.
              </p>
            </motion.div>

            {/* Enhanced Search Section */}
            <motion.div
              className="max-w-3xl mx-auto mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-green-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 rounded-3xl p-2 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center flex-1 gap-4 px-6 py-4">
                      <Search className="text-gray-400 w-6 h-6 flex-shrink-0" />
                      <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search for your perfect city..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-lg bg-transparent border-none outline-none placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <motion.button
                      type="submit"
                      className="bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 hover:from-blue-600 hover:via-cyan-600 hover:to-green-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="hidden sm:inline">Search</span>
                      <ArrowRight className="w-5 h-5 sm:hidden" />
                    </motion.button>
                  </div>
                </div>
              </form>
              
              {/* Quick filters */}
              <motion.div
                className="flex flex-wrap justify-center gap-3 mt-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {['Popular Cities', 'Business Events', 'Weddings', 'Conferences'].map((filter, index) => (
                  <button
                    key={filter}
                    className="px-4 py-2 bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    {filter}
                  </button>
                ))}
              </motion.div>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="flex flex-wrap justify-center items-center gap-8 text-gray-500 dark:text-gray-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Verified Venues</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span>Top Rated</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Trusted by 10k+ Organizers</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Enhanced Stats Section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            <StatsCard
              icon={<Building className="w-6 h-6" />}
              value={stats.totalVenues.toLocaleString()}
              label="Premium Venues"
              gradient="from-blue-500 via-blue-600 to-blue-700"
              delay={0}
            />
            <StatsCard
              icon={<Calendar className="w-6 h-6" />}
              value={stats.totalEvents.toLocaleString()}
              label="Events Hosted"
              gradient="from-cyan-500 via-cyan-600 to-teal-600"
              delay={0.1}
            />
            <StatsCard
              icon={<MapPin className="w-6 h-6" />}
              value={stats.activeCities}
              label="Active Cities"
              gradient="from-green-500 via-emerald-600 to-green-700"
              delay={0.2}
            />
            <StatsCard
              icon={<Star className="w-6 h-6" />}
              value={stats.featuredVenues}
              label="Featured Venues"
              gradient="from-orange-500 via-red-500 to-pink-500"
              delay={0.3}
            />
          </div>

          {/* Cities Section */}
          <div>
            <motion.div
              className="flex flex-col lg:flex-row lg:items-center justify-between mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="mb-6 lg:mb-0">
                <h2 className="text-4xl lg:text-5xl font-bold mb-3">
                  <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500 bg-clip-text text-transparent">
                    Explore Cities
                  </span>
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  {filteredCities.length} incredible destinations waiting for you
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300">
                  <Grid className="w-4 h-4" />
                  <span>View</span>
                </button>
              </div>
            </motion.div>

            {/* Loading state */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg border border-white/20 dark:border-gray-700/50 animate-pulse">
                    <div className="h-52 w-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
                    <div className="p-6">
                      <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
                      <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
                      <div className="flex gap-2">
                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <motion.div
                className="text-center py-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-6xl mb-6">🚧</div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Oops! Something went wrong
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {/* Cities Grid */}
            {!loading && !error && (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    layout
                  >
                    {displayedCities.map((city, index) => (
                      <CityCard
                        key={city.city}
                        city={city}
                        onSelect={handleCitySelect}
                        index={index}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>

                {/* Show More/Less Button */}
                {filteredCities.length > 6 && (
                  <motion.div
                    className="text-center mt-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <button
                      onClick={() => setShowAllCities(!showAllCities)}
                      className="group inline-flex items-center gap-3 px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <span className="font-semibold">
                        {showAllCities ? 'Show Less' : `Discover ${filteredCities.length - 6} More Cities`}
                      </span>
                      <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${
                        showAllCities ? 'rotate-90' : 'group-hover:translate-x-1'
                      }`} />
                    </button>
                  </motion.div>
                )}

                {/* No results */}
                {filteredCities.length === 0 && !loading && (
                  <motion.div
                    className="text-center py-20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="text-6xl mb-6">🔍</div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500 bg-clip-text text-transparent mb-4">
                      No cities found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Try adjusting your search term or explore our popular destinations
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      Show All Cities
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Enhanced CTA Section */}
          <motion.div
            className="text-center py-20 mt-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="relative max-w-4xl mx-auto">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-green-500/10 rounded-3xl blur-3xl" />
              
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-12 border border-white/30 dark:border-gray-700/50 shadow-2xl">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <h3 className="text-3xl md:text-4xl font-bold mb-6">
                    <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500 bg-clip-text text-transparent">
                      Ready to Host Your Event?
                    </span>
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                    Join thousands of event organizers who trust our platform to find the perfect venues for their memorable occasions.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <motion.button
                      className="bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 hover:from-blue-600 hover:via-cyan-600 hover:to-green-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/events')}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        <span>Browse Events</span>
                      </div>
                    </motion.button>
                    
                    <motion.button
                      className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-8 py-4 rounded-2xl font-semibold transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <span>List Your Venue</span>
                      </div>
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Enhanced custom styles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(2deg);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          background-size: 1000px 100%;
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
          background: linear-gradient(45deg, #3b82f6, #10b981);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #2563eb, #059669);
        }
        
        /* Smooth transitions */
        * {
          transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 200ms;
        }
        
        /* Custom gradient animations */
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
        
        /* Enhanced focus states */
        input:focus {
          outline: none;
          ring: 2px;
          ring-color: rgba(59, 130, 246, 0.5);
        }
        
        /* Mobile optimizations */
        @media (max-width: 640px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
        
        /* Backdrop blur fallback */
        @supports not (backdrop-filter: blur(12px)) {
          .backdrop-blur-xl {
            background-color: rgba(255, 255, 255, 0.9);
          }
          
          .dark .backdrop-blur-xl {
            background-color: rgba(31, 41, 55, 0.9);
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;