import React from 'react';
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, CalendarDays, BarChart2, FileText, Settings } from "lucide-react";

interface OrganizerNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  isLoading: boolean;
}

const OrganizerNavigation: React.FC<OrganizerNavigationProps> = ({
  currentView,
  onViewChange,
  onLogout,
  isLoading
}) => {
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'myEvents', label: 'My Events', icon: CalendarDays },
    { id: 'overallStats', label: 'Overall Stats', icon: BarChart2 }, // Changed from 'stats' to 'overallStats' for clarity
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'createEvent', label: 'Create Event', icon: CalendarDays }, // Added 'Create Event' for direct navigation
  ];

  return (
    <Card className="w-48 p-3 flex flex-col justify-between h-full min-h-[calc(100vh-6rem)]">
      <div className="space-y-1">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left",
              currentView === item.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            type="button"
          >
            <item.icon className="h-4 w-4" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="pt-4 mt-auto border-t border-border">
        <Button
          onClick={onLogout}
          className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm py-2"
          disabled={isLoading}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </Card>
  );
};

export default OrganizerNavigation;