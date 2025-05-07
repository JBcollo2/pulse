import React from 'react';

interface EventMapProps {
  location: string;
  className?: string;
  height?: string;
  width?: string;
}

const EventMap: React.FC<EventMapProps> = ({ location, className = '', height = '500px', width = '100%' }) => {
  console.log('EventMap - Input location:', location);
  
  // Extract coordinates from Google Maps URL or location string
  const extractCoordinates = (locationData: string) => {
    try {
      // If it's a Google Maps URL
      if (locationData.startsWith('http')) {
        console.log('EventMap - Processing Google Maps URL');
        const match = locationData.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match) {
          const coords = {
            lat: parseFloat(match[1]),
            lng: parseFloat(match[2])
          };
          console.log('EventMap - Extracted coordinates:', coords);
          return coords;
        }
        console.log('EventMap - No coordinates found in URL');
      } else {
        console.log('EventMap - Processing plain location string');
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
        console.log('EventMap - Extracting place name from URL');
        const match = locationData.match(/\/place\/([^\/@]+)/);
        if (match) {
          const placeName = decodeURIComponent(match[1].replace(/\+/g, ' '));
          console.log('EventMap - Extracted place name:', placeName);
          return placeName;
        }
      }
      console.log('EventMap - Using original location as place name:', locationData);
      return locationData;
    } catch (error) {
      console.error('EventMap - Error extracting place name:', error);
      return locationData;
    }
  };

  // Try to get API key from environment
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  console.log('EventMap - API Key available:', !!apiKey);

  // If API key is available, use the embed API
  if (apiKey) {
    const coords = extractCoordinates(location);
    if (coords) {
      const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${coords.lat},${coords.lng}&zoom=16`;
      console.log('EventMap - Using API with coordinates:', mapUrl);
      
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
  
  // Fallback to iframe share format
  const coords = extractCoordinates(location);
  if (coords) {
    const mapUrl = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&hl=en&z=14&output=embed`;
    console.log('EventMap - Using iframe share with coordinates:', mapUrl);
    
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

  // If no coordinates found, fall back to place search
  const placeName = extractPlaceName(location);
  const searchUrl = `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&hl=en&z=14&output=embed`;
  console.log('EventMap - Using place search fallback:', searchUrl);
  
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