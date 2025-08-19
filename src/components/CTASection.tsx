import React, { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';

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
    <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Discover Amazing Events?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Get instant access to exclusive events, early bird pricing, and personalized recommendations tailored just for you.
          </p>
        </div>

        {/* Main CTA Card */}
        <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-8 md:p-12 text-center shadow-xl">
          <div className="mb-8">
            <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">
              Join our community today!
            </h3>
            
            <div className="max-w-md mx-auto mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubscribe(e)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
                />
                <button
                  onClick={handleSubscribe}
                  className="bg-white text-gray-800 hover:bg-gray-100 font-medium px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {isSubscribed ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Subscribed!
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-white/10 backdrop-blur-sm text-white border border-white/30 hover:bg-white/20 font-medium px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105">
              Explore Events
            </button>
            
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <div className="flex -space-x-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 bg-white/30 rounded-full border border-white/50"></div>
                ))}
              </div>
              <span>Join 10,000+ event lovers</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;