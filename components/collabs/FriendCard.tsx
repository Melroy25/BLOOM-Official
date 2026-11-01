import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MessageCircle, Flame, UserMinus } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { UserProfile } from '../../types/collabs';
import { ProfileAvatar } from '../common/ProfileAvatar';

interface FriendCardProps {
  user: UserProfile;
  onMessage: (user: UserProfile) => void;
  onRemove: (userId: string) => void;
  onViewProfile: (userId: string) => void;
}

export const FriendCard: React.FC<FriendCardProps> = ({
  user,
  onMessage,
  onRemove,
  onViewProfile,
}) => {
  const handleRemovePress = () => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${user.name} from your Bloom circle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemove(user.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.card, Shadows.sm]}>
      {/* Top Profile Info */}
      <TouchableOpacity
        style={styles.profileRow}
        onPress={() => onViewProfile(user.id)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrapper}>
          <ProfileAvatar name={user.name} size={46} />
          {user.isOnline && <View style={styles.onlineBadge} />}
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.handle}>{user.handle}</Text>
          <View style={styles.streakPill}>
            <Flame size={12} color="#E8A87C" strokeWidth={2.5} />
            <Text style={styles.streakText}>{user.streak}-Day Streak</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.messageBtn}
          onPress={() => onMessage(user)}
          activeOpacity={0.75}
        >
          <MessageCircle size={15} color={Colors.white} strokeWidth={2} />
          <Text style={styles.messageBtnText}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeBtn}
          onPress={handleRemovePress}
          activeOpacity={0.7}
        >
          <UserMinus size={16} color={Colors.mutedText} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.darkText,
  },
  handle: {
    ...Typography.caption,
    color: Colors.mutedText,
    marginBottom: 4,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    alignSelf: 'flex-start',
    gap: 4,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D47E45',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 236, 233, 0.6)',
    paddingTop: Spacing.sm,
  },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  messageBtnText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.white,
    fontSize: 13,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
