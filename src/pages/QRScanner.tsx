import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BadgeCheck, X, RefreshCw, QrCode, Camera, CheckCircle2, Hash } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

declare global {
  interface Window {
    jsQR: any;
  }
}

interface TicketData {
  id: number;
  event?: {
    title?: string;
    start_time?: string;
    location?: string;
  };
  attendee_name?: string;
  ticket_type?: string;
  event_id?: number;
  scanned_at?: string;
  scanned_by?: string;
}

interface ScanHistoryItem {
  id: string;
  timestamp: string;
  status: 'success' | 'error';
  details: TicketData | { error: string };
}

// Styled Manual Entry Dialog Component
const ManualEntryDialog = ({ isOpen, onClose, onSubmit }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticketId: string) => void;
}) => {
  const [ticketId, setTicketId] = useState('');

  const handleOk = () => {
    if (ticketId.trim()) {
      onSubmit(ticketId);
      setTicketId('');
      onClose();
    }
  };

  const handleCancel = () => {
    setTicketId('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleOk();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-2xl">
          <CardHeader className="relative pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Enter Ticket ID
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Please provide the ticket identification number
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label 
                htmlFor="ticketId" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Ticket ID:
              </label>
              <div className="relative">
                <input
                  id="ticketId"
                  type="text"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="e.g., TKT-2024-001234"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-base"
                  autoFocus
                />
                {ticketId && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter the complete ticket ID as shown on your ticket
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleOk}
                disabled={!ticketId.trim()}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 px-6 py-2 font-medium"
              >
                Verify Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const QRScanner = () => {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [verification, setVerification] = useState<{ 
    status: 'success' | 'error' | null; 
    message: string; 
    ticketData: TicketData | null 
  }>({ status: null, message: '', ticketData: null });
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('scanner');
  const [loading, setLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("QRScanner component mounted");
    if (scanning) {
      console.log("Starting camera...");
      startCamera();
    } else {
      console.log("Stopping camera...");
      stopCamera();
    }

    return () => {
      console.log("Cleaning up...");
      stopCamera();
    };
  }, [scanning]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: { facingMode: 'environment' }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("Camera stream set to video element");
      }
      
      setCameraPermission(true);
      console.log("Camera started");
      
      // Load jsQR dynamically
      await loadJsQR();
      
      // Start scanning interval
      scannerIntervalRef.current = setInterval(scanQRCode, 300);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraPermission(false);
      setScanning(false);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to scan QR codes.",
        variant: "destructive"
      });
    }
  };

  const loadJsQR = async () => {
    if (!window.jsQR) {
      try {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise<void>((resolve, reject) => {
          script.onload = () => {
            console.log("jsQR library loaded successfully.");
            resolve();
          };
          script.onerror = () => {
            console.error("Failed to load jsQR library.");
            reject(new Error("Failed to load jsQR library."));
          };
        });
      } catch (error) {
        console.error('Error loading jsQR library:', error);
        toast({
          title: "Error",
          description: "Failed to load QR scanning library.",
          variant: "destructive"
        });
      }
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !window.jsQR) return;
    
    const video = videoRef.current;
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
    
    const canvas = document.createElement('canvas');
    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) return;
    
    const width = video.videoWidth;
    const height = video.videoHeight;
    
    canvas.width = width;
    canvas.height = height;
    canvasContext.drawImage(video, 0, 0, width, height);
    
    const imageData = canvasContext.getImageData(0, 0, width, height);
    const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });
    
    if (code && code.data) {
      console.log("QR Code detected:", code.data);
      clearInterval(scannerIntervalRef.current);
      setScannedCode(code.data);
      verifyTicket(code.data);
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (scannerIntervalRef.current) {
      clearInterval(scannerIntervalRef.current);
      scannerIntervalRef.current = null;
    }
  };

  const verifyTicket = async (ticketCode: string) => {
    setLoading(true);
    setVerification({ status: null, message: '', ticketData: null });
    
    try {
      // Option 1: Send the QR code content to validate_ticket endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tickets/${ticketCode}/verify`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        console.log("Ticket verified successfully:", data);
        setVerification({
          status: 'success',
          message: data.message || 'Ticket verified successfully!',
          ticketData: data.data
        });
        
        // Add to history
        setHistory(prev => [{
          id: ticketCode,
          timestamp: new Date().toISOString(),
          status: 'success',
          details: data.data
        }, ...prev.slice(0, 19)]);
        
        toast({
          title: "Success",
          description: "Ticket verified successfully!",
          variant: "default"
        });
      } else {
        console.error("Ticket verification failed:", data);
        setVerification({
          status: 'error',
          message: data.message || 'Invalid ticket',
          ticketData: null
        });
        
        // Add to history
        setHistory(prev => [{
          id: ticketCode,
          timestamp: new Date().toISOString(),
          status: 'error',
          details: { error: data.message }
        }, ...prev.slice(0, 19)]);
        
        toast({
          title: "Error",
          description: data.message || 'Failed to verify ticket',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error verifying ticket:', error);
      
      setVerification({
        status: 'error',
        message: error.message || 'Network error. Please try again.',
        ticketData: null
      });
      
      // Add to history
      setHistory(prev => [{
        id: ticketCode,
        timestamp: new Date().toISOString(),
        status: 'error',
        details: { error: error.message || 'Network error' }
      }, ...prev.slice(0, 19)]);
      
      toast({
        title: "Error",
        description: error.message || "Network error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScannedCode(null);
    setVerification({ status: null, message: '', ticketData: null });
    setScanning(true);
  };

  // Updated manual entry function to use styled dialog
  const handleManualEntry = (ticketId: string) => {
    setScannedCode(ticketId);
    verifyTicket(ticketId);
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-900 min-h-screen">
      {/* Manual Entry Dialog */}
      <ManualEntryDialog 
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        onSubmit={handleManualEntry}
      />

      <Tabs defaultValue="scanner" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <TabsTrigger 
            value="scanner" 
            className="text-gray-900 dark:text-gray-200 data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700"
          >
            Scanner
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="text-gray-900 dark:text-gray-200 data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700"
          >
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-200">Ticket Scanner</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Scan QR codes to verify tickets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!scanning && !scannedCode ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <QrCode className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    Ready to scan tickets
                  </p>
                  <Button 
                    onClick={() => setScanning(true)}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Scanning
                  </Button>
                </div>
              ) : scanning ? (
                <div className="relative">
                  <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover"
                      autoPlay 
                      playsInline
                    />
                  </div>
                  <div className="absolute inset-0 border-4 border-blue-500/50 dark:border-blue-400/50 rounded-lg pointer-events-none" />
                  
                  <Button 
                    variant="outline" 
                    className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setScanning(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              ) : scannedCode ? (
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center p-4">
                      <RefreshCw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                    </div>
                  ) : verification.status === 'success' ? (
                    <Alert variant="default" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertTitle className="text-green-800 dark:text-green-300">Valid Ticket</AlertTitle>
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        {verification.message}
                      </AlertDescription>
                    </Alert>
                  ) : verification.status === 'error' ? (
                    <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                      <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertTitle className="text-red-800 dark:text-red-300">Invalid Ticket</AlertTitle>
                      <AlertDescription className="text-red-700 dark:text-red-400">
                        {verification.message}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  
                  {verification.ticketData && (
                    <Card className="border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-green-700 dark:text-green-300">
                          Ticket Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <p className="font-medium text-gray-900 dark:text-gray-200">Event:</p>
                          <p className="text-gray-700 dark:text-gray-300">{verification.ticketData.event?.title || 'N/A'}</p>
                          
                          <p className="font-medium text-gray-900 dark:text-gray-200">Date:</p>
                          <p className="text-gray-700 dark:text-gray-300">{verification.ticketData.event?.start_time ? formatDateTime(verification.ticketData.event.start_time) : 'N/A'}</p>
                          
                          <p className="font-medium text-gray-900 dark:text-gray-200">Location:</p>
                          <p className="text-gray-700 dark:text-gray-300">{verification.ticketData.event?.location || 'N/A'}</p>
                          
                          <p className="font-medium text-gray-900 dark:text-gray-200">Ticket ID:</p>
                          <p className="font-mono text-gray-700 dark:text-gray-300">{verification.ticketData.id}</p>
                          
                          <p className="font-medium text-gray-900 dark:text-gray-200">Attendee:</p>
                          <p className="text-gray-700 dark:text-gray-300">{verification.ticketData.attendee_name || 'N/A'}</p>
                          
                          <p className="font-medium text-gray-900 dark:text-gray-200">Ticket Type:</p>
                          <p className="text-gray-700 dark:text-gray-300">{verification.ticketData.ticket_type || 'Standard'}</p>
                          
                          <p className="font-medium text-gray-900 dark:text-gray-200">Scanned:</p>
                          <p className="text-gray-700 dark:text-gray-300">{verification.ticketData.scanned_at ? formatDateTime(verification.ticketData.scanned_at) : 'Just now'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setShowManualEntry(true)}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                Manual Entry
              </Button>
              
              {scannedCode && (
                <Button 
                  onClick={resetScanner}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Scan Another
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-200">Scan History</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Recent ticket scans
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No scan history yet
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {history.map((item, index) => (
                    <div key={index} className="p-4 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      {item.status === 'success' ? (
                        <BadgeCheck className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-mono text-sm truncate text-gray-900 dark:text-gray-200">
                            {item.id}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                          {item.status === 'success'
                            ? 'event' in item.details && item.details.event?.title
                              ? item.details.event.title
                              : 'Ticket verified'
                            : 'error' in item.details
                              ? item.details.error
                              : 'Verification failed'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setHistory([])}
                disabled={history.length === 0}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                Clear History
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QRScanner;