import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Star, Search, Globe, Calendar, TrendingUp, Building,
  ArrowRight, Zap, Users, Award, Coffee, Wifi, Car, Utensils,
  Shield, Music, Activity, Eye, Navigation, Sparkles, Camera,
  Heart, Share2, Filter, Grid, ChevronRight, Loader2, RefreshCw
} from 'lucide-react';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

// API service functions
const apiService = {
  async getCities() {
    try {
      const response = await fetch(`${API_BASE_URL}/cities`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }
  },

  async getCityEvents(city) {
    try {
      const response = await fetch(`${API_BASE_URL}/events/city/${encodeURIComponent(city)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching events for ${city}:`, error);
      throw error;
    }
  }
};

// Real image fetching functions from venue page
const fetchWikiImage = async (wikidataId) => {
  try {
    console.log(`[fetchWikiImage] Fetching image for Wikidata ID: ${wikidataId}`);
    const response = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`);
    const data = await response.json();
    const entity = data.entities[wikidataId];
    const imageClaim = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (imageClaim) {
      const filename = encodeURIComponent(imageClaim.replace(/ /g, '_'));
      const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
      console.log(`[fetchWikiImage] Found image: ${imageUrl}`);
      return imageUrl;
    }
    console.log(`[fetchWikiImage] No image found in claims`);
    return null;
  } catch (error) {
    console.error(`[fetchWikiImage] Error:`, error);
    return null;
  }
};

const searchCityImage = async (cityName, index = 0) => {
  try {
    console.log(`[searchCityImage] Starting search for: "${cityName}"`);
    const formattedQuery = encodeURIComponent(cityName);

    const url = `https://nominatim.openstreetmap.org/search?q=${formattedQuery}&format=json&addressdetails=1&limit=5&extratags=1&bounded=0`;
    console.log(`[searchCityImage] Fetching from: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EventApp/1.0'
      }
    });
    console.log(`[searchCityImage] Response status: ${response.status}`);
    if (!response.ok) throw new Error('Failed to fetch location data');
    const data = await response.json();
    console.log(`[searchCityImage] Response data:`, data);
    
    if (!data || data.length === 0) {
      console.warn(`[searchCityImage] No results found`);
      const colors = ['6366f1', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899'];
      const colorIndex = index % colors.length;
      return `https://placehold.co/800x600/${colors[colorIndex]}/ffffff?text=${encodeURIComponent(cityName.substring(0, 20))}&font=Open+Sans`;
    }

    let place = data[0];
    const sortedResults = data.sort((a, b) => {
      const aScore = (a.importance || 0) + (a.address ? Object.keys(a.address).length * 0.1 : 0);
      const bScore = (b.importance || 0) + (b.address ? Object.keys(b.address).length * 0.1 : 0);
      return bScore - aScore;
    });

    place = sortedResults[0];
    console.log(`[searchCityImage] Selected place:`, place);

    const wikidataId = place.extratags?.wikidata;
    let photoUrl = null;
    
    if (wikidataId) {
      const wikiImage = await fetchWikiImage(wikidataId);
      if (wikiImage) {
        photoUrl = wikiImage;
      }
    }
    
    if (!photoUrl) {
      const colors = ['6366f1', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899'];
      const colorIndex = index % colors.length;
      photoUrl = `https://placehold.co/800x600/${colors[colorIndex]}/ffffff?text=${encodeURIComponent(cityName.substring(0, 20))}&font=Open+Sans`;
    }
    
    console.log(`[searchCityImage] Final photo URL: ${photoUrl}`);
    return photoUrl;
  } catch (error) {
    console.error('[searchCityImage] Error:', error);
    const colors = ['6366f1', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899'];
    const colorIndex = index % colors.length;
    return `https://placehold.co/800x600/${colors[colorIndex]}/ffffff?text=${encodeURIComponent(cityName.substring(0, 20))}&font=Open+Sans`;
  }
};

// Simple StatsCard Component
const StatsCard = ({ icon, value, label, gradient, loading = false }) => (
  <motion.div
    className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
      <div className={`p-2 sm:p-3 rounded-xl ${gradient} shadow-lg group-hover:rotate-12 transition-transform duration-500 shrink-0`}>
        {loading ? (
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white animate-spin" />
        ) : (
          React.cloneElement(icon, { className: 'w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white' })
        )}
      </div>
      <div className="text-center sm:text-left">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
          {loading ? (
            <div className="h-6 sm:h-7 lg:h-8 w-12 sm:w-16 bg-gray-300 dark:bg-gray-600 animate-pulse rounded"></div>
          ) : (
            value
          )}
        </div>
        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</div>
      </div>
    </div>
  </motion.div>
);

// Updated CityCard Component with real images and venue count
const CityCard = ({ city, onSelect, index }) => {
  const [venueCount, setVenueCount] = useState(null);
  const [loadingVenues, setLoadingVenues] = useState(false);

  // Fetch unique venues count for this city
  useEffect(() => {
    const fetchVenueCount = async () => {
      try {
        setLoadingVenues(true);
        const data = await apiService.getCityEvents(city.city);
        // Count unique venues from events
        const uniqueVenues = new Set(data.events?.map(event => event.location).filter(Boolean));
        setVenueCount(uniqueVenues.size);
      } catch (error) {
        console.error(`Error fetching venue count for ${city.city}:`, error);
        setVenueCount(0);
      } finally {
        setLoadingVenues(false);
      }
    };

    fetchVenueCount();
  }, [city.city]);

  return (
    <motion.div
      className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-all duration-500 hover:transform hover:scale-105"
      onClick={() => onSelect(city.city)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative h-32 sm:h-40 lg:h-48 overflow-hidden">
        <img
          src={city.imageUrl || `https://placehold.co/800x600/6366f1/ffffff?text=${encodeURIComponent(city.city.substring(0, 20))}&font=Open+Sans`}
          alt={city.city}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            const colors = ['6366f1', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899'];
            const colorIndex = index % colors.length;
            (e.target as HTMLImageElement).src = `https://placehold.co/800x600/${colors[colorIndex]}/ffffff?text=${encodeURIComponent(city.city.substring(0, 20))}&font=Open+Sans`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 text-white">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2">{city.city}</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Building className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>
                {loadingVenues ? (
                  <Loader2 className="w-3 h-3 animate-spin inline" />
                ) : (
                  `${venueCount || 0} venues`
                )}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{city.event_count || 0} events</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="mb-3">
          {city.top_amenities && city.top_amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {city.top_amenities.slice(0, 3).map((amenity, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 text-blue-600 dark:text-blue-300 text-xs rounded-full border border-blue-200/50 dark:border-blue-700/50"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>
        <button className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold py-2 sm:py-3 rounded-xl shadow-lg transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2">
          <span>Explore {city.city}</span>
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
    </motion.div>
  );
};

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
  const [statsLoading, setStatsLoading] = useState(true);
  const [showAllCities, setShowAllCities] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.4
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  // Calculate comprehensive stats from all cities
  type City = {
    city: string;
    event_count?: number;
    [key: string]: any;
  };

  type Event = {
    location?: string;
    [key: string]: any;
  };

  const calculateStats = async (citiesData: City[]) => {
    try {
      setStatsLoading(true);
      let totalVenues = 0;
      let totalEvents = 0;
      let featuredVenues = 0;

      // Get detailed data for each city to calculate accurate venue counts
      const cityPromises = citiesData.map(async (city: City) => {
        try {
          const cityData = await apiService.getCityEvents(city.city);
          const uniqueVenues = new Set(
            (cityData.events as Event[] | undefined)?.map((event: Event) => event.location).filter(Boolean)
          );
          const venueCount = uniqueVenues.size;
          const eventCount = (cityData.events as Event[] | undefined)?.length || 0;
          
          // Count featured venues (venues with >3 events or featured events)
          const venueEventCounts: { [location: string]: number } = {};
          (cityData.events as Event[] | undefined)?.forEach((event: Event) => {
            if (event.location) {
              venueEventCounts[event.location] = (venueEventCounts[event.location] || 0) + 1;
            }
          });
          
          const cityFeaturedVenues = Object.values(venueEventCounts).filter(count => Number(count) > 3).length;
          
          return {
            venues: venueCount,
            events: eventCount,
            featuredVenues: cityFeaturedVenues
          };
        } catch (error) {
          console.error(`Error calculating stats for ${city.city}:`, error);
          return { venues: 0, events: city.event_count || 0, featuredVenues: 0 };
        }
      });

      const results = await Promise.all(cityPromises);
      
      results.forEach(result => {
        totalVenues += result.venues;
        totalEvents += result.events;
        featuredVenues += result.featuredVenues;
      });

      setStats({
        totalVenues,
        totalEvents,
        activeCities: citiesData.length,
        featuredVenues,
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
      // Fallback to basic stats from cities data
      const totalEvents = citiesData.reduce((sum: number, city: City) => sum + (city.event_count || 0), 0);
      setStats({
        totalVenues: citiesData.length * 3, // Rough estimate
        totalEvents,
        activeCities: citiesData.length,
        featuredVenues: Math.ceil(citiesData.length * 0.3),
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch cities with real images and calculate stats
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch cities from API
        const response = await apiService.getCities();
        const citiesData = response.cities || [];
        
        if (citiesData.length === 0) {
          throw new Error('No cities found');
        }

        // Calculate stats first (can run in parallel with image fetching)
        calculateStats(citiesData);
        
        // Fetch real images for each city
        const citiesWithImages = await Promise.all(
          citiesData.map(async (city, index) => {
            try {
              // Add delay between requests to avoid rate limiting
              if (index > 0) {
                await new Promise(resolve => setTimeout(resolve, 200));
              }
              const imageUrl = await searchCityImage(city.city, index);
              return { ...city, imageUrl };
            } catch (error) {
              console.error(`Error fetching image for ${city.city}:`, error);
              const colors = ['6366f1', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899'];
              const colorIndex = index % colors.length;
              return { 
                ...city, 
                imageUrl: `https://placehold.co/800x600/${colors[colorIndex]}/ffffff?text=${encodeURIComponent(city.city.substring(0, 20))}&font=Open+Sans`
              };
            }
          })
        );
        
        setCities(citiesWithImages);
      } catch (err) {
        const errorMessage = err.message || 'Failed to load cities';
        setError(errorMessage);
        console.error('Error fetching cities:', err);
        
        // Set empty state
        setCities([]);
        setStats({
          totalVenues: 0,
          totalEvents: 0,
          activeCities: 0,
          featuredVenues: 0,
        });
      } finally {
        setLoading(false);
        setStatsLoading(false);
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
    console.log(`Navigate to venues for ${cityName}`);
    // In real app: navigate(`/venues?city=${encodeURIComponent(cityName)}`);
    // Or: window.location.href = `/venues?city=${encodeURIComponent(cityName)}`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const exactMatch = cities.find(city => 
        city.city.toLowerCase() === searchQuery.toLowerCase()
      );
      if (exactMatch) {
        handleCitySelect(exactMatch.city);
      }
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const displayedCities = showAllCities ? filteredCities : filteredCities.slice(0, 6);

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden transition-all duration-300">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10 dark:opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>

      <div className="relative z-10">
        <main className="py-6 sm:py-8 lg:py-12 pt-20 sm:pt-24 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Hero Section */}
            <motion.div
              className="mb-8 sm:mb-12"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12 lg:mb-16">
                <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white mb-4 sm:mb-6 shadow-lg shadow-blue-500/25">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">Discover Amazing Venues</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent leading-tight">
                  Find Perfect<br />Event Venues
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
                  Explore thousands of unique venues across cities worldwide with state-of-the-art facilities and amenities.
                </p>

                {/* Search Section */}
                <div className="max-w-2xl mx-auto mb-8 sm:mb-12 px-4">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      placeholder="Search for cities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-4 sm:pr-6 py-3 sm:py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-300"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-green-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </form>
                </div>
              </motion.div>

              {/* Stats Section */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12 lg:mb-16">
                <StatsCard
                  icon={<Building />}
                  value={stats.totalVenues}
                  label="Total Venues"
                  gradient="bg-gradient-to-br from-blue-500 to-green-500"
                  loading={statsLoading}
                />
                <StatsCard
                  icon={<Calendar />}
                  value={stats.totalEvents}
                  label="Events Hosted"
                  gradient="bg-gradient-to-br from-blue-500 to-green-500"
                  loading={statsLoading}
                />
                <StatsCard
                  icon={<MapPin />}
                  value={stats.activeCities}
                  label="Active Cities"
                  gradient="bg-gradient-to-br from-blue-500 to-green-500"
                  loading={statsLoading}
                />
                <StatsCard
                  icon={<Sparkles />}
                  value={stats.featuredVenues}
                  label="Featured Venues"
                  gradient="bg-gradient-to-br from-blue-500 to-green-500"
                  loading={statsLoading}
                />
              </motion.div>

              {/* Cities Section */}
              <motion.div variants={itemVariants}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                      Explore Cities
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading cities...
                        </span>
                      ) : (
                        `${filteredCities.length} cities available`
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-200/50 dark:border-gray-600">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-300" />
                    <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-300">Popular Destinations</span>
                  </div>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {Array(6).fill(0).map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
                        <div className="h-32 sm:h-40 lg:h-48 w-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700" />
                        <div className="p-3 sm:p-4 lg:p-6 space-y-3">
                          <div className="h-4 sm:h-6 w-3/4 bg-gray-300 dark:bg-gray-600 rounded" />
                          <div className="flex gap-2">
                            <div className="h-6 w-20 bg-gray-300 dark:bg-gray-600 rounded-full" />
                            <div className="h-6 w-24 bg-gray-300 dark:bg-gray-600 rounded-full" />
                          </div>
                          <div className="h-8 sm:h-10 w-full bg-gray-300 dark:bg-gray-600 rounded-xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-12 sm:py-20">
                    <div className="relative inline-block mb-4 sm:mb-6">
                      <div className="text-4xl sm:text-6xl animate-bounce">⚠️</div>
                      <div className="absolute -top-2 -right-2 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-ping"></div>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">Something went wrong</h3>
                    <p className="text-red-500 text-base sm:text-lg mb-4 sm:mb-6">{error}</p>
                    <button
                      onClick={handleRetry}
                      className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {displayedCities.map((city, index) => (
                        <CityCard
                          key={city.city}
                          city={city}
                          onSelect={handleCitySelect}
                          index={index}
                        />
                      ))}
                    </div>

                    {/* Show More/Less Button */}
                    {filteredCities.length > 6 && (
                      <div className="text-center mt-8 sm:mt-12">
                        <button
                          onClick={() => setShowAllCities(!showAllCities)}
                          className="border border-gray-200 dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 dark:hover:from-blue-900/20 dark:hover:to-green-900/20 transition-all duration-300 px-6 py-3 rounded-xl text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2 mx-auto"
                        >
                          <span>
                            {showAllCities ? 'Show Less' : `View ${filteredCities.length - 6} More Cities`}
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${
                            showAllCities ? 'rotate-90' : ''
                          }`} />
                        </button>
                      </div>
                    )}

                    {/* No results */}
                    {filteredCities.length === 0 && (
                      <div className="text-center py-12 sm:py-20">
                        <div className="relative inline-block mb-4 sm:mb-6">
                          <div className="text-6xl sm:text-8xl animate-bounce">🏢</div>
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 h-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-full blur-sm"></div>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                          No cities found
                        </h3>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 px-4">
                          Try adjusting your search or explore our popular destinations
                        </p>
                        <button
                          onClick={() => setSearchQuery('')}
                          className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Show All Cities
                        </button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </main>

        {/* Footer Section */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 sm:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                  <Building className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                  VenueHub
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Connecting you with the perfect venues for your events
              </p>
              <div className="flex justify-center items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>© 2024 VenueHub. All rights reserved.</span>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>Made with love</span>
                </div>
              </div>
            </div>
          </div>
        </footer>

        {/* Custom Styles */}
        <style>{`
          * {
            transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 200ms;
          }
          ::-webkit-scrollbar {
            width: 6px;
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
          .group:hover .group-hover\\:rotate-12 {
            transform: rotate(12deg);
          }
          .backdrop-blur-sm {
            backdrop-filter: blur(4px);
          }
          @supports not (backdrop-filter: blur(4px)) {
            .backdrop-blur-sm {
              background-color: rgba(255, 255, 255, 0.8);
            }
            .dark .backdrop-blur-sm {
              background-color: rgba(31, 41, 55, 0.8);
            }
          }
          @media (max-width: 640px) {
            .container {
              padding-left: 1rem;
              padding-right: 1rem;
            }
          }
          @media (hover: none) and (pointer: coarse) {
            button, .cursor-pointer {
              min-height: 44px;
              min-width: 44px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LandingPage;