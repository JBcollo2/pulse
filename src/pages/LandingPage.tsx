import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Star, Search, Globe, Calendar, TrendingUp, Building,
  ArrowRight, Zap, Users, Award, Coffee, Wifi, Car, Utensils,
  Shield, Music, Activity, Eye, Navigation, Sparkles, Camera,
  Heart, Share2, Filter, Grid, ChevronRight, Loader2, RefreshCw
} from 'lucide-react';

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
const StatsCard = ({ icon, value, label, gradient }) => (
  <motion.div
    className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
      <div className={`p-2 sm:p-3 rounded-xl ${gradient} shadow-lg group-hover:rotate-12 transition-transform duration-500 shrink-0`}>
        {React.cloneElement(icon, { className: 'w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white' })}
      </div>
      <div className="text-center sm:text-left">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">{value}</div>
        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</div>
      </div>
    </div>
  </motion.div>
);

// Updated CityCard Component with real images
const CityCard = ({ city, onSelect, index }) => (
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
            <span>{city.venues || city.event_count || 0} venues</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{city.event_count} events</span>
          </div>
        </div>
      </div>
    </div>
    <div className="p-3 sm:p-4 lg:p-6">
      <button className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold py-2 sm:py-3 rounded-xl shadow-lg transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2">
        <span>Explore {city.city}</span>
        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
    </div>
  </motion.div>
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

  // Fetch cities with real images
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoading(true);
        const mockCities = [
          { city: 'Nakuru', event_count: 12, venues: 6 },
          { city: 'Nairobi', event_count: 25, venues: 15 },
          { city: 'Eldoret', event_count: 8, venues: 4 },
          { city: 'Mombasa', event_count: 18, venues: 10 },
          { city: 'Kisumu', event_count: 14, venues: 8 },
          { city: 'Thika', event_count: 6, venues: 3 }
        ];

        // Fetch real images for each city
        const citiesWithImages = await Promise.all(
          mockCities.map(async (city, index) => {
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

        // Calculate stats
        const totalEvents = citiesWithImages.reduce((sum, city) => sum + city.event_count, 0);
        const featuredVenues = citiesWithImages.filter(city => city.event_count > 15).length;
        setStats({
          totalVenues: citiesWithImages.length * 5,
          totalEvents,
          activeCities: citiesWithImages.length,
          featuredVenues,
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
    console.log(`Maps to venues for ${cityName}`);
    // In real app: navigate(`/venues?city=${encodeURIComponent(cityName)}`);
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
                {/* Updated Gradient for the Sparkles Icon */}
                <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white mb-4 sm:mb-6 shadow-lg shadow-teal-500/25">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">Discover Amazing Venues</span>
                </div>
                {/* Updated Gradient for the Title */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent leading-tight">
                  Find Perfect<br />Event Venues
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
                  Explore thousands of unique venues across cities worldwide with state-of-the-art facilities and amenities.
                </p>

                {/* Search Section */}
                <div className="max-w-2xl mx-auto mb-8 sm:mb-12 px-4">
                  <div className="relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      placeholder="Search for cities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-4 sm:pr-6 py-3 sm:py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-300"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/10 to-cyan-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
              </motion.div>

              {/* Stats Section */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12 lg:mb-16">
                {/* Updated Gradient for each Stats Card Icon Background */}
                <StatsCard
                  icon={<Building />}
                  value={stats.totalVenues}
                  label="Total Venues"
                  gradient="bg-gradient-to-br from-teal-500 to-cyan-500"
                />
                <StatsCard
                  icon={<Calendar />}
                  value={stats.totalEvents}
                  label="Events Hosted"
                  gradient="bg-gradient-to-br from-teal-500 to-cyan-500"
                />
                <StatsCard
                  icon={<MapPin />}
                  value={stats.activeCities}
                  label="Active Cities"
                  gradient="bg-gradient-to-br from-teal-500 to-cyan-500"
                />
                <StatsCard
                  icon={<Sparkles />}
                  value={stats.featuredVenues}
                  label="Featured Venues"
                  gradient="bg-gradient-to-br from-teal-500 to-cyan-500"
                />
              </motion.div>

              {/* Cities Section */}
              <motion.div variants={itemVariants}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                  <div>
                    {/* Updated Gradient for the Section Title */}
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                      Explore Cities
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                      {filteredCities.length} cities available
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-200/50 dark:border-gray-600">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-teal-600 dark:text-teal-300" />
                    <span className="text-xs sm:text-sm font-medium text-teal-600 dark:text-teal-300">Popular Destinations</span>
                  </div>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {Array(6).fill(0).map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
                        <div className="h-32 sm:h-40 lg:h-48 w-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700" />
                        <div className="p-3 sm:p-4 lg:p-6 space-y-3">
                          <div className="h-4 sm:h-6 w-3/4 bg-gray-300 dark:bg-gray-600 rounded" />
                          <div className="h-3 sm:h-4 w-1/2 bg-gray-300 dark:bg-gray-600 rounded" />
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
                      onClick={() => window.location.reload()}
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
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
                          className="border border-gray-200 dark:border-gray-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 dark:hover:from-teal-900/20 dark:hover:to-cyan-900/20 transition-all duration-300 px-6 py-3 rounded-xl text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2 mx-auto"
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
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 h-2 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-full blur-sm"></div>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                          No cities found
                        </h3>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 px-4">
                          Try adjusting your search or explore our popular destinations
                        </p>
                        <button
                          onClick={() => setSearchQuery('')}
                          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
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
            background: linear-gradient(45deg, #20c997, #17a2b8); /* Teal to Cyan */
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(45deg, #18a87b, #138496); /* Darker shades for hover */
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