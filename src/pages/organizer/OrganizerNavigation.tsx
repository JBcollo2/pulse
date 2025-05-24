// frontend/pulse/src/pages/organizer/OrganizerNavigation.tsx

import React from 'react';
import { cn } from "@/lib/utils"; // Assuming this utility helps with conditional class joining
import { Card } from "@/components/ui/card"; // Assuming shadcn/ui Card component
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui Button component
// Import icons from lucide-react for visual cues in the navigation
import { LogOut, LayoutDashboard, CalendarDays, BarChart2, FileText, Settings } from "lucide-react";

// Define the props interface for the OrganizerNavigation component.
// This clearly specifies what properties the component expects from its parent.
interface OrganizerNavigationProps {
    currentView: string; // The ID of the currently active view (e.g., 'myEvents', 'reports').
                         // This is used to apply active styling to the corresponding navigation item.
    onViewChange: (view: string) => void; // A callback function that the parent component provides.
                                         // It's called when a navigation item is clicked,
                                         // passing the ID of the new view.
    onLogout: () => void; // A callback function to handle the user logout action.
                          // This typically triggers an API call and redirects the user.
    isLoading: boolean; // A boolean flag to indicate if a global loading state is active.
                        // This is used to disable the logout button to prevent multiple clicks
                        // or actions during ongoing operations (e.g., logging out).
}

// The OrganizerNavigation functional component.
const OrganizerNavigation: React.FC<OrganizerNavigationProps> = ({
    currentView,
    onViewChange,
    onLogout,
    isLoading
}) => {
    // Define the list of navigation items. Each item has:
    // - id: A unique identifier, used for 'currentView' matching and as a key.
    // - label: The text displayed for the navigation item.
    // - icon: The Lucide React icon component to be rendered next to the label.
    const navigationItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'myEvents', label: 'My Events', icon: CalendarDays },
        { id: 'stats', label: 'Statistics', icon: BarChart2 },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Settings },
        // Note: 'viewTicketTypes' and 'viewReport' are sub-views managed within 'myEvents' or directly from event actions,
        // so they typically don't need dedicated main navigation links in the sidebar.
    ];

    return (
        // A Card component from shadcn/ui acts as the container for the navigation.
        // It's styled to be a fixed-width sidebar,
        // using flexbox to push the logout button to the bottom.
        <Card className="w-48 p-3 flex flex-col justify-between h-full min-h-[calc(100vh-6rem)]">
            {/* Top section for main navigation items */}
            <div className="space-y-1">
                {/* Map over the navigationItems array to render each button */}
                {navigationItems.map((item) => (
                    <button
                        key={item.id} // Unique key for list rendering
                        onClick={() => onViewChange(item.id)} // Calls the onViewChange prop with the item's ID
                        // 'cn' utility is used for conditional class joining.
                        // It applies different styles based on whether the item is the 'currentView'.
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left",
                            currentView === item.id // If this item is the active view...
                                ? "bg-primary text-primary-foreground" // ...apply active (primary) styles
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground" // ...otherwise, apply inactive styles with hover effects
                        )}
                        type="button" // Explicitly set type to "button" to prevent default form submission behavior if nested in a form.
                    >
                        {/* Render the icon component (e.g., <LayoutDashboard />) */}
                        <item.icon className="h-4 w-4" />
                        {/* Display the text label for the navigation item */}
                        <span className="truncate">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Bottom section for the Logout button.
                'mt-auto' pushes it to the bottom of the flex container. */}
            <div className="pt-4 mt-auto border-t border-border">
                <Button
                    onClick={onLogout} // Calls the onLogout prop when clicked
                    className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm py-2"
                    disabled={isLoading} // The button is disabled if 'isLoading' is true,
                                         // preventing clicks during an active operation (like logout).
                >
                    <LogOut className="h-4 w-4 mr-2" /> {/* Logout icon */}
                    Logout
                </Button>
            </div>
        </Card>
    );
};

export default OrganizerNavigation;