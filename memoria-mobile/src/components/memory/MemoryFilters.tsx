/**
 * MemoryFilters Component for Memoria.ai
 * Simple filtering and sorting interface optimized for elderly users
 * Features large buttons, clear labels, and intuitive organization
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { MemoryFilters as MemoryFiltersType, MemorySort } from '../../types';
import { useSettingsStore, useMemoryStore } from '../../stores';
import AccessibleButton from '../accessibility/AccessibleButton';

interface MemoryFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters?: (filters: MemoryFiltersType, sort: MemorySort) => void;
  style?: ViewStyle;
}

const MemoryFilters: React.FC<MemoryFiltersProps> = ({
  visible,
  onClose,
  onApplyFilters,
  style,
}) => {
  const {
    getCurrentFontSize,
    getCurrentTouchTargetSize,
    shouldUseHighContrast,
    hapticFeedbackEnabled,
    language
  } = useSettingsStore();

  const { filters, sort, setFilters, setSort, clearFilters } = useMemoryStore();

  const [localFilters, setLocalFilters] = useState<MemoryFiltersType>(filters);
  const [localSort, setLocalSort] = useState<MemorySort>(sort);

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();

  const sortOptions = [
    { field: 'createdAt', direction: 'desc', label: 'Newest First' },
    { field: 'createdAt', direction: 'asc', label: 'Oldest First' },
    { field: 'title', direction: 'asc', label: 'Alphabetical (A-Z)' },
    { field: 'title', direction: 'desc', label: 'Alphabetical (Z-A)' },
    { field: 'duration', direction: 'desc', label: 'Longest First' },
    { field: 'duration', direction: 'asc', label: 'Shortest First' },
  ];

  const languageOptions = [
    { value: 'all', label: 'All Languages' },
    { value: 'en', label: 'English' },
    { value: 'zh', label: 'Chinese' },
  ];

  const quickFilters = [
    {
      key: 'all',
      label: 'All Memories',
      icon: 'library',
      filter: {},
    },
    {
      key: 'favorites',
      label: 'Favorites',
      icon: 'star',
      filter: { isFavorite: true },
    },
    {
      key: 'recent',
      label: 'Recent (7 days)',
      icon: 'time',
      filter: {
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
      },
    },
    {
      key: 'thisMonth',
      label: 'This Month',
      icon: 'calendar',
      filter: {
        dateRange: {
          start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          end: new Date(),
        },
      },
    },
  ];

  const handleQuickFilter = async (filterKey: string, filter: MemoryFiltersType) => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLocalFilters(filter);
  };

  const handleLanguageFilter = async (languageValue: string) => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLocalFilters({
      ...localFilters,
      language: languageValue === 'all' ? undefined : languageValue as 'en' | 'zh',
    });
  };

  const handleSortChange = async (sortOption: typeof sortOptions[0]) => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLocalSort({
      field: sortOption.field as MemorySort['field'],
      direction: sortOption.direction as MemorySort['direction'],
    });
  };

  const handleApplyFilters = async () => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setFilters(localFilters);
    setSort(localSort);
    onApplyFilters?.(localFilters, localSort);
    onClose();
  };

  const handleClearFilters = async () => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const defaultSort: MemorySort = { field: 'createdAt', direction: 'desc' };
    setLocalFilters({});
    setLocalSort(defaultSort);
    clearFilters();
    setSort(defaultSort);
    onClose();
  };

  const handleClose = () => {
    // Reset to current filters if user cancels
    setLocalFilters(filters);
    setLocalSort(sort);
    onClose();
  };

  const isFilterActive = (filterKey: string): boolean => {
    switch (filterKey) {
      case 'all':
        return Object.keys(localFilters).length === 0;
      case 'favorites':
        return localFilters.isFavorite === true;
      case 'recent':
        return !!localFilters.dateRange &&
               localFilters.dateRange.start.getTime() > Date.now() - 8 * 24 * 60 * 60 * 1000;
      case 'thisMonth':
        const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        return !!localFilters.dateRange &&
               localFilters.dateRange.start.getTime() === thisMonthStart.getTime();
      default:
        return false;
    }
  };

  const isSortActive = (sortOption: typeof sortOptions[0]): boolean => {
    return localSort.field === sortOption.field && localSort.direction === sortOption.direction;
  };

  const isLanguageActive = (languageValue: string): boolean => {
    if (languageValue === 'all') {
      return !localFilters.language;
    }
    return localFilters.language === languageValue;
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: highContrast ? '#222222' : '#ffffff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: highContrast ? '#444444' : '#e5e7eb',
    },
    title: {
      fontSize: fontSize + 4,
      fontWeight: 'bold',
      color: highContrast ? '#ffffff' : '#1f2937',
    },
    closeButton: {
      width: touchTargetSize,
      height: touchTargetSize,
      borderRadius: touchTargetSize / 2,
      backgroundColor: highContrast ? '#444444' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 100,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: fontSize + 2,
      fontWeight: '600',
      color: highContrast ? '#ffffff' : '#1f2937',
      marginBottom: 16,
    },
    quickFiltersGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    quickFilterButton: {
      flex: 1,
      minWidth: '45%',
      minHeight: touchTargetSize + 10,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 2,
    },
    quickFilterActive: {
      backgroundColor: '#2563eb',
      borderColor: '#2563eb',
    },
    quickFilterInactive: {
      backgroundColor: highContrast ? '#444444' : '#f8fafc',
      borderColor: highContrast ? '#555555' : '#e5e7eb',
    },
    quickFilterText: {
      fontSize: fontSize,
      fontWeight: '600',
      textAlign: 'center',
    },
    quickFilterActiveText: {
      color: '#ffffff',
    },
    quickFilterInactiveText: {
      color: highContrast ? '#ffffff' : '#374151',
    },
    languageButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    languageButton: {
      flex: 1,
      minHeight: touchTargetSize,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    languageActive: {
      backgroundColor: '#2563eb',
      borderColor: '#2563eb',
    },
    languageInactive: {
      backgroundColor: highContrast ? '#444444' : '#f8fafc',
      borderColor: highContrast ? '#555555' : '#e5e7eb',
    },
    languageText: {
      fontSize: fontSize,
      fontWeight: '600',
    },
    languageActiveText: {
      color: '#ffffff',
    },
    languageInactiveText: {
      color: highContrast ? '#ffffff' : '#374151',
    },
    sortButton: {
      minHeight: touchTargetSize,
      borderRadius: 10,
      padding: 16,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 2,
    },
    sortActive: {
      backgroundColor: '#2563eb',
      borderColor: '#2563eb',
    },
    sortInactive: {
      backgroundColor: highContrast ? '#444444' : '#f8fafc',
      borderColor: highContrast ? '#555555' : '#e5e7eb',
    },
    sortText: {
      fontSize: fontSize,
      fontWeight: '600',
    },
    sortActiveText: {
      color: '#ffffff',
    },
    sortInactiveText: {
      color: highContrast ? '#ffffff' : '#374151',
    },
    actionsContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: highContrast ? '#222222' : '#ffffff',
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: highContrast ? '#444444' : '#e5e7eb',
      flexDirection: 'row',
      gap: 12,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          style={[styles.container, style]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter & Sort</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
            >
              <Ionicons
                name="close"
                size={fontSize + 2}
                color={highContrast ? '#ffffff' : '#6b7280'}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.scrollContent}>
              {/* Quick Filters */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Filters</Text>
                <View style={styles.quickFiltersGrid}>
                  {quickFilters.map((filter) => (
                    <TouchableOpacity
                      key={filter.key}
                      style={[
                        styles.quickFilterButton,
                        isFilterActive(filter.key) ? styles.quickFilterActive : styles.quickFilterInactive,
                      ]}
                      onPress={() => handleQuickFilter(filter.key, filter.filter)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={filter.label}
                      accessibilityState={{ selected: isFilterActive(filter.key) }}
                    >
                      <Ionicons
                        name={filter.icon as any}
                        size={fontSize + 2}
                        color={isFilterActive(filter.key)
                          ? '#ffffff'
                          : (highContrast ? '#ffffff' : '#374151')
                        }
                      />
                      <Text style={[
                        styles.quickFilterText,
                        isFilterActive(filter.key) ? styles.quickFilterActiveText : styles.quickFilterInactiveText,
                      ]}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Language Filter */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Language</Text>
                <View style={styles.languageButtons}>
                  {languageOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.languageButton,
                        isLanguageActive(option.value) ? styles.languageActive : styles.languageInactive,
                      ]}
                      onPress={() => handleLanguageFilter(option.value)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={option.label}
                      accessibilityState={{ selected: isLanguageActive(option.value) }}
                    >
                      <Text style={[
                        styles.languageText,
                        isLanguageActive(option.value) ? styles.languageActiveText : styles.languageInactiveText,
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sort Options */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sort By</Text>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={`${option.field}-${option.direction}`}
                    style={[
                      styles.sortButton,
                      isSortActive(option) ? styles.sortActive : styles.sortInactive,
                    ]}
                    onPress={() => handleSortChange(option)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: isSortActive(option) }}
                  >
                    <Text style={[
                      styles.sortText,
                      isSortActive(option) ? styles.sortActiveText : styles.sortInactiveText,
                    ]}>
                      {option.label}
                    </Text>
                    {isSortActive(option) && (
                      <Ionicons
                        name="checkmark-circle"
                        size={fontSize + 2}
                        color="#ffffff"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <AccessibleButton
              title="Clear All"
              onPress={handleClearFilters}
              variant="secondary"
              style={{ flex: 1 }}
              accessibilityLabel="Clear all filters and reset to default"
            />
            <AccessibleButton
              title="Apply Filters"
              onPress={handleApplyFilters}
              variant="primary"
              style={{ flex: 2 }}
              accessibilityLabel="Apply selected filters and sorting"
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default MemoryFilters;