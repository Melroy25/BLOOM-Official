import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, Search } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import { ProfileAvatar } from '../common/ProfileAvatar';

interface CollabsHeaderProps {
  userName: string;
  onProfilePress: () => void;
  onNotificationPress: () => void;
  onSearchPress: () => void;
  searchActive?: boolean;
}

export const CollabsHeader: React.FC<CollabsHeaderProps> = ({
  userName,
  onProfilePress,
  onNotificationPress,
  onSearchPress,
  searchActive = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Bloom Circle</Text>
          <Text style={styles.subtitle}>Grow together. Connect. Inspire.</Text>
        </View>

        <View style={styles.rightIcons}>
          {/* Search Button */}
          <TouchableOpacity
            style={[styles.iconButton, searchActive && styles.iconButtonActive]}
            onPress={onSearchPress}
            activeOpacity={0.7}
          >
            <Search
              size={20}
              color={searchActive ? Colors.white : Colors.darkText}
              strokeWidth={1.8}
            />
          </TouchableOpacity>

          {/* Notification Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Bell size={20} color={Colors.darkText} strokeWidth={1.8} />
            <View style={styles.notifDot} />
          </TouchableOpacity>

          {/* Profile Avatar Button */}
          <TouchableOpacity onPress={onProfilePress} activeOpacity={0.8}>
            <ProfileAvatar name={userName} size={38} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...Typography.h1,
    fontSize: 28,
    color: Colors.darkText,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    fontSize: 13,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  iconButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
});
