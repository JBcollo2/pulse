import React from 'react';
import { cn } from "@/lib/utils"; // Assuming cn utility is available
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Import icons needed for organizer navigation
import { LogOut, LayoutDashboard, CalendarDays, BarChart2, FileText, Settings, Package } from "lucide-react";

// Define props interface
interface OrganizerNavigationProps {
  // Using string type for currentView as it's just an ID string here
  currentView: string;
  // The onViewChange function accepts the view ID string
  onViewChange: (view: string) => void;
  onLogout: () => void;
  isLoading: boolean; // To disable logout button during loading
}

const OrganizerNavigation: React.FC<OrganizerNavigationProps> = ({
  currentView,
  onViewChange,
  onLogout,
  isLoading
}) => {
  // Define navigation items for the organizer dashboard views
  const navigationItems = [
    // Corresponds to 'overview' in OrganizerDashboardView
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    // Corresponds to 'myEvents'
    { id: 'myEvents', label: 'My Events', icon: CalendarDays }, // Or Package, ListTodo etc.
    // Corresponds to 'stats'
    { id: 'stats', label: 'Statistics', icon: BarChart2 }, // Or Activity
    // Corresponds to 'reports'
    { id: 'reports', label: 'Reports', icon: FileText }, // Or Clipboard
    // Corresponds to 'settings'
    { id: 'settings', label: 'Settings', icon: Settings },
    // Note: 'viewTicketTypes' and 'viewReport' are accessed from 'myEvents' list,
    // so they don't typically need dedicated main navigation links.
  ];

  return (
    // Use Card and similar styling as AdminNavigation
    <Card className="w-40 p-2"> {/* Adjusted width slightly based on Admin example */}
      <div className="space-y-1">
        {navigationItems.map((item) => (
          // Use button element for navigation items
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors w-full",
              // Apply active styling if currentView matches item.id
              currentView === item.id
                ? "bg-primary text-primary-foreground" // Active state styles
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground" // Inactive state styles
            )}
            type="button" // Explicitly set type to button
          >
            {/* Render the icon component */}
            <item.icon className="h-3.5 w-3.5" />
            {/* Display the label */}
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Logout button section */}
      <div className="pt-2 mt-2 border-t">
        <Button
          onClick={onLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white text-xs py-1.5" // Example button styling
          disabled={isLoading} // Disable button when loading
        >
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
          Logout
        </Button>
      </div>
    </Card>
  );
};

export default OrganizerNavigation;