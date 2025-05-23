import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, DollarSign, Ticket, Users, BarChart } from 'lucide-react';

const Overview = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome, John</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Events", value: "12", icon: BarChart, color: "bg-blue-100 dark:bg-blue-900" },
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
  );
};

export default Overview; 