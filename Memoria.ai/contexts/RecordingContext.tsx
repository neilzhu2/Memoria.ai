import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RecordingContextType {
  triggerRecording: () => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  recordingTrigger: number;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTrigger, setRecordingTrigger] = useState(0);

  const triggerRecording = () => {
    // Increment trigger to signal a new recording should start
    setRecordingTrigger(prev => prev + 1);
  };

  return (
    <RecordingContext.Provider
      value={{
        triggerRecording,
        isRecording,
        setIsRecording,
        recordingTrigger,
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecording() {
  const context = useContext(RecordingContext);
  if (context === undefined) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }
  return context;
}