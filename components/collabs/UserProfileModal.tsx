import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TouchableWithoutFeedback,
} from 'react-native';
import { X, Flame, Trophy, Award, Lock, Shield, Check } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { UserProfile } from '../../types/collabs';
import { ProfileAvatar } from '../common/ProfileAvatar';

interface UserProfileModalProps {
  visible: boolean;
  user: UserProfile | null;
  onClose: () => void;
  isCurrentUser?: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  user,
  onClose,
  isCurrentUser = false,
}) => {
  const [publicProfile, setPublicProfile] = useState(true);
  const [showStreak, setShowStreak] = useState(true);
  const [allowDMs, setAllowDMs] = useState(true);

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheetContainer, Shadows.lg]}>
              <View style={styles.handleBar} />

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={18} color={Colors.mutedText} strokeWidth={2} />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                  <ProfileAvatar name={user.name} size={64} />
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userHandle}>{user.handle}</Text>
                  <Text style={styles.userBio}>{user.bio}</Text>
                </View>

                {/* Stats Counters Grid */}
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Flame size={16} color="#D47E45" strokeWidth={2.4} />
                    <Text style={styles.statNum}>{user.streak}d</Text>
                    <Text style={styles.statLabel}>Streak</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Trophy size={16} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.statNum}>{user.challengesJoined}</Text>
                    <Text style={styles.statLabel}>Challenges</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Award size={16} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.statNum}>{user.friendsCount}</Text>
                    <Text style={styles.statLabel}>Friends</Text>
                  </View>
                </View>

                {/* Achievement Badges */}
                <Text style={styles.sectionTitle}>Earned Badges</Text>
                <View style={styles.badgesRow}>
                  {user.badges.length > 0 ? (
                    user.badges.map(b => (
                      <View key={b.id} style={styles.badgePill}>
                        <Award size={13} color={Colors.primaryDark} strokeWidth={2.2} />
                        <Text style={styles.badgePillText}>{b.name}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noBadgesText}>
                      Participate in challenges to unlock badges! 🌱
                    </Text>
                  )}
                </View>

                {/* Privacy Settings (if current user) */}
                {isCurrentUser && (
                  <>
                    <View style={styles.privacyHeaderRow}>
                      <Shield size={16} color={Colors.primaryDark} strokeWidth={2} />
                      <Text style={styles.sectionTitle}>Community Privacy</Text>
                    </View>

                    <View style={styles.settingItem}>
                      <View style={styles.settingText}>
                        <Text style={styles.settingTitle}>Public Profile</Text>
                        <Text style={styles.settingSub}>
                          Visible in community discussions and search
                        </Text>
                      </View>
                      <Switch
                        value={publicProfile}
                        onValueChange={setPublicProfile}
                        trackColor={{ false: Colors.border, true: Colors.primary }}
                        thumbColor={Colors.white}
                      />
                    </View>

                    <View style={styles.settingItem}>
                      <View style={styles.settingText}>
                        <Text style={styles.settingTitle}>Show Daily Streaks</Text>
                        <Text style={styles.settingSub}>
                          Display streak badges to inspire friends
                        </Text>
                      </View>
                      <Switch
                        value={showStreak}
                        onValueChange={setShowStreak}
                        trackColor={{ false: Colors.border, true: Colors.primary }}
                        thumbColor={Colors.white}
                      />
                    </View>

                    <View style={styles.settingItem}>
                      <View style={styles.settingText}>
                        <Text style={styles.settingTitle}>Direct Messages</Text>
                        <Text style={styles.settingSub}>
                          Allow Bloom circle friends to message you
                        </Text>
                      </View>
                      <Switch
                        value={allowDMs}
                        onValueChange={setAllowDMs}
                        trackColor={{ false: Colors.border, true: Colors.primary }}
                        thumbColor={Colors.white}
                      />
                    </View>
                  </>
                )}

                <View style={{ height: Spacing.xl }} />
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(41, 51, 46, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    maxHeight: '85%',
    position: 'relative',
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  userName: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.darkText,
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  userHandle: {
    ...Typography.caption,
    color: Colors.mutedText,
    marginBottom: Spacing.sm,
  },
  userBio: {
    ...Typography.bodySmall,
    color: Colors.darkText,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNum: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.darkText,
    marginTop: 4,
  },
  statLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.mutedText,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: Spacing.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    gap: 5,
  },
  badgePillText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  noBadgesText: {
    ...Typography.caption,
    color: Colors.mutedText,
    fontStyle: 'italic',
  },
  privacyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
  },
  settingSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
  },
});
