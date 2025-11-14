/**
 * Cultural Calendar Utilities for Memoria.ai
 * Handles Chinese holidays, traditional festivals, and family celebrations
 * Provides memory prompts and cultural context for elderly users
 */

import { CulturalCalendarEvent, CulturalMemoryPrompt, ChineseRelationshipLabels } from '../types';

// Chinese Traditional Holidays (Lunar Calendar)
export const CHINESE_TRADITIONAL_HOLIDAYS: Omit<CulturalCalendarEvent, 'id' | 'familyId' | 'customForFamily'>[] = [
  {
    name: 'Spring Festival',
    nameLabels: {
      en: 'Spring Festival (Chinese New Year)',
      zh: '春节',
      pinyin: 'Chūn Jié'
    },
    description: 'The most important traditional Chinese holiday celebrating the beginning of the lunar new year',
    descriptionLabels: {
      en: 'The most important traditional Chinese holiday celebrating the beginning of the lunar new year',
      zh: '中国最重要的传统节日，庆祝农历新年的开始',
      pinyin: 'Zhōngguó zuì zhòngyào de chuántǒng jiérì, qìngzhù nónglì xīnnián de kāishǐ'
    },
    date: new Date(), // This would be calculated based on lunar calendar
    isRecurring: true,
    recurrencePattern: 'lunar-new-year',
    duration: 15,
    type: 'traditional_holiday',
    culturalSignificance: 'Family reunion, ancestor veneration, hope for prosperity in the new year',
    traditionalActivities: [
      'Family reunion dinner (年夜饭)',
      'Red envelope giving (压岁钱)',
      'Fireworks and dragon dances',
      'Visiting relatives and friends',
      'Cleaning house before New Year',
      'Preparing traditional foods'
    ],
    isPrivate: false,
    encouragesSharing: true,
    suggestedActivities: [
      'Record family reunion stories',
      'Share childhood New Year memories',
      'Tell stories about traditional customs',
      'Describe favorite New Year foods'
    ],
    memoryPrompts: []
  },
  {
    name: 'Mid-Autumn Festival',
    nameLabels: {
      en: 'Mid-Autumn Festival',
      zh: '中秋节',
      pinyin: 'Zhōngqiū Jié'
    },
    description: 'Festival celebrating family unity and the full moon',
    descriptionLabels: {
      en: 'Festival celebrating family unity and the full moon',
      zh: '庆祝家庭团圆和满月的节日',
      pinyin: 'Qìngzhù jiātíng tuányuán hé mǎnyuè de jiérì'
    },
    date: new Date(), // Calculated based on lunar calendar
    isRecurring: true,
    recurrencePattern: 'lunar-15th-8th-month',
    duration: 3,
    type: 'traditional_holiday',
    culturalSignificance: 'Family unity, harmony, gratitude for harvest',
    traditionalActivities: [
      'Moon viewing (赏月)',
      'Eating mooncakes (月饼)',
      'Family gatherings',
      'Lantern displays',
      'Sharing stories and poems'
    ],
    isPrivate: false,
    encouragesSharing: true,
    suggestedActivities: [
      'Share memories of making mooncakes',
      'Tell stories about moon viewing traditions',
      'Describe family Mid-Autumn celebrations',
      'Share poems or stories about the moon'
    ],
    memoryPrompts: []
  },
  {
    name: 'Dragon Boat Festival',
    nameLabels: {
      en: 'Dragon Boat Festival',
      zh: '端午节',
      pinyin: 'Duānwǔ Jié'
    },
    description: 'Traditional festival commemorating poet Qu Yuan',
    descriptionLabels: {
      en: 'Traditional festival commemorating poet Qu Yuan',
      zh: '纪念诗人屈原的传统节日',
      pinyin: 'Jìniàn shīrén Qū Yuán de chuántǒng jiérì'
    },
    date: new Date(), // 5th day of 5th lunar month
    isRecurring: true,
    recurrencePattern: 'lunar-5th-5th-month',
    duration: 1,
    type: 'traditional_holiday',
    culturalSignificance: 'Honoring patriotic spirit, warding off evil, community bonding',
    traditionalActivities: [
      'Dragon boat racing (龙舟比赛)',
      'Eating zongzi (粽子)',
      'Hanging herbs and talismans',
      'Drinking realgar wine',
      'Community celebrations'
    ],
    isPrivate: false,
    encouragesSharing: true,
    suggestedActivities: [
      'Share memories of making zongzi',
      'Tell stories about dragon boat races',
      'Describe traditional protective rituals',
      'Share community celebration memories'
    ],
    memoryPrompts: []
  },
  {
    name: 'Qingming Festival',
    nameLabels: {
      en: 'Qingming Festival (Tomb Sweeping Day)',
      zh: '清明节',
      pinyin: 'Qīngmíng Jié'
    },
    description: 'Day for honoring ancestors and visiting graves',
    descriptionLabels: {
      en: 'Day for honoring ancestors and visiting graves',
      zh: '缅怀祖先和扫墓的日子',
      pinyin: 'Miǎnhuái zǔxiān hé sǎomù de rìzi'
    },
    date: new Date(), // Usually April 4-6
    isRecurring: true,
    recurrencePattern: 'solar-april-4-6',
    duration: 1,
    type: 'memorial',
    culturalSignificance: 'Ancestor veneration, filial piety, family continuity',
    traditionalActivities: [
      'Tomb sweeping (扫墓)',
      'Offering food and flowers',
      'Burning incense and paper money',
      'Family grave visits',
      'Sharing ancestor stories'
    ],
    isPrivate: false,
    encouragesSharing: true,
    suggestedActivities: [
      'Share stories about departed family members',
      'Tell about ancestor traditions',
      'Describe family grave visiting customs',
      'Share wisdom passed down from elders'
    ],
    memoryPrompts: []
  },
  {
    name: 'Lantern Festival',
    nameLabels: {
      en: 'Lantern Festival',
      zh: '元宵节',
      pinyin: 'Yuánxiāo Jié'
    },
    description: 'Festival marking the end of Chinese New Year celebrations',
    descriptionLabels: {
      en: 'Festival marking the end of Chinese New Year celebrations',
      zh: '标志着春节庆祝活动结束的节日',
      pinyin: 'Biāozhì zhe Chūnjié qìngzhù huódòng jiéshù de jiérì'
    },
    date: new Date(), // 15th day of 1st lunar month
    isRecurring: true,
    recurrencePattern: 'lunar-15th-1st-month',
    duration: 1,
    type: 'traditional_holiday',
    culturalSignificance: 'Reunion, brightness, hope for the future',
    traditionalActivities: [
      'Lantern displays and parades',
      'Eating tangyuan (汤圆)',
      'Solving lantern riddles',
      'Lion and dragon dances',
      'Family gatherings'
    ],
    isPrivate: false,
    encouragesSharing: true,
    suggestedActivities: [
      'Share memories of beautiful lanterns',
      'Tell stories about solving riddles',
      'Describe family lantern traditions',
      'Share tangyuan making memories'
    ],
    memoryPrompts: []
  }
];

// Cultural Memory Prompts
export const CULTURAL_MEMORY_PROMPTS: CulturalMemoryPrompt[] = [
  // Spring Festival Prompts
  {
    id: 'spring_festival_reunion',
    prompt: 'Tell us about your most memorable Chinese New Year family reunion',
    promptLabels: {
      en: 'Tell us about your most memorable Chinese New Year family reunion',
      zh: '告诉我们您最难忘的春节家庭团聚',
      pinyin: 'Gàosù wǒmen nín zuì nánwàng de Chūnjié jiātíng tuánjù'
    },
    context: 'Spring Festival is the most important time for family reunions in Chinese culture',
    contextLabels: {
      en: 'Spring Festival is the most important time for family reunions in Chinese culture',
      zh: '春节是中国文化中家庭团聚最重要的时刻',
      pinyin: 'Chūnjié shì Zhōngguó wénhuà zhōng jiātíng tuánjù zuì zhòngyào de shíkè'
    },
    targetRole: 'elder',
    culturalRelevance: 'chinese_traditional',
    category: 'tradition',
    difficulty: 'moderate',
    estimatedDuration: 10,
    tags: ['spring_festival', 'family_reunion', 'tradition', 'celebration']
  },
  {
    id: 'childhood_new_year',
    prompt: 'What did Chinese New Year mean to you as a child?',
    promptLabels: {
      en: 'What did Chinese New Year mean to you as a child?',
      zh: '您小时候春节对您意味着什么？',
      pinyin: 'Nín xiǎoshíhou Chūnjié duì nín yìwèi zhe shénme?'
    },
    targetRole: 'elder',
    culturalRelevance: 'chinese_traditional',
    category: 'childhood',
    difficulty: 'simple',
    estimatedDuration: 8,
    tags: ['childhood', 'spring_festival', 'memories', 'tradition']
  },
  {
    id: 'traditional_foods',
    prompt: 'Share a story about preparing traditional festival foods with your family',
    promptLabels: {
      en: 'Share a story about preparing traditional festival foods with your family',
      zh: '分享一个和家人一起准备传统节日食物的故事',
      pinyin: 'Fēnxiǎng yīgè hé jiārén yīqǐ zhǔnbèi chuántǒng jiérì shíwù de gùshì'
    },
    culturalRelevance: 'chinese_traditional',
    category: 'tradition',
    difficulty: 'moderate',
    estimatedDuration: 12,
    tags: ['food', 'tradition', 'family', 'cooking', 'festival']
  },
  {
    id: 'wisdom_from_elders',
    prompt: 'What important life wisdom did your parents or grandparents teach you?',
    promptLabels: {
      en: 'What important life wisdom did your parents or grandparents teach you?',
      zh: '您的父母或祖父母教给您什么重要的人生智慧？',
      pinyin: 'Nín de fùmǔ huò zǔfùmǔ jiào gěi nín shénme zhòngyào de rénshēng zhìhuì?'
    },
    targetRole: 'elder',
    culturalRelevance: 'universal',
    category: 'wisdom',
    difficulty: 'detailed',
    estimatedDuration: 15,
    tags: ['wisdom', 'family_history', 'values', 'teachings']
  },
  {
    id: 'cultural_traditions',
    prompt: 'Describe a cultural tradition that was important in your family',
    promptLabels: {
      en: 'Describe a cultural tradition that was important in your family',
      zh: '描述一个在您家庭中很重要的文化传统',
      pinyin: 'Miáoshù yīgè zài nín jiātíng zhōng hěn zhòngyào de wénhuà chuántǒng'
    },
    culturalRelevance: 'chinese_traditional',
    category: 'tradition',
    difficulty: 'moderate',
    estimatedDuration: 10,
    tags: ['tradition', 'culture', 'family', 'customs']
  },
  {
    id: 'hometown_memories',
    prompt: 'Tell us about the place where you grew up and what made it special',
    promptLabels: {
      en: 'Tell us about the place where you grew up and what made it special',
      zh: '告诉我们您成长的地方以及它的特别之处',
      pinyin: 'Gàosù wǒmen nín chéngzhǎng de dìfāng yǐjí tā de tèbié zhī chù'
    },
    culturalRelevance: 'universal',
    category: 'childhood',
    difficulty: 'moderate',
    estimatedDuration: 12,
    tags: ['hometown', 'childhood', 'geography', 'memories']
  },
  {
    id: 'family_values',
    prompt: 'What values were most important in your family growing up?',
    promptLabels: {
      en: 'What values were most important in your family growing up?',
      zh: '您成长时家庭中最重要的价值观是什么？',
      pinyin: 'Nín chéngzhǎng shí jiātíng zhōng zuì zhòngyào de jiàzhíguān shì shénme?'
    },
    targetRole: 'elder',
    culturalRelevance: 'chinese_traditional',
    category: 'family_history',
    difficulty: 'detailed',
    estimatedDuration: 15,
    tags: ['values', 'family', 'upbringing', 'character']
  }
];

// Utility functions for cultural calendar
export class CulturalCalendarUtils {
  /**
   * Calculate Chinese lunar calendar dates
   * Note: This is a simplified version. A full implementation would use a proper lunar calendar library
   */
  static calculateLunarDate(year: number, month: number, day: number): Date {
    // This would integrate with a proper Chinese lunar calendar library
    // For now, returning approximate solar calendar equivalents
    const lunarToSolarApprox = {
      'spring_festival': new Date(year, 1, 1), // Approximate February 1st
      'mid_autumn': new Date(year, 8, 15), // Approximate September 15th
      'dragon_boat': new Date(year, 5, 15), // Approximate June 15th
      'lantern_festival': new Date(year, 1, 15), // Approximate February 15th
    };

    return new Date(year, month, day);
  }

  /**
   * Get upcoming Chinese holidays for the next N days
   */
  static getUpcomingHolidays(daysAhead: number = 60): CulturalCalendarEvent[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;

    const holidays: CulturalCalendarEvent[] = [];

    // Add current year and next year holidays
    [currentYear, nextYear].forEach(year => {
      CHINESE_TRADITIONAL_HOLIDAYS.forEach(holiday => {
        const holidayEvent: CulturalCalendarEvent = {
          ...holiday,
          id: `${holiday.name.toLowerCase().replace(/\s+/g, '_')}_${year}`,
          date: this.calculateLunarDate(year, 0, 1), // Simplified calculation
          familyId: undefined,
          isPrivate: false,
          customForFamily: false,
          memoryPrompts: this.getMemoryPromptsForHoliday(holiday.name)
        };
        holidays.push(holidayEvent);
      });
    });

    // Filter to upcoming holidays within the specified timeframe
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return holidays
      .filter(holiday => holiday.date >= now && holiday.date <= futureDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Get memory prompts for a specific holiday
   */
  static getMemoryPromptsForHoliday(holidayName: string): CulturalMemoryPrompt[] {
    const holidayTags = {
      'Spring Festival': ['spring_festival', 'new_year'],
      'Mid-Autumn Festival': ['mid_autumn', 'moon_festival'],
      'Dragon Boat Festival': ['dragon_boat', 'zongzi'],
      'Qingming Festival': ['qingming', 'ancestors'],
      'Lantern Festival': ['lantern_festival', 'tangyuan']
    };

    const tags = holidayTags[holidayName] || [];

    return CULTURAL_MEMORY_PROMPTS.filter(prompt =>
      tags.some(tag => prompt.tags.includes(tag))
    );
  }

  /**
   * Get culturally appropriate prompts based on user role and family context
   */
  static getCulturalPrompts(
    role: string,
    culturalRelevance: string = 'chinese_traditional',
    category?: string
  ): CulturalMemoryPrompt[] {
    return CULTURAL_MEMORY_PROMPTS.filter(prompt => {
      const roleMatch = !prompt.targetRole || prompt.targetRole === role;
      const cultureMatch = prompt.culturalRelevance === 'universal' ||
                          prompt.culturalRelevance === culturalRelevance;
      const categoryMatch = !category || prompt.category === category;

      return roleMatch && cultureMatch && categoryMatch;
    });
  }

  /**
   * Generate family-specific cultural events
   */
  static createFamilyEvent(
    familyId: string,
    name: string,
    nameLabels: ChineseRelationshipLabels,
    date: Date,
    type: 'birthday' | 'anniversary' | 'memorial' | 'custom',
    culturalSignificance?: string
  ): CulturalCalendarEvent {
    return {
      id: `family_${familyId}_${Date.now()}`,
      name,
      nameLabels,
      date,
      isRecurring: type === 'birthday' || type === 'anniversary',
      recurrencePattern: type === 'birthday' || type === 'anniversary' ? 'yearly' : undefined,
      type: type === 'custom' ? 'family_celebration' : type,
      culturalSignificance: culturalSignificance || 'Important family milestone',
      traditionalActivities: this.getTraditionalActivitiesForEventType(type),
      familyTraditions: [],
      familyId,
      isPrivate: true,
      customForFamily: true,
      memoryPrompts: this.getMemoryPromptsForEventType(type),
      encouragesSharing: true,
      suggestedActivities: this.getSuggestedActivitiesForEventType(type)
    };
  }

  /**
   * Get traditional activities for different event types
   */
  private static getTraditionalActivitiesForEventType(type: string): string[] {
    const activities = {
      birthday: [
        'Longevity noodles (长寿面)',
        'Birthday cake sharing',
        'Red egg distribution',
        'Family blessing ceremony',
        'Photo taking and memory sharing'
      ],
      anniversary: [
        'Renewal of vows or commitments',
        'Family dinner celebration',
        'Sharing relationship stories',
        'Looking through old photos',
        'Creating new family traditions'
      ],
      memorial: [
        'Moment of silence',
        'Sharing stories about the departed',
        'Lighting incense or candles',
        'Looking at photos and mementos',
        'Continuing their traditions'
      ],
      custom: [
        'Family gathering',
        'Special meal preparation',
        'Story sharing',
        'Photo taking',
        'Creating new memories'
      ]
    };

    return activities[type] || activities.custom;
  }

  /**
   * Get memory prompts for different event types
   */
  private static getMemoryPromptsForEventType(type: string): CulturalMemoryPrompt[] {
    // Filter existing prompts that are relevant to the event type
    const relevantTags = {
      birthday: ['birthday', 'celebration', 'family'],
      anniversary: ['anniversary', 'love', 'family'],
      memorial: ['memorial', 'family_history', 'wisdom'],
      custom: ['family', 'celebration', 'tradition']
    };

    const tags = relevantTags[type] || relevantTags.custom;

    return CULTURAL_MEMORY_PROMPTS.filter(prompt =>
      tags.some(tag => prompt.tags.includes(tag))
    ).slice(0, 3); // Limit to 3 most relevant prompts
  }

  /**
   * Get suggested activities for different event types
   */
  private static getSuggestedActivitiesForEventType(type: string): string[] {
    const activities = {
      birthday: [
        'Share birthday memories from childhood',
        'Tell stories about growing older',
        'Describe favorite birthday traditions',
        'Share wisdom gained over the years'
      ],
      anniversary: [
        'Tell the story of how you met',
        'Share favorite memories together',
        'Describe how your relationship has grown',
        'Talk about hopes for the future'
      ],
      memorial: [
        'Share favorite memories of them',
        'Tell stories about their wisdom',
        'Describe how they influenced your life',
        'Share traditions they taught you'
      ],
      custom: [
        'Explain why this day is special',
        'Share related family stories',
        'Describe family traditions',
        'Talk about hopes and dreams'
      ]
    };

    return activities[type] || activities.custom;
  }

  /**
   * Validate if a cultural action is appropriate based on family hierarchy
   */
  static validateCulturalRespect(
    action: string,
    fromRole: string,
    toRole: string,
    fromGeneration: number,
    toGeneration: number
  ): boolean {
    // Respect hierarchy: younger generations should be respectful to elders
    if (toGeneration < fromGeneration) {
      // Speaking to an elder
      const respectfulActions = [
        'share_memory_respectfully',
        'ask_for_wisdom',
        'invite_politely',
        'request_permission'
      ];

      if (!respectfulActions.includes(action)) {
        return false;
      }
    }

    // Elders can be more direct with younger generations
    if (fromGeneration < toGeneration) {
      return true; // Elders have more freedom in communication
    }

    return true; // Same generation or other relationships are generally acceptable
  }

  /**
   * Get appropriate language and tone for family communication
   */
  static getCulturalCommunicationStyle(
    fromRole: string,
    toRole: string,
    fromGeneration: number,
    toGeneration: number,
    language: 'en' | 'zh'
  ): {
    formality: 'formal' | 'casual' | 'intimate';
    honorific: string;
    greeting: string;
  } {
    let formality: 'formal' | 'casual' | 'intimate' = 'casual';
    let honorific = '';
    let greeting = '';

    // Determine formality based on relationship
    if (toGeneration < fromGeneration) {
      // Speaking to elder
      formality = 'formal';
      honorific = language === 'zh' ? '您' : 'respected';
      greeting = language === 'zh' ? '您好' : 'Hello (respectfully)';
    } else if (toGeneration > fromGeneration) {
      // Speaking to younger
      formality = 'casual';
      honorific = language === 'zh' ? '你' : '';
      greeting = language === 'zh' ? '你好' : 'Hello';
    } else {
      // Same generation
      formality = 'casual';
      honorific = language === 'zh' ? '你' : '';
      greeting = language === 'zh' ? '你好' : 'Hello';
    }

    return { formality, honorific, greeting };
  }
}