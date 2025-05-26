import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"; // Added CardFooter
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle } from "lucide-react"; // Import icons for loading and error

interface OrganizerProfile {
    user_id: number;
    company_name: string;
    company_logo: string | null;
    company_description: string | null;
    website: string | null;
    social_media_links: any; // Consider refining this type if possible
    business_registration_number: string | null;
    tax_id: string | null;
    address: string | null;
    user?: {
        full_name: string;
        email: string;
        phone_number: string;
    }
}

// Zod schema for form validation
const profileFormSchema = z.object({
    company_name: z.string()
        .min(2, { message: "Company name must be at least 2 characters." })
        .max(100, { message: "Company name must not be longer than 100 characters." }),
    company_description: z.string()
        .max(500, { message: "Description must not be longer than 500 characters." })
        .nullable().transform(e => e === "" ? null : e), // Transform empty string to null
    website: z.string()
        .url({ message: "Please enter a valid URL." })
        .nullable().transform(e => e === "" ? null : e), // Transform empty string to null
    business_registration_number: z.string()
        .max(50, { message: "Registration number must not be longer than 50 characters." })
        .nullable().transform(e => e === "" ? null : e), // Transform empty string to null
    tax_id: z.string()
        .max(50, { message: "Tax ID must not be longer than 50 characters." })
        .nullable().transform(e => e === "" ? null : e), // Transform empty string to null
    address: z.string()
        .max(200, { message: "Address must not be longer than 200 characters." })
        .nullable().transform(e => e === "" ? null : e), // Transform empty string to null
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const OrganizerProfileSettings: React.FC = () => {
    const { toast } = useToast();
    const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [profile, setProfile] = useState<OrganizerProfile | null>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            company_name: "",
            company_description: null,
            website: null,
            business_registration_number: null,
            tax_id: null,
            address: null,
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
            setProfileError(null); // Clear any previous error on successful fetch

            // Ensure null for optional fields if they come as empty strings
            const sanitizedData = {
                ...data,
                company_description: data.company_description === "" ? null : data.company_description,
                website: data.website === "" ? null : data.website,
                business_registration_number: data.business_registration_number === "" ? null : data.business_registration_number,
                tax_id: data.tax_id === "" ? null : data.tax_id,
                address: data.address === "" ? null : data.address,
            };
            setProfile(sanitizedData);
            reset(sanitizedData);
            reset(sanitizedData);
        } catch (err: any) {
            console.error("Error fetching profile:", err);
            setProfileError(err.message || "Failed to load profile.");
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "Failed to load profile data. Please try again.",
            });
        } finally {
            setIsLoadingProfile(false);
        }
    }, [reset, toast]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const onSubmit = async (data: ProfileFormValues) => {
        setIsUpdating(true);
        setProfileError(null); // Clear previous errors before a new submission

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

            // No need to setProfile state here, reset will update the form values
            toast({
                title: "Profile Updated",
                description: "Your profile has been successfully updated.",
                duration: 3000,
            });
            // Reset form with the successfully saved data to mark it as not dirty
            // This is important because the backend might return the data slightly differently
            // or confirm the save, ensuring the form's dirty state is accurate.
            reset(data); // Using `data` instead of `updatedProfile` from response since `data` is what was sent and accepted.
        } catch (err: any) {
            console.error("Error updating profile:", err);
            setProfileError(err.message || "Failed to update profile.");
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: err.message || "There was an error updating your profile. Please try again.",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // --- Loading State ---
    if (isLoadingProfile) {
        return (
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>Organizer Profile</CardTitle>
                    <CardDescription>Loading your profile details...</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Fetching profile data...</p>
                </CardContent>
            </Card>
        );
    }

    // --- Error State ---
    if (profileError) {
        return (
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-6 w-6" /> Error Loading Profile
                    </CardTitle>
                    <CardDescription>We couldn't retrieve your profile information.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive font-medium text-sm mb-4">{profileError}</p>
                    <Button onClick={fetchProfile} className="w-full">
                        Retry Loading Profile
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // --- Main Form Display ---
    return (
        <div className="space-y-6 max-w-4xl mx-auto py-8">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">Profile Settings</h1>
            <p className="text-lg text-muted-foreground">
                Update your personal and organization details. This information will be used for event management and communication.
            </p>

            <Card>
                <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                    <CardDescription>
                        These details represent your organization to attendees and partners.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="company_name">Company Name</Label>
                            <Input
                                id="company_name"
                                type="text"
                                {...register("company_name")}
                                placeholder="Your Company Name"
                            />
                            {errors.company_name && <p className="text-destructive text-sm mt-1">{errors.company_name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                type="url"
                                {...register("website")}
                                placeholder="https://www.yourcompany.com"
                            />
                            {errors.website && <p className="text-destructive text-sm mt-1">{errors.website.message}</p>}
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="company_description">Company Description</Label>
                            <Input // Using Input for simplicity, consider a TextArea for larger descriptions
                                id="company_description"
                                type="text"
                                {...register("company_description")}
                                placeholder="A brief description of your company or organization."
                            />
                            {errors.company_description && <p className="text-destructive text-sm mt-1">{errors.company_description.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="business_registration_number">Business Registration Number</Label>
                            <Input
                                id="business_registration_number"
                                type="text"
                                {...register("business_registration_number")}
                                placeholder="e.g., BRN123456"
                            />
                            {errors.business_registration_number && <p className="text-destructive text-sm mt-1">{errors.business_registration_number.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tax_id">Tax ID</Label>
                            <Input
                                id="tax_id"
                                type="text"
                                {...register("tax_id")}
                                placeholder="e.g., TAXID7890"
                            />
                            {errors.tax_id && <p className="text-destructive text-sm mt-1">{errors.tax_id.message}</p>}
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                type="text"
                                {...register("address")}
                                placeholder="Your company's physical address"
                            />
                            {errors.address && <p className="text-destructive text-sm mt-1">{errors.address.message}</p>}
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="border-t pt-6 mt-6 flex justify-end">
                    <Button
                        type="submit"
                        form="organizer-profile-form" // Link button to the form
                        className="min-w-[120px]"
                        disabled={isUpdating || !isDirty}
                        onClick={handleSubmit(onSubmit)} // Attach handleSubmit to the button's onClick
                    >
                        {isUpdating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </CardFooter>
            </Card>

            {/* Optionally add a section for basic user details if they are part of the profile object */}
            {profile?.user && (
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Person Details</CardTitle>
                        <CardDescription>
                            Your primary contact information for the platform.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input id="full_name" type="text" value={profile.user.full_name} disabled className="cursor-not-allowed bg-muted/50" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={profile.user.email} disabled className="cursor-not-allowed bg-muted/50" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone_number">Phone Number</Label>
                            <Input id="phone_number" type="tel" value={profile.user.phone_number} disabled className="cursor-not-allowed bg-muted/50" />
                        </div>
                        <p className="md:col-span-2 text-sm text-muted-foreground">
                            To change these details, please contact support.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default OrganizerProfileSettings;