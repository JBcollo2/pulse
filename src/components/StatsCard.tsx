import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Ticket, DollarSign, Users } from 'lucide-react';

interface Stat {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

interface StatsCardProps {
  stats: Stat[];
}

const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="transition-transform duration-300 hover:scale-105 hover:shadow-lg"
        >
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold mt-2">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-full ${stat.color} transition-colors duration-300`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCard;
