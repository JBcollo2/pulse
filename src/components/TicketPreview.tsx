
import React, { useState } from 'react';
import { Calendar, Clock, MapPin, QrCode, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TicketPreviewProps {
  eventName: string;
  date: string;
  time: string;
  location: string;
  ticketHolder: string;
  ticketType: string;
  ticketId: string;
}

const TicketPreview: React.FC<TicketPreviewProps> = ({
  eventName,
  date,
  time,
  location,
  ticketHolder,
  ticketType,
  ticketId
}) => {
  const [showQr, setShowQr] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card overflow-hidden max-w-md mx-auto">
      <div className="bg-gradient-to-r from-pulse-purple to-pulse-blue p-6 text-white">
        <h3 className="text-xl font-bold mb-2">{eventName}</h3>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          <span className="text-sm">{date}</span>
          <span className="mx-2">•</span>
          <Clock className="h-4 w-4 mr-2" />
          <span className="text-sm">{time}</span>
        </div>
      </div>
      
      <div className="p-6 bg-white dark:bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <User className="h-5 w-5 text-pulse-purple mr-2" />
            <span className="font-medium">{ticketHolder}</span>
          </div>
          <span className="text-sm font-semibold px-3 py-1 bg-pulse-purple/10 text-pulse-purple rounded-full">
            {ticketType}
          </span>
        </div>
        
        <div className="flex items-center text-muted-foreground mb-4">
          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm">{location}</span>
        </div>
        
        <div className="border-t border-dashed border-border py-4 my-4 relative">
          <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-background"></div>
          <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-background"></div>
        </div>
        
        <div className="text-center mb-4">
          <Button 
            variant="ghost"
            className="text-pulse-purple hover:text-pulse-deep-purple hover:bg-pulse-purple/10"
            onClick={() => setShowQr(!showQr)}
          >
            <QrCode className="h-5 w-5 mr-2" />
            {showQr ? "Hide QR Code" : "Show QR Code"}
          </Button>
        </div>
        
        {showQr && (
          <div 
            className={cn(
              "flex flex-col items-center justify-center p-6 bg-white rounded-lg transition-all duration-500",
              showQr && "animate-morph-qr"
            )}
          >
            <div className={`w-48 h-48 bg-contain bg-center bg-no-repeat mb-3`} style={{backgroundImage: `url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TICKET-${ticketId}')`}}></div>
            <span className="text-sm text-muted-foreground">Ticket ID: {ticketId}</span>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          className="w-full mt-4 flex items-center justify-center text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-5 w-5 mr-2" /> Less details
            </>
          ) : (
            <>
              <ChevronDown className="h-5 w-5 mr-2" /> More details
            </>
          )}
        </Button>
        
        {expanded && (
          <div className="mt-4 space-y-3 text-sm text-muted-foreground animate-fade-in">
            <p>• Please arrive 30 minutes before the event starts</p>
            <p>• Your ticket will be scanned at the entrance</p>
            <p>• This ticket is non-refundable and non-transferable</p>
            <p>• Food and beverages available at the venue</p>
            <p>• Please follow venue safety guidelines</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketPreview;
