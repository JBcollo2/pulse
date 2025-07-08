import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-purple-600 rounded-full"></div>
                <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">P</span>
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">Pulse</span>
            </Link>

            <p className="text-gray-400 mb-6">
              Your premier destination for discovering and booking tickets to the most exciting events.
            </p>

            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-purple-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-500 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-500 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-500 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-6 text-white">Company</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-purple-500 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-400 hover:text-purple-500 transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/partners" className="text-gray-400 hover:text-purple-500 transition-colors">
                  Partners
                </Link>
              </li>
              <li>
                <Link to="/press" className="text-gray-400 hover:text-purple-500 transition-colors">
                  Press
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-purple-500 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-6 text-white">Resources</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/help" className="text-gray-400 hover:text-purple-500 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/faqs" className="text-gray-400 hover:text-purple-500 transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-purple-500 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/developers" className="text-gray-400 hover:text-purple-500 transition-colors">
                  Developers
                </Link>
              </li>
              <li>
                <Link to="/affiliates" className="text-gray-400 hover:text-purple-500 transition-colors">
                  Affiliate Program
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-6 text-white">Legal</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-purple-500 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-purple-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-gray-400 hover:text-purple-500 transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/accessibility" className="text-gray-400 hover:text-purple-500 transition-colors">
                  Accessibility
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-gray-400 hover:text-purple-500 transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400 mb-4 md:mb-0">
            © 2025 Pulse. All rights reserved.
          </p>

          <div className="flex space-x-6">
            <Link to="/privacy" className="text-sm text-gray-400 hover:text-purple-500 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-sm text-gray-400 hover:text-purple-500 transition-colors">
              Terms
            </Link>
            <Link to="/cookies" className="text-sm text-gray-400 hover:text-purple-500 transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
