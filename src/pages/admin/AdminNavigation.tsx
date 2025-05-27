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
    { id: 'users', label: 'Manage Users', icon: Users, description: 'Manage platform users' },
    { id: 'events', label: 'Manage Events', icon: Calendar, description: 'Manage all events' },
    { id: 'reports', label: 'Reports', icon: Shield, description: 'View reports' },
  ];

  return (
    <Card className={cn(
      "fixed top-0 left-0 h-screen w-72 p-4 flex flex-col shadow-lg",
      darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
    )}>
      {/* Header */}
      <div className={cn("p-4 border-b", darkMode ? "border-gray-700" : "border-gray-200")}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-xl">Admins</h2>
            <p className={cn("text-xs", darkMode ? "text-gray-400" : "text-gray-500")}>Manage platform activities</p>
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
                  : darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              <div className="flex-1 text-left">
                <div className="font-semibold">{item.label}</div>
                <div className={cn("text-xs", darkMode ? "text-gray-400" : "text-gray-500")}>{item.description}</div>
              </div>
            </button>
          );
        })}

        {/* Stats Card */}
        <div className={cn(
          "mt-8 p-4 rounded-xl border",
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100"
        )}>
          <div className="flex items-center gap-2 mb-3">
            <Activity className={cn("w-4 h-4", darkMode ? "text-indigo-300" : "text-indigo-600")} />
            <span className={cn("text-sm font-semibold", darkMode ? "text-indigo-100" : "text-indigo-900")}>Quick Stats</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Active Users</span>
              <span className={darkMode ? "text-indigo-400" : "text-indigo-600 font-bold"}>120</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Total Events</span>
              <span className={darkMode ? "text-green-400" : "text-green-600 font-bold"}>45</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Reports</span>
              <span className={darkMode ? "text-purple-400" : "text-purple-600 font-bold"}>7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className={cn("p-4 border-t", darkMode ? "border-gray-700" : "border-gray-200")}>
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
