import React from 'react';
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
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl dark:bg-gray-800 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stat.value}</p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              {typeof stat.icon === 'function' ? (
                <stat.icon />
              ) : (
                <stat.icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCard;