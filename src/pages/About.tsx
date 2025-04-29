import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom'; // Assuming react-router-dom for Link
import { Shield, Calendar, Users, CreditCard, Globe, Award } from 'lucide-react'; // Icons from lucide-react

const About = () => {
  return (
    // Retain main layout styling
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />

      <main>
        {/* Retain container and max-width styling */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Use styling for main title */}
            {/* Removed text-gradient as it was specific to the old title/brand */}
            <h1 className="text-4xl font-bold mb-6">About Tickify</h1>

            {/* Use styling for introductory paragraph */}
            <p className="text-xl mb-8">
              The premier event ticketing platform designed to connect event organizers with attendees seamlessly and securely.
            </p>

            {/* Apply prose styling to a section containing paragraphs, headings, and lists */}
            {/* Integrating 'Our Story' section */}
            <div className="prose prose-lg dark:prose-invert mb-12">
              <h2>Our Story</h2>
              <p>
                Founded in 2023, Tickify was born out of a simple idea: to make event ticketing accessible, secure, and streamlined for both organizers and attendees.
              </p>
              <p>
                Our team of passionate event enthusiasts and technology experts came together to create a platform that addresses the common pain points in the event industry. We understand the challenges faced by event organizers in managing ticket sales, validating entries, and handling payments securely.
              </p>
              <p>
                Today, Tickify serves thousands of events worldwide, from small local gatherings to large-scale conferences and festivals. Our mission remains the same: to provide the most user-friendly and secure ticketing experience in the market.
              </p>
              {/* Integrating the image - wrapped in a div to control flow */}
              {/* Adjusting image styling to fit the layout and max-width */}
              <div className="my-8 flex justify-center">
                 {/* Removed the absolute positioned decorative square to keep styling simple */}
                 <img
                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2032&auto=format&fit=crop"
                    alt="Team collaboration"
                    className="rounded-lg shadow-xl max-w-full h-auto" // Ensure image is responsive and fits container
                 />
              </div>


              {/* Integrating 'Our Values' section - adapting grid/card structure to prose or simple divs */}
              <h2>Our Values</h2>
               {/* Using a grid layout similar to the second component, but without Card component */}
              <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-8 text-center"> {/* not-prose to prevent prose from styling grid items */}
                <div className="flex flex-col items-center p-4"> {/* Simple div simulating a card effect */}
                  <Shield className="h-12 w-12 text-primary mb-4" /> {/* Using text-primary assuming it's available or mapping tickify-accent */}
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Security</h3> {/* Using text-foreground */}
                  <p className="text-base text-muted-foreground"> {/* Using muted-foreground or similar available color */}
                    We prioritize the security of transactions and personal data above all else. Our platform implements state-of-the-art encryption and security measures.
                  </p>
                </div>
                 <div className="flex flex-col items-center p-4">
                  <Users className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Accessibility</h3>
                  <p className="text-base text-muted-foreground">
                    We believe that events should be accessible to everyone. Our platform is designed to be intuitive and easy to use for people of all technical abilities.
                  </p>
                </div>
                 <div className="flex flex-col items-center p-4">
                  <Globe className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Innovation</h3>
                  <p className="text-base text-muted-foreground">
                    We constantly push the boundaries of what's possible in event ticketing, integrating new technologies and features to enhance the user experience.
                  </p>
                </div>
              </div>

              {/* Integrating 'Key Features' section - adapting grid structure */}
              <h2>Key Features</h2>
               {/* Using a grid layout similar to the second component */}
              <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-8"> {/* not-prose to prevent prose from styling grid items */}
                <div className="flex items-start">
                  <Calendar className="h-10 w-10 text-primary mr-4 flex-shrink-0" /> {/* Using text-primary */}
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Event Creation</h3>
                    <p className="text-base text-muted-foreground">
                      Organizers can easily create and manage events, set up different ticket types, and monitor sales in real-time.
                    </p>
                  </div>
                </div>
                 <div className="flex items-start">
                  <CreditCard className="h-10 w-10 text-primary mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Secure Payments</h3>
                    <p className="text-base text-muted-foreground">
                      Integration with trusted payment providers like M-Pesa and Paystack ensures that all transactions are secure and reliable.
                    </p>
                  </div>
                </div>
                 <div className="flex items-start">
                  <Shield className="h-10 w-10 text-primary mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Ticket Validation</h3>
                    <p className="text-base text-muted-foreground">
                      Our QR code-based ticket validation system allows for quick and secure entry verification at events.
                    </p>
                  </div>
                </div>
                 <div className="flex items-start">
                  <Award className="h-10 w-10 text-primary mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Analytics & Reporting</h3>
                    <p className="text-base text-muted-foreground">
                      Comprehensive analytics and reporting tools help organizers understand their audience and optimize future events.
                    </p>
                  </div>
                </div>
              </div>

               {/* Keep the list structure, adjusting content */}
               {/* This list was from the first component, replacing with the structure above */}
               {/* If you still need a list format for some points, you can add it here within the prose block */}

            </div> {/* End prose block */}

            {/* Integrating 'Join the Tickify Community' section */}
             <div className="text-center mt-12"> {/* Added margin top for spacing */}
                <h2 className="text-3xl font-bold mb-6 text-foreground">Join the Tickify Community</h2> {/* Using text-foreground */}
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8"> {/* Using text-xl and muted-foreground */}
                    Whether you're an event organizer looking to streamline your ticketing process or an attendee searching for your next great experience, Tickify is here to help.
                </p>
                {/* Retain button styling but update links and text */}
                <div className="flex flex-wrap justify-center gap-4">
                    <Button asChild size="lg"> {/* Use Button component */}
                        <Link to="/register">Create an Account</Link> {/* Use Link for navigation */}
                    </Button>
                    <Button asChild variant="outline" size="lg"> {/* Use Button component */}
                         <Link to="/events">Browse Events</Link> {/* Use Link for navigation */}
                    </Button>
                </div>
             </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;