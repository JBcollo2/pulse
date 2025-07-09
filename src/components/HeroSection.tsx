import React from 'react';
import { Calendar, MapPin, Users, Star, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection: React.FC = () => {
  return (
    <div className="relative">
      {/* Hero Background Section - Half height on mobile */}
      <div className="relative h-[50vh] md:h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 rounded-b-3xl md:rounded-b-[3rem]">
        {/* Animated geometric shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-purple-400/30 rounded-full animate-spin-slow"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-r from-pink-200/20 to-purple-500/20 rounded-lg rotate-45 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-yellow-400/30 rounded-full animate-bounce"></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="container relative z-10 mx-auto px-4 pt-20 md:pt-8 pb-12 md:pb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 md:px-6 md:py-2 mb-4 md:mb-6 text-white/90 animate-fade-in">
            <Zap className="w-4 h-4" />
            <span className="text-xs md:text-sm font-medium">Live Events Happening Now</span>
          </div>

          <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 animate-fade-in text-white leading-tight">
              Your Gateway 
            <span className="block bg-gradient-to-r from-pink-200 to-purple-400 bg-clip-text text-transparent">
              to Unforgettable Events
            </span>
          </h1>

          <p className="text-base md:text-xl text-purple-100 max-w-2xl mx-auto mb-6 md:mb-8 animate-fade-in leading-relaxed px-4" style={{ animationDelay: '0.2s' }}>
            Discover, book, and experience live shows, festivals, and more — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center animate-fade-in px-4" style={{ animationDelay: '0.4s' }}>
            <Button className="bg-gradient-to-r from-pink-10 to-purple-600 hover:from-pink-200 hover:to-purple-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-full text-base md:text-lg font-semibold shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 group w-full sm:w-auto">
              Explore Events
              <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" className="border-2 border-white/30 text-white hover:bg-white hover:text-purple-900 px-6 py-3 md:px-8 md:py-4 rounded-full text-base md:text-lg font-semibold backdrop-blur-sm transition-all duration-300 w-full sm:w-auto">
              Watch Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Section - Below hero on mobile */}
      <div className="bg-white dark:bg-gray-900 py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 group-hover:shadow-lg group-hover:shadow-purple-500/25">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">10+</div>
              <div className="text-gray-600 dark:text-gray-300 font-medium">Events Monthly</div>
            </div>

            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4 group-hover:shadow-lg group-hover:shadow-blue-500/25">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">7+</div>
              <div className="text-gray-600 dark:text-gray-300 font-medium">Cities</div>
            </div>

            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4 group-hover:shadow-lg group-hover:shadow-green-500/25">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">200+</div>
              <div className="text-gray-600 dark:text-gray-300 font-medium">Happy Attendees</div>
            </div>

            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mb-4 group-hover:shadow-lg group-hover:shadow-yellow-500/25">
                <Star className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">3.9</div>
              <div className="text-gray-600 dark:text-gray-300 font-medium">Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Experience Highlights */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience seamless event discovery with cutting-edge features designed for modern event-goers
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Instant Booking",
                description: "Book tickets in seconds with our lightning-fast checkout process",
                icon: Zap,
                color: "from-yellow-400 to-orange-500"
              },
              {
                title: "Live Updates",
                description: "Get real-time notifications about your favorite events and artists",
                icon: Calendar,
                color: "from-blue-400 to-purple-500"
              },
              {
                title: "Exclusive Access",
                description: "Unlock VIP experiences and early bird tickets before anyone else",
                icon: Star,
                color: "from-pink-400 to-purple-500"
              }
            ].map((feature, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-full mb-6 group-hover:shadow-lg transition-all duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-purple-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default HeroSection;