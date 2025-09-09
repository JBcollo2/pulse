import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  MapPin, Search, Globe, Calendar, Filter, Grid, List, TrendingUp, Eye, Navigation,
  Phone, Clock, Users, Heart, Share2, Bookmark, ChevronRight, ChevronLeft, Loader2,
  Award, Camera, Music, Coffee, Wifi, Car, Utensils, ShieldCheck, Activity, Mail,
  Building, ArrowUpDown, RefreshCw, Menu, X, Ticket, Tag, ArrowRight, Zap, Sparkles, Star
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAmenityIcon, getAmenityIconWithColor } from '../utils/amenityIcons';
// Alternative import (try this if the above doesn't work):
// import { getAmenityIcon, getAmenityIconWithColor } from '@/utils/amenityIcons';
// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
// Fetch real location image using Wikidata and OpenStreetMap
const searchCityImage = async (cityName, index = 0) => {
  try {
    const formattedQuery = encodeURIComponent(cityName);
    const url = `https://nominatim.openstreetmap.org/search?q=${formattedQuery}&format=json&addressdetails=1&limit=5&extratags=1&bounded=0`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EventApp/1.0'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch location data');
    const data = await response.json();
    if (!data || data.length === 0) {
      const colors = ['6366f1', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899'];
      const colorIndex = index % colors.length;
      return `https://placehold.co/800x600/${colors[colorIndex]}/ffffff?text=${encodeURIComponent(cityName.substring(0, 20))}&font=Open+Sans`;
    }
    const sortedResults = data.sort((a, b) => {
      const aScore = (a.importance || 0) + (a.address ? Object.keys(a.address).length * 0.1 : 0);
      const bScore = (b.importance || 0) + (b.address ? Object.keys(b.address).length * 0.1 : 0);
      return bScore - aScore;
    });
    const place = sortedResults[0];
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
    return photoUrl;
  } catch (error) {
    console.error('Error fetching city image:', error);
    const colors = ['6366f1', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899'];
    const colorIndex = index % colors.length;
    return `https://placehold.co/800x600/${colors[colorIndex]}/ffffff?text=${encodeURIComponent(cityName.substring(0, 20))}&font=Open+Sans`;
  }
};
const fetchWikiImage = async (wikidataId) => {
  try {
    const response = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`);
    const data = await response.json();
    const entity = data.entities[wikidataId];
    const imageClaim = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (imageClaim) {
      const filename = encodeURIComponent(imageClaim.replace(/ /g, '_'));
      return `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Wikidata image:', error);
    return null;
  }
};
// StatsCard Component with gradients
const StatsCard = ({ icon, value, label, gradient }) => (
  <motion.div
    className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="absolute inset-0 opacity-5 dark:opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>
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
// CityCard Component with real images and hover effects
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
      <Button className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-2 sm:py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base">
        <span>Explore {city.city}</span>
        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
      </Button>
    </div>
  </motion.div>
);
// VenueCard Component with real images and hover effects
const VenueCard = ({ venue, index, onViewDetails }) => {
  const [isHovered, setIsHovered] = useState(false);
  const getCategoryGradient = () => 'from-blue-500 to-green-500';
  const getCategoryIcon = () => '🏢';
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  const getDisplayEvent = () => {
    if (!venue.events || venue.events.length === 0) return null;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const sortedEvents = [...venue.events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const upcomingEvent = sortedEvents.find(event => new Date(event.date).getTime() >= currentDate.getTime());
    return upcomingEvent || sortedEvents[sortedEvents.length - 1];
  };
  const getEventStats = () => {
    if (!venue.events || venue.events.length === 0) {
      return { upcoming: 0, total: venue.totalEvents || 0, nextEventDate: null };
    }
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const upcoming = venue.events.filter(event => new Date(event.date).getTime() >= currentDate.getTime()).length;
    const nextEvent = venue.events
      .filter(event => new Date(event.date).getTime() >= currentDate.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    return {
      upcoming,
      total: venue.totalEvents || venue.events.length,
      nextEventDate: nextEvent ? nextEvent.date : null
    };
  };
  const displayEvent = getDisplayEvent();
  const eventStats = getEventStats();
  return (
    <motion.div
      className="group relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/30 dark:border-gray-800/60 cursor-pointer"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onViewDetails(venue)}
    >
      <div className="relative h-56 overflow-hidden rounded-t-3xl">
        {displayEvent?.image ? (
          <motion.img
            src={displayEvent.image}
            alt={venue.location}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-green-500/10"
              animate={{ opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <span className="text-6xl font-bold text-white relative z-10 drop-shadow-2xl">
              {venue.location.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          {venue.totalEvents > 5 && (
            <motion.div
              className="px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-green-500 opacity-90 shadow-lg backdrop-blur-sm flex items-center gap-1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.9 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <Star className="w-3 h-3 fill-current" />
              POPULAR
            </motion.div>
          )}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <motion.div
            className="flex items-center justify-between"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 text-white bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              <span>{getCategoryIcon()}</span>
              <span className="text-sm font-medium">Venue</span>
            </div>
            <div className="flex items-center gap-2 text-white bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">
                {eventStats.upcoming > 0 ? `${eventStats.upcoming} upcoming` : `${eventStats.total} events`}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <motion.h3
            className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-all duration-500 line-clamp-2"
            style={{
              backgroundImage: isHovered ? `linear-gradient(to right, var(--tw-gradient-stops))` : 'none',
              '--tw-gradient-from': '#3b82f6',
              '--tw-gradient-to': '#10b981',
              '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)'
            } as React.CSSProperties}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {venue.location}
          </motion.h3>
          {eventStats.upcoming > 3 && (
            <motion.div
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-blue-500 to-green-500 opacity-90 text-white text-xs font-bold flex-shrink-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            >
              <TrendingUp className="w-3 h-3" />
              ACTIVE
            </motion.div>
          )}
        </div>
        <motion.p
          className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {venue.city} - {eventStats.total} events hosted at this location
          {eventStats.nextEventDate && (
            <span className="block text-green-600 dark:text-green-400 font-medium mt-1">
              Next event: {formatDate(eventStats.nextEventDate)}
            </span>
          )}
        </motion.p>
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <span className="text-sm font-medium truncate">{venue.city}</span>
          </div>
          {displayEvent && (
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Clock className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <span className="text-sm font-medium">
                {formatDate(displayEvent.date)}
                {displayEvent.start_time && ` at ${formatTime(displayEvent.start_time)}`}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <Users className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <span className="text-sm font-medium">
              {eventStats.total} Total Events
              {eventStats.upcoming > 0 && (
                <span className="text-green-600 dark:text-green-400 ml-1">
                  ({eventStats.upcoming} upcoming)
                </span>
              )}
            </span>
          </div>
        </motion.div>
        {venue.uniqueAmenities && venue.uniqueAmenities.length > 0 && (
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {venue.uniqueAmenities.slice(0, 4).map((amenityGroup, idx) => {
              // Split and show individual amenities
              const individualAmenities = amenityGroup.split(',').map(a => a.trim());
              const firstAmenity = individualAmenities[0];
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium"
                  title={amenityGroup}
                >
                  {getAmenityIcon(firstAmenity.toLowerCase(), "w-4 h-4")}
                  <span className="capitalize">{firstAmenity}</span>
                  {individualAmenities.length > 1 && (
                    <span className="text-gray-400">+{individualAmenities.length - 1}</span>
                  )}
                </div>
              );
            })}
            {venue.uniqueAmenities.length > 4 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                +{venue.uniqueAmenities.length - 4} more
              </span>
            )}
          </motion.div>
        )}
        {displayEvent?.category && (
          <motion.div
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Tag className="w-4 h-4" />
            <span>Latest: {displayEvent.category}</span>
          </motion.div>
        )}
        <motion.div
          className="flex items-center justify-between pt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {eventStats.total}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                events
              </span>
            </div>
            <div className="space-y-1 mt-1">
              {eventStats.upcoming > 0 && (
                <div className="text-sm font-medium text-green-600 dark:text-green-400">
                  {eventStats.upcoming} upcoming
                </div>
              )}
            </div>
          </div>
          <motion.button
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 text-sm"
            whileTap={{ scale: 0.95 }}
            whileHover={{ boxShadow: `0 15px 30px -8px rgba(59, 130, 246, 0.3)`, y: -1 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewDetails(venue);
            }}
          >
            <Ticket className="w-4 h-4" />
            <span>Explore Venue</span>
          </motion.button>
        </motion.div>
      </div>
      <motion.div
        className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500 to-green-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 -z-10"
        initial={{ scale: 0.8 }}
        animate={{ scale: isHovered ? 1.1 : 0.8 }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  );
};
// Main VenuePage Component
const VenuePage = () => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [availableFilters, setAvailableFilters] = useState({
    locations: [],
    time_filters: ['upcoming', 'today', 'past', 'all']
  });
  const [filters, setFilters] = useState({
    city: '',
    location: '',
    time_filter: 'upcoming',
    sort_by: 'date',
    sort_order: 'asc'
  });
  const [stats, setStats] = useState({
    totalVenues: 0,
    totalEvents: 0,
    activeCities: 0,
    featuredVenues: 0,
  });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const loadMoreRef = useRef(null);
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
  // Fetch cities and stats
  const fetchCities = async () => {
    try {
      setLoading(true);
      const [citiesResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/cities`).then(res => res.json()),
        fetch(`${API_BASE_URL}/api/stats`).then(res => res.json())
      ]);
      const citiesData = citiesResponse.cities || [];
      const citiesWithImages = await Promise.all(
        citiesData.map(async (city, index) => {
          try {
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
      setStats({
        totalVenues: statsResponse.total_venues || 0,
        totalEvents: statsResponse.total_events || 0,
        activeCities: statsResponse.active_cities || 0,
        featuredVenues: statsResponse.featured_venues || 0,
      });
    } catch (err) {
      setError('Failed to load cities and stats');
      console.error('Error fetching cities and stats:', err);
    } finally {
      setLoading(false);
    }
  };
  // Fetch city events and update venue count
  const fetchCityEvents = async (page = 1, reset = false) => {
    if (!selectedCity) return;
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
        ...(filters.location && { location: filters.location }),
        time_filter: filters.time_filter,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order
      });
      const response = await fetch(
        `${API_BASE_URL}/events/city/${encodeURIComponent(selectedCity)}?${params}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      const venueMap = new Map();
      data.events.forEach(event => {
        const key = event.location;
        if (!venueMap.has(key)) {
          venueMap.set(key, {
            location: event.location,
            city: event.city,
            events: [],
            totalEvents: 0,
            uniqueAmenities: new Set(),
            topEvent: null
          });
        }
        const venue = venueMap.get(key);
        venue.events.push(event);
        venue.totalEvents++;
        if (event.amenities) {
          event.amenities.forEach(amenity => venue.uniqueAmenities.add(amenity));
        }
        if (!venue.topEvent || event.featured) {
          venue.topEvent = event;
        }
      });
      const processedVenues = Array.from(venueMap.values()).map(venue => ({
        ...venue,
        uniqueAmenities: Array.from(venue.uniqueAmenities)
      }));
      if (reset || page === 1) {
        setVenues(processedVenues);
        setCurrentPage(1);
      } else {
        setVenues(prev => [...prev, ...processedVenues]);
      }
      setCurrentPage(page);
      setHasMore(data.pagination.has_next);
      setAvailableFilters(data.available_filters || {
        locations: [],
        time_filters: ['upcoming', 'today', 'past', 'all']
      });
    } catch (err) {
      setError('Failed to load venues');
      console.error('Error fetching city events:', err);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };
  useEffect(() => {
    fetchCities();
  }, []);
  useEffect(() => {
    const cityFromParams = searchParams.get('city');
    if (cityFromParams && cities.length > 0) {
      setSelectedCity(cityFromParams);
      setFilters(prev => ({ ...prev, city: cityFromParams }));
    }
  }, [cities, searchParams]);
  useEffect(() => {
    if (selectedCity) {
      fetchCityEvents(1, true);
    }
  }, [selectedCity, filters.location, filters.time_filter, filters.sort_by, filters.sort_order]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore && selectedCity) {
          fetchCityEvents(currentPage + 1, false);
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [currentPage, hasMore, isLoadingMore, selectedCity]);
  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setFilters(prev => ({ ...prev, city }));
    setSearchParams({ city });
    setVenues([]);
    setCurrentPage(1);
    setHasMore(true);
  };
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setVenues([]);
    setCurrentPage(1);
    setHasMore(true);
  };
  const handleViewDetails = (venue) => {
    setSelectedVenue(venue);
  };
  const handleGetDirections = (venue) => {
    const query = encodeURIComponent(`${venue.location}, ${venue.city}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(mapsUrl, '_blank');
  };
  const handleShare = (venue) => {
    const shareData = {
      title: venue.location,
      text: `Check out this venue in ${venue.city}!`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };
  const filteredVenues = useMemo(() => {
    return venues.filter(venue => {
      const matchesSearch = !searchQuery ||
        venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.city.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [venues, searchQuery]);
  const sortedVenues = useMemo(() => {
    const sorted = [...filteredVenues];
    switch (activeTab) {
      case 'trending':
        return sorted.sort((a, b) => b.totalEvents - a.totalEvents);
      case 'popular':
        return sorted.sort((a, b) => b.totalEvents - a.totalEvents);
      case 'nearby':
        return sorted.sort(() => Math.random() - 0.5);
      default:
        return sorted;
    }
  }, [filteredVenues, activeTab]);
  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden transition-all duration-300">
      <div className="absolute inset-0 z-0 opacity-10 dark:opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>
      <div className="relative z-10">
        <Navbar />
        <main className="py-6 sm:py-8 lg:py-12 pt-20 sm:pt-24 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {!selectedCity ? (
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
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-green-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>
                </motion.div>
                <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12 lg:mb-16">
                  <StatsCard
                    icon={<Building />}
                    value={stats.totalVenues}
                    label="Total Venues"
                    gradient="bg-gradient-to-br from-blue-500 to-green-500"
                  />
                  <StatsCard
                    icon={<Calendar />}
                    value={stats.totalEvents}
                    label="Events Hosted"
                    gradient="bg-gradient-to-br from-blue-500 to-green-500"
                  />
                  <StatsCard
                    icon={<MapPin />}
                    value={stats.activeCities}
                    label="Active Cities"
                    gradient="bg-gradient-to-br from-blue-500 to-green-500"
                  />
                  <StatsCard
                    icon={<Sparkles />}
                    value={stats.featuredVenues}
                    label="Featured Venues"
                    gradient="bg-gradient-to-br from-blue-500 to-green-500"
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                        Explore Cities
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                        {cities.filter(city => city.city.toLowerCase().includes(searchQuery.toLowerCase())).length} cities available
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
                            <Skeleton className="h-4 sm:h-6 w-3/4 bg-gray-300 dark:bg-gray-600 rounded" />
                            <Skeleton className="h-3 sm:h-4 w-1/2 bg-gray-300 dark:bg-gray-600 rounded" />
                            <Skeleton className="h-8 sm:h-10 w-full bg-gray-300 dark:bg-gray-600 rounded-xl" />
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
                      <Button
                        onClick={fetchCities}
                        className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {cities
                        .filter(city => city.city.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((city, index) => (
                          <CityCard
                            key={city.city}
                            city={city}
                            onSelect={handleCitySelect}
                            index={index}
                          />
                        ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCity('');
                        setSearchParams({});
                      }}
                      className="border-gray-200 dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 dark:hover:from-blue-900/20 dark:hover:to-green-900/20 transition-all duration-300 shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Back to Cities</span>
                      <span className="sm:hidden">Back</span>
                    </Button>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                        {selectedCity}
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                        {venues.length} venues found
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                    <Button
                      variant="outline"
                      onClick={() => fetchCityEvents(1, true)}
                      disabled={loading}
                      className="border-gray-200 dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 dark:hover:from-blue-900/20 dark:hover:to-green-900/20 transition-all duration-300"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>
                  </div>
                </motion.div>
                <motion.div variants={itemVariants} className="mb-6 sm:mb-8 space-y-4">
                  <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 max-w-full lg:max-w-md">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search venues..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-4 py-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm hover:shadow-md transition-all duration-300"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <select
                        value={filters.location}
                        onChange={(e) => handleFilterChange('location', e.target.value)}
                        className="px-3 sm:px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-400 shadow-sm hover:shadow-md transition-all duration-300 text-sm sm:text-base"
                      >
                        <option value="">All Locations</option>
                        {availableFilters.locations?.map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                      <select
                        value={filters.time_filter}
                        onChange={(e) => handleFilterChange('time_filter', e.target.value)}
                        className="px-3 sm:px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-400 shadow-sm hover:shadow-md transition-all duration-300 text-sm sm:text-base"
                      >
                        <option value="upcoming">Upcoming Events</option>
                        <option value="today">Today</option>
                        <option value="past">Past Events</option>
                        <option value="all">All Events</option>
                      </select>
                      <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          className={viewMode === 'grid' ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25' : 'text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 dark:hover:from-blue-900/20 dark:hover:to-green-900/20'}
                        >
                          <Grid className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className={viewMode === 'list' ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25' : 'text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 dark:hover:from-blue-900/20 dark:hover:to-green-900/20'}
                        >
                          <List className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-lg">
                      <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 text-xs sm:text-sm">All Venues</TabsTrigger>
                      <TabsTrigger value="trending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 text-xs sm:text-sm">Trending</TabsTrigger>
                      <TabsTrigger value="popular" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 text-xs sm:text-sm">Popular</TabsTrigger>
                      <TabsTrigger value="nearby" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 rounded-lg transition-all duration-300 text-xs sm:text-sm hidden sm:block">Nearby</TabsTrigger>
                    </TabsList>
                    <TabsContent value={activeTab} className="mt-4 sm:mt-6">
                      {loading ? (
                        <div className={`grid gap-4 sm:gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
                          {Array(6).fill(0).map((_, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
                              <div className="h-40 sm:h-48 lg:h-56 w-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700" />
                              <div className="p-3 sm:p-4 lg:p-6 space-y-4">
                                <Skeleton className="h-4 sm:h-6 w-3/4 bg-gray-300 dark:bg-gray-600 rounded" />
                                <Skeleton className="h-3 sm:h-4 w-1/2 bg-gray-300 dark:bg-gray-600 rounded" />
                                <div className="flex gap-2">
                                  <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 bg-gray-300 dark:bg-gray-600 rounded-full" />
                                  <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 bg-gray-300 dark:bg-gray-600 rounded-full" />
                                </div>
                                <Skeleton className="h-8 sm:h-10 w-full bg-gray-300 dark:bg-gray-600 rounded-xl" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          {error && (
                            <div className="text-center py-6 sm:py-8 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl border border-red-200 dark:border-red-800 shadow-lg mx-4">
                              <div className="relative inline-block mb-4">
                                <div className="text-3xl sm:text-4xl animate-bounce">⚠️</div>
                                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-ping"></div>
                              </div>
                              <p className="text-base sm:text-lg font-medium text-red-600 dark:text-red-400">{error}</p>
                            </div>
                          )}
                          {!error && sortedVenues.length === 0 && (
                            <div className="text-center py-12 sm:py-20">
                              <div className="relative inline-block mb-4 sm:mb-6">
                                <div className="text-6xl sm:text-8xl animate-bounce">🏢</div>
                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 h-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-full blur-sm"></div>
                              </div>
                              <h3 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                                No venues found
                              </h3>
                              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 px-4">
                                Try adjusting your search or filters to discover amazing venues
                              </p>
                              <Button
                                onClick={() => {
                                  setSearchQuery('');
                                  setFilters(prev => ({ ...prev, location: '' }));
                                }}
                                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Clear Filters
                              </Button>
                            </div>
                          )}
                          <div className={`grid gap-4 sm:gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
                            <AnimatePresence>
                              {sortedVenues.map((venue, index) => (
                                <VenueCard
                                  key={`${venue.location}-${venue.city}`}
                                  venue={venue}
                                  index={index}
                                  onViewDetails={handleViewDetails}
                                />
                              ))}
                            </AnimatePresence>
                          </div>
                          {isLoadingMore && (
                            <div className="flex justify-center items-center py-8 sm:py-12">
                              <div className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-lg">
                                <div className="relative">
                                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-500" />
                                  <div className="absolute inset-0 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-gradient-to-r from-blue-500 to-green-500 opacity-20 animate-pulse"></div>
                                </div>
                                <span className="text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base">Loading more venues...</span>
                              </div>
                            </div>
                          )}
                          <div ref={loadMoreRef} className="h-10 w-full" />
                          {!hasMore && sortedVenues.length > 0 && (
                            <div className="text-center py-8 sm:py-12">
                              <div className="inline-flex items-center px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-full border border-blue-200/50 dark:border-gray-600 shadow-lg">
                                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-300 mr-2" />
                                <span className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">
                                  You've explored all venues in {selectedCity}!
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                </motion.div>
              </motion.div>
            )}
          </div>
        </main>
        <Dialog open={!!selectedVenue} onOpenChange={() => setSelectedVenue(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl mx-4">
            <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                {selectedVenue?.location}
              </DialogTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <span className="font-medium text-sm sm:text-base">{selectedVenue?.city}</span>
                </div>
              </div>
            </DialogHeader>
            {selectedVenue && (
              <div className="space-y-4 sm:space-y-6 pt-4">
                {selectedVenue.topEvent?.image && (
                  <div className="relative h-48 sm:h-64 rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={selectedVenue.topEvent.image}
                      alt={selectedVenue.location}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-green-500/10" />
                    <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 flex flex-col sm:flex-row justify-between gap-2">
                      <div className="bg-gradient-to-r from-blue-500/90 to-green-500/90 backdrop-blur-sm text-white px-3 sm:px-4 py-2 rounded-full flex items-center gap-2 border border-white/20 shadow-lg shadow-blue-500/25">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="font-medium text-sm">{selectedVenue.totalEvents} Events</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                      <h4 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25">
                          <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        Venue Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                          <span className="text-gray-600 dark:text-gray-300 text-sm">City:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{selectedVenue.city}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                          <span className="text-gray-600 dark:text-gray-300 text-sm">Total Events:</span>
                          <span className="font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent text-sm">{selectedVenue.totalEvents}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                      <h4 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-white shadow-lg shadow-green-500/25">
                          <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        Available Amenities
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {selectedVenue.uniqueAmenities.map((amenity, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 sm:p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                          >
                            {getAmenityIconWithColor(amenity, "w-3 h-3 sm:w-4 sm:h-4")}
                            <span className="capitalize text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                              {amenity.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                          <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-white shadow-lg shadow-purple-500/25">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          </div>
                          Events at this Venue
                        </h4>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                          {selectedVenue.events.length > 5 ? `Showing 5 of ${selectedVenue.events.length}` : `${selectedVenue.events.length} events`}
                        </div>
                      </div>
                      {selectedVenue.events.length > 0 ? (
                        <div className="space-y-3 max-h-60 sm:max-h-80 overflow-y-auto pr-2">
                          {selectedVenue.events.slice(0, 10).map((event, index) => (
                            <div
                              key={event.id || index}
                              className="p-3 sm:p-4 bg-white dark:bg-gray-700 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 dark:hover:from-blue-900/20 dark:hover:to-green-900/20 transition-all duration-300 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md hover:scale-105"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100 flex-1 mr-2 line-clamp-2">
                                  {event.name}
                                </h5>
                                {event.status && (
                                  <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap font-medium ${
                                    event.status === 'active'
                                      ? 'bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-300'
                                      : event.status === 'completed'
                                      ? 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900/30 dark:to-gray-800/30 text-gray-700 dark:text-gray-300'
                                      : 'bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-700 dark:text-yellow-300'
                                  }`}>
                                    {event.status}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 gap-2 sm:gap-4 mb-2 flex-wrap">
                                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                                  <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                  <span>{new Date(event.date).toLocaleDateString()}</span>
                                </div>
                                {event.start_time && (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/30 rounded-md">
                                    <Clock className="w-3 h-3 text-green-600 dark:text-green-400" />
                                    <span>{event.start_time}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                {event.category && (
                                  <span className="inline-block px-2 py-1 bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                                    {event.category}
                                  </span>
                                )}
                                <div className="flex items-center gap-1">
                                  <Heart className="w-3 h-3 text-red-500" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{event.likes_count || 0}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {selectedVenue.events.length > 10 && (
                            <div className="text-center pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/events?city=${encodeURIComponent(selectedVenue.city)}&location=${encodeURIComponent(selectedVenue.location)}`)}
                                className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 dark:hover:from-blue-900/20 dark:hover:to-green-900/20 hover:border-blue-400 dark:hover:border-green-400 transition-all duration-300 text-sm"
                              >
                                View all {selectedVenue.events.length} events
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                          <div className="relative inline-block mb-3">
                            <Calendar className="w-8 h-8 sm:w-12 sm:h-12 mx-auto opacity-50" />
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 sm:w-8 h-1 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-full blur-sm"></div>
                          </div>
                          <p className="text-sm">No events scheduled at this venue</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => handleGetDirections(selectedVenue)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-2 sm:py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  >
                    <Navigation className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Get Directions
                  </Button>
                  <Button
                    onClick={() => navigate(`/events?city=${encodeURIComponent(selectedVenue.city)}&location=${encodeURIComponent(selectedVenue.location)}`)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-2 sm:py-3 rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  >
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    View All Events
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare(selectedVenue)}
                    className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 dark:hover:from-blue-900/20 dark:hover:to-green-900/20 hover:border-blue-400 dark:hover:border-green-400 bg-white dark:bg-gray-800 font-semibold py-2 sm:py-3 rounded-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  >
                    <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Share Venue
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Footer />
        <style>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-8px);
            }
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
          .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
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
            .DialogContent {
              margin: 1rem;
              max-width: calc(100vw - 2rem);
            }
            .sm\\:grid-cols-2 {
              grid-template-columns: repeat(1, minmax(0, 1fr));
            }
            @media (min-width: 640px) {
              .sm\\:grid-cols-2 {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }
          }
          @media (max-width: 768px) {
            .TabsList {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
            h1 {
              line-height: 1.2;
            }
            h2 {
              line-height: 1.3;
            }
            .Button {
              min-height: 44px;
              touch-action: manipulation;
            }
          }
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
            animation: gradient-shift 3s ease infinite;
          }
          @keyframes pulse-glow {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.7;
              transform: scale(1.05);
            }
          }
          .animate-pulse-glow {
            animation: pulse-glow 2s ease-in-out infinite;
          }
          .focus\\:ring-2:focus {
            outline: 2px solid transparent;
            outline-offset: 2px;
            ring-width: 2px;
          }
          @media (hover: none) and (pointer: coarse) {
            button, .cursor-pointer {
              min-height: 44px;
              min-width: 44px;
            }
          }
          img {
            transition: opacity 0.3s ease;
          }
          img[data-loaded="false"] {
            opacity: 0;
          }
          img[data-loaded="true"] {
            opacity: 1;
          }
        `}</style>
      </div>
    </div>
  );
};
export default VenuePage;
