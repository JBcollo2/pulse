import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, Construction, Zap, ArrowLeft, RefreshCw } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const [isUnderConstruction, setIsUnderConstruction] = useState(false);

  useEffect(() => {
    // Check if this is a planned route that's under construction
    const constructionRoutes = ['/dashboard', '/profile', '/settings', '/admin'];
    const isConstruction = constructionRoutes.some(route => 
      location.pathname.startsWith(route)
    );
    
    setIsUnderConstruction(isConstruction);
    
    if (isConstruction) {
      console.log(
        "Under Construction: User accessed planned route:",
        location.pathname
      );
    } else {
      console.error(
        "404 Error: User attempted to access non-existent route:",
        location.pathname
      );
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-200/30 dark:bg-purple-800/30 rounded-full animate-float"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-blue-200/30 dark:bg-blue-800/30 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-32 left-1/3 w-20 h-20 bg-pink-200/30 dark:bg-pink-800/30 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 bg-yellow-200/30 dark:bg-yellow-800/30 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        
        {/* Animated Lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-purple-300/20 dark:via-purple-600/20 to-transparent animate-pulse"></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-blue-300/20 dark:via-blue-600/20 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        {/* Icon Animation */}
        <div className="mb-8 animate-bounce-slow">
          {isUnderConstruction ? (
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg">
              <Construction className="w-12 h-12 text-white animate-pulse" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg">
              <Zap className="w-12 h-12 text-white animate-pulse" />
            </div>
          )}
        </div>

        {/* Status Code */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-pulse">
            {isUnderConstruction ? '🚧' : '404'}
          </h1>
        </div>

        {/* Title */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
            {isUnderConstruction ? 'Under Construction' : 'Page Not Found'}
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full animate-pulse"></div>
        </div>

        {/* Description */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            {isUnderConstruction ? (
              <>
                We're working hard to bring you something amazing! <br />
                This feature is currently being built and will be available soon.
              </>
            ) : (
              <>
                Oops! The page you're looking for doesn't exist. <br />
                It might have been moved, deleted, or you entered the wrong URL.
              </>
            )}
          </p>
          
          {/* Loading Animation for Construction */}
          {isUnderConstruction && (
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Building something awesome...</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Back to Home
          </a>
          
          <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white dark:hover:bg-purple-500 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
        </div>

        {/* Fun Fact */}
        <div className="mt-12 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="inline-flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full px-6 py-3 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            <Zap className="w-4 h-4 text-purple-500" />
            <span>
              {isUnderConstruction 
                ? "Great things take time to build perfectly" 
                : "Did you know? The first 404 error was at CERN in 1992!"
              }
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default NotFound;