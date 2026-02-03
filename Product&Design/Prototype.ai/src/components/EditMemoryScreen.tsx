import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, X, Play, Pause, Trash2 } from 'lucide-react';

interface EditMemoryScreenProps {
  isVisible: boolean;
  prompt: string;
  duration: number;
  onSave: (transcript: string) => void;
  onClose: () => void;
  onDeleteMemory: () => void;
}

export default function EditMemoryScreen({
  isVisible,
  prompt,
  duration,
  onSave,
  onClose,
  onDeleteMemory
}: EditMemoryScreenProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackInterval, setPlaybackInterval] = useState<NodeJS.Timeout | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Generate a mock transcript based on the prompt
      const mockTranscript = generateMockTranscript(prompt);
      setTranscript(mockTranscript);
      setPlaybackPosition(0);
      setIsPlaying(false);
      
      // Focus the textarea after animation completes to trigger mobile keyboard
      const focusTimeout = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // Scroll to the end of the text for immediate editing
          textareaRef.current.setSelectionRange(
            textareaRef.current.value.length, 
            textareaRef.current.value.length
          );
        }
      }, 350); // Delay to allow animation to complete
      
      // Listen for viewport changes to detect keyboard open/close on mobile
      const handleResize = () => {
        const viewportHeight = window.innerHeight;
        const documentHeight = document.documentElement.clientHeight;
        const heightDifference = Math.abs(documentHeight - viewportHeight);
        
        // If viewport is significantly smaller, keyboard is probably open
        setIsKeyboardOpen(heightDifference > 150);
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        clearTimeout(focusTimeout);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible, prompt]);

  // Clean up playback interval on unmount
  useEffect(() => {
    return () => {
      if (playbackInterval) {
        clearInterval(playbackInterval);
      }
    };
  }, [playbackInterval]);

  const generateMockTranscript = (prompt: string) => {
    // Generate a mock transcript based on the prompt for demonstration
    const prompts: { [key: string]: string } = {
      "Talk about your first job": "It was 1954, and I had just turned 17. My first job was at a small bakery on the corner of Maple and 3rd Street. Every morning at 5:30, I would ride my old bicycle there, the air still cool and quiet. The bakery was run by Mr. and Mrs. Novak, a kind couple from Hungary who made the best sourdough bread I've ever tasted. I was in charge of sweeping the floors, boxing pastries, and eventually, ringing up the customers. I remember the smell of freshly baked cinnamon rolls and the way the morning sunlight would stream through the front windows. One day, Mrs. Novak taught me how to braid challah bread. I wasn't very good at it at first, but she laughed and said, 'It's like life — messy at first, but it holds together if you're gentle.' I never forgot that. I earned $2.10 a week, and I gave most of it to my mother to help with the bills, but I kept a few coins for a bottle of orange soda on Saturdays. That job didn't last more than a year, but it taught me responsibility, patience, and the quiet joy of a good day's work.",
      "Describe your childhood home": "Our house was a small two-story colonial with white clapboard siding and green shutters. It sat on Elm Street, third house from the corner, with a big oak tree in the front yard that dropped acorns every fall. The front porch had a swing where my mother would sit and shell peas in the summer evenings. Inside, the living room had a stone fireplace and my father's favorite armchair by the window. The kitchen was the heart of our home, with a big wooden table where we ate every meal and did our homework. Upstairs, I shared a room with my sister Mary, and we had matching quilts that our grandmother made. The basement always smelled like my father's pipe tobacco and had shelves lined with my mother's canned vegetables and preserves.",
      "Tell me about your wedding day": "June 15th, 1962. The morning started with rain, and I thought it was a bad omen, but by noon the sun came out and everything sparkled like diamonds. I wore my mother's wedding dress, taken in at the waist, with pearls that belonged to my grandmother. The ceremony was at St. Mary's Catholic Church, with Father O'Brien officiating. My hands shook so much I could barely hold the bouquet of white roses and baby's breath. When I saw Frank waiting at the altar in his Navy dress uniform, all my nerves melted away. After the ceremony, we had a reception in the church hall with my aunt's famous meatballs and Uncle Joe playing the accordion. We danced to 'Moon River' for our first dance, and Frank whispered in my ear that he loved me more than all the stars in the sky."
    };

    return prompts[prompt] || "This is where your memory would appear as text that you can edit. In a real implementation, this would be the transcribed version of your recorded audio. You can modify this text to add details, correct any mistakes, or organize your thoughts before saving your memory.";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause playback
      if (playbackInterval) {
        clearInterval(playbackInterval);
        setPlaybackInterval(null);
      }
      setIsPlaying(false);
    } else {
      // Start playback
      setIsPlaying(true);
      const interval = setInterval(() => {
        setPlaybackPosition(prev => {
          const newPosition = prev + 0.1;
          if (newPosition >= duration) {
            // Playback complete
            setIsPlaying(false);
            setPlaybackInterval(null);
            return duration;
          }
          return newPosition;
        });
      }, 100);
      setPlaybackInterval(interval);
    }
  };

  const handleSave = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onSave(transcript);
    }, 300);
  };

  const handleClose = () => {
    setIsAnimating(false);
    // Clean up playback if running
    if (playbackInterval) {
      clearInterval(playbackInterval);
      setPlaybackInterval(null);
    }
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleDelete = () => {
    setIsAnimating(false);
    // Clean up playback if running
    if (playbackInterval) {
      clearInterval(playbackInterval);
      setPlaybackInterval(null);
    }
    setTimeout(() => {
      onDeleteMemory();
    }, 300);
  };

  if (!isVisible && !isAnimating) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" data-name="Edit Memory Screen">
      {/* Background overlay */}
      <div
        className={`
          absolute inset-0 bg-[rgba(0,0,0,0.5)] transition-opacity duration-300 ease-out
          ${isAnimating && isVisible ? 'opacity-100' : 'opacity-0'}
        `}
      />
      
      {/* Sliding screen */}
      <div className="relative w-full h-full">
        <div
          className={`
            absolute bottom-0 w-full h-full bg-white transition-transform duration-300 ease-out
            ${isAnimating && isVisible ? 'translate-y-0' : 'translate-y-full'}
          `}
          style={{
            // Ensure proper viewport behavior on mobile when keyboard appears
            height: '100%',
            maxHeight: '100vh',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <button
              onClick={handleClose}
              className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            
            <h1 
              className="text-lg"
              style={{ 
                fontFamily: "'Shantell Sans', sans-serif",
                fontWeight: 'bold'
              }}
            >
              Edit Memory
            </h1>
            
            <button
              onClick={handleDelete}
              className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className={`flex-1 flex flex-col px-6 py-4 overflow-hidden safe-area-padding keyboard-aware transition-all duration-300 ${isKeyboardOpen ? 'h-[50vh]' : 'h-[calc(100vh-80px)]'}`}>
            {/* Memory Title - Compact when keyboard is open */}
            <div className={`mb-4 transition-all duration-300 ${isKeyboardOpen ? 'mb-2' : 'mb-4'}`}>
              <h2 
                className={`mb-2 transition-all duration-300 ${isKeyboardOpen ? 'text-base' : 'text-lg'}`}
                style={{ 
                  fontFamily: "'Shantell Sans', sans-serif",
                  fontWeight: 'bold'
                }}
              >
                {prompt}
              </h2>
            </div>

            {/* Audio Player - Hide when keyboard is open for more space */}
            <div className={`mb-6 p-4 bg-gray-50 rounded-lg transition-all duration-300 ${isKeyboardOpen ? 'hidden' : 'block'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">
                  {formatTime(playbackPosition)}
                </span>
                <span className="text-sm text-gray-600">
                  {formatTime(duration)}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="relative w-full h-1 bg-gray-300 rounded-full mb-4">
                <div 
                  className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-100"
                  style={{ width: `${(playbackPosition / duration) * 100}%` }}
                />
              </div>

              {/* Play Controls */}
              <div className="flex items-center justify-center">
                <button
                  onClick={handlePlayPause}
                  className="flex items-center justify-center w-12 h-12 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                >
                  {isPlaying ? (
                    <Pause size={20} className="text-gray-700" />
                  ) : (
                    <Play size={20} className="text-gray-700 ml-0.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Transcript Editor */}
            <div className="flex-1 flex flex-col min-h-0">
              <label 
                htmlFor="transcript-editor"
                className="text-sm text-gray-600 mb-2"
                style={{ 
                  fontFamily: "'Shantell Sans', sans-serif"
                }}
              >
                Memory transcript
              </label>
              <textarea
                id="transcript-editor"
                ref={textareaRef}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="flex-1 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent overflow-y-auto"
                placeholder="Your memory will appear here as text that you can edit..."
                inputMode="text"
                autoCapitalize="sentences"
                autoCorrect="on"
                spellCheck="true"
                rows={10}
                style={{ 
                  fontFamily: "'Shantell Sans', sans-serif",
                  fontSize: '16px', // 16px prevents zoom on iOS
                  lineHeight: '1.5',
                  WebkitAppearance: 'none', // Remove iOS styling
                  minHeight: '200px', // Minimum height for editing
                  maxHeight: 'none' // Allow natural expansion within flex container
                }}
              />
            </div>

            {/* Save Button - Sticky at bottom with safe area */}
            <div className="pt-6 pb-2 bg-white sticky bottom-0 border-t border-gray-100 mt-4">
              <button
                onClick={handleSave}
                className="w-full py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors active:scale-98 touch-manipulation text-center"
                style={{ 
                  fontFamily: "'Shantell Sans', sans-serif",
                  fontWeight: 'bold',
                  fontSize: '18px' // Larger for better touch target
                }}
              >
                Save Memory
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}