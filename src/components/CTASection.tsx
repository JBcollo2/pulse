import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, Users, ArrowRight, CheckCircle, Star, Award, Shield } from 'lucide-react';

const AnimatedNumber = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime;
    let animationFrame;
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(easeOutCubic * parseInt(end.replace(/\D/g, '')));
      
      setCount(currentCount);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, isVisible]);

  const formatNumber = (num) => {
    if (end.includes('K+')) return `${num}K+`;
    if (end.includes('M+')) return `${(num/1000).toFixed(1)}M+`;
    if (end.includes('%')) return `${num}%`;
    return `${num}${suffix}`;
  };

  return (
    <div ref={elementRef} className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text mb-2">
      {isVisible ? formatNumber(count) : end}
    </div>
  );
};

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
    <section className="relative py-20 px-4 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Background Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-10 dark:opacity-5" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")'
        }}
      ></div>

      <div className="container mx-auto relative z-10">
        <div className="max-w-6xl mx-auto">
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

          {/* Stats Section with Animated Numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              { number: "50K+", label: "Events Created" },
              { number: "1M+", label: "Happy Attendees" },
              { number: "99.9%", label: "Uptime" },
              { number: "24/7", label: "Support" }
            ].map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <AnimatedNumber end={stat.number} />
                <div className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Success Stories Section */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-200 dark:border-gray-700 mb-16">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Trusted by Industry Leaders
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                See how top organizations are transforming their events with Pulse
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  company: "TechConf Global",
                  industry: "Technology",
                  improvement: "300% increase in attendee engagement",
                  quote: "Pulse transformed our virtual conferences into interactive experiences that attendees actually enjoy.",
                  avatar: "TC"
                },
                {
                  company: "Healthcare Summit",
                  industry: "Healthcare",
                  improvement: "50% reduction in planning time",
                  quote: "The automation features saved us weeks of manual work. Our team can now focus on creating great content.",
                  avatar: "HS"
                },
                {
                  company: "Creative Workshops",
                  industry: "Education",
                  improvement: "95% attendee satisfaction rate",
                  quote: "The analytics helped us understand our audience better and deliver exactly what they wanted.",
                  avatar: "CW"
                }
              ].map((story, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {story.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{story.company}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{story.industry}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      {story.improvement}
                    </p>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 italic text-sm leading-relaxed">
                    "{story.quote}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast Setup",
                description: "Create professional events in under 5 minutes with our intuitive drag-and-drop builder.",
                features: ["One-click templates", "Smart automation", "Instant publishing"]
              },
              {
                icon: Users,
                title: "Advanced Analytics",
                description: "Get deep insights into attendee behavior, engagement metrics, and event performance.",
                features: ["Real-time dashboards", "Custom reports", "Predictive insights"]
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-level security with 99.9% uptime guarantee and 24/7 monitoring.",
                features: ["SSL encryption", "GDPR compliant", "Regular backups"]
              }
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <IconComponent className="h-6 w-6 text-blue-600" />
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {feature.title}
                    </h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;