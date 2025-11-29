import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

type EventType =
  | 'app_opened'
  | 'user_signed_up'
  | 'user_logged_in'
  | 'recording_started'
  | 'recording_saved'
  | 'recording_deleted'
  | 'memory_viewed'
  | 'memory_edited'
  | 'memory_deleted'
  | 'profile_updated'
  | 'feedback_submitted';

class Analytics {
  static async track(
    event: EventType,
    properties?: Record<string, any>
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('analytics_events').insert({
        user_id: user?.id,
        event_type: event,
        platform: Platform.OS,
        properties: {
          app_version: Constants.expoConfig?.version,
          ...properties,
        },
      });
    } catch (error) {
      // Silent fail - don't break app if analytics fails
      console.log('Analytics error:', error);
    }
  }
}

export default Analytics;
