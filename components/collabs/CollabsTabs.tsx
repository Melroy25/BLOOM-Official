import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Globe, Users, Trophy } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { CollabTab } from '../../types/collabs';

interface CollabsTabsProps {
  activeTab: CollabTab;
  onTabChange: (tab: CollabTab) => void;
  pendingRequestsCount?: number;
}

export const CollabsTabs: React.FC<CollabsTabsProps> = ({
  activeTab,
  onTabChange,
  pendingRequestsCount = 0,
}) => {
  const tabs = [
    { key: 'global' as const, label: 'Global', Icon: Globe },
    { key: 'friends' as const, label: 'Friends', Icon: Users, badge: pendingRequestsCount },
    { key: 'challenges' as const, label: 'Challenges', Icon: Trophy },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.pillContainer}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.75}
            >
              <tab.Icon
                size={16}
                color={isActive ? Colors.white : Colors.mutedText}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>

              {tab.badge && tab.badge > 0 ? (
                <View
                  style={[
                    styles.badgeContainer,
                    isActive ? styles.badgeActive : styles.badgeInactive,
                  ]}
                >
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.round,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: BorderRadius.round,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    fontSize: 13,
    color: Colors.mutedText,
  },
  tabLabelActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  badgeContainer: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 2,
  },
  badgeActive: {
    backgroundColor: Colors.white,
  },
  badgeInactive: {
    backgroundColor: Colors.error,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
});
