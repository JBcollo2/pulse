import React from 'react';

interface EventMapProps {
  city?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  className?: string;
  height?: string;
  width?: string;
}

const EventMap: React.FC<EventMapProps> = ({
  city,
  location,
  latitude,
  longitude,
  className = '',
  height = '500px',
  width = '100%',
}) => {
  console.log('EventMap - Input city:', city);
  console.log('EventMap - Input location:', location);
  console.log('EventMap - Input latitude:', latitude);
  console.log('EventMap - Input longitude:', longitude);

  // If explicit coordinates are provided, use them
  if (latitude && longitude) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const mapUrl = apiKey
      ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=16`
      : `https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=14&output=embed`;
    return (
      <iframe
        src={mapUrl}
        width={width}
        height={height}
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className={className}
      />
    );
  }

  // Combine city + location for search context
  const buildSearchQuery = () => {
    if (city) {
      return `${location}, ${city}`;
    }
    return location;
  };

  // Extract coordinates from Google Maps URL or location string
  const extractCoordinates = (locationData: string) => {
    try {
      if (locationData.startsWith('http')) {
        const match = locationData.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match) {
          return {
            lat: parseFloat(match[1]),
            lng: parseFloat(match[2]),
          };
        }
      }
      return null;
    } catch (error) {
      console.error('EventMap - Error extracting coordinates:', error);
      return null;
    }
  };

  // Extract place name from Google Maps URL or use location string
  const extractPlaceName = (locationData: string) => {
    try {
      if (locationData.startsWith('http')) {
        const match = locationData.match(/\/place\/([^\/@]+)/);
        if (match) {
          return decodeURIComponent(match[1].replace(/\+/g, ' '));
        }
      }
      return locationData;
    } catch (error) {
      console.error('EventMap - Error extracting place name:', error);
      return locationData;
    }
  };

  // Try to get API key from environment
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // If API key is available, use the embed API with query
  if (apiKey) {
    const coords = extractCoordinates(location);
    if (coords) {
      const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${coords.lat},${coords.lng}&zoom=16`;
      return (
        <iframe
          src={mapUrl}
          width={width}
          height={height}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className={className}
        />
      );
    } else {
      const searchQuery = buildSearchQuery();
      const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(
        searchQuery
      )}&zoom=14`;
      return (
        <iframe
          src={mapUrl}
          width={width}
          height={height}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className={className}
        />
      );
    }
  }

  // Fallback without API key
  const coords = extractCoordinates(location);
  if (coords) {
    const mapUrl = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&hl=en&z=14&output=embed`;
    return (
      <div className={`relative ${className}`} style={{ height, width }}>
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/5"></div>
        </div>
      </div>
    );
  }

  // If no coordinates found, fall back to place search (with city if available)
  const placeName = buildSearchQuery() || extractPlaceName(location);
  const searchUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    placeName
  )}&hl=en&z=14&output=embed`;
  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <iframe
        src={searchUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/5"></div>
      </div>
    </div>
  );
};

export default EventMap;
