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
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({
  currentView,
  onViewChange,
  onLogout,
  isLoading,
}) => {
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart2, description: 'Dashboard overview' },
    { id: 'users', label: 'Manage Users', icon: Users, description: 'Manage platform users' },
    { id: 'events', label: 'Manage Events', icon: Calendar, description: 'Manage all events' },
    { id: 'reports', label: 'Reports', icon: Shield, description: 'View reports' },
  ];

  return (
    <Card className="fixed top-0 left-0 h-screen w-72 p-4 flex flex-col shadow-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-xl">Admins</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Manage platform activities</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
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
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <item.icon className="h-5 w-5" />
              <div className="flex-1 text-left">
                <div className="font-semibold">{item.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
              </div>
            </button>
          );
        })}

        {/* Stats Card */}
        <div className="mt-8 p-4 rounded-xl border bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
            <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Quick Stats</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Active Users</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">120</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Events</span>
              <span className="font-bold text-green-600 dark:text-green-400">45</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Reports</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
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
