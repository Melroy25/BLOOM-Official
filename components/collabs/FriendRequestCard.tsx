import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, X, UserPlus, Flame } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { UserProfile } from '../../types/collabs';
import { ProfileAvatar } from '../common/ProfileAvatar';

interface FriendRequestCardProps {
  user: UserProfile;
  onAccept: (userId: string) => void;
  onReject: (userId: string) => void;
  onViewProfile: (userId: string) => void;
}

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({
  user,
  onAccept,
  onReject,
  onViewProfile,
}) => {
  return (
    <View style={[styles.card, Shadows.sm]}>
      <TouchableOpacity
        style={styles.profileRow}
        onPress={() => onViewProfile(user.id)}
        activeOpacity={0.7}
      >
        <ProfileAvatar name={user.name} size={42} />
        <View style={styles.infoCol}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.handle}>{user.handle}</Text>
          <Text style={styles.bio} numberOfLines={1}>{user.bio}</Text>
        </View>
      </TouchableOpacity>

      {/* Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => onAccept(user.id)}
          activeOpacity={0.75}
        >
          <Check size={15} color={Colors.white} strokeWidth={2.4} />
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => onReject(user.id)}
          activeOpacity={0.7}
        >
          <X size={15} color={Colors.mutedText} strokeWidth={2} />
          <Text style={styles.rejectText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface SuggestedFriendCardProps {
  user: UserProfile;
  onAddFriend: (userId: string) => void;
  onViewProfile: (userId: string) => void;
}

export const SuggestedFriendCard: React.FC<SuggestedFriendCardProps> = ({
  user,
  onAddFriend,
  onViewProfile,
}) => {
  const isPending = user.friendshipStatus === 'pending_sent';

  return (
    <View style={[styles.suggestedCard, Shadows.sm]}>
      <TouchableOpacity
        style={styles.suggestedInfo}
        onPress={() => onViewProfile(user.id)}
        activeOpacity={0.7}
      >
        <ProfileAvatar name={user.name} size={40} />
        <View style={styles.infoCol}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.handle}>{user.handle}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.addBtn, isPending && styles.addBtnPending]}
        onPress={() => onAddFriend(user.id)}
        disabled={isPending}
        activeOpacity={0.75}
      >
        {isPending ? (
          <Text style={styles.addBtnTextPending}>Requested</Text>
        ) : (
          <>
            <UserPlus size={14} color={Colors.white} strokeWidth={2} />
            <Text style={styles.addBtnText}>Add</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoCol: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  name: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 15,
    color: Colors.darkText,
  },
  handle: {
    ...Typography.caption,
    color: Colors.mutedText,
    fontSize: 11,
  },
  bio: {
    ...Typography.caption,
    color: Colors.lightText,
    fontSize: 11,
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 7,
    gap: 5,
  },
  acceptText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.white,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.md,
    paddingVertical: 7,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rejectText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  suggestedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  addBtnPending: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addBtnText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.white,
    fontSize: 12,
  },
  addBtnTextPending: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.mutedText,
    fontSize: 12,
  },
});
