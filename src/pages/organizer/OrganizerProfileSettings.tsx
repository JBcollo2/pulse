import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface OrganizerProfile {
    user_id: number;
    company_name: string;
    company_logo: string | null;
    company_description: string | null;
    website: string | null;
    social_media_links: any;
    business_registration_number: string | null;
    tax_id: string | null;
    address: string | null;
    user?: {
        full_name: string;
        email: string;
        phone_number: string;
    }
}

const profileFormSchema = z.object({
    company_name: z.string().min(2, { message: "Company name must be at least 2 characters." }).max(100, { message: "Company name must not be longer than 100 characters." }),
    company_description: z.string().max(500, { message: "Description must not be longer than 500 characters." }).optional().nullable(),
    website: z.string().url({ message: "Please enter a valid URL." }).optional().nullable(),
    business_registration_number: z.string().max(50, { message: "Registration number must not be longer than 50 characters." }).optional().nullable(),
    tax_id: z.string().max(50, { message: "Tax ID must not be longer than 50 characters." }).optional().nullable(),
    address: z.string().max(200, { message: "Address must not be longer than 200 characters." }).optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const OrganizerProfileSettings: React.FC = () => {
    const [profile, setProfile] = useState<OrganizerProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            company_name: "",
            company_description: "",
            website: "",
            business_registration_number: "",
            tax_id: "",
            address: "",
        },
    });

    const { register, handleSubmit, reset, formState: { errors, isDirty } } = form;

    const fetchProfile = useCallback(async () => {
        setIsLoadingProfile(true);
        setProfileError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/organizer/profile`, {
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to fetch profile data.");
            }

            const data: OrganizerProfile = await response.json();
            setProfile(data);
            reset(data);
        } catch (err: any) {
            console.error("Error fetching profile:", err);
            setProfileError(err.message || "Failed to load profile.");
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "Failed to load profile data.",
            });
        } finally {
            setIsLoadingProfile(false);
        }
    }, [reset]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const onSubmit = async (data: ProfileFormValues) => {
        setIsUpdating(true);
        setProfileError(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/organizer/profile`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update profile data.");
            }

            const updatedProfile: OrganizerProfile = await response.json();
            setProfile(updatedProfile);
            toast({
                title: "Profile Updated",
                description: "Your profile has been successfully updated.",
                duration: 3000,
            });
            reset(updatedProfile);
        } catch (err: any) {
            console.error("Error updating profile:", err);
            setProfileError(err.message || "Failed to update profile.");
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: err.message || "There was an error updating your profile.",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoadingProfile) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Organizer Profile</CardTitle>
                    <CardDescription>Loading your profile details...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, index) => (
                            <div key={index} className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (profileError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Organizer Profile</CardTitle>
                    <CardDescription>Error loading profile.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-red-500 font-semibold">Error: {profileError}</p>
                    <Button onClick={fetchProfile} className="mt-4">Retry Loading Profile</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground text-lg">
                Update your personal and organization details.
            </p>

            <Card className="max-w-3xl">
                <CardHeader>
                    <CardTitle>Your Profile Information</CardTitle>
                    <CardDescription>
                        Manage your contact details and organization information.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <Label htmlFor="company_name">Company Name</Label>
                            <Input
                                id="company_name"
                                type="text"
                                {...register("company_name")}
                                className="mt-1"
                            />
                            {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="company_description">Company Description</Label>
                            <Input
                                id="company_description"
                                type="text"
                                {...register("company_description")}
                                className="mt-1"
                            />
                            {errors.company_description && <p className="text-red-500 text-sm mt-1">{errors.company_description.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                type="url"
                                {...register("website")}
                                className="mt-1"
                            />
                            {errors.website && <p className="text-red-500 text-sm mt-1">{errors.website.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="business_registration_number">Business Registration Number</Label>
                            <Input
                                id="business_registration_number"
                                type="text"
                                {...register("business_registration_number")}
                                className="mt-1"
                            />
                            {errors.business_registration_number && <p className="text-red-500 text-sm mt-1">{errors.business_registration_number.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="tax_id">Tax ID</Label>
                            <Input
                                id="tax_id"
                                type="text"
                                {...register("tax_id")}
                                className="mt-1"
                            />
                            {errors.tax_id && <p className="text-red-500 text-sm mt-1">{errors.tax_id.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                type="text"
                                {...register("address")}
                                className="mt-1"
                            />
                            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isUpdating || !isDirty}
                        >
                            {isUpdating ? "Saving..." : "Save Changes"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default OrganizerProfileSettings;
