import React from 'react';
import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { Colors } from '@/constants/Colors';

/**
 * Custom Toast Configuration for Memoria.ai
 *
 * Optimized for elderly users with:
 * - Large text (18px minimum)
 * - High contrast colors
 * - Bottom positioning with slide-up animation
 * - Comfortable padding and spacing
 */

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#4CAF50',
        borderLeftWidth: 8,
        backgroundColor: '#FFFFFF',
        height: 80,
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
      }}
      text1Style={{
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
      }}
      text2Style={{
        fontSize: 16,
        fontWeight: '400',
        color: '#4a4a4a',
        lineHeight: 22,
      }}
      text2NumberOfLines={2}
    />
  ),

  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#F44336',
        borderLeftWidth: 8,
        backgroundColor: '#FFFFFF',
        height: 80,
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
      }}
      text1Style={{
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
      }}
      text2Style={{
        fontSize: 16,
        fontWeight: '400',
        color: '#4a4a4a',
        lineHeight: 22,
      }}
      text2NumberOfLines={2}
    />
  ),

  warning: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#FF9800',
        borderLeftWidth: 8,
        backgroundColor: '#FFFFFF',
        height: 80,
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
      }}
      text1Style={{
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
      }}
      text2Style={{
        fontSize: 16,
        fontWeight: '400',
        color: '#4a4a4a',
        lineHeight: 22,
      }}
      text2NumberOfLines={2}
    />
  ),

  info: (props: any) => (
    <InfoToast
      {...props}
      style={{
        borderLeftColor: '#2196F3',
        borderLeftWidth: 8,
        backgroundColor: '#FFFFFF',
        height: 80,
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
      }}
      text1Style={{
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
      }}
      text2Style={{
        fontSize: 16,
        fontWeight: '400',
        color: '#4a4a4a',
        lineHeight: 22,
      }}
      text2NumberOfLines={2}
    />
  ),
};
