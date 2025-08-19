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
    <section className="relative py-20 px-4 overflow-hidden bg-white dark:bg-gray-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-teal-50 via-mint-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-blue-400 to-teal-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-20 w-40 h-40 bg-gradient-to-br from-teal-400 to-green-500 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-gradient-to-br from-green-400 to-blue-500 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              <div className="w-2 h-2 bg-gradient-to-br from-teal-400 to-green-400 rounded-full opacity-60"></div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 text-white px-6 py-3 rounded-full text-sm font-medium mb-6 shadow-lg">
              <Sparkles className="h-4 w-4" />
              Join the Community
              <Sparkles className="h-4 w-4" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 text-transparent bg-clip-text">
                Be Part of Something
              </span>
              <br />
              <span className="text-gray-800 dark:text-gray-200">Extraordinary</span>
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Join thousands of event enthusiasts who trust Pulse to discover their next great experience. 
              Get early access, exclusive deals, and personalized recommendations.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Instant event discovery with our advanced search and filtering system",
                color: "from-blue-500 to-teal-500",
                bgColor: "from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20"
              },
              {
                icon: Users,
                title: "Community Driven",
                description: "Connect with like-minded people and share your event experiences",
                color: "from-teal-500 to-green-500",
                bgColor: "from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20"
              },
              {
                icon: Calendar,
                title: "Never Miss Out",
                description: "Smart notifications and reminders keep you updated on everything",
                color: "from-green-500 to-blue-500",
                bgColor: "from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20"
              }
            ].map(({ icon: Icon, title, description, color, bgColor }, index) => (
              <div
                key={index}
                className={`group relative p-8 bg-gradient-to-br ${bgColor} backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2`}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">
                  {title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>
            <div className="absolute inset-0 backdrop-blur-sm rounded-3xl"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Ready to Discover Amazing Events?
              </h3>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                Get instant access to exclusive events, early bird pricing, and personalized recommendations 
                tailored just for you. Join our community today!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 w-full">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-6 py-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
                    required
                  />
                  <Button
                    type="submit"
                    className="bg-white text-gray-800 hover:bg-gray-100 font-medium px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg whitespace-nowrap"
                  >
                    {isSubscribed ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Subscribed!
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Get Started
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </form>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  variant="outline"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm font-medium px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  Explore Events
                </Button>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 bg-white/20 rounded-full border-2 border-white/30"></div>
                    ))}
                  </div>
                  <span>Join 10,000+ event lovers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </section>
  );
};

export default CTASection;