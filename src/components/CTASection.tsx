import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, Users, Calendar, ArrowRight, CheckCircle } from 'lucide-react';

const CTASection = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 3000);
      setEmail('');
    }
  };

  return (
    <section className="relative py-20 px-4 bg-gray-50 dark:bg-gray-800">
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
              </div>

              {/* Right Side - Form */}
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl">
                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Get Started Free
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    No credit card required • 14-day free trial
                  </p>
                </div>

                <form onSubmit={handleSubscribe} className="space-y-4">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    {isSubscribed ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Welcome to Pulse!
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        Start Free Trial
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </form>

                <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>10,000+ organizers trust Pulse</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alternative CTA */}
          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Want to see it in action first?
            </p>
            <Button
              variant="outline"
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-6 py-3 rounded-xl transition-all duration-200"
            >
              Book a Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;