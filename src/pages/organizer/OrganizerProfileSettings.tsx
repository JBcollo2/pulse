import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

// Form-related imports for validation and state management
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- Interfaces for Data Structures ---
// Define the shape of the organizer profile data you expect from your backend.
interface OrganizerProfile {
    id: number;
    name: string;
    email: string;
    contact_phone: string;
    organization_name: string;
    address?: string; // Optional field
    city?: string;    // Optional field
    country?: string; // Optional field
}

// --- Zod Schema for Form Validation ---
// This schema defines the validation rules for your form fields.
const profileFormSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, { message: "Name must not be longer than 50 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    contact_phone: z.string()
        .min(10, { message: "Phone number must be at least 10 digits." })
        .max(15, { message: "Phone number must not be longer than 15 digits." })
        .regex(/^\+?[0-9\s-()]*$/, { message: "Invalid phone number format." }), // Basic phone number regex
    organization_name: z.string().min(2, { message: "Organization name must be at least 2 characters." }).max(100, { message: "Organization name must not be longer than 100 characters." }),
    address: z.string().max(100, { message: "Address must not be longer than 100 characters." }).optional().nullable(),
    city: z.string().max(50, { message: "City must not be longer than 50 characters." }).optional().nullable(),
    country: z.string().max(50, { message: "Country must not be longer than 50 characters." }).optional().nullable(),
});

// Define the type for the form data based on the Zod schema
type ProfileFormValues = z.infer<typeof profileFormSchema>;

// --- OrganizerProfileSettings Component ---
const OrganizerProfileSettings: React.FC = () => {
    // State to hold the current profile data
    const [profile, setProfile] = useState<OrganizerProfile | null>(null);
    // State to manage loading status for fetching profile
    const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
    // State to manage error message for fetching profile
    const [profileError, setProfileError] = useState<string | null>(null);
    // State to manage loading status for updating profile
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    // Initialize React Hook Form with Zod resolver for validation
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: "",
            email: "",
            contact_phone: "",
            organization_name: "",
            address: "",
            city: "",
            country: "",
        },
    });

    const { register, handleSubmit, reset, formState: { errors, isDirty } } = form; // isDirty checks if form has changed

    // --- Fetch Profile Data ---
    const fetchProfile = useCallback(async () => {
        setIsLoadingProfile(true);
        setProfileError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to fetch profile data.");
            }

            const data: OrganizerProfile = await response.json();
            setProfile(data);
            // Reset the form with the fetched data
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

    // Fetch profile data on component mount
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // --- Update Profile Data ---
    const onSubmit = async (data: ProfileFormValues) => {
        setIsUpdating(true);
        setProfileError(null); // Clear previous errors

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
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
            // Reset form state to reflect the updated data and clear dirty flag
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

    // --- Render Logic ---
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

    // If profile is loaded successfully, display the form
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
                    {/* Use the form's handleSubmit for submission */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Name Field */}
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                {...register("name")} // Connects input to React Hook Form
                                className="mt-1"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                        </div>

                        {/* Email Field */}
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                {...register("email")}
                                className="mt-1"
                                disabled // Email often not directly editable here, might require separate process
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                        </div>

                        {/* Contact Phone Field */}
                        <div>
                            <Label htmlFor="contact_phone">Contact Phone</Label>
                            <Input
                                id="contact_phone"
                                type="tel" // Use type="tel" for phone numbers
                                {...register("contact_phone")}
                                className="mt-1"
                            />
                            {errors.contact_phone && <p className="text-red-500 text-sm mt-1">{errors.contact_phone.message}</p>}
                        </div>

                        {/* Organization Name Field */}
                        <div>
                            <Label htmlFor="organization_name">Organization Name</Label>
                            <Input
                                id="organization_name"
                                type="text"
                                {...register("organization_name")}
                                className="mt-1"
                            />
                            {errors.organization_name && <p className="text-red-500 text-sm mt-1">{errors.organization_name.message}</p>}
                        </div>

                        {/* Address Field (Optional) */}
                        <div>
                            <Label htmlFor="address">Address (Optional)</Label>
                            <Input
                                id="address"
                                type="text"
                                {...register("address")}
                                className="mt-1"
                            />
                            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
                        </div>

                        {/* City Field (Optional) */}
                        <div>
                            <Label htmlFor="city">City (Optional)</Label>
                            <Input
                                id="city"
                                type="text"
                                {...register("city")}
                                className="mt-1"
                            />
                            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
                        </div>

                        {/* Country Field (Optional) */}
                        <div>
                            <Label htmlFor="country">Country (Optional)</Label>
                            <Input
                                id="country"
                                type="text"
                                {...register("country")}
                                className="mt-1"
                            />
                            {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isUpdating || !isDirty} // Disable if updating or no changes made
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
