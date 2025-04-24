import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Mail, Lock, User, Phone, AlertCircle, Download, Building, Link, FileText, Trash2, LogOut } from "lucide-react"; // Added LogOut icon
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

interface AdminProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define types for your data based on expected API responses
interface Report {
  id: number;
  event_name: string;
  ticket_type: string;
  total_tickets_sold: number;
  total_revenue: number; // Assuming number type for currency
}

interface Event {
  id: number;
  name: string;
  date: string; // Or Date type if you parse it
  location: string;
}

interface UserData {
  id: number;
  full_name: string;
  email: string;
  role: string;
  phone_number?: string; // Added phone_number based on model.py
  is_organizer?: boolean; // Added is_organizer based on backend response
}

// Define type for Organizer data fetched from /auth/organizers
interface OrganizerData {
  id: number; // User ID
  full_name: string;
  email: string;
  role: string; // Should be "ORGANIZER"
  phone_number?: string;
  organizer_profile?: { // Nested organizer profile data
    id: number;
    user_id: number;
    company_name: string;
    company_description?: string;
    website?: string;
    social_media_links?: any; // Adjust type if you know the structure
    business_registration_number?: string;
    tax_id?: string;
    address?: string;
    company_logo?: string; // URL of the logo
    created_at: string;
    updated_at: string;
    events_count?: number; // Added based on backend response
  } | null;
}


const Admin: React.FC<AdminProps> = ({ isOpen, onClose }) => {
  // Updated currentView state to include new admin views from auth.py
  const [currentView, setCurrentView] = useState<'reports' | 'events' | 'nonAttendees' | 'registerAdmin' | 'registerOrganizer' | 'registerSecurity' | 'viewOrganizers' | 'viewAllUsers'>('reports');

  const [reports, setReports] = useState<Report[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [nonAttendees, setNonAttendees] = useState<UserData[]>([]);
  const [organizers, setOrganizers] = useState<OrganizerData[]>([]); // State for organizers
  const [allUsers, setAllUsers] = useState<UserData[]>([]); // State for all users

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State for registering Admin users
  const [adminRegistrationData, setAdminRegistrationData] = useState({
    email: '',
    phone_number: '',
    password: '',
    full_name: ''
  });

  // State for registering Organizer users (adjusted for file upload)
  const [organizerRegistrationData, setOrganizerRegistrationData] = useState({
    user_id: '', // User ID to register as organizer
    company_name: '',
    company_description: '',
    website: '',
    business_registration_number: '',
    tax_id: '',
    address: ''
  });
  const [organizerCompanyLogo, setOrganizerCompanyLogo] = useState<File | null>(null);


  // State for registering Security users
  const [securityRegistrationData, setSecurityRegistrationData] = useState({
    email: '',
    phone_number: '',
    password: '',
    full_name: ''
  });

  const { toast } = useToast();

  // Updated toggleForm to handle all available views
  const toggleForm = (view: 'reports' | 'events' | 'nonAttendees' | 'registerAdmin' | 'registerOrganizer' | 'registerSecurity' | 'viewOrganizers' | 'viewAllUsers') => {
    setCurrentView(view);
    setError('');
    setSuccessMessage('');
    // Fetch data relevant to the new view
    if (view === 'reports') fetchReports();
    else if (view === 'events') fetchEvents();
    else if (view === 'nonAttendees') fetchNonAttendees();
    else if (view === 'viewOrganizers') fetchOrganizers(); // Fetch organizers
    else if (view === 'viewAllUsers') fetchAllUsers(); // Fetch all users
  };

  useEffect(() => {
    if (isOpen) {
      // Fetch data for the initial view when the dialog opens
      if (currentView === 'reports') {
        fetchReports();
      } else if (currentView === 'events') {
        fetchEvents();
      } else if (currentView === 'nonAttendees') {
        fetchNonAttendees();
      } else if (currentView === 'viewOrganizers') {
        fetchOrganizers();
      } else if (currentView === 'viewAllUsers') {
        fetchAllUsers();
      }
    }
  }, [isOpen, currentView]); // Added currentView to dependency array

  const getAuthHeaders = (includeContentType = true) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = token
      ? { 'Authorization': `Bearer ${token}` }
      : {};

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  };

  const handleFetchError = async (response: Response) => {
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
  };

  // --- Existing Fetch Functions ---
  const fetchReports = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const data: Report[] = await response.json();
      setReports(data);
    } catch (err) {
      console.error('Fetch reports error:', err);
      setError('An unexpected error occurred while fetching reports.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while fetching reports.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/events`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const data: Event[] = await response.json();
      setEvents(data);
    } catch (err) {
      console.error('Fetch events error:', err);
      setError('An unexpected error occurred while fetching events.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while fetching events.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNonAttendees = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/non-attendees`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const data: UserData[] = await response.json();
      setNonAttendees(data);
    } catch (err) {
      console.error('Fetch non-attendee users error:', err);
      setError('An unexpected error occurred while fetching non-attendee users.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while fetching non-attendee users.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReportPDF = async (eventId: number) => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/${eventId}/pdf`, {
        headers: getAuthHeaders(false), // Don't include Content-Type for file download
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `event_report_${eventId}.pdf`;
      if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch && filenameMatch.length > 1) {
              filename = filenameMatch[1];
          }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      setSuccessMessage('PDF report generated and downloaded successfully.');
      toast({
        title: "Success",
        description: "PDF report generated and downloaded successfully.",
        variant: "default",
      });
    } catch (err) {
      console.error('Generate PDF report error:', err);
      setError('An unexpected error occurred while generating PDF report.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while generating PDF report.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- New Fetch and Handle Functions from auth.py ---

  const handleRegisterAdmin = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/admin/register-admin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(adminRegistrationData)
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const result = await response.json();
      setSuccessMessage(result.msg || 'Admin registered successfully.');
      toast({
        title: "Success",
        description: result.msg || "Admin registered successfully.",
        variant: "default",
      });
      setAdminRegistrationData({ // Clear form
        email: '',
        phone_number: '',
        password: '',
        full_name: ''
      });
    } catch (err) {
      console.error('Register admin error:', err);
      setError('An unexpected error occurred while registering admin.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while registering admin.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterOrganizer = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      // Use FormData for file uploads
      const formData = new FormData();
      formData.append('user_id', organizerRegistrationData.user_id);
      formData.append('company_name', organizerRegistrationData.company_name);
      formData.append('company_description', organizerRegistrationData.company_description);
      formData.append('website', organizerRegistrationData.website);
      formData.append('business_registration_number', organizerRegistrationData.business_registration_number);
      formData.append('tax_id', organizerRegistrationData.tax_id);
      formData.append('address', organizerRegistrationData.address);
      if (organizerCompanyLogo) {
        formData.append('company_logo', organizerCompanyLogo);
      }

      // Note: When using FormData, the 'Content-Type' header should NOT be set manually.
      // The browser will set it automatically to 'multipart/form-data' and include the boundary.
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/admin/register-organizer`, {
        method: 'POST',
        headers: getAuthHeaders(false), // Pass false to NOT include 'Content-Type': 'application/json'
        body: formData
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const result = await response.json();
      setSuccessMessage(result.msg || 'Organizer registered successfully.');
      toast({
        title: "Success",
        description: result.msg || "Organizer registered successfully.",
        variant: "default",
      });
      setOrganizerRegistrationData({ // Clear form
        user_id: '',
        company_name: '',
        company_description: '',
        website: '',
        business_registration_number: '',
        tax_id: '',
        address: ''
      });
      setOrganizerCompanyLogo(null); // Clear file input
    } catch (err) {
      console.error('Register organizer error:', err);
      setError('An unexpected error occurred while registering organizer.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while registering organizer.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSecurity = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/admin/register-security`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(securityRegistrationData)
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const result = await response.json();
      setSuccessMessage(result.msg || 'Security user registered successfully.');
      toast({
        title: "Success",
        description: result.msg || "Security user registered successfully.",
        variant: "default",
      });
      setSecurityRegistrationData({ // Clear form
        email: '',
        phone_number: '',
        password: '',
        full_name: ''
      });
    } catch (err) {
      console.error('Register security error:', err);
      setError('An unexpected error occurred while registering security user.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while registering security user.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganizers = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/organizers`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const data: OrganizerData[] = await response.json();
      setOrganizers(data);
    } catch (err) {
      console.error('Fetch organizers error:', err);
      setError('An unexpected error occurred while fetching organizers.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while fetching organizers.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrganizer = async (organizerId: number) => {
    if (!window.confirm(`Are you sure you want to delete organizer with User ID ${organizerId}? This will delete the user and their organizer profile.`)) {
      return; // User cancelled
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/organizers/${organizerId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const result = await response.json();
      setSuccessMessage(result.msg || `Organizer with User ID ${organizerId} deleted successfully.`);
      toast({
        title: "Success",
        description: result.msg || `Organizer with User ID ${organizerId} deleted successfully.`,
        variant: "default",
      });
      fetchOrganizers(); // Refresh the list
    } catch (err) {
      console.error('Delete organizer error:', err);
      setError('An unexpected error occurred while deleting organizer.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while deleting organizer.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/users`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      const data: UserData[] = await response.json();
      setAllUsers(data); // Set to allUsers state
    } catch (err) {
      console.error('Fetch all users error:', err);
      setError('An unexpected error occurred while fetching all users.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while fetching all users.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handle Input Changes ---

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setAdminRegistrationData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleOrganizerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setOrganizerRegistrationData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleOrganizerLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOrganizerCompanyLogo(e.target.files[0]);
    } else {
      setOrganizerCompanyLogo(null);
    }
  };


  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSecurityRegistrationData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // --- Logout Function ---
  const handleLogout = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      // Call the /auth/logout endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await handleFetchError(response);
        return;
      }

      // Assuming successful logout clears the token client-side
      localStorage.removeItem('token'); // Remove token from local storage
      // You might also want to clear other user-related state in your app if any
      setSuccessMessage('Logout successful.');
      toast({
        title: "Success",
        description: "Logout successful.",
        variant: "default",
      });
      onClose(); // Close the admin dialog
      // Optional: Redirect the user to the login page or home page
      // window.location.href = '/login'; // Example redirect
    } catch (err) {
      console.error('Logout error:', err);
      setError('An unexpected error occurred while logging out.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while logging out.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 bg-transparent border-none shadow-none">
        <div className="relative w-full min-h-[580px]">
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-md">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}

          {/* Reports View */}
          {currentView === 'reports' && (
            <Card className="w-full p-6 glass-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-gradient">Reports</CardTitle>
                <CardDescription>View reports and download PDFs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="default" className="bg-green-100 border-green-400 text-green-800">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2 max-h-96 overflow-y-auto"> {/* Added max height and overflow */}
                  {reports.length === 0 && !isLoading && <p className="text-center text-muted-foreground">No reports found.</p>}
                  {reports.map(report => (
                    <div key={report.id} className="border p-4 rounded shadow">
                      <p><strong>Event:</strong> {report.event_name}</p> {/* Added bold */}
                      <p><strong>Ticket Type:</strong> {report.ticket_type}</p> {/* Added bold */}
                      <p><strong>Total Sold:</strong> {report.total_tickets_sold}</p> {/* Added bold */}
                      <p><strong>Total Revenue:</strong> ${report.total_revenue ? report.total_revenue.toFixed(2) : 'N/A'}</p> {/* Added bold */}
                      <Button onClick={() => handleGenerateReportPDF(report.id)} className="mt-2 bg-blue-500 hover:bg-blue-700 text-white">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => toggleForm('events')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  View Events
                </button>
                <button
                  onClick={() => toggleForm('nonAttendees')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  View Non-Attendee Users
                </button>
                 <button
                  onClick={() => toggleForm('registerAdmin')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  Register Admin
                </button>
                <button
                  onClick={() => toggleForm('registerOrganizer')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  Register Organizer
                </button>
                 <button
                  onClick={() => toggleForm('registerSecurity')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  Register Security
                </button>
                 <button
                  onClick={() => toggleForm('viewOrganizers')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  View Organizers
                </button>
                 <button
                  onClick={() => toggleForm('viewAllUsers')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  View All Users
                </button>
                 {/* Logout Button */}
                 <Button
                    onClick={handleLogout}
                    className="mt-2 bg-red-500 hover:bg-red-700 text-white"
                    disabled={isLoading}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
              </CardFooter>
            </Card>
          )}

          {/* Events View */}
          {currentView === 'events' && (
            <Card className="w-full p-6 glass-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-gradient">All Events</CardTitle>
                <CardDescription>List of all events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="default" className="bg-green-100 border-green-400 text-green-800">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2 max-h-96 overflow-y-auto"> {/* Added max height and overflow */}
                  {events.length === 0 && !isLoading && <p className="text-center text-muted-foreground">No events found.</p>}
                  {events.map(event => (
                    <div key={event.id} className="border p-4 rounded shadow">
                      <p><strong>Event:</strong> {event.name}</p> {/* Added bold */}
                      <p><strong>Date:</strong> {event.date}</p> {/* Added bold */}
                      <p><strong>Location:</strong> {event.location}</p> {/* Added bold */}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex flex-wrap justify-center gap-2">
                 <button
                  onClick={() => toggleForm('reports')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  Reports
                </button>
                <button
                  onClick={() => toggleForm('nonAttendees')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  View Non-Attendee Users
                </button>
                 <button
                  onClick={() => toggleForm('registerAdmin')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  Register Admin
                </button>
                <button
                  onClick={() => toggleForm('registerOrganizer')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  Register Organizer
                </button>
                 <button
                  onClick={() => toggleForm('registerSecurity')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  Register Security
                </button>
                 <button
                  onClick={() => toggleForm('viewOrganizers')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  View Organizers
                </button>
                 <button
                  onClick={() => toggleForm('viewAllUsers')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  View All Users
                </button>
                  {/* Logout Button */}
                 <Button
                    onClick={handleLogout}
                    className="mt-2 bg-red-500 hover:bg-red-700 text-white"
                    disabled={isLoading}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
              </CardFooter>
            </Card>
          )}

          {/* Non-Attendees View */}
          {currentView === 'nonAttendees' && (
            <Card className="w-full p-6 glass-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-gradient">Non-Attendee Users</CardTitle>
                <CardDescription>List of users who are not attendees</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="default" className="bg-green-100 border-green-400 text-green-800">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2 max-h-96 overflow-y-auto"> {/* Added max height and overflow */}
                  {nonAttendees.length === 0 && !isLoading && <p className="text-center text-muted-foreground">No non-attendee users found.</p>}
                  {nonAttendees.map(user => (
                    <div key={user.id} className="border p-4 rounded shadow">
                      <p><strong>Name:</strong> {user.full_name}</p> {/* Added bold */}
                      <p><strong>Email:</strong> {user.email}</p> {/* Added bold */}
                      <p><strong>Role:</strong> {user.role}</p> {/* Added bold */}
                       {user.phone_number && <p><strong>Phone:</strong> {user.phone_number}</p>} {/* Added bold and conditional render */}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex flex-wrap justify-center gap-2">
                 <button
                  onClick={() => toggleForm('reports')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  Reports
                </button>
                <button
                  onClick={() => toggleForm('events')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  View Events
                </button>
                 <button
                  onClick={() => toggleForm('registerAdmin')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  Register Admin
                </button>
                <button
                  onClick={() => toggleForm('registerOrganizer')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  Register Organizer
                </button>
                 <button
                  onClick={() => toggleForm('registerSecurity')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  Register Security
                </button>
                 <button
                  onClick={() => toggleForm('viewOrganizers')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  View Organizers
                </button>
                 <button
                  onClick={() => toggleForm('viewAllUsers')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  View All Users
                </button>
                  {/* Logout Button */}
                 <Button
                    onClick={handleLogout}
                    className="mt-2 bg-red-500 hover:bg-red-700 text-white"
                    disabled={isLoading}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
              </CardFooter>
            </Card>
          )}

           {/* Register Admin View */}
           {currentView === 'registerAdmin' && (
            <Card className="w-full p-6 glass-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-gradient">Register New Admin</CardTitle>
                <CardDescription>Create a new administrator account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="default" className="bg-green-100 border-green-400 text-green-800">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="John Doe"
                    value={adminRegistrationData.full_name}
                    onChange={handleAdminChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={adminRegistrationData.email}
                    onChange={handleAdminChange}
                  />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="07xxxxxxxx"
                     value={adminRegistrationData.phone_number}
                    onChange={handleAdminChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={adminRegistrationData.password}
                    onChange={handleAdminChange}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" onClick={handleRegisterAdmin} disabled={isLoading}>
                  Register Admin
                </Button>
                 <div className="pt-2 flex flex-wrap justify-center gap-2">
                   <button
                    onClick={() => toggleForm('reports')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    Reports
                  </button>
                  <button
                    onClick={() => toggleForm('events')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View Events
                  </button>
                   <button
                    onClick={() => toggleForm('nonAttendees')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View Non-Attendee Users
                  </button>
                  <button
                    onClick={() => toggleForm('registerOrganizer')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    Register Organizer
                  </button>
                   <button
                    onClick={() => toggleForm('registerSecurity')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    Register Security
                  </button>
                   <button
                    onClick={() => toggleForm('viewOrganizers')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View Organizers
                  </button>
                   <button
                    onClick={() => toggleForm('viewAllUsers')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View All Users
                  </button>
                   {/* Logout Button */}
                   <Button
                      onClick={handleLogout}
                      className="mt-2 bg-red-500 hover:bg-red-700 text-white"
                      disabled={isLoading}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                </div>
              </CardFooter>
            </Card>
          )}

          {/* Register Organizer View */}
           {currentView === 'registerOrganizer' && (
            <Card className="w-full p-6 glass-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-gradient">Register Organizer</CardTitle>
                <CardDescription>Register an existing user as an organizer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="default" className="bg-green-100 border-green-400 text-green-800">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}
                 <div className="grid gap-2">
                  <Label htmlFor="user_id">User ID</Label>
                  <Input
                    id="user_id"
                    type="number" // Expecting a number for User ID
                    placeholder="Enter existing User ID"
                    value={organizerRegistrationData.user_id}
                    onChange={handleOrganizerChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    type="text"
                    placeholder="Acme Events Ltd."
                    value={organizerRegistrationData.company_name}
                    onChange={handleOrganizerChange}
                  />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="company_description">Company Description</Label>
                  <Input
                    id="company_description"
                    type="text"
                    placeholder="Brief description"
                    value={organizerRegistrationData.company_description}
                    onChange={handleOrganizerChange}
                  />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.example.com"
                    value={organizerRegistrationData.website}
                    onChange={handleOrganizerChange}
                  />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="business_registration_number">Business Registration Number</Label>
                  <Input
                    id="business_registration_number"
                    type="text"
                    placeholder="Reg. No."
                    value={organizerRegistrationData.business_registration_number}
                    onChange={handleOrganizerChange}
                  />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="tax_id">Tax ID</Label>
                  <Input
                    id="tax_id"
                    type="text"
                    placeholder="Tax ID"
                    value={organizerRegistrationData.tax_id}
                    onChange={handleOrganizerChange}
                  />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Company Address"
                    value={organizerRegistrationData.address}
                    onChange={handleOrganizerChange}
                  />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="company_logo">Company Logo</Label>
                  <Input
                    id="company_logo"
                    type="file"
                    accept="image/*"
                    onChange={handleOrganizerLogoChange}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" onClick={handleRegisterOrganizer} disabled={isLoading}>
                  Register Organizer
                </Button>
                 <div className="pt-2 flex flex-wrap justify-center gap-2">
                   <button
                    onClick={() => toggleForm('reports')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    Reports
                  </button>
                  <button
                    onClick={() => toggleForm('events')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View Events
                  </button>
                   <button
                    onClick={() => toggleForm('nonAttendees')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View Non-Attendee Users
                  </button>
                  <button
                    onClick={() => toggleForm('registerAdmin')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    Register Admin
                  </button>
                   <button
                    onClick={() => toggleForm('registerSecurity')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    Register Security
                  </button>
                   <button
                    onClick={() => toggleForm('viewOrganizers')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View Organizers
                  </button>
                   <button
                    onClick={() => toggleForm('viewAllUsers')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View All Users
                  </button>
                   {/* Logout Button */}
                   <Button
                      onClick={handleLogout}
                      className="mt-2 bg-red-500 hover:bg-red-700 text-white"
                      disabled={isLoading}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                </div>
              </CardFooter>
            </Card>
          )}

           {/* Register Security View */}
           {currentView === 'registerSecurity' && (
            <Card className="w-full p-6 glass-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-gradient">Register New Security</CardTitle>
                <CardDescription>Create a new security user account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="default" className="bg-green-100 border-green-400 text-green-800">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Jane Doe"
                    value={securityRegistrationData.full_name}
                    onChange={handleSecurityChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@example.com"
                    value={securityRegistrationData.email}
                    onChange={handleSecurityChange}
                  />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="07xxxxxxxx"
                     value={securityRegistrationData.phone_number}
                    onChange={handleSecurityChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={securityRegistrationData.password}
                    onChange={handleSecurityChange}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" onClick={handleRegisterSecurity} disabled={isLoading}>
                  Register Security User
                </Button>
                 <div className="pt-2 flex flex-wrap justify-center gap-2">
                   <button
                    onClick={() => toggleForm('reports')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    Reports
                  </button>
                  <button
                    onClick={() => toggleForm('events')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View Events
                  </button>
                   <button
                    onClick={() => toggleForm('nonAttendees')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View Non-Attendee Users
                  </button>
                  <button
                    onClick={() => toggleForm('registerAdmin')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    Register Admin
                  </button>
                   <button
                    onClick={() => toggleForm('registerOrganizer')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    Register Organizer
                  </button>
                   <button
                    onClick={() => toggleForm('viewOrganizers')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View Organizers
                  </button>
                   <button
                    onClick={() => toggleForm('viewAllUsers')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View All Users
                  </button>
                   {/* Logout Button */}
                   <Button
                      onClick={handleLogout}
                      className="mt-2 bg-red-500 hover:bg-red-700 text-white"
                      disabled={isLoading}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                </div>
              </CardFooter>
            </Card>
          )}

          {/* View Organizers View */}
           {currentView === 'viewOrganizers' && (
            <Card className="w-full p-6 glass-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-gradient">All Organizers</CardTitle>
                <CardDescription>List of all registered organizers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="default" className="bg-green-100 border-green-400 text-green-800">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2 max-h-96 overflow-y-auto"> {/* Added max height and overflow */}
                  {organizers.length === 0 && !isLoading && <p className="text-center text-muted-foreground">No organizers found.</p>}
                  {organizers.map(organizer => (
                    <div key={organizer.id} className="border p-4 rounded shadow">
                      <p><strong>User ID:</strong> {organizer.id}</p> {/* Display User ID */}
                      <p><strong>Name:</strong> {organizer.full_name}</p>
                      <p><strong>Email:</strong> {organizer.email}</p>
                       {organizer.phone_number && <p><strong>Phone:</strong> {organizer.phone_number}</p>}
                      {organizer.organizer_profile && (
                        <>
                          <p><strong>Company:</strong> {organizer.organizer_profile.company_name}</p>
                           {organizer.organizer_profile.events_count !== undefined && <p><strong>Events Count:</strong> {organizer.organizer_profile.events_count}</p>}
                          {organizer.organizer_profile.website && <p><strong>Website:</strong> <a href={organizer.organizer_profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{organizer.organizer_profile.website}</a></p>}
                           {organizer.organizer_profile.company_logo && <p><strong>Logo:</strong> <img src={organizer.organizer_profile.company_logo} alt={`${organizer.organizer_profile.company_name} Logo`} className="w-16 h-16 object-cover rounded mt-2"/></p>}
                        </>
                      )}
                       <Button onClick={() => handleDeleteOrganizer(organizer.id)} className="mt-2 bg-red-500 hover:bg-red-700 text-white">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Organizer
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex flex-wrap justify-center gap-2">
                 <button
                  onClick={() => toggleForm('reports')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  Reports
                </button>
                <button
                  onClick={() => toggleForm('events')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  View Events
                </button>
                   <button
                    onClick={() => toggleForm('nonAttendees')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View Non-Attendee Users
                  </button>
                  <button
                    onClick={() => toggleForm('registerAdmin')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    Register Admin
                  </button>
                   <button
                    onClick={() => toggleForm('registerSecurity')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    Register Security
                  </button>
                   <button
                    onClick={() => toggleForm('registerOrganizer')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    Register Organizer
                  </button>
                   <button
                    onClick={() => toggleForm('viewAllUsers')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View All Users
                  </button>
                   {/* Logout Button */}
                   <Button
                      onClick={handleLogout}
                      className="mt-2 bg-red-500 hover:bg-red-700 text-white"
                      disabled={isLoading}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
              </CardFooter>
            </Card>
          )}

           {/* View All Users View */}
           {currentView === 'viewAllUsers' && (
            <Card className="w-full p-6 glass-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-gradient">All Users</CardTitle>
                <CardDescription>List of all users in the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="default" className="bg-green-100 border-green-400 text-green-800">
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2 max-h-96 overflow-y-auto"> {/* Added max height and overflow */}
                  {allUsers.length === 0 && !isLoading && <p className="text-center text-muted-foreground">No users found.</p>}
                  {allUsers.map(user => (
                    <div key={user.id} className="border p-4 rounded shadow">
                      <p><strong>ID:</strong> {user.id}</p> {/* Added bold */}
                      <p><strong>Name:</strong> {user.full_name}</p> {/* Added bold */}
                      <p><strong>Email:</strong> {user.email}</p> {/* Added bold */}
                      <p><strong>Role:</strong> {user.role}</p> {/* Added bold */}
                       {user.phone_number && <p><strong>Phone:</strong> {user.phone_number}</p>} {/* Added bold and conditional render */}
                       {/* Removed Delete User button - can be added back if the endpoint is re-registered */}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex flex-wrap justify-center gap-2">
                 <button
                  onClick={() => toggleForm('reports')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  Reports
                </button>
                <button
                  onClick={() => toggleForm('events')}
                  className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                  type="button"
                >
                  View Events
                </button>
                   <button
                    onClick={() => toggleForm('nonAttendees')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View Non-Attendee Users
                  </button>
                  <button
                    onClick={() => toggleForm('registerAdmin')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    Register Admin
                  </button>
                   <button
                    onClick={() => toggleForm('registerSecurity')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    Register Security
                  </button>
                   <button
                    onClick={() => toggleForm('viewOrganizers')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    View Organizers
                  </button>
                   <button
                    onClick={() => toggleForm('registerOrganizer')}
                    className="text-sm text-muted-foreground hover:underline font-medium text-pulse-purple hover:text-pulse-deep-purple"
                    type="button"
                  >
                    Register Organizer
                  </button>
                   {/* Logout Button */}
                   <Button
                      onClick={handleLogout}
                      className="mt-2 bg-red-500 hover:bg-red-700 text-white"
                      disabled={isLoading}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
              </CardFooter>
            </Card>
          )}

          {/* Removed views for deleteEvent, deleteUser, deleteReport, logout */}

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Admin;
