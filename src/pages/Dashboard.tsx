
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, DollarSign, Ticket, Users, BarChart, Calendar, Settings } from 'lucide-react';

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
                    { id: "myEvents", name: "My Events", icon: Calendar },
                    { id: "tickets", name: "Tickets", icon: Ticket },
                    { id: "settings", name: "Settings", icon: Settings },
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
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Welcome, John</h1>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: "Total Events", value: "12", icon: Calendar, color: "bg-blue-100 dark:bg-blue-900" },
                    { title: "Ticket Sales", value: "487", icon: Ticket, color: "bg-green-100 dark:bg-green-900" },
                    { title: "Revenue", value: "$4,327", icon: DollarSign, color: "bg-purple-100 dark:bg-purple-900" },
                    { title: "Attendees", value: "1,208", icon: Users, color: "bg-amber-100 dark:bg-amber-900" },
                  ].map((stat, index) => (
                    <Card key={index}>
                      <CardContent className="p-6 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.title}</p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                        </div>
                        <div className={`p-2 rounded-full ${stat.color}`}>
                          <stat.icon className="h-5 w-5" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming Events</CardTitle>
                      <CardDescription>Your next scheduled events</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { name: "Summer Music Festival", date: "Jun 15, 2025", tickets: "300/500 sold" },
                          { name: "Tech Conference", date: "Jul 05, 2025", tickets: "120/200 sold" },
                          { name: "Art Exhibition", date: "Jul 22, 2025", tickets: "75/150 sold" },
                        ].map((event, index) => (
                          <div key={index} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                            <div>
                              <p className="font-medium">{event.name}</p>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <CalendarDays className="h-3 w-3 mr-1" />
                                {event.date}
                              </div>
                            </div>
                            <div className="text-sm">{event.tickets}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest actions and updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { action: "New ticket sold", event: "Summer Music Festival", time: "2 hours ago" },
                          { action: "Event updated", event: "Tech Conference", time: "Yesterday" },
                          { action: "Promotion created", event: "Art Exhibition", time: "3 days ago" },
                          { action: "5 tickets sold", event: "DJ Night", time: "1 week ago" },
                        ].map((activity, index) => (
                          <div key={index} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                            <div>
                              <p className="font-medium">{activity.action}</p>
                              <p className="text-sm text-muted-foreground">{activity.event}</p>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {activity.time}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            {/* My Events Tab */}
            {activeTab === "myEvents" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">My Events</h1>
                  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
                    Create Event
                  </button>
                </div>
                
                <Tabs defaultValue="upcoming">
                  <TabsList>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="past">Past</TabsTrigger>
                    <TabsTrigger value="draft">Drafts</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upcoming" className="space-y-4 mt-4">
                    {[1, 2, 3].map((index) => (
                      <Card key={index}>
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-40 h-24 md:h-auto bg-muted"></div>
                            <div className="p-4 flex-1">
                              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                                <div>
                                  <h3 className="font-semibold">Event Name {index}</h3>
                                  <p className="text-sm text-muted-foreground">Jun {10 + index}, 2025 • 8:00 PM</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm px-2 py-1 bg-muted rounded-full">
                                    {120 + index * 50}/500 sold
                                  </span>
                                  <button className="text-sm text-primary">
                                    Manage
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="past" className="space-y-4 mt-4">
                    <p className="text-muted-foreground">Your past events will appear here.</p>
                  </TabsContent>
                  
                  <TabsContent value="draft" className="space-y-4 mt-4">
                    <p className="text-muted-foreground">Your draft events will appear here.</p>
                  </TabsContent>
                </Tabs>
              </div>
            )}
            
            {/* Tickets Tab */}
            {activeTab === "tickets" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Tickets</h1>
                <p className="text-muted-foreground">Manage your event tickets and check-ins</p>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Ticket Sales Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center bg-muted rounded-md">
                      <p className="text-muted-foreground">Ticket sales chart will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account and preferences</p>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                          <input
                            id="firstName"
                            defaultValue="John"
                            className="w-full p-2 rounded-md border bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                          <input
                            id="lastName"
                            defaultValue="Doe"
                            className="w-full p-2 rounded-md border bg-background"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                        <input
                          id="email"
                          type="email"
                          defaultValue="john.doe@example.com"
                          className="w-full p-2 rounded-md border bg-background"
                        />
                      </div>
                      
                      <button type="button" className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
                        Save Changes
                      </button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
