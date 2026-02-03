import React from 'react';

interface WaveformDisplayProps {
  isPaused: boolean;
  showReplay?: boolean;
  playbackPosition?: number;
  duration: number;
}

export function WaveformDisplay({ isPaused, showReplay, playbackPosition, duration }: WaveformDisplayProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Waveform bars */}
      <div className="flex items-center justify-center gap-1">
        {[...Array(20)].map((_, i) => {
          const barHeight = Math.random() * 60 + 20;
          const isActive = showReplay && playbackPosition 
            ? (i / 20) <= (playbackPosition / duration)
            : !isPaused;
          
          return (
            <div
              key={i}
              className={`rounded-full transition-colors duration-200 ${
                showReplay 
                  ? (isActive ? 'bg-blue-500' : 'bg-gray-300')
                  : 'bg-gray-400'
              } ${
                !showReplay && !isPaused && i % 3 === 0 ? 'animate-pulse' : 
                !showReplay && !isPaused && i % 2 === 0 ? 'animate-bounce' : ''
              }`}
              style={{
                width: '3px',
                height: `${barHeight}px`,
                animationDelay: `${i * 100}ms`,
                animationDuration: '1s'
              }}
            />
          );
        })}
      </div>
    </div>
  );
}