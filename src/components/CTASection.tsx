import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, ArrowRight, CheckCircle } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background Pattern (Copied from Footer) */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-teal-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)`
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-3 rounded-full text-sm font-medium mb-6 shadow-md">
                <Sparkles className="h-4 w-4" />
                Join the Community
                <Sparkles className="h-4 w-4" />
              </div>

              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-gray-900 dark:text-gray-100">Ready to</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text">
                  Transform Your Events?
                </span>
              </h2>

              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Experience the future of event management with our powerful platform.
                Join thousands of successful event organizers who've elevated their events with Pulse.
              </p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              {[
                { number: "50K+", label: "Events Created" },
                { number: "1M+", label: "Happy Attendees" },
                { number: "99.9%", label: "Uptime" },
                { number: "24/7", label: "Support" }
              ].map((stat, index) => (
                <div key={index} className="text-center p-6 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Main CTA Card */}
            <div className="bg-white dark:bg-gray-700 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-200 dark:border-gray-600">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Side - Content */}
                <div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                    Start Your Event Journey Today
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    Get instant access to professional event tools, detailed analytics,
                    and dedicated support. No setup fees, no hidden costs.
                  </p>
                  
                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    {[
                      "Unlimited event creation",
                      "Advanced attendee management",
                      "Real-time analytics dashboard",
                      "24/7 premium support"
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                  {/* Book a Demo Button */}
                  <Button
                    variant="default"
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <div className="flex items-center justify-center gap-2">
                      Book a Demo
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </Button>
                </div>

                {/* Right Side - Image or Placeholder */}
                <div className="hidden lg:block">
                  <div className="aspect-w-16 aspect-h-9 w-full h-full rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <span className="text-center p-4">
                      
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
