import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, User, Globe, Bell, Shield, Info, Edit3 } from 'lucide-react';
import { useLanguage, Language } from './LanguageContext';

interface SettingsScreenProps {
  isVisible: boolean;
  onClose: () => void;
  userName: string;
  onUpdateUserName: (name: string) => void;
  onShowToast: (message: string) => void;
}

interface UserProfile {
  name: string;
  birthYear: string;
  birthMonth: string;
}

interface AppSettings {
  language: string;
  reminderEnabled: boolean;
  reminderTime: string;
  privacyMode: boolean;
}

export default function SettingsScreen({ 
  isVisible, 
  onClose, 
  userName, 
  onUpdateUserName, 
  onShowToast 
}: SettingsScreenProps) {
  const { language, setLanguage, t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile>({
    name: userName,
    birthYear: '',
    birthMonth: ''
  });
  
  const [settings, setSettings] = useState<AppSettings>({
    language: language === 'en' ? 'English' : '中文',
    reminderEnabled: true,
    reminderTime: '3:00 PM',
    privacyMode: false
  });

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (isVisible) {
      loadSettings();
    }
  }, [isVisible, language]);

  // Update settings when language context changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      language: language === 'en' ? 'English' : '中文'
    }));
  }, [language]);

  const loadSettings = () => {
    try {
      // Load profile data
      const savedProfile = localStorage.getItem('memoria-user-profile');
      if (savedProfile) {
        const profileData = JSON.parse(savedProfile);
        setProfile({ ...profileData, name: userName });
      } else {
        setProfile(prev => ({ ...prev, name: userName }));
      }

      // Load app settings
      const savedSettings = localStorage.getItem('memoria-app-settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({
          ...parsedSettings,
          language: language === 'en' ? 'English' : '中文'
        });
      } else {
        setSettings(prev => ({
          ...prev,
          language: language === 'en' ? 'English' : '中文'
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveProfile = (newProfile: UserProfile) => {
    try {
      localStorage.setItem('memoria-user-profile', JSON.stringify(newProfile));
      setProfile(newProfile);
      if (newProfile.name !== userName) {
        onUpdateUserName(newProfile.name);
      }
      onShowToast(t('toast.profile_updated'));
    } catch (error) {
      console.error('Error saving profile:', error);
      onShowToast(t('toast.profile_update_failed'));
    }
  };

  const saveSettings = (newSettings: AppSettings) => {
    try {
      localStorage.setItem('memoria-app-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      onShowToast('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      onShowToast('Failed to save settings. Please try again.');
    }
  };

  const formatProfileDisplay = () => {
    let display = profile.name || userName;
    if (profile.birthYear && profile.birthMonth) {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const monthIndex = parseInt(profile.birthMonth) - 1;
      const monthName = monthNames[monthIndex] || profile.birthMonth;
      display += `, ${profile.birthYear} ${monthName}`;
    }
    return display;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Status Bar Spacer */}
      <div className="h-11 bg-white"></div>

      {/* Header */}
      <header className="flex items-center px-6 py-4 border-b border-gray-100">
        <button
          onClick={onClose}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
        >
          <ChevronLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="flex-1 text-center pr-10 font-semibold">
          {t('settings.title')}
        </h1>
      </header>

      {/* Settings Content */}
      <div className="flex-1 px-6 py-2">
        {/* Profile Section */}
        <button
          onClick={() => setShowEditProfile(true)}
          className="w-full flex items-center justify-between py-6 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6 transition-colors active:scale-98"
        >
          <div className="flex-1 text-left">
            <h3 className="mb-1 font-semibold">
              {t('settings.profile')}
            </h3>
            <p className="text-gray-600">
              {formatProfileDisplay()}
            </p>
          </div>
          <ChevronRight size={20} className="text-gray-400 ml-3" />
        </button>

        {/* Language Section */}
        <button
          onClick={() => setShowLanguageSelector(true)}
          className="w-full flex items-center justify-between py-6 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6 transition-colors active:scale-98"
        >
          <div className="flex-1 text-left">
            <h3 className="mb-1 font-semibold">
              {t('settings.language')}
            </h3>
            <p className="text-gray-600">{language === 'en' ? t('settings.language.english') : t('settings.language.chinese')}</p>
          </div>
          <ChevronRight size={20} className="text-gray-400 ml-3" />
        </button>

        {/* Reminder Section */}
        <button
          onClick={() => setShowReminderSettings(true)}
          className="w-full flex items-center justify-between py-6 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6 transition-colors active:scale-98"
        >
          <div className="flex-1 text-left">
            <h3 className="mb-1 font-semibold">
              Reminder
            </h3>
            <p className="text-gray-600">
              {settings.reminderEnabled ? `Remind me everyday at ${settings.reminderTime}` : 'No reminders set'}
            </p>
          </div>
          <ChevronRight size={20} className="text-gray-400 ml-3" />
        </button>

        {/* Privacy & Data Section */}
        <button
          onClick={() => onShowToast('Privacy settings: All data is stored locally on your device. No information is sent to servers.')}
          className="w-full flex items-center justify-between py-6 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6 transition-colors active:scale-98"
        >
          <div className="flex-1 text-left">
            <h3 className="font-semibold">
              Privacy & Data
            </h3>
          </div>
          <ChevronRight size={20} className="text-gray-400 ml-3" />
        </button>

        {/* About the App Section */}
        <button
          onClick={() => onShowToast('Memoria.ai v1.0 - A memory recording app designed for seniors to capture and cherish their life stories.')}
          className="w-full flex items-center justify-between py-6 hover:bg-gray-50 -mx-6 px-6 transition-colors active:scale-98"
        >
          <div className="flex-1 text-left">
            <h3 className="font-semibold">
              About the App
            </h3>
          </div>
          <ChevronRight size={20} className="text-gray-400 ml-3" />
        </button>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-white z-10 flex flex-col">
          <div className="h-11 bg-white"></div>
          <header className="flex items-center px-6 py-4 border-b border-gray-100">
            <button
              onClick={() => setShowEditProfile(false)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            <h1 className="flex-1 text-center pr-10 font-semibold">
              Edit Profile
            </h1>
          </header>

          <div className="flex-1 px-6 py-6">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const newProfile = {
                  name: formData.get('name') as string || userName,
                  birthYear: formData.get('birthYear') as string || '',
                  birthMonth: formData.get('birthMonth') as string || ''
                };
                saveProfile(newProfile);
                setShowEditProfile(false);
              }}
              className="space-y-6"
            >
              <div>
                <label 
                  htmlFor="name" 
                  className="block mb-2 font-semibold"
                >
                  {t('settings.name')}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={profile.name}
                  placeholder="Enter your name"
                  className="w-full p-4 border rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label 
                  htmlFor="birthYear" 
                  className="block mb-2 font-semibold"
                >
                  Birth Year (Optional)
                </label>
                <input
                  type="number"
                  id="birthYear"
                  name="birthYear"
                  defaultValue={profile.birthYear}
                  placeholder="1950"
                  min="1900"
                  max="2010"
                  className="w-full p-4 border rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label 
                  htmlFor="birthMonth" 
                  className="block mb-2 font-semibold"
                >
                  Birth Month (Optional)
                </label>
                <select
                  id="birthMonth"
                  name="birthMonth"
                  defaultValue={profile.birthMonth}
                  className="w-full p-4 border rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors appearance-none"
                >
                  <option value="">Select month</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors active:scale-98 font-semibold"
                >
                  {t('settings.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Language Selector Modal */}
      {showLanguageSelector && (
        <div className="fixed inset-0 bg-white z-10 flex flex-col">
          <div className="h-11 bg-white"></div>
          <header className="flex items-center px-6 py-4 border-b border-gray-100">
            <button
              onClick={() => setShowLanguageSelector(false)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            <h1 className="flex-1 text-center pr-10 font-semibold">
              {t('settings.language')}
            </h1>
          </header>

          <div className="flex-1 px-6 py-2">
            {[
              { code: 'en' as Language, display: t('settings.language.english') },
              { code: 'zh' as Language, display: t('settings.language.chinese') }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setSettings({ ...settings, language: lang.display });
                  setShowLanguageSelector(false);
                  onShowToast(t('toast.profile_updated'));
                }}
                className={`w-full flex items-center justify-between py-6 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6 transition-colors active:scale-98 ${
                  language === lang.code ? 'bg-blue-50' : ''
                }`}
              >
                <span 
                  className={`${language === lang.code ? 'text-blue-600 font-semibold' : ''}`}
                >
                  {lang.display}
                </span>
                {language === lang.code && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reminder Settings Modal */}
      {showReminderSettings && (
        <div className="fixed inset-0 bg-white z-10 flex flex-col">
          <div className="h-11 bg-white"></div>
          <header className="flex items-center px-6 py-4 border-b border-gray-100">
            <button
              onClick={() => setShowReminderSettings(false)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            <h1 className="flex-1 text-center pr-10 font-semibold">
              Reminders
            </h1>
          </header>

          <div className="flex-1 px-6 py-6">
            {/* Enable/Disable Reminders */}
            <div className="flex items-center justify-between py-4 mb-6">
              <div>
                <h3 
                  className="mb-1"
                  style={{ 
                    fontFamily: "'Shantell Sans', sans-serif",
                    fontWeight: 'bold'
                  }}
                >
                  Daily Reminders
                </h3>
                <p className="text-gray-600">Get reminded to record your memories</p>
              </div>
              <button
                onClick={() => saveSettings({ ...settings, reminderEnabled: !settings.reminderEnabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.reminderEnabled ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.reminderEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Reminder Time */}
            {settings.reminderEnabled && (
              <div className="mb-6">
                <h3 
                  className="mb-3"
                  style={{ 
                    fontFamily: "'Shantell Sans', sans-serif",
                    fontWeight: 'bold'
                  }}
                >
                  Reminder Time
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '8:00 PM'].map((time) => (
                    <button
                      key={time}
                      onClick={() => saveSettings({ ...settings, reminderTime: time })}
                      className={`p-4 rounded-xl border-2 transition-colors active:scale-98 ${
                        settings.reminderTime === time 
                          ? 'border-blue-500 bg-blue-50 text-blue-600' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ 
                        fontFamily: "'Shantell Sans', sans-serif",
                        fontWeight: settings.reminderTime === time ? 'bold' : 'normal'
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-xl">
              <p 
                className="text-blue-700"
                style={{ 
                  fontFamily: "'Shantell Sans', sans-serif"
                }}
              >
                💡 Reminders help you maintain a consistent habit of recording memories. You can always change these settings later.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}