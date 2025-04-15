
import React from 'react';
import { Button } from '@/components/ui/button';
import { Ticket, Smartphone, CreditCard } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-pulse-purple/90 to-pulse-blue/90 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center"></div>
      </div>
      
      <div className="container mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready for Unforgettable Experiences?</h2>
          <p className="text-xl opacity-90 mb-10">
            Download our app to access exclusive events, instant ticket delivery, and personalized recommendations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass-card-dark p-6 text-center">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Tickets</h3>
              <p className="text-white/70 text-sm">
                Get tickets delivered instantly to your device, no printing needed
              </p>
            </div>
            
            <div className="glass-card-dark p-6 text-center">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Mobile Experience</h3>
              <p className="text-white/70 text-sm">
                Enjoy a seamless experience optimized for your mobile devices
              </p>
            </div>
            
            <div className="glass-card-dark p-6 text-center">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Payments</h3>
              <p className="text-white/70 text-sm">
                Transact with confidence with our secure payment processing
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-pulse-purple hover:bg-white/90">
              Download App
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
              Browse Events
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
