import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  MapPin, 
  User, 
  CreditCard, 
  Share2, 
  Phone, 
  Clock, 
  Ticket, 
  AlertCircle, 
  X, 
  CheckCircle, 
  XCircle, 
  Shield,
  Copy,
  Facebook,
  Twitter,
  MessageCircle,
  Mail,
  Check
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import EventMap from '@/components/EventMap';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface TicketType {
  id: number;
  type_name: string;
  price: number;
  quantity?: number;
}

interface Event {
  id: number;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  image: string | null;
  category?: string;
  organizer: {
    id: number;
    company_name: string;
  };
  latitude?: number;
  longitude?: number;
}

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentReference = searchParams.get('reference');
  const location = useLocation();
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | 'cancelled' | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketType, setTicketType] = useState<string>('');
  const [ticketCount, setTicketCount] = useState(1);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [buyButtonDisabled, setBuyButtonDisabled] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Share functionality state
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [buyerDetails, setBuyerDetails] = useState({
    name: '',
    email: '',
    phone_number: ''
  });
  const { toast } = useToast();

  // Share functionality functions
  const getEventUrl = () => {
    return `${window.location.origin}/events/${id}`;
  };

  const getShareText = () => {
    if (!event) return '';
    return `Check out this amazing event: ${event.name} on ${formatDate(event.date)} at ${event.location}. Get your tickets now!`;
  };

  // Web Share API (native mobile sharing)
  const handleNativeShare = async () => {
    if (!event) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: getShareText(),
          url: getEventUrl(),
        });
      } catch (err) {
        console.log('Error sharing:', err);
        // Fallback to custom share modal
        setShowShareModal(true);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      setShowShareModal(true);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getEventUrl());
      setCopySuccess(true);
      toast({
        title: "Link Copied!",
        description: "Event link has been copied to clipboard",
        duration: 2000,
      });
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = getEventUrl();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      toast({
        title: "Link Copied!",
        description: "Event link has been copied to clipboard",
        duration: 2000,
      });
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Social media share functions
  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getEventUrl())}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(getShareText());
    const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(getEventUrl())}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`${getShareText()} ${getEventUrl()}`);
    const url = `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    if (!event) return;
    const subject = encodeURIComponent(`Check out: ${event.name}`);
    const body = encodeURIComponent(`${getShareText()}\n\nEvent Details: ${getEventUrl()}`);
    const url = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = url;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  useEffect(() => {
    const fetchEventAndTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const eventRes = await fetch(`${import.meta.env.VITE_API_URL}/events/${id}`, {
          credentials: 'include'
        });
        if (!eventRes.ok) {
          throw new Error('Failed to fetch event details.');
        }
        const eventData = await eventRes.json();
        setEvent(eventData);
        const ticketTypesUrl = `${import.meta.env.VITE_API_URL}/events/${id}/ticket-types`;
        const ticketRes = await fetch(ticketTypesUrl, {
          credentials: 'include'
        });
        if (!ticketRes.ok) {
          throw new Error('Failed to fetch ticket types.');
        }
        const ticketData = await ticketRes.json();
        if (Array.isArray(ticketData)) {
          setTicketTypes(ticketData);
          if (ticketData.length > 0) {
            setTicketType(ticketData[0].id.toString());
          }
        } else if (ticketData.ticket_types) {
          setTicketTypes(ticketData.ticket_types);
          if (ticketData.ticket_types.length > 0) {
            setTicketType(ticketData.ticket_types[0].id.toString());
          }
        }
      } catch (err) {
        setError('Could not load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchEventAndTickets();
  }, [id]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setBuyerDetails({
            name: userData.full_name || '',
            email: userData.email || '',
            phone_number: userData.phone_number || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    fetchUserProfile();
  }, []);

  const selectedTicketPrice = ticketTypes.find(t => t.id.toString() === ticketType)?.price || 0;
  const total = selectedTicketPrice * ticketCount;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPaymentDialog(true);
    setBuyButtonDisabled(true);
    setTimeout(() => {
      setBuyButtonDisabled(false);
    }, 20000);
  };

  const handlePaymentMethodSelect = async (method: string) => {
    setSelectedPaymentMethod(method);
    setIsProcessingPayment(true);
    if (!event) return;
    try {
      const ticketData = {
        event_id: event.id,
        ticket_type_id: parseInt(ticketType),
        quantity: ticketCount,
        payment_method: method,
        buyer_name: buyerDetails.name,
        buyer_email: buyerDetails.email,
        phone_number: buyerDetails.phone_number
      };
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });
      if (!response.ok) {
        throw new Error("Payment initialization failed");
      }
      const data = await response.json();
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (method === "Paystack" && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else if (method === "Mpesa") {
        toast({
          title: "M-Pesa Payment Initiated",
          description: "Please check your phone for STK push notification and complete the payment",
          duration: 10000,
        });
        setShowPaymentDialog(false);
      } else {
        toast({
          title: "Payment Initiated",
          description: "Your payment is being processed",
        });
        setShowPaymentDialog(false);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not start payment. Please try again.",
        variant: "destructive"
      });
      setShowPaymentDialog(false);
    } finally {
      setIsProcessingPayment(false);
      setSelectedPaymentMethod(null);
    }
  };

  useEffect(() => {
    if (location.pathname.includes('/payment-success')) {
      setPaymentStatus('success');
    } else if (location.pathname.includes('/payment-failed')) {
      setPaymentStatus('failed');
    } else if (location.pathname.includes('/payment-pending')) {
      setPaymentStatus('pending');
    } else if (location.pathname.includes('/payment-cancelled')) {
      setPaymentStatus('cancelled');
    }
    if (paymentReference && !paymentStatus) {
      verifyPaymentStatus(paymentReference);
    }
  }, [location.pathname, paymentReference]);

  const verifyPaymentStatus = async (reference: string) => {
    setVerifyingPayment(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/paystack/verify/${reference}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setPaymentStatus('success');
        toast({
          title: "Payment Successful",
          description: "Your ticket purchase was successful!",
          duration: 5000,
        });
      } else if (response.ok && data.status === 'cancelled') {
        setPaymentStatus('cancelled');
        toast({
          title: "Payment Cancelled",
          description: data.user_message || "Payment was cancelled by user.",
          duration: 5000,
        });
      } else {
        setPaymentStatus('failed');
        toast({
          title: "Payment Failed",
          description: "Your payment could not be verified.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      setPaymentStatus('failed');
      toast({
        title: "Verification Error",
        description: "Could not verify payment status.",
        variant: "destructive",
      });
    } finally {
      setVerifyingPayment(false);
    }
  };

  const renderPaymentStatusAlert = () => {
    if (!paymentStatus) return null;
    switch (paymentStatus) {
      case 'success':
        return (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-300">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Payment Successful!</AlertTitle>
            <AlertDescription>
              Your payment was successful and your tickets have been issued. Check your email for details.
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-green-300 text-green-800"
                onClick={() => navigate('/tickets')}
              >
                View My Tickets
              </Button>
            </AlertDescription>
          </Alert>
        );
      case 'failed':
        return (
          <Alert className="mb-6 bg-red-50 text-red-800 border-red-300">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle>Payment Failed</AlertTitle>
            <AlertDescription>
              Your payment was not successful. Please try again or contact support for assistance.
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-red-300 text-red-800"
                onClick={() => setPaymentStatus(null)}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        );
      case 'cancelled':
        return (
          <Alert className="mb-6 bg-orange-50 text-orange-800 border-orange-300">
            <XCircle className="h-4 w-4 text-orange-600" />
            <AlertTitle>Payment Cancelled</AlertTitle>
            <AlertDescription>
              You cancelled the payment request. No charges were made to your account. You can try purchasing tickets again if needed.
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-orange-300 text-orange-800"
                onClick={() => setPaymentStatus(null)}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        );
      case 'pending':
        return (
          <Alert className="mb-6 bg-yellow-50 text-yellow-800 border-yellow-300">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertTitle>Payment Pending</AlertTitle>
            <AlertDescription>
              Your payment is being processed. We'll notify you once it's complete.
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-yellow-300 text-yellow-800"
                onClick={() => window.location.reload()}
              >
                Check Status
              </Button>
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  // Share Modal Component
  const ShareModal = () => {
    if (!showShareModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowShareModal(false)}
        />
        <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Share Event</h3>
            <button
              onClick={() => setShowShareModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Copy Link Section */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={getEventUrl()}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-gray-900 dark:text-white"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors flex items-center space-x-2"
              >
                {copySuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Options */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={shareOnFacebook}
              className="flex items-center justify-center space-x-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Facebook className="h-5 w-5" />
              <span>Facebook</span>
            </button>
            
            <button
              onClick={shareOnTwitter}
              className="flex items-center justify-center space-x-2 p-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
            >
              <Twitter className="h-5 w-5" />
              <span>Twitter</span>
            </button>
            
            <button
              onClick={shareOnWhatsApp}
              className="flex items-center justify-center space-x-2 p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span>WhatsApp</span>
            </button>
            
            <button
              onClick={shareViaEmail}
              className="flex items-center justify-center space-x-2 p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Mail className="h-5 w-5" />
              <span>Email</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Share this event with your friends and family
            </p>
          </div>
        </div>
      </div>
    );
  };

  const AdvancedPaymentDialog = () => {
    if (!showPaymentDialog) return null;
    const paymentMethods = [
      {
        id: "Mpesa",
        name: "M-Pesa",
        description: "Pay with mobile money",
        icon: Phone,
        color: "from-green-500 to-green-600",
        hoverColor: "from-green-600 to-green-700",
        features: ["Instant transfer", "No cards needed", "Secure payment"],
        processingTime: "Instant"
      },
      {
        id: "Paystack",
        name: "Paystack",
        description: "Pay with card",
        icon: CreditCard,
        color: "from-blue-500 to-blue-600",
        hoverColor: "from-blue-600 to-blue-700",
        features: ["All major cards", "Bank transfer", "International"],
        processingTime: "2-3 minutes"
      }
    ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => !isProcessingPayment && setShowPaymentDialog(false)}
        />
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all max-h-[90vh] overflow-y-auto">
          <div className="relative bg-gradient-to-r from-blue-500 to-[#10b981] px-6 md:px-8 py-6 md:py-8 text-white">
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="h-6 md:h-8 w-6 md:w-8" />
              <h2 className="text-xl md:text-2xl font-bold">Secure Payment</h2>
            </div>
            <p className="text-green-100 text-base md:text-lg">
              Choose your preferred payment method to complete your purchase
            </p>

            <div className="absolute -top-4 -right-4 w-16 md:w-24 h-16 md:h-24 bg-white/10 rounded-full blur-xl" />
            <div className="absolute -bottom-2 -left-2 w-12 md:w-16 h-12 md:h-16 bg-white/10 rounded-full blur-lg" />
          </div>
          <div className="p-6 md:p-8">
            <div className="text-center mb-6 md:mb-8 p-4 md:p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount to pay</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(total)}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedPaymentMethod === method.id;
                const isCurrentlyProcessing = isProcessingPayment && isSelected;

                return (
                  <div
                    key={method.id}
                    onClick={() => !isProcessingPayment && handlePaymentMethodSelect(method.id)}
                    className={`
                      relative group cursor-pointer transition-all duration-300 transform hover:scale-105
                      ${isSelected ? 'ring-2 ring-blue-500' : ''}
                      ${isProcessingPayment && !isSelected ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-300">
                      <div className={`bg-gradient-to-r ${method.color} group-hover:bg-gradient-to-r group-hover:${method.hoverColor} rounded-xl p-3 md:p-4 mb-4 transition-all duration-300`}>
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center space-x-2 md:space-x-3">
                            <Icon className="h-6 md:h-8 w-6 md:w-8" />
                            <div>
                              <h3 className="font-bold text-lg md:text-xl">{method.name}</h3>
                              <p className="text-xs md:text-sm opacity-90">{method.description}</p>
                            </div>
                          </div>
                          {isCurrentlyProcessing && (
                            <div className="animate-spin rounded-full h-5 md:h-6 w-5 md:w-6 border-2 border-white border-t-transparent" />
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        {method.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                            <CheckCircle className="h-3 md:h-4 w-3 md:w-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>Processing time: {method.processingTime}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-3 md:top-4 right-3 md:right-4 bg-blue-500 text-white rounded-full p-1">
                          <CheckCircle className="h-3 md:h-4 w-3 md:w-4" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 rounded-2xl transition-all duration-300 pointer-events-none" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center space-x-2 text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-6">
              <Shield className="h-3 md:h-4 w-3 md:w-4" />
              <span>256-bit SSL encryption • PCI DSS compliant • Your data is secure</span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowPaymentDialog(false)}
                disabled={isProcessingPayment}
                className="flex-1 py-3 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancel
              </button>
            </div>
            {isProcessingPayment && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
                  <span className="text-blue-700 dark:text-blue-300 font-medium text-sm md:text-base">
                    Processing your payment with {selectedPaymentMethod}...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-48 mb-12" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-red-500">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || "Event not found. Please try again later."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <Navbar />
    <main className="py-12 pt-24">
      <div className="container mx-auto px-4">
        {verifyingPayment ? (
          <div className="mb-6 text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p>Verifying your payment...</p>
          </div>
        ) : renderPaymentStatusAlert()}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="rounded-lg overflow-hidden mb-8">
              <img
                src={event.image || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'}
                alt={event.name}
                className="w-full max-h-96 object-cover"
              />
            </div>
            <div className="mb-8">
              {event.category && (
                <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-[#10b981] text-white">{event.category}</Badge>
              )}
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.name}</h1>
              <div className="flex flex-wrap gap-6 mb-6 text-gray-600 dark:text-gray-300">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  <span>By {event.organizer.company_name}</span>
                </div>
              </div>
              <Separator className="my-6 bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">About This Event</h2>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{event.description}</p>
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-4">Location</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{event.location}</p>
                  <EventMap location={event.location} />
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-6 rounded-lg shadow-md sticky top-24 border border-gray-200 dark:border-gray-700">
              {isCheckingOut ? (
                <div>
                  <h2 className="text-xl font-bold mb-6">Complete Your Purchase</h2>
                  <form onSubmit={handleProceedToPayment}>
                    <div className="space-y-4 mb-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1">
                          Full Name
                        </label>
                        <Input
                          id="name"
                          type="text"
                          value={buyerDetails.name}
                          onChange={(e) => setBuyerDetails(prev => ({ ...prev, name: e.target.value }))}
                          required
                          className="bg-gray-50 dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">
                          Email
                        </label>
                        <Input
                          id="email"
                          type="email"
                          value={buyerDetails.email}
                          onChange={(e) => setBuyerDetails(prev => ({ ...prev, email: e.target.value }))}
                          required
                          className="bg-gray-50 dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium mb-1">
                          Phone Number (for M-Pesa)
                        </label>
                        <Input
                          id="phone"
                          type="tel"
                          value={buyerDetails.phone_number}
                          onChange={(e) => setBuyerDetails(prev => ({ ...prev, phone_number: e.target.value }))}
                          required
                          className="bg-gray-50 dark:bg-gray-800"
                        />
                      </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all text-white"
                      disabled={buyButtonDisabled}
                    >
                      {buyButtonDisabled ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Proceed to Payment
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-2 border-gray-300 dark:border-gray-700"
                      onClick={() => setIsCheckingOut(false)}
                    >
                      Back
                    </Button>
                  </form>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold mb-2">Tickets</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">Secure your spot now</p>
                  {ticketTypes.length > 0 ? (
                    <>
                      <div className="space-y-4 mb-6">
                        <div>
                          <label htmlFor="ticketType" className="block text-sm font-medium mb-1">
                            Ticket Type
                          </label>
                          <Select value={ticketType} onValueChange={setTicketType}>
                            <SelectTrigger id="ticketType" className="bg-gray-50 dark:bg-gray-800">
                              <SelectValue placeholder="Select ticket type" />
                            </SelectTrigger>
                            <SelectContent>
                              {ticketTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  <span className="font-medium">{type.type_name}</span> - {formatCurrency(type.price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label htmlFor="quantity" className="block text-sm font-medium mb-1">
                            Quantity
                          </label>
                          <Select
                            value={ticketCount.toString()}
                            onValueChange={(value) => setTicketCount(parseInt(value))}
                          >
                            <SelectTrigger id="quantity" className="bg-gray-50 dark:bg-gray-800">
                              <SelectValue placeholder="Select quantity" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                        <div className="flex justify-between mb-2">
                          <span>
                            {ticketTypes.find(t => t.id.toString() === ticketType)?.type_name} × {ticketCount}
                          </span>
                          <span>{formatCurrency(selectedTicketPrice * ticketCount)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-4">
                          <span>Total</span>
                          <span>{formatCurrency(total)}</span>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-blue-500 to-[#10b981] hover:from-blue-500 hover:to-[#10b981] hover:scale-105 transition-all text-white"
                        onClick={() => setIsCheckingOut(true)}
                      >
                        Get Tickets
                      </Button>
                    </>
                  ) : (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 my-4 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-600">
                      <p className="font-bold">No tickets available</p>
                      <p>There are currently no tickets available for this event.</p>
                      <Button
                        variant="outline"
                        className="mt-4 w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-900/50"
                        onClick={() => {
                          window.location.reload();
                        }}
                      >
                        Refresh
                      </Button>
                    </div>
                  )}
                  <div className="mt-6 flex gap-4 justify-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                      onClick={handleNativeShare}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
    <ShareModal />
    <AdvancedPaymentDialog />
    <Footer />
  </div>
);
};

export default EventDetails;