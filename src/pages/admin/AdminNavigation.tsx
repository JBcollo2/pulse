import React from 'react';
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, BarChart2, Calendar, Users, Shield, UserPlus } from "lucide-react";

interface AdminNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  isLoading: boolean;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({
  currentView,
  onViewChange,
  onLogout,
  isLoading
}) => {
  const navigationItems = [
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'events', label: 'View Events', icon: Calendar },
    { id: 'nonAttendees', label: 'Non-Attendees', icon: Users },
    { id: 'registerAdmin', label: 'Register Admin', icon: UserPlus },
    { id: 'registerSecurity', label: 'Register Security', icon: Shield },
    { id: 'viewAllUsers', label: 'View All Users', icon: Users },
  ];

  return (
    <Card className="w-40 p-2">
      <div className="space-y-1">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors w-full",
              currentView === item.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            type="button"
          >
            <item.icon className="h-3.5 w-3.5" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="pt-2 mt-2 border-t">
        <Button
          onClick={onLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white text-xs py-1.5"
          disabled={isLoading}
        >
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
          Logout
        </Button>
      </div>
    </Card>
  );
};

export default AdminNavigation; 