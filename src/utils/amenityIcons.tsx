import { 
  Wifi, Car, Utensils, Music, Coffee, ShieldCheck, Activity, 
  Building, ArrowUpDown, Zap, Users, MapPin, Camera, Star 
} from 'lucide-react';
import { ReactElement } from 'react';

// Simple icon mapping for general use
export const getAmenityIcon = (amenity: string, className: string = "w-4 h-4"): ReactElement => {
  const iconMap: Record<string, ReactElement> = {
    'wifi': <Wifi className={className} />,
    'parking': <Car className={className} />,
    'food': <Utensils className={className} />,
    'music': <Music className={className} />,
    'coffee': <Coffee className={className} />,
    'security': <ShieldCheck className={className} />,
    'activities': <Activity className={className} />,
    'restroom': <Building className={className} />,
    'elevator': <ArrowUpDown className={className} />,
    'air_conditioning': <Zap className={className} />,
    'heating': <Zap className={className} />,
    'wheelchair_accessible': <Users className={className} />,
    'outdoor_seating': <MapPin className={className} />,
    'bar': <Coffee className={className} />,
    'stage': <Music className={className} />,
    'dance_floor': <Activity className={className} />,
    'photography': <Camera className={className} />,
    'sound_system': <Music className={className} />,
    'lighting': <Zap className={className} />,
    'catering': <Utensils className={className} />,
    'valet': <Car className={className} />,
    'coat_check': <Building className={className} />,
  };
  return iconMap[amenity.toLowerCase()] || <Star className={className} />;
};

// Icon mapping with colors for venue details dialog
export const getAmenityIconWithColor = (amenity: string, baseClassName: string = "w-4 h-4"): ReactElement => {
  const iconMap: Record<string, ReactElement> = {
    'wifi': <Wifi className={`${baseClassName} text-blue-600 dark:text-blue-400`} />,
    'parking': <Car className={`${baseClassName} text-green-600 dark:text-green-400`} />,
    'food': <Utensils className={`${baseClassName} text-orange-600 dark:text-orange-400`} />,
    'music': <Music className={`${baseClassName} text-purple-600 dark:text-purple-400`} />,
    'coffee': <Coffee className={`${baseClassName} text-amber-600 dark:text-amber-400`} />,
    'security': <ShieldCheck className={`${baseClassName} text-red-600 dark:text-red-400`} />,
    'activities': <Activity className={`${baseClassName} text-indigo-600 dark:text-indigo-400`} />,
    'restroom': <Building className={`${baseClassName} text-gray-600 dark:text-gray-400`} />,
    'elevator': <ArrowUpDown className={`${baseClassName} text-blue-600 dark:text-blue-400`} />,
    'air_conditioning': <Zap className={`${baseClassName} text-cyan-600 dark:text-cyan-400`} />,
    'heating': <Zap className={`${baseClassName} text-red-600 dark:text-red-400`} />,
    'wheelchair_accessible': <Users className={`${baseClassName} text-green-600 dark:text-green-400`} />,
    'outdoor_seating': <MapPin className={`${baseClassName} text-green-600 dark:text-green-400`} />,
    'bar': <Coffee className={`${baseClassName} text-amber-600 dark:text-amber-400`} />,
    'stage': <Music className={`${baseClassName} text-purple-600 dark:text-purple-400`} />,
    'dance_floor': <Activity className={`${baseClassName} text-pink-600 dark:text-pink-400`} />,
    'photography': <Camera className={`${baseClassName} text-indigo-600 dark:text-indigo-400`} />,
    'sound_system': <Music className={`${baseClassName} text-purple-600 dark:text-purple-400`} />,
    'lighting': <Zap className={`${baseClassName} text-yellow-600 dark:text-yellow-400`} />,
    'catering': <Utensils className={`${baseClassName} text-orange-600 dark:text-orange-400`} />,
    'valet': <Car className={`${baseClassName} text-blue-600 dark:text-blue-400`} />,
    'coat_check': <Building className={`${baseClassName} text-gray-600 dark:text-gray-400`} />,
  };
  return iconMap[amenity.toLowerCase()] || <MapPin className={`${baseClassName} text-gray-600 dark:text-gray-400`} />;
};
