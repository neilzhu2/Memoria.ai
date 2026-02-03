import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations = {
  en: {
    // App title and branding
    'app.title': 'memoria.ai',
    'app.welcome': 'Welcome! Let\'s start capturing your memories.',
    'app.hello': 'Hello, {name}! 👋',
    'app.memories_count': 'You have {count} saved {memories}',
    'app.memory': 'memory',
    'app.memories': 'memories',
    
    // Name input
    'name.placeholder': 'What\'s your name?',
    'name.get_started': 'Get Started',
    'name.continue_guest': 'Continue as Guest',
    
    // Navigation and buttons
    'nav.memories': 'Memories',
    'nav.settings': 'Settings',
    'nav.export_memoir': 'Export My Memoir',
    'nav.previous_prompt': 'Previous prompt',
    'nav.next_prompt': 'Next prompt',
    
    // Recording states
    'record.start': 'Start Recording',
    'record.recording': 'Recording',
    'record.paused': 'Paused',
    'record.continue': 'Continue Recording',
    'record.pause': 'Pause',
    'record.stop': 'Stop',
    'record.delete': 'Delete',
    'record.save': 'Save Memory',
    
    // Settings
    'settings.title': 'Settings',
    'settings.profile': 'Profile',
    'settings.name': 'Name',
    'settings.language': 'Language',
    'settings.language.english': 'English',
    'settings.language.chinese': '中文',
    'settings.data': 'Data',
    'settings.export': 'Export All Memories',
    'settings.export_description': 'Download all your memories as a text file',
    'settings.about': 'About',
    'settings.version': 'Version',
    'settings.save': 'Save',
    'settings.cancel': 'Cancel',
    
    // Memories screen
    'memories.title': 'My Memories',
    'memories.empty': 'No memories yet',
    'memories.empty_description': 'Start recording your first memory!',
    'memories.search': 'Search memories...',
    'memories.edit': 'Edit',
    'memories.delete': 'Delete',
    'memories.created': 'Created',
    'memories.updated': 'Updated',
    'memories.type.voice': 'Voice',
    'memories.type.text': 'Text',
    
    // Edit memory
    'edit.title': 'Edit Memory',
    'edit.save': 'Save Changes',
    'edit.cancel': 'Cancel',
    'edit.delete': 'Delete Memory',
    
    // Confirmation dialogs
    'confirm.delete_memory': 'Delete Memory',
    'confirm.delete_memory_text': 'Are you sure you want to delete this memory? This action cannot be undone.',
    'confirm.delete': 'Delete',
    'confirm.cancel': 'Cancel',
    'confirm.discard_changes': 'Discard Changes',
    'confirm.discard_changes_text': 'You have unsaved changes. Are you sure you want to discard them?',
    'confirm.discard': 'Discard',
    
    // Toast messages
    'toast.memory_saved': 'Memory saved! 🎉',
    'toast.memory_updated': 'Memory updated successfully!',
    'toast.memory_deleted': 'Memory deleted successfully',
    'toast.profile_updated': 'Profile updated successfully!',
    'toast.export_success': 'Exported {count} memories successfully!',
    'toast.export_failed': 'Failed to export memories. Please try again.',
    'toast.save_failed': 'Failed to save memory. Please try again.',
    'toast.update_failed': 'Failed to update memory. Please try again.',
    'toast.delete_failed': 'Failed to delete memory. Please try again.',
    'toast.profile_update_failed': 'Failed to update profile. Please try again.',
    
    // Daily prompts
    'prompt.first_job': 'Talk about your first job',
    'prompt.childhood_home': 'Describe your childhood home',
    'prompt.wedding_day': 'Tell me about your wedding day',
    'prompt.family_tradition': 'What was your favorite family tradition?',
    'prompt.school_days': 'Share a memory from your school days',
    'prompt.first_car': 'Describe your first car',
    'prompt.family_vacation': 'Tell me about a family vacation',
    'prompt.mother': 'What was your mother like?',
    'prompt.siblings': 'Share a story about your siblings',
    'prompt.hometown': 'Describe your hometown',
    'prompt.wedding_dress': 'Tell me about your wedding dress or suit',
    'prompt.childhood_games': 'What games did you play as a child?',
    'prompt.favorite_teacher': 'Describe your favorite teacher',
    'prompt.first_pet': 'Tell me about your first pet',
    'prompt.dinner_time': 'What was dinner time like in your family?'
  },
  zh: {
    // App title and branding
    'app.title': 'memoria.ai',
    'app.welcome': '欢迎！让我们开始记录您的回忆吧。',
    'app.hello': '您好，{name}！👋',
    'app.memories_count': '您已保存了 {count} 个{memories}',
    'app.memory': '回忆',
    'app.memories': '回忆',
    
    // Name input
    'name.placeholder': '请输入您的姓名',
    'name.get_started': '开始使用',
    'name.continue_guest': '以访客身份继续',
    
    // Navigation and buttons
    'nav.memories': '回忆',
    'nav.settings': '设置',
    'nav.export_memoir': '导出我的回忆录',
    'nav.previous_prompt': '上一个提示',
    'nav.next_prompt': '下一个提示',
    
    // Recording states
    'record.start': '开始录音',
    'record.recording': '录音中',
    'record.paused': '已暂停',
    'record.continue': '继续录音',
    'record.pause': '暂停',
    'record.stop': '停止',
    'record.delete': '删除',
    'record.save': '保存回忆',
    
    // Settings
    'settings.title': '设置',
    'settings.profile': '个人资料',
    'settings.name': '姓名',
    'settings.language': '语言',
    'settings.language.english': 'English',
    'settings.language.chinese': '中文',
    'settings.data': '数据',
    'settings.export': '导出所有回忆',
    'settings.export_description': '将所有回忆下载为文本文件',
    'settings.about': '关于',
    'settings.version': '版本',
    'settings.save': '保存',
    'settings.cancel': '取消',
    
    // Memories screen
    'memories.title': '我的回忆',
    'memories.empty': '暂无回忆',
    'memories.empty_description': '开始录制您的第一个回忆吧！',
    'memories.search': '搜索回忆...',
    'memories.edit': '编辑',
    'memories.delete': '删除',
    'memories.created': '创建时间',
    'memories.updated': '更新时间',
    'memories.type.voice': '语音',
    'memories.type.text': '文本',
    
    // Edit memory
    'edit.title': '编辑回忆',
    'edit.save': '保存更改',
    'edit.cancel': '取消',
    'edit.delete': '删除回忆',
    
    // Confirmation dialogs
    'confirm.delete_memory': '删除回忆',
    'confirm.delete_memory_text': '您确定要删除这个回忆吗？此操作无法撤销。',
    'confirm.delete': '删除',
    'confirm.cancel': '取消',
    'confirm.discard_changes': '放弃更改',
    'confirm.discard_changes_text': '您有未保存的更改。确定要放弃它们吗？',
    'confirm.discard': '放弃',
    
    // Toast messages
    'toast.memory_saved': '回忆已保存！🎉',
    'toast.memory_updated': '回忆更新成功！',
    'toast.memory_deleted': '回忆删除成功',
    'toast.profile_updated': '个人资料更新成功！',
    'toast.export_success': '成功导出 {count} 个回忆！',
    'toast.export_failed': '导出回忆失败，请重试。',
    'toast.save_failed': '保存回忆失败，请重试。',
    'toast.update_failed': '更新回忆失败，请重试。',
    'toast.delete_failed': '删除回忆失败，请重试。',
    'toast.profile_update_failed': '更新个人资料失败，请重试。',
    
    // Daily prompts
    'prompt.first_job': '谈谈您的第一份工作',
    'prompt.childhood_home': '描述您童年时的家',
    'prompt.wedding_day': '告诉我您的婚礼那天',
    'prompt.family_tradition': '您最喜欢的家庭传统是什么？',
    'prompt.school_days': '分享一个学生时代的回忆',
    'prompt.first_car': '描述您的第一辆车',
    'prompt.family_vacation': '说说家庭度假的经历',
    'prompt.mother': '您的母亲是什么样的人？',
    'prompt.siblings': '分享一个关于兄弟姐妹的故事',
    'prompt.hometown': '描述您的家乡',
    'prompt.wedding_dress': '说说您的婚纱或礼服',
    'prompt.childhood_games': '您小时候玩什么游戏？',
    'prompt.favorite_teacher': '描述您最喜欢的老师',
    'prompt.first_pet': '说说您的第一只宠物',
    'prompt.dinner_time': '您家的晚餐时光是什么样的？'
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load saved language preference
    try {
      const savedLanguage = localStorage.getItem('memoria-language') as Language;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh')) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    try {
      localStorage.setItem('memoria-language', newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    let translation = translations[language][key] || translations.en[key] || key;
    
    // Handle replacements like {name}, {count}, etc.
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        translation = translation.replace(`{${placeholder}}`, String(value));
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}