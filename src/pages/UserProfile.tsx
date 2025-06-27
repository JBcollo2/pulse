import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Building2, 
  Globe, 
  MapPin, 
  FileText,
  Hash,
  CreditCard,
  Save,
  Loader2
} from 'lucide-react';

interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  organizer_profile?: {
    company_name: string;
    company_description: string;
    website: string;
    social_media_links: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
    };
    business_registration_number: string;
    tax_id: string;
    address: string;
  };
}

const UserProfile = () => {
  const [profile, setProfile] = useState<UserProfile>({
    id: 0,
    full_name: '',
    email: '',
    phone_number: '',
    role: '',
    organizer_profile: {
      company_name: '',
      company_description: '',
      website: '',
      social_media_links: {},
      business_registration_number: '',
      tax_id: '',
      address: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch profile",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-700 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200">
              Profile Settings
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your account information and preferences
            </p>
          </div>
        </div>
      </div>
      
      {/* Main Profile Card */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <User className="h-5 w-5 text-blue-500" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </label>
                <Input
                  id="fullName"
                  value={profile.full_name}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 
                           text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400
                           focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 
                           text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </label>
                <Input
                  id="phone"
                  value={profile.phone_number}
                  onChange={(e) => setProfile({...profile, phone_number: e.target.value})}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 
                           text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400
                           focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role
                </label>
                <Input
                  id="role"
                  value={profile.role}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 
                           text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Organizer Profile Section */}
            {profile.role === 'ORGANIZER' && profile.organizer_profile && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-6">
                  <Building2 className="h-5 w-5 text-green-500" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Organizer Profile
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="companyName" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company Name
                    </label>
                    <Input
                      id="companyName"
                      value={profile.organizer_profile.company_name}
                      onChange={(e) => setProfile({
                        ...profile,
                        organizer_profile: {
                          ...profile.organizer_profile!,
                          company_name: e.target.value
                        }
                      })}
                      className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 
                               text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400
                               focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                      placeholder="Enter company name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="website" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website
                    </label>
                    <Input
                      id="website"
                      value={profile.organizer_profile.website}
                      onChange={(e) => setProfile({
                        ...profile,
                        organizer_profile: {
                          ...profile.organizer_profile!,
                          website: e.target.value
                        }
                      })}
                      className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 
                               text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400
                               focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                      placeholder="https://yourcompany.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="businessRegNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Business Registration Number
                    </label>
                    <Input
                      id="businessRegNumber"
                      value={profile.organizer_profile.business_registration_number}
                      onChange={(e) => setProfile({
                        ...profile,
                        organizer_profile: {
                          ...profile.organizer_profile!,
                          business_registration_number: e.target.value
                        }
                      })}
                      className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 
                               text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400
                               focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                      placeholder="Enter registration number"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="taxId" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Tax ID
                    </label>
                    <Input
                      id="taxId"
                      value={profile.organizer_profile.tax_id}
                      onChange={(e) => setProfile({
                        ...profile,
                        organizer_profile: {
                          ...profile.organizer_profile!,
                          tax_id: e.target.value
                        }
                      })}
                      className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 
                               text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400
                               focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                      placeholder="Enter tax ID"
                    />
                  </div>
                </div>

                {/* Full-width fields */}
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="companyDescription" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Company Description
                    </label>
                    <Textarea
                      id="companyDescription"
                      value={profile.organizer_profile.company_description}
                      onChange={(e) => setProfile({
                        ...profile,
                        organizer_profile: {
                          ...profile.organizer_profile!,
                          company_description: e.target.value
                        }
                      })}
                      className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 
                               text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400
                               focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400
                               min-h-[100px] resize-none"
                      placeholder="Describe your company and what you do..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Business Address
                    </label>
                    <Textarea
                      id="address"
                      value={profile.organizer_profile.address}
                      onChange={(e) => setProfile({
                        ...profile,
                        organizer_profile: {
                          ...profile.organizer_profile!,
                          address: e.target.value
                        }
                      })}
                      className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 
                               text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400
                               focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400
                               min-h-[80px] resize-none"
                      placeholder="Enter your business address..."
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 
                         text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;