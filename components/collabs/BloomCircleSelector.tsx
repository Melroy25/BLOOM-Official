import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Globe, Users } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { BloomCircleTab } from '../../types/collabs';

interface BloomCircleSelectorProps {
  activeTab: BloomCircleTab;
  onTabChange: (tab: BloomCircleTab) => void;
  myCircleBadge?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(136, (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.lg) / 2);

export const BloomCircleSelector: React.FC<BloomCircleSelectorProps> = ({
  activeTab,
  onTabChange,
  myCircleBadge = 0,
}) => {
  const isGlobal = activeTab === 'global';
  const isMyCircle = activeTab === 'my_circle';

  return (
    <View style={styles.container}>
      <View style={styles.circlesRow}>
        {/* Circle 1: Global Circle */}
        <TouchableOpacity
          style={[
            styles.circle,
            isGlobal ? styles.circleActive : styles.circleInactive,
            Shadows.sm,
          ]}
          onPress={() => onTabChange('global')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.iconWrapper,
              isGlobal ? styles.iconWrapperActive : styles.iconWrapperInactive,
            ]}
          >
            <Globe
              size={24}
              color={isGlobal ? Colors.white : Colors.primaryDark}
              strokeWidth={2}
            />
          </View>
          <Text
            style={[
              styles.circleText,
              isGlobal ? styles.circleTextActive : styles.circleTextInactive,
            ]}
          >
            Global Circle
          </Text>
        </TouchableOpacity>

        {/* Circle 2: My Circle */}
        <TouchableOpacity
          style={[
            styles.circle,
            isMyCircle ? styles.circleActive : styles.circleInactive,
            Shadows.sm,
          ]}
          onPress={() => onTabChange('my_circle')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.iconWrapper,
              isMyCircle ? styles.iconWrapperActive : styles.iconWrapperInactive,
            ]}
          >
            <Users
              size={24}
              color={isMyCircle ? Colors.white : Colors.primaryDark}
              strokeWidth={2}
            />
          </View>
          <Text
            style={[
              styles.circleText,
              isMyCircle ? styles.circleTextActive : styles.circleTextInactive,
            ]}
          >
            My Circle
          </Text>

          {myCircleBadge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{myCircleBadge}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  circlesRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    gap: Spacing.md,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 2,
    position: 'relative',
  },
  circleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  circleInactive: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconWrapperInactive: {
    backgroundColor: Colors.lightSage,
  },
  circleText: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  circleTextActive: {
    color: Colors.white,
  },
  circleTextInactive: {
    color: Colors.darkText,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
