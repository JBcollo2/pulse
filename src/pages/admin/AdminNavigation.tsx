import React from 'react';
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, BarChart2, Calendar, Users, Shield, UserPlus, Activity } from "lucide-react";

interface AdminNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  isLoading: boolean;
  darkMode: boolean;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({
  currentView,
  onViewChange,
  onLogout,
  isLoading,
  darkMode,
}) => {
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart2, description: 'Dashboard overview' },
    { id: 'events', label: 'My Events', icon: Calendar, description: 'Manage your events' },
    { id: 'stats', label: 'Overall Stats', icon: Users, description: 'Analytics & insights' },
    { id: 'reports', label: 'Reports', icon: Shield, description: 'Generate reports' },
  ];

  return (
    <Card className={cn(
      "fixed top-0 left-0 h-screen w-72 p-4",
      darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800",
      "flex flex-col shadow-lg"
    )}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-xl">Organizers</h2>
            <p className="text-xs text-gray-500">Manage team members</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors w-full",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                    : darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                )}
              >
                <item.icon className="h-5 w-5" />
                <div className="flex-1 text-left">
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-900">Quick Stats</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Events</span>
              <span className="font-bold text-indigo-600">12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Tickets</span>
              <span className="font-bold text-green-600">1,247</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Revenue</span>
              <span className="font-bold text-purple-600">$24.5k</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={onLogout}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
        >
          <LogOut className="h-5 w-5 mr-2" />
          {isLoading ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </Card>
  );
};

export default AdminNavigation;
