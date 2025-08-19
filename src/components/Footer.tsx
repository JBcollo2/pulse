import React from 'react';
import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Instagram, Youtube, Linkedin, Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-teal-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)`
        }}></div>
      </div>

      <div className="relative z-10 py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center space-x-3 mb-6 group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-teal-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <span className="text-white font-bold text-xl">P</span>
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 text-transparent bg-clip-text">
                    Pulse
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Event Discovery</p>
                </div>
              </Link>

              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                Discover extraordinary experiences and connect with the events that matter to you. Your journey to unforgettable moments starts here.
              </p>

              <div className="flex space-x-3">
                {[
                  { icon: Facebook, href: "#", color: "hover:text-blue-600" },
                  { icon: Twitter, href: "#", color: "hover:text-blue-500" },
                  { icon: Instagram, href: "#", color: "hover:text-pink-600" },
                  { icon: Youtube, href: "#", color: "hover:text-red-600" },
                  { icon: Linkedin, href: "#", color: "hover:text-blue-700" }
                ].map(({ icon: Icon, href, color }, index) => (
                  <a
                    key={index}
                    href={href}
                    className={`w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 ${color} transition-all duration-300 hover:scale-110 hover:shadow-lg group`}
                  >
                    <Icon className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation Links */}
            <div>
              <h3 className="font-bold text-lg mb-6 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-teal-500 rounded-full"></div>
                Discover
              </h3>
              <ul className="space-y-3">
                {[
                  { to: "/events", label: "Events" },
                  { to: "/venues", label: "Venues" },
                  { to: "/artists", label: "Artists" },
                  { to: "/categories", label: "Categories" },
                  { to: "/trending", label: "Trending" }
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-300 text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-green-500 rounded-full"></div>
                Company
              </h3>
              <ul className="space-y-3">
                {[
                  { to: "/about", label: "About Us" },
                  { to: "/careers", label: "Careers" },
                  { to: "/partners", label: "Partners" },
                  { to: "/press", label: "Press" },
                  { to: "/contact", label: "Contact" }
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-300 text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & Newsletter */}
            <div>
              <h3 className="font-bold text-lg mb-6 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
                Connect
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <span>hello@pulse.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-green-500 rounded-lg flex items-center justify-center">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <span>San Francisco, CA</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 via-teal-50 to-green-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-2xl border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Stay updated with the latest events
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email"
                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300"
                  />
                  <Button size="sm" className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span>© 2025 Pulse. All rights reserved.</span>
                <div className="w-2 h-2 bg-gradient-to-r from-teal-500 to-green-500 rounded-full animate-pulse"></div>
              </p>

              <div className="flex items-center gap-6">
                {[
                  { to: "/privacy", label: "Privacy" },
                  { to: "/terms", label: "Terms" },
                  { to: "/cookies", label: "Cookies" },
                  { to: "/accessibility", label: "Accessibility" }
                ].map(({ to, label }, index) => (
                  <Link
                    key={to}
                    to={to}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-300"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;