import { useEffect, useState } from 'react';
import { Gift, Rocket, Star, Sparkles, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeCelebrationProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function WelcomeCelebration({ isVisible, onClose }: WelcomeCelebrationProps) {
  const [showRockets, setShowRockets] = useState(false);
  const [showStars, setShowStars] = useState(false);

  useEffect(() => {
    if (isVisible) {
      console.log('WelcomeCelebration component is now visible');
      // Start rocket animation immediately
      setShowRockets(true);
      
      // Start star animation after a slight delay
      const starTimer = setTimeout(() => {
        setShowStars(true);
      }, 300);

      // Auto-close after 5 seconds
      const autoCloseTimer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => {
        clearTimeout(starTimer);
        clearTimeout(autoCloseTimer);
      };
    } else {
      setShowRockets(false);
      setShowStars(false);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-2xl p-8 mx-4 max-w-md w-full text-center shadow-2xl">
        {/* Rocket animations */}
        {showRockets && (
          <>
            <div className="absolute -top-4 left-1/4">
              <Rocket className="h-8 w-8 text-orange-500 rocket-fly" />
            </div>
            <div className="absolute -top-6 right-1/4">
              <Rocket className="h-6 w-6 text-red-500 rocket-fly" style={{ animationDelay: '0.5s' }} />
            </div>
            <div className="absolute -top-2 left-1/2">
              <Rocket className="h-10 w-10 text-blue-500 rocket-fly" style={{ animationDelay: '1s' }} />
            </div>
          </>
        )}

        {/* Star animations */}
        {showStars && (
          <>
            <div className="absolute top-4 left-4">
              <Star className="h-4 w-4 text-yellow-400 star-twinkle" />
            </div>
            <div className="absolute top-6 right-6">
              <Star className="h-3 w-3 text-yellow-500 star-twinkle" style={{ animationDelay: '0.3s' }} />
            </div>
            <div className="absolute bottom-8 left-8">
              <Sparkles className="h-5 w-5 text-purple-400 star-twinkle" style={{ animationDelay: '0.7s' }} />
            </div>
            <div className="absolute bottom-6 right-8">
              <Sparkles className="h-4 w-4 text-pink-400 star-twinkle" style={{ animationDelay: '0.5s' }} />
            </div>
          </>
        )}

        {/* Main content */}
        <div className="relative z-10">
          <div className="bg-gradient-to-r from-orange-100 to-orange-200 rounded-full p-4 mx-auto mb-6 w-20 h-20 flex items-center justify-center">
            <Gift className="h-12 w-12 text-orange-600" />
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-4 celebration-text">
            Welcome to CakesBuy!
          </h2>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <Wallet className="h-8 w-8 text-green-600" />
              <span className="text-4xl font-bold text-green-800">₹50</span>
            </div>
            <p className="text-lg font-semibold text-green-700 mb-2">
              Welcome Bonus Added!
            </p>
            <p className="text-sm text-green-600">
              Your wallet has been credited with ₹50. Use it on your next order!
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-lg text-gray-700">
              🎉 <span className="font-semibold">Congratulations!</span> You've successfully joined CakesBuy
            </p>
            <p className="text-sm text-gray-600">
              Start exploring our collection of 100% eggless cakes and use your welcome bonus on your first order!
            </p>
          </div>

          <Button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl shadow-lg"
          >
            Start Shopping Now! 🛒
          </Button>
        </div>
      </div>
    </div>
  );
}