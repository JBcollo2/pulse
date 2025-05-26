import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, DollarSign, CheckCircle, LayoutDashboard, BarChart2, FileText, LogOut, Menu, X, Sun, Moon, ChevronRight, Settings, Bell, User, Sparkles, Activity, Search, TrendingUp, Users, Eye, ArrowRight, Zap, Star } from 'lucide-react';

// Mock components for demo - replace with your actual components
const OrganizerNavigation = ({ currentView, onViewChange, onLogout, isLoading }) => null;
const OrganizerReports = ({ eventId }) => null;
const OrganizerStats = ({ overallSummary, isLoading, error }) => null;

// Mock toast hook for demo
const useToast = () => ({
  toast: ({ title, description, variant }) => console.log(`${variant}: ${title} - ${description}`)
});

// --- Interface Definitions ---
interface Event {
    id: number;
    name: string;
    date: string;
    location: string;
    description?: string;
}

interface OverallSummary {
    organizer_name: string;
    total_tickets_sold_across_all_events: number;
    total_revenue_across_all_events: string;
    events_summary: {
        event_id: number;
        event_name: string;
        date: string;
        location: string;
        tickets_sold: number;
        revenue: number;
    }[];
    total_events?: number;
    upcoming_events_count?: number;
    past_events_count?: number;
    tickets_sold_monthly_trend?: { month: string; tickets: number }[];
    revenue_monthly_trend?: { month: string; revenue: number }[];
}

type ViewType = 'overview' | 'myEvents' | 'overallStats' | 'reports' | 'settings' | 'viewReport';

const OrganizerDashboard: React.FC = () => {
    // --- State Management ---
    const [currentView, setCurrentView] = useState<ViewType>('overview');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [successMessage, setSuccessMessage] = useState<string | undefined>();
    const [organizerEvents, setOrganizerEvents] = useState<Event[]>([
        { id: 1, name: 'Summer Music Festival', date: '2025-07-15', location: 'Central Park', description: 'Annual summer music festival' },
        { id: 2, name: 'Tech Conference 2025', date: '2025-06-10', location: 'Convention Center', description: 'Latest in technology trends' },
        { id: 3, name: 'Art Exhibition', date: '2025-04-20', location: 'Downtown Gallery', description: 'Contemporary art showcase' }
    ]);
    const [overallSummary, setOverallSummary] = useState<OverallSummary | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(true);

    const { toast } = useToast();

    // Navigation items with enhanced styling data
    const navigationItems = [
        {
            id: 'overview',
            label: 'Dashboard',
            icon: LayoutDashboard,
            description: 'Overview & quick stats',
            gradient: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-500/20',
            hoverColor: 'hover:bg-blue-500/30'
        },
        {
            id: 'myEvents',
            label: 'My Events',
            icon: CalendarDays,
            description: 'Manage your events',
            gradient: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-500/20',
            hoverColor: 'hover:bg-purple-500/30'
        },
        {
            id: 'overallStats',
            label: 'Analytics',
            icon: BarChart2,
            description: 'Performance metrics',
            gradient: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-500/20',
            hoverColor: 'hover:bg-green-500/30'
        },
        {
            id: 'reports',
            label: 'Reports',
            icon: FileText,
            description: 'Detailed insights',
            gradient: 'from-orange-500 to-red-500',
            bgColor: 'bg-orange-500/20',
            hoverColor: 'hover:bg-orange-500/30'
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            description: 'Account preferences',
            gradient: 'from-gray-500 to-slate-500',
            bgColor: 'bg-gray-500/20',
            hoverColor: 'hover:bg-gray-500/30'
        }
    ];

    // --- Helper Functions ---
    const handleFetchError = useCallback(async (response: Response) => {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (jsonError) {
            console.error('Failed to parse error response:', jsonError);
        }
        setError(errorMessage);
        toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
        });
    }, [toast]);

    // --- API Call Functions (Mock implementations for demo) ---
    const fetchOrganizerEvents = useCallback(async () => {
        setIsLoading(true);
        setError(undefined);
        // Mock API call
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    }, []);

    const fetchOverallSummary = useCallback(async () => {
        setIsLoading(true);
        setError(undefined);
        // Mock API call
        setTimeout(() => {
            setOverallSummary({
                organizer_name: 'John Doe',
                total_tickets_sold_across_all_events: 1250,
                total_revenue_across_all_events: '$45,000',
                events_summary: []
            });
            setIsLoading(false);
        }, 1000);
    }, []);

    const handleLogout = useCallback(async () => {
        setIsLoading(true);
        toast({
            title: "Success",
            description: "Logout successful.",
            variant: "default",
        });
        setTimeout(() => {
            setIsLoading(false);
            // window.location.href = '/';
        }, 1000);
    }, [toast]);

    // --- View Navigation Handlers ---
    const handleViewChange = useCallback((view: string) => {
        if (['overview', 'myEvents', 'overallStats', 'reports', 'settings', 'viewReport'].includes(view)) {
            setCurrentView(view as ViewType);
            setError(undefined);
            setSuccessMessage(undefined);
        }
    }, []);

    const handleViewReport = useCallback((eventId: number) => {
        setSelectedEventId(eventId);
        setCurrentView('viewReport');
    }, []);

    // Filter navigation items based on search
    const filteredNavItems = navigationItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- Component: Enhanced Sidebar ---
    const EnhancedSidebar = () => (
        <div className={`${sidebarCollapsed ? 'w-20' : 'w-80'} transition-all duration-300 ease-in-out flex-shrink-0`}>
            <div className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        {!sidebarCollapsed && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">EventPro</h2>
                                    <p className="text-xs text-gray-400">Organizer Dashboard</p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110"
                        >
                            {sidebarCollapsed ? <ChevronRight className="w-5 h-5 text-white" /> : <X className="w-5 h-5 text-white" />}
                        </button>
                    </div>

                    {/* Search */}
                    {!sidebarCollapsed && (
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search menu..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                            />
                        </div>
                    )}

                    {/* Quick Stats Widget */}
                    {!sidebarCollapsed && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                                <Activity className="w-5 h-5 text-blue-400" />
                                <span className="text-sm font-medium text-white">Quick Stats</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <div className="text-gray-400">Events</div>
                                    <div className="text-white font-bold">{organizerEvents.length}</div>
                                </div>
                                <div>
                                    <div className="text-gray-400">Revenue</div>
                                    <div className="text-white font-bold">$45K</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Items */}
                    <nav className="space-y-2">
                        {filteredNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentView === item.id;

                            return (
                                <div key={item.id} className="relative group">
                                    <button
                                        onClick={() => handleViewChange(item.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                                            isActive
                                                ? `bg-gradient-to-r ${item.gradient} shadow-lg shadow-blue-500/25 scale-105`
                                                : `${item.bgColor} ${item.hoverColor} hover:scale-105 hover:shadow-lg`
                                        }`}
                                    >
                                        {/* Animated background for active state */}
                                        {isActive && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50" />
                                        )}

                                        <div className="relative z-10 flex items-center gap-3 w-full">
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-300'} transition-all duration-200`} />
                                            {!sidebarCollapsed && (
                                                <div className="flex-1 text-left">
                                                    <div className={`font-medium ${isActive ? 'text-white' : 'text-gray-200'}`}>
                                                        {item.label}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {item.description}
                                                    </div>
                                                </div>
                                            )}
                                            {!sidebarCollapsed && (
                                                <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'} transition-transform duration-200 ${isActive ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                                            )}
                                        </div>
                                    </button>

                                    {/* Tooltip for collapsed state */}
                                    {sidebarCollapsed && (
                                        <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                            {item.label}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* User Profile Section */}
                    {!sidebarCollapsed && (
                        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-white">John Doe</div>
                                    <div className="text-xs text-gray-400">Event Organizer</div>
                                </div>
                                <button className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200">
                                    <Bell className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className={`w-full mt-4 flex items-center gap-3 p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-all duration-300 hover:scale-105 ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut className="w-5 h-5 text-red-400" />
                        {!sidebarCollapsed && <span className="text-red-400 font-medium">Logout</span>}
                    </button>
                </div>
            </div>
        </div>
    );

    // --- Component: Enhanced Card ---
    const EnhancedCard = ({ children, className = "", gradient = "", hover = true, ...props }) => (
        <div
            className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden relative group transition-all duration-300 ${hover ? 'hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10' : ''} ${className}`}
            {...props}
        >
            {gradient && (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
            )}
            <div className="relative z-10">{children}</div>
        </div>
    );

    // --- Component: Stat Card ---
    const StatCard = ({ title, value, icon: Icon, gradient, change, description }) => (
        <EnhancedCard gradient={gradient} className="p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-gray-400 text-sm font-medium">{title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{value}</p>
                    {change && (
                        <div className="flex items-center gap-1 mt-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">{change}</span>
                        </div>
                    )}
                    {description && (
                        <p className="text-gray-500 text-xs mt-1">{description}</p>
                    )}
                </div>
                <div className={`p-3 bg-gradient-to-br ${gradient} rounded-xl`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </EnhancedCard>
    );

    // --- useEffect for Data Fetching ---
    useEffect(() => {
        if (currentView === 'myEvents') {
            fetchOrganizerEvents();
        } else if (currentView === 'overallStats') {
            fetchOverallSummary();
        }
    }, [currentView, fetchOrganizerEvents, fetchOverallSummary]);

    // --- Main Render ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
                <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
            </div>

            <div className="relative z-10 container mx-auto py-6">
                {/* Loading Overlay */}
                {isLoading && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 flex items-center gap-4">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-white font-medium">Loading...</span>
                        </div>
                    </div>
                )}

                <div className="flex gap-6">
                    <EnhancedSidebar />

                    <div className="flex-1 space-y-6">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>Dashboard</span>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-white capitalize">{currentView}</span>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 backdrop-blur-xl">
                                {error}
                            </div>
                        )}
                        {successMessage && (
                            <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 backdrop-blur-xl">
                                {successMessage}
                            </div>
                        )}

                        {/* --- Overview Section --- */}
                        {currentView === 'overview' && (
                            <div className="space-y-8">
                                <div className="text-center">
                                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                                        Welcome Back
                                    </h1>
                                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                                        Manage your events with style. Track performance, analyze trends, and grow your business.
                                    </p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    <StatCard
                                        title="Total Events"
                                        value={organizerEvents.length}
                                        icon={CalendarDays}
                                        gradient="from-blue-500 to-cyan-500"
                                        change="+12%"
                                        description="vs last month"
                                    />
                                    <StatCard
                                        title="Upcoming Events"
                                        value={organizerEvents.filter(e => new Date(e.date) > new Date()).length}
                                        icon={Zap}
                                        gradient="from-green-500 to-emerald-500"
                                        change="+5%"
                                        description="this month"
                                    />
                                    <StatCard
                                        title="Total Revenue"
                                        value="$45,000"
                                        icon={DollarSign}
                                        gradient="from-purple-500 to-pink-500"
                                        change="+18%"
                                        description="vs last month"
                                    />
                                </div>

                                {/* Quick Actions */}
                                <EnhancedCard className="p-8">
                                    <h3 className="text-2xl font-bold text-white mb-6">Quick Actions</h3>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        {[
                                            { label: 'View My Events', view: 'myEvents', icon: CalendarDays, gradient: 'from-blue-500 to-purple-500' },
                                            { label: 'Analytics Dashboard', view: 'overallStats', icon: BarChart2, gradient: 'from-green-500 to-blue-500' },
                                            { label: 'Generate Reports', view: 'reports', icon: FileText, gradient: 'from-orange-500 to-red-500' }
                                        ].map((action, index) => {
                                            const Icon = action.icon;
                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => handleViewChange(action.view)}
                                                    className={`p-6 bg-gradient-to-r ${action.gradient} rounded-xl hover:scale-105 transition-all duration-300 group`}
                                                >
                                                    <Icon className="w-8 h-8 text-white mb-3" />
                                                    <div className="text-white font-medium">{action.label}</div>
                                                    <ArrowRight className="w-5 h-5 text-white/70 mt-2 group-hover:translate-x-1 transition-transform duration-200" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </EnhancedCard>
                            </div>
                        )}

                        {/* --- My Events Section --- */}
                        {currentView === 'myEvents' && (
                            <div className="space-y-8">
                                <div>
                                    <h1 className="text-4xl font-bold text-white mb-2">My Events</h1>
                                    <p className="text-xl text-gray-300">
                                        Manage and track all your events in one place
                                    </p>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {organizerEvents.map((event, index) => (
                                        <EnhancedCard key={event.id} className="overflow-hidden">
                                            <div className="relative">
                                                {/* Event image placeholder with gradient */}
                                                <div className={`h-48 bg-gradient-to-br ${['from-blue-500 to-purple-500', 'from-green-500 to-blue-500', 'from-orange-500 to-red-500'][index % 3]} relative`}>
                                                    <div className="absolute inset-0 bg-black/20" />
                                                    <div className="absolute top-4 right-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                            new Date(event.date) > new Date()
                                                                ? 'bg-green-500/80 text-white'
                                                                : 'bg-gray-500/80 text-white'
                                                        }`}>
                                                            {new Date(event.date) > new Date() ? 'Upcoming' : 'Completed'}
                                                        </span>
                                                    </div>
                                                    <div className="absolute bottom-4 left-4">
                                                        <CalendarDays className="w-6 h-6 text-white/80" />
                                                    </div>
                                                </div>

                                                <div className="p-6">
                                                    <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
                                                    <p className="text-gray-400 text-sm mb-4">
                                                        {new Date(event.date).toLocaleDateString()} • {event.location}
                                                    </p>
                                                    {event.description && (
                                                        <p className="text-gray-300 text-sm mb-4">{event.description}</p>
                                                    )}

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleViewReport(event.id)}
                                                            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View Report
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </EnhancedCard>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- Overall Stats Section --- */}
                        {currentView === 'overallStats' && (
                            <div className="space-y-8">
                                <div>
                                    <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
                                    <p className="text-xl text-gray-300">
                                        Deep insights into your event performance
                                    </p>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    <StatCard
                                        title="Total Tickets Sold"
                                        value="1,250"
                                        icon={Users}
                                        gradient="from-blue-500 to-cyan-500"
                                        change="+25%"
                                        description="vs last month"
                                    />
                                    <StatCard
                                        title="Revenue Generated"
                                        value="$45,000"
                                        icon={DollarSign}
                                        gradient="from-green-500 to-emerald-500"
                                        change="+18%"
                                        description="vs last month"
                                    />
                                    <StatCard
                                        title="Average Attendance"
                                        value="85%"
                                        icon={TrendingUp}
                                        gradient="from-purple-500 to-pink-500"
                                        change="+5%"
                                        description="this month"
                                    />
                                    <StatCard
                                        title="Customer Rating"
                                        value="4.8"
                                        icon={Star}
                                        gradient="from-orange-500 to-red-500"
                                        change="+0.3"
                                        description="average rating"
                                    />
                                </div>

                                <EnhancedCard className="p-8" gradient="from-blue-500/10 to-purple-500/10">
                                    <h3 className="text-2xl font-bold text-white mb-4">Performance Overview</h3>
                                    <div className="text-gray-300">
                                        <p>Your events are performing exceptionally well! Here's a summary of your key metrics:</p>
                                        <ul className="mt-4 space-y-2">
                                            <li>• Ticket sales have increased by 25% compared to last month</li>
                                            <li>• Revenue growth of 18% shows strong monetization</li>
                                            <li>• High attendance rate of 85% indicates strong event appeal</li>
                                            <li>• Customer satisfaction rating of 4.8/5 reflects quality delivery</li>
                                        </ul>
                                    </div>
                                </EnhancedCard>
                            </div>
                        )}

                        {/* --- Reports Section --- */}
                        {currentView === 'reports' && (
                            <div className="space-y-6">
                                <h1 className="text-3xl font-bold text-white">Event Reports</h1>
                                <p className="text-gray-300 text-lg">
                                    Access detailed reports for individual events. Select an event from "My Events" to generate its report.
                                </p>
                                <EnhancedCard className="p-8">
                                    <h3 className="text-2xl font-bold text-white mb-4">How to Access Reports</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                                            <div>
                                                <h4 className="font-medium text-white">Go to My Events</h4>
                                                <p className="text-sm text-gray-300">Navigate to the "My Events" section to see all your events.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                                            <div>
                                                <h4 className="font-medium text-white">Select an Event</h4>
                                                <p className="text-sm text-gray-300">Click "View Report" on any event card to see detailed analytics.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                                            <div>
                                                <h4 className="font-medium text-white">Analyze Performance</h4>
                                                <p className="text-sm text-gray-300">Review ticket sales, revenue, and other important metrics.</p>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-white border-opacity-20">
                                            <button
                                                onClick={() => handleViewChange('myEvents')}
                                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300 transform hover:scale-105"
                                            >
                                                Go to My Events
                                            </button>
                                        </div>
                                    </div>
                                </EnhancedCard>
                            </div>
                        )}

                        {/* --- View Individual Event Report Section --- */}
                        {currentView === 'viewReport' && selectedEventId !== null && (
                            <div className="space-y-6">
                                <button
                                    onClick={() => setCurrentView('myEvents')}
                                    className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-300 transform hover:scale-105"
                                >
                                    ← Back to My Events
                                </button>
                                <h1 className="text-3xl font-bold text-white">
                                    Event Report: {organizerEvents.find(e => e.id === selectedEventId)?.name || `Event ID: ${selectedEventId}`}
                                </h1>
                                <EnhancedCard className="p-8">
                                    <OrganizerReports eventId={selectedEventId} />
                                </EnhancedCard>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizerDashboard;
