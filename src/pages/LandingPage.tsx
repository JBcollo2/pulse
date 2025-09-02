import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Star, Search, Globe, Calendar, TrendingUp, Building,
  ArrowRight, Zap, Users, Award, Coffee, Wifi, Car, Utensils
} from 'lucide-react';

// Floating background shapes
const FloatingShapes = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 via-cyan-400/10 to-blue-500/10 rounded-full blur-xl animate-pulse" />
    <div className="absolute top-60 right-20 w-24 h-24 bg-gradient-to-br from-cyan-400/10 via-blue-400/10 to-cyan-500/10 rounded-full blur-xl" />
    <div className="absolute bottom-40 left-1/3 w-40 h-40 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-blue-500/5 rounded-full blur-2xl" />
  </div>
);

// CityCard Component
const CityCard = ({ city, onSelect, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      className={`group relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/30 dark:border-gray-800/60 cursor-pointer`}
      onClick={() => onSelect(city.city)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={city.image || `https://source.unsplash.com/random/800x600/?${city.city}`}
          alt={city.city}
          className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {city.popular && (
          <div className="absolute top-3 right-3">
            <div className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg animate-pulse">
              <TrendingUp className="w-3 h-3" />
              HOT
            </div>
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1">{city.city}</h3>
          <div className="flex items-center justify-between text-white/80">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span className="text-sm">{city.venues || 'N/A'} venues</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{city.event_count} events</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
          <span>Explore {city.city}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// StatsCard Component
const StatsCard = ({ icon, value, label, gradient }) => (
  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} text-white shadow-lg`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
      </div>
    </div>
  </div>
);

// FeatureCard Component
const FeatureCard = ({ icon, title, description, gradient }) => (
  <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
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

        // Calculate stats
        const totalEvents = data.cities.reduce((sum, city) => sum + city.event_count, 0);
        const featuredVenues = data.cities.filter(city => city.popular).length;
        setStats({
          totalVenues: data.cities.length * 5,
          totalEvents,
          activeCities: data.cities.length,
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
    navigate(`/venues?city=${encodeURIComponent(cityName)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 text-gray-900 dark:text-gray-100 relative overflow-hidden">
      <FloatingShapes />

      <main className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-6 leading-tight">
              Find Perfect<br />Event Venues
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Explore thousands of unique venues across cities worldwide.
            </p>
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 shadow-lg placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <StatsCard
              icon={<Building className="w-6 h-6" />}
              value={stats.totalVenues}
              label="Total Venues"
              gradient="from-blue-500 to-blue-600"
            />
            <StatsCard
              icon={<Calendar className="w-6 h-6" />}
              value={stats.totalEvents}
              label="Events Hosted"
              gradient="from-cyan-500 to-cyan-600"
            />
            <StatsCard
              icon={<MapPin className="w-6 h-6" />}
              value={stats.activeCities}
              label="Active Cities"
              gradient="from-emerald-500 to-emerald-600"
            />
            <StatsCard
              icon={<Star className="w-6 h-6" />}
              value={stats.featuredVenues}
              label="Featured Venues"
              gradient="from-amber-500 to-orange-500"
            />
          </div>

          {/* Cities Grid */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  Explore Cities
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {filteredCities.length} cities available
                </p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg border border-white/20 dark:border-gray-700/50 animate-pulse">
                    <div className="h-40 w-full bg-gray-200 dark:bg-gray-700" />
                    <div className="p-4">
                      <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                      <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20 text-red-500">
                <p>{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
