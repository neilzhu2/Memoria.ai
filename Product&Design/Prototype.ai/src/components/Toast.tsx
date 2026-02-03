import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  isVisible: boolean;
  message: string;
  onDismiss: () => void;
  autoHideDuration?: number;
  screenType?: 'home' | 'other'; // To determine positioning
}

export default function Toast({ 
  isVisible, 
  message, 
  onDismiss, 
  autoHideDuration = 3000,
  screenType = 'home'
}: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      // Auto-dismiss after specified duration
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHideDuration]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(onDismiss, 300); // Wait for animation to complete
  };

  if (!isVisible && !isAnimating) {
    return null;
  }

  // Calculate bottom position based on screen type
  // On home page: maintain current distance (224px from bottom)
  // On other pages: use distance that maintains same visual spacing from bottom
  const bottomPosition = screenType === 'home' ? 'bottom-56' : 'bottom-24'; // 96px from bottom on other pages

  return (
    <div
      className={`fixed ${bottomPosition} left-6 right-6 z-10`}
      data-name="Toast Notification"
    >
      <div
        className={`
          bg-white border border-gray-200 rounded-2xl shadow-lg p-4 transition-all duration-300 ease-out
          ${isAnimating && isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-full'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span 
              className="text-sm text-gray-800"
              style={{ 
                fontFamily: "'Shantell Sans', sans-serif",
                fontWeight: 'medium'
              }}
            >
              {message}
            </span>
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
            aria-label="Dismiss notification"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}