import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { EventDialog } from "@/components/EventDialog";

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
  const { toast } = useToast();
  const [showEventDialog, setShowEventDialog] = useState(false);

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
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        {profile.role === 'ORGANIZER' && (
          <Button variant="outline" onClick={() => setShowEventDialog(true)}>
            Add Event
          </Button>
        )}
      </div>

      <EventDialog 
        open={showEventDialog} 
        onOpenChange={setShowEventDialog} 
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) => setProfile({...profile, full_name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
              <Input
                id="phone"
                value={profile.phone_number}
                onChange={(e) => setProfile({...profile, phone_number: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">Role</label>
              <Input
                id="role"
                value={profile.role}
                disabled
              />
            </div>

            {profile.role === 'ORGANIZER' && profile.organizer_profile && (
              <>
                <div className="mt-6 pt-6 border-t">
                  <h2 className="text-xl font-semibold mb-4">Organizer Profile</h2>
                  
                  <div className="space-y-2">
                    <label htmlFor="companyName" className="text-sm font-medium">Company Name</label>
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
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="companyDescription" className="text-sm font-medium">Company Description</label>
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
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="website" className="text-sm font-medium">Website</label>
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
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="businessRegNumber" className="text-sm font-medium">Business Registration Number</label>
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
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="taxId" className="text-sm font-medium">Tax ID</label>
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
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="address" className="text-sm font-medium">Address</label>
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
                    />
                  </div>
                </div>
              </>
            )}
            
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile; 