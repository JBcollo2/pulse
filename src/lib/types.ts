import {
  Handshake, Star, Users, TrendingUp, Activity
} from "lucide-react";

// --- Interfaces ---
export interface Partner {
  id: number;
  organizer_id: number;
  company_name: string;
  company_description?: string;
  logo_url?: string;
  website_url?: string;
  contact_email?: string;
  contact_person?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_collaborations?: number;
  recent_collaborations?: RecentCollaboration[];
  collaboration_stats?: {
    total_collaborations: number;
    active_collaborations: number;
    collaboration_types: string[];
  };
  collaborations?: Collaboration[];
}

export interface RecentCollaboration {
  event_id: number;
  event_name: string;
  collaboration_type: string;
  created_at: string;
}

export interface Collaboration {
  id: number;
  event_id: number;
  partner_id: number;
  collaboration_type: string;
  description?: string;
  display_order: number;
  show_on_event_page: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  event_name?: string;
  event_date?: string;
  partner_name?: string;
}

export interface Event {
  id: number;
  name: string;
  date?: string;
  location?: string;
  status?: string;
}

export interface PartnersResponse {
  partners: Partner[];
  pagination: {
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
  organizer_id: number;
  filters: {
    include_inactive: boolean;
    sort_by: string;
    sort_order: string;
    search?: string;
  };
}

export interface PartnerDetailsResponse {
  partner: Partner;
  pagination: {
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface CollaborationsResponse {
  event_id: number;
  event_name: string;
  collaborations: Collaboration[];
  pagination: {
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// --- Constants ---
export const COLLABORATION_TYPES = [
  { value: 'PARTNER', label: 'Partner', icon: Handshake, color: 'text-blue-500' },
  { value: 'OFFICIAL_PARTNER', label: 'Official Partner', icon: Star, color: 'text-yellow-500' },
  { value: 'COLLABORATOR', label: 'Collaborator', icon: Users, color: 'text-green-500' },
  { value: 'SUPPORTER', label: 'Supporter', icon: TrendingUp, color: 'text-purple-500' },
  { value: 'MEDIA_PARTNER', label: 'Media Partner', icon: Activity, color: 'text-orange-500' },
];

export const SORT_OPTIONS = [
  { value: 'company_name', label: 'Company Name' },
  { value: 'created_at', label: 'Date Created' },
  { value: 'total_collaborations', label: 'Total Collaborations' },
  { value: 'active_status', label: 'Active Status' },
];

export const ALLOWED_FILE_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
