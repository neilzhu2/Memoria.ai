import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Menu, Mic, Settings, User } from 'lucide-react';
import RecordingScreen from './components/RecordingScreen';
import MemoriesScreen from './components/MemoriesScreen';
import SettingsScreen from './components/SettingsScreen';
import Toast from './components/Toast';
import { LanguageProvider, useLanguage } from './components/LanguageContext';

// Prompt keys for translation
const dailyPromptKeys = [
  'prompt.first_job',
  'prompt.childhood_home',
  'prompt.wedding_day',
  'prompt.family_tradition',
  'prompt.school_days',
  'prompt.first_car',
  'prompt.family_vacation',
  'prompt.mother',
  'prompt.siblings',
  'prompt.hometown',
  'prompt.wedding_dress',
  'prompt.childhood_games',
  'prompt.favorite_teacher',
  'prompt.first_pet',
  'prompt.dinner_time'
];

function AppContent() {
  const { t } = useLanguage();
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  const [memories, setMemories] = useState([]);
  const [showMemories, setShowMemories] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const currentPrompt = t(dailyPromptKeys[currentPromptIndex]);

  // Load user data and memories on startup
  useEffect(() => {
    loadUserData();
    loadMemories();
  }, []);

  // Clean up recording interval on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    };
  }, [recordingInterval]);

  const loadUserData = () => {
    try {
      const savedName = localStorage.getItem('memoria-user-name');
      if (savedName) {
        setUserName(savedName);
      } else {
        setShowNameInput(true);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadMemories = () => {
    try {
      const savedMemories = localStorage.getItem('memoria-memories');
      if (savedMemories) {
        setMemories(JSON.parse(savedMemories));
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    }
  };

  const saveMemory = (memory) => {
    try {
      const existingMemories = JSON.parse(localStorage.getItem('memoria-memories') || '[]');
      const updatedMemories = [...existingMemories, memory];
      localStorage.setItem('memoria-memories', JSON.stringify(updatedMemories));
      setMemories(updatedMemories);
    } catch (error) {
      console.error('Error saving memory:', error);
    }
  };

  const updateMemory = (memoryId: string, newContent: string) => {
    try {
      const updatedMemories = memories.map(memory => 
        memory.id === memoryId 
          ? { ...memory, content: newContent, updated_at: new Date().toISOString() }
          : memory
      );
      localStorage.setItem('memoria-memories', JSON.stringify(updatedMemories));
      setMemories(updatedMemories);
      showToastNotification(t('toast.memory_updated'));
    } catch (error) {
      console.error('Error updating memory:', error);
      showToastNotification(t('toast.update_failed'));
    }
  };

  const deleteMemory = (memoryId: string) => {
    try {
      const updatedMemories = memories.filter(memory => memory.id !== memoryId);
      localStorage.setItem('memoria-memories', JSON.stringify(updatedMemories));
      setMemories(updatedMemories);
      showToastNotification(t('toast.memory_deleted'));
    } catch (error) {
      console.error('Error deleting memory:', error);
      showToastNotification(t('toast.delete_failed'));
    }
  };

  const saveUserName = (name) => {
    try {
      localStorage.setItem('memoria-user-name', name);
      setUserName(name);
      setShowNameInput(false);
    } catch (error) {
      console.error('Error saving user name:', error);
    }
  };

  const updateUserName = (name: string) => {
    try {
      localStorage.setItem('memoria-user-name', name);
      setUserName(name);
      showToastNotification(t('toast.profile_updated'));
    } catch (error) {
      console.error('Error updating user name:', error);
      showToastNotification(t('toast.profile_update_failed'));
    }
  };

  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleToastDismiss = () => {
    setShowToast(false);
  };

  const handlePreviousPrompt = () => {
    setCurrentPromptIndex(prev => 
      prev === 0 ? dailyPromptKeys.length - 1 : prev - 1
    );
  };

  const handleNextPrompt = () => {
    setCurrentPromptIndex(prev => 
      prev === dailyPromptKeys.length - 1 ? 0 : prev + 1
    );
  };

  const handleStartRecording = async () => {
    setIsRecording(true);
    setIsPaused(false);
    setRecordingDuration(0);
    
    // Start the recording timer
    const interval = setInterval(() => {
      setRecordingDuration(prev => prev + 0.1);
    }, 100);
    
    setRecordingInterval(interval);
  };

  const handlePauseRecording = () => {
    // Pause the recording timer
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    
    setIsPaused(true);
  };

  const handleResumeRecording = () => {
    // Resume the recording timer
    const interval = setInterval(() => {
      setRecordingDuration(prev => prev + 0.1);
    }, 100);
    
    setRecordingInterval(interval);
    setIsPaused(false);
  };

  const handleStopRecording = async (transcript?: string) => {
    // Clear the recording timer
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }

    try {
      // Use the provided transcript or create a default one
      const memoryContent = transcript || `This is a memory response to: "${currentPrompt}". The recording lasted ${recordingDuration.toFixed(1)} seconds. In a real implementation, this would contain the transcribed audio content or typed response from the user.`;
      
      const memory = {
        id: crypto.randomUUID(),
        prompt: currentPrompt,
        content: memoryContent,
        type: 'voice',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      saveMemory(memory);
      setIsRecording(false);
      setIsPaused(false);
      setRecordingDuration(0);
      showToastNotification(t('toast.memory_saved'));
      
      // Move to next prompt
      handleNextPrompt();
    } catch (error) {
      console.error('Error saving memory:', error);
      setIsRecording(false);
      setIsPaused(false);
      setRecordingDuration(0);
      showToastNotification(t('toast.save_failed'));
    }
  };

  const handleCloseRecording = () => {
    // Clear the recording timer
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setRecordingDuration(0);
  };

  const handleDeleteMemory = () => {
    // Clear the recording timer
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setRecordingDuration(0);
    showToastNotification(t('toast.memory_deleted'));
  };

  const handleExportMemoir = async () => {
    try {
      let exportContent = `${userName || 'User'}'s Memories\n`;
      exportContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
      
      memories.forEach((memory, index) => {
        exportContent += `Memory ${index + 1}\n`;
        exportContent += `Date: ${new Date(memory.created_at).toLocaleDateString()}\n`;
        exportContent += `Prompt: ${memory.prompt}\n`;
        exportContent += `Content: ${memory.content}\n`;
        exportContent += `Type: ${memory.type}\n\n`;
        exportContent += '---\n\n';
      });

      // Create and download the export file
      const blob = new Blob([exportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${userName || 'User'}_Memories_${new Date().toLocaleDateString().replace(/\//g, '-')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      showToastNotification(t('toast.export_success', { count: memories.length }));
    } catch (error) {
      console.error('Export error:', error);
      showToastNotification(t('toast.export_failed'));
    }
  };

  const handleMemories = () => {
    handleToastDismiss(); // Clear any active toast when switching screens
    setShowMemories(!showMemories);
  };

  const handleSettings = () => {
    handleToastDismiss(); // Clear any active toast when switching screens
    setShowSettings(!showSettings);
  };

  // Name Input Modal
  if (showNameInput) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 py-6">
          <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold mb-2">
                {t('app.title')}
              </h1>
              <p className="text-gray-600">
                {t('app.welcome')}
              </p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const name = formData.get('name') as string;
                if (name.trim()) {
                  saveUserName(name.trim());
                }
              }} 
              className="space-y-4"
            >
              <input
                type="text"
                name="name"
                placeholder={t('name.placeholder')}
                className="w-full p-4 border rounded-xl text-lg"
                required
                autoFocus
              />
              
              <button
                type="submit"
                className="w-full p-4 bg-blue-500 text-white rounded-xl text-lg hover:bg-blue-600 transition-colors"
              >
                {t('name.get_started')}
              </button>
            </form>

            <button
              onClick={() => saveUserName('Guest')}
              className="w-full mt-4 p-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {t('name.continue_guest')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Memories View
  if (showMemories) {
    return (
      <>
        <MemoriesScreen
          isVisible={showMemories}
          memories={memories}
          onClose={() => {
            handleToastDismiss(); // Clear any active toast when closing
            setShowMemories(false);
          }}
          onDeleteMemory={deleteMemory}
          onUpdateMemory={updateMemory}
        />
        
        {/* Toast notifications for memories view */}
        <Toast
          isVisible={showToast}
          message={toastMessage}
          onDismiss={handleToastDismiss}
          screenType="other"
        />
      </>
    );
  }

  // Settings View
  if (showSettings) {
    return (
      <>
        <SettingsScreen
          isVisible={showSettings}
          onClose={() => {
            handleToastDismiss(); // Clear any active toast when closing
            setShowSettings(false);
          }}
          userName={userName}
          onUpdateUserName={updateUserName}
          onShowToast={showToastNotification}
        />
        
        {/* Toast notifications for settings view */}
        <Toast
          isVisible={showToast}
          message={toastMessage}
          onDismiss={handleToastDismiss}
          screenType="other"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative pb-24">
      {/* Status Bar Spacer */}
      <div className="h-11 bg-white"></div>

      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-600">
            <User size={16} />
            <span className="text-sm">{userName}</span>
          </div>
        </div>
        
        <button 
          onClick={handleExportMemoir}
          className="text-black text-xs font-medium hover:opacity-70 transition-opacity active:scale-95"
        >
          {t('nav.export_memoir')}
        </button>
      </header>

      {/* User greeting */}
      <div className="px-6 pb-4">
        <p className="text-gray-600">
          {t('app.hello', { name: userName })}
        </p>
        {memories.length > 0 && (
          <p className="text-sm text-gray-500">
            {t('app.memories_count', { 
              count: memories.length, 
              memories: memories.length === 1 ? t('app.memory') : t('app.memories') 
            })}
          </p>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Daily Prompt Card Container */}
        <div className="relative w-full">
          {/* Navigation Arrows */}
          <button
            onClick={handlePreviousPrompt}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-4 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
            aria-label={t('nav.previous_prompt')}
          >
            <ChevronLeft size={32} className="text-gray-600" />
          </button>

          <button
            onClick={handleNextPrompt}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-4 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
            aria-label={t('nav.next_prompt')}
          >
            <ChevronRight size={32} className="text-gray-600" />
          </button>

          {/* Main Prompt Card */}
          <div 
            className="bg-white mx-12 py-16 px-8 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow active:scale-98"
            onClick={handleStartRecording}
          >
            <div className="flex items-center justify-center">
              <p className="text-center text-2xl font-semibold leading-tight text-gray-800">
                {currentPrompt}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0px_-2px_24px_0px_rgba(0,0,0,0.08)] pb-8">
        {/* Main Navigation Row */}
        <div className="relative flex justify-between items-center px-6 pt-6 pb-4">
          {/* Memories Tab */}
          <button 
            onClick={handleMemories}
            className={`relative flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors active:scale-95 min-w-[60px] ${showMemories ? 'bg-blue-50' : ''}`}
          >
            <Menu size={28} className={`${memories.length > 0 ? 'text-blue-500' : 'text-black opacity-50'}`} />
            <span className={`text-xs font-medium ${memories.length > 0 ? 'text-blue-500' : 'text-black opacity-50'}`}>
              {t('nav.memories')}
            </span>
            {memories.length > 0 && (
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {memories.length > 9 ? '9+' : memories.length}
              </div>
            )}
          </button>

          {/* Settings Tab */}
          <button 
            onClick={handleSettings}
            className={`flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors active:scale-95 min-w-[60px] ${showSettings ? 'bg-blue-50' : ''}`}
          >
            <User size={28} className={`${showSettings ? 'text-blue-500' : 'text-black opacity-50'}`} />
            <span className={`text-xs font-medium ${showSettings ? 'text-blue-500' : 'text-black opacity-50'}`}>
              {t('nav.settings')}
            </span>
          </button>

          {/* Central Start Recording Button - Extended above footer */}
          <div className="absolute left-1/2 top-6 -translate-x-1/2 -translate-y-1/2">
            <button
              onClick={handleStartRecording}
              disabled={isRecording}
              className={`
                relative w-[88px] h-[88px] rounded-full border-4 border-gray-400
                ${isRecording 
                  ? 'bg-red-500 animate-pulse border-red-400' 
                  : 'bg-gray-50 hover:bg-gray-100 active:scale-95'
                }
                transition-all duration-200 disabled:cursor-not-allowed shadow-xl
              `}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {isRecording ? (
                  <>
                    <div className="w-5 h-5 bg-white rounded-full" />
                    <span className="absolute bottom-1 text-[10px] font-medium text-white px-1">
                      {isPaused ? t('record.paused') : t('record.recording')}
                    </span>
                  </>
                ) : (
                  <Mic size={24} className="text-gray-600" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="flex items-center justify-center pt-2">
          <div 
            className="w-32 h-1 bg-black bg-opacity-10 rounded-full"
          />
        </div>
      </div>

      {/* Recording Screen Overlay */}
      <RecordingScreen
        isVisible={isRecording}
        prompt={currentPrompt}
        onClose={handleCloseRecording}
        onStop={handleStopRecording}
        onPause={handlePauseRecording}
        onResume={handleResumeRecording}
        recordingDuration={recordingDuration}
        isPaused={isPaused}
        onDeleteMemory={handleDeleteMemory}
      />

      {/* Toast notifications for main view */}
      <Toast
        isVisible={showToast}
        message={toastMessage}
        onDismiss={handleToastDismiss}
        screenType="home"
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}