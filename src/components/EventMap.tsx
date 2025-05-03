import React from 'react';

import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

interface EventMapProps {
  location: string;
  latitude?: number;
  longitude?: number;
}

const EventMap: React.FC<EventMapProps> = ({ location, latitude, longitude }) => {
  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  const center = {
    lat: latitude || 0,
    lng: longitude || 0
  };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={15}
      >
        {latitude && longitude && (
          <Marker position={center} />
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default EventMap; 