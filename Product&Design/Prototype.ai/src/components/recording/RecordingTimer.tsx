import React from 'react';
import { formatTime } from './utils';

interface RecordingTimerProps {
  duration: number;
  showReplay?: boolean;
  playbackPosition?: number;
}

export function RecordingTimer({ duration, showReplay, playbackPosition }: RecordingTimerProps) {
  const displayTime = showReplay && playbackPosition !== undefined ? playbackPosition : duration;
  const totalTime = duration;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <div 
        className="text-[48px] font-bold text-black text-center"
        style={{ 
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
          fontWeight: '700'
        }}
      >
        {formatTime(displayTime)}
        {showReplay && (
          <div 
            className="text-[16px] font-medium text-gray-600 mt-1"
            style={{ 
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
              fontWeight: '500'
            }}
          >
            / {formatTime(totalTime)}
          </div>
        )}
      </div>
    </div>
  );
}