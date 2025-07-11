import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ChevronRight, Zap, Bell, Crown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import AnimatedSection from '@/components/AnimatedSection';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
}

const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const slides: Slide[] = [
    {
      image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      title: 'Discover Amazing Events',
      subtitle: 'Find and book tickets for the best events in Kenya'
    },
    {
      image: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
      title: 'Experience Unforgettable Moments',
      subtitle: 'From music festivals to cultural celebrations'
    },
    {
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      title: 'Connect with Your Community',
      subtitle: 'Join thousands of event-goers across the country'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="w-full">
      {/* Hero Section with Rounded Top */}
      <div className="relative rounded-t-3xl overflow-hidden w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Background Slides */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              height: '566px',
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.4) contrast(1.1) dark:brightness(0.25)'
            }}
          />
        ))}

        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 via-transparent to-blue-900/60 dark:from-gray-900/80 dark:via-gray-800/40 dark:to-gray-900/80" />

        {/* Content */}
        <div className="relative z-10 flex flex-col md:flex-row h-full w-full min-h-[500px]">
          <div className="flex-1 flex flex-col justify-end p-6 md:p-10">
            <div className="w-full max-w-3xl animate-fade-in">
              <AnimatedSection>
                <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 drop-shadow-lg">
                  {slides[currentSlide].title}
                </h1>
                <p className="text-white/95 dark:text-white/90 text-base md:text-lg mb-8 max-w-2xl drop-shadow-md">
                  {slides[currentSlide].subtitle}
                </p>
              </AnimatedSection>
              <AnimatedSection delay={200}>
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 mb-8 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link to="/events">
                    <Ticket className="h-5 w-5 mr-2" />
                    Browse Events
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
              </AnimatedSection>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Features Section - Seamless Integration */}
      <div className="bg-white dark:bg-gray-900 py-12 md:py-16 transition-colors duration-300">
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
                icon: <Zap className="w-8 h-8 text-white" />,
                color: "from-yellow-400 to-orange-500"
              },
              {
                title: "Live Updates",
                description: "Get real-time notifications about your favorite events and artists",
                icon: <Bell className="w-8 h-8 text-white" />,
                color: "from-blue-400 to-purple-500"
              },
              {
                title: "Exclusive Access",
                description: "Unlock VIP experiences and early bird tickets before anyone else",
                icon: <Crown className="w-8 h-8 text-white" />,
                color: "from-pink-400 to-purple-500"
              }
            ].map((feature, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40 transition-all duration-300 transform hover:scale-105 text-center border border-gray-100 dark:border-gray-700">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-full mb-6 group-hover:shadow-lg transition-all duration-300 mx-auto`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
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
    </div>
  );
};

export default HeroSection;