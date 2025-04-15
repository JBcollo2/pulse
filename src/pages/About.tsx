
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      
      <main>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-gradient">About Pulse</h1>
            
            <p className="text-xl mb-8">
              Revolutionizing how you discover, book, and enjoy events with secure digital ticketing.
            </p>
            
            <div className="prose prose-lg dark:prose-invert mb-12">
              <p>
                Pulse was founded in 2025 with a simple mission: make event ticketing seamless, 
                secure, and exciting for everyone. We believe that great experiences start 
                before you even arrive at an event.
              </p>
              
              <p>
                Our platform connects event organizers with attendees through an intuitive interface, 
                ensuring that discovering and purchasing tickets is as enjoyable as the event itself.
              </p>
              
              <h2>Our Vision</h2>
              <p>
                We envision a world where event discovery is personalized, ticket purchases are 
                frictionless, and memories are shared seamlessly. By leveraging cutting-edge 
                technology, we're creating the future of event experiences.
              </p>
              
              <h2>What Makes Us Different</h2>
              <ul>
                <li>Digital-first ticketing with animated, secure QR codes</li>
                <li>Personalized event recommendations based on your preferences</li>
                <li>Direct connections between fans and event organizers</li>
                <li>Transparent pricing with no hidden fees</li>
                <li>Commitment to sustainability with paperless ticketing</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">Join Our Team</Button>
              <Button variant="outline" size="lg">Contact Us</Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
