// src/pages/Dashboard.tsx

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Calendar, Ticket, Settings, Users, QrCode } from 'lucide-react';

// Import your main page-level components
import Overview from './Overview';
import Tickets from './Tickets';
import QRScanner from './QRScanner';
import UserProfile from './UserProfile';
import Admin from './Admin';
import ManageOrganizersPage from './Manage_organizer'; // Correctly import the component for managing organizers


const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Dashboard</CardTitle>
                <CardDescription>Manage your events</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {[
                    { id: "overview", name: "Overview", icon: BarChart },
                    { id: "tickets", name: "Tickets", icon: Ticket },
                    { id: "scanner", name: "QR Scanner", icon: QrCode },
                    { id: "organizers", name: "Organizers", icon: Users }, // Tab for managing organizers
                    { id: "profile", name: "Profile", icon: Settings },
                    { id: "admin", name: "Admin", icon: Settings },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm ${
                        activeTab === item.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "overview" && <Overview />}
            {activeTab === "tickets" && <Tickets />}
            {activeTab === "scanner" && <QRScanner />}
            {activeTab === "organizers" && <ManageOrganizersPage />} {/* Render ManageOrganizersPage here */}
            {activeTab === "profile" && <UserProfile />}
            {activeTab === "admin" && <Admin />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;