import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Clock, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from "@/components/ui/skeleton";

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        toast({
          title: "Error",
          description: "No payment reference found",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      try {
        console.log("Verifying payment with reference:", reference);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/paystack/verify/${reference}`, {
          credentials: 'include',
        });

        const data = await response.json();
        console.log("Payment verification response:", data);
        
        if (response.ok) {
          if (data.status === "success") {
            setStatus('success');
            setPaymentDetails(data);
            toast({
              title: "Payment Successful",
              description: "Your payment has been processed successfully!",
            });
          } else if (data.status === "pending") {
            setStatus('pending');
            toast({
              title: "Payment Pending",
              description: "Your payment is still being processed.",
            });
          } else {
            setStatus('failed');
            toast({
              title: "Payment Failed",
              description: data.message || "Your payment could not be processed.",
              variant: "destructive"
            });
          }
        } else {
          setStatus('failed');
          toast({
            title: "Verification Failed",
            description: data.error || "Could not verify payment status.",
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setStatus('failed');
        toast({
          title: "Verification Error",
          description: "There was a problem verifying your payment.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [reference, toast]);

  const handleBackToEvents = () => {
    navigate('/events');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <div className="flex justify-center gap-4 mt-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      );
    }

    switch (status) {
      case 'success':
        return (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
            
            <div className="mb-6">
              <p className="text-muted-foreground mb-4">
                Your payment was processed successfully. Your tickets have been issued and sent to your email.
              </p>
              {paymentDetails && (
                <div className="bg-muted p-4 rounded-md text-left mb-6 mx-auto max-w-md">
                  <p className="mb-2"><strong>Reference:</strong> {reference}</p>
                  {paymentDetails.amount && (
                    <p className="mb-2"><strong>Amount:</strong> {(paymentDetails.amount / 100).toLocaleString('en-US', { style: 'currency', currency: paymentDetails.currency || 'NGN' })}</p>
                  )}
                  {paymentDetails.customer && (
                    <p className="mb-2"><strong>Email:</strong> {paymentDetails.customer.email}</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/tickets')} 
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                View My Tickets
              </Button>
              <Button 
                variant="outline" 
                onClick={handleBackToEvents}
              >
                Browse More Events
              </Button>
            </div>
          </>
        );
      
      case 'failed':
        return (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold mb-4">Payment Failed</h1>
            
            <div className="mb-6">
              <p className="text-muted-foreground mb-4">
                We couldn't process your payment. No charges were made to your account.
              </p>
              
              {reference && (
                <div className="bg-muted p-4 rounded-md text-left mb-6 mx-auto max-w-md">
                  <p className="mb-2"><strong>Reference:</strong> {reference}</p>
                  <p className="mb-2">You can use this reference if you need to contact support.</p>
                </div>
              )}
              
              <p className="text-muted-foreground mb-4">
                Common issues include insufficient funds, network issues, or declined transactions.
                You can try again or use a different payment method.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleBackToEvents}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/events')}
              >
                Browse Events
              </Button>
            </div>
          </>
        );
      
      case 'pending':
        return (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            
            <h1 className="text-2xl font-bold mb-4">Payment Processing</h1>
            
            <div className="mb-6">
              <p className="text-muted-foreground mb-4">
                Your payment is currently being processed. This usually takes a few minutes.
              </p>
              
              {reference && (
                <div className="bg-muted p-4 rounded-md text-left mb-6 mx-auto max-w-md">
                  <p className="mb-2"><strong>Reference:</strong> {reference}</p>
                  <p className="mb-2">You can use this reference to check your payment status.</p>
                </div>
              )}
              
              <p className="text-muted-foreground mb-4">
                We'll send you an email once your payment is confirmed. You can also check the status in your tickets page.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => window.location.reload()}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Refresh Status
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/tickets')}
              >
                Go to My Tickets
              </Button>
            </div>
          </>
        );
      
      default:
        return (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold mb-4">Unknown Payment Status</h1>
            
            <div className="mb-6">
              <p className="text-muted-foreground mb-4">
                We couldn't determine the status of your payment.
              </p>
              
              {reference && (
                <div className="bg-muted p-4 rounded-md text-left mb-6 mx-auto max-w-md">
                  <p className="mb-2"><strong>Reference:</strong> {reference}</p>
                  <p className="mb-2">Please contact support with this reference number for assistance.</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleBackToEvents}
                className="bg-primary text-white"
              >
                Go Back to Events
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/tickets')}
              >
                Check My Tickets
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      <main className="py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Button 
            variant="ghost" 
            onClick={handleBackToEvents}
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Events
          </Button>
          
          <div className="bg-card rounded-lg shadow-md p-8 text-center">
            {renderContent()}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentStatus;