
import React from 'react';
import { FacebookIcon, TwitterIcon, InstagramIcon, YoutubeIcon, LinkedinIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-pulse-purple rounded-full"></div>
                <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
                  <span className="text-pulse-purple font-bold text-sm">P</span>
                </div>
              </div>
              <span className="text-2xl font-bold text-gradient">Pulse</span>
            </Link>
            
            <p className="text-muted-foreground mb-6">
              Your premier destination for discovering and booking tickets to the most exciting events.
            </p>
            
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                <TwitterIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                <YoutubeIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                <LinkedinIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-6">Company</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/partners" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                  Partners
                </Link>
              </li>
              <li>
                <Link to="/press" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                  Press
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-6">Resources</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/help" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/faqs" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/developers" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                  Developers
                </Link>
              </li>
              <li>
                <Link to="/affiliates" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                  Affiliate Program
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-6">Legal</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/accessibility" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                  Accessibility
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-muted-foreground hover:text-pulse-purple transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            © 2025 Pulse. All rights reserved.
          </p>
          
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-pulse-purple transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-pulse-purple transition-colors">
              Terms
            </Link>
            <Link to="/cookies" className="text-sm text-muted-foreground hover:text-pulse-purple transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
