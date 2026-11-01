import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Flame, Trophy, Award, Users, Sparkles } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { LeaderboardUser, UserProfile } from '../../types/collabs';
import { ProfileAvatar } from '../common/ProfileAvatar';

interface StreakAndLeaderboardProps {
  personalStreak: number;
  friends: UserProfile[];
  leaderboard: LeaderboardUser[];
  onUserPress: (userId: string) => void;
}

export const StreakAndLeaderboard: React.FC<StreakAndLeaderboardProps> = ({
  personalStreak,
  friends,
  leaderboard,
  onUserPress,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. Personal Streak Card */}
      <View style={[styles.streakCard, Shadows.sm]}>
        <View style={styles.streakLeft}>
          <View style={styles.flameCircle}>
            <Flame size={28} color="#D47E45" strokeWidth={2.4} />
          </View>
          <View>
            <View style={styles.streakTitleRow}>
              <Text style={styles.streakCount}>{personalStreak} Days</Text>
              <View style={styles.onFireBadge}>
                <Text style={styles.onFireText}>ACTIVE STREAK</Text>
              </View>
            </View>
            <Text style={styles.streakSub}>2 days until your 14-Day Milestone! 🌱</Text>
          </View>
        </View>
      </View>

      {/* 2. Friends' Streaks Horizontal Row */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Friends' Streaks</Text>
        <Text style={styles.sectionSub}>Inspiring one another</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.friendsStreakScroll}
      >
        {friends.map(f => (
          <TouchableOpacity
            key={f.id}
            style={styles.friendStreakPill}
            onPress={() => onUserPress(f.id)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarWithFlame}>
              <ProfileAvatar name={f.name} size={36} />
              <View style={styles.miniFlameBadge}>
                <Flame size={10} color="#D47E45" strokeWidth={2.5} />
              </View>
            </View>
            <Text style={styles.friendStreakName} numberOfLines={1}>
              {f.name.split(' ')[0]}
            </Text>
            <Text style={styles.friendStreakVal}>{f.streak}d</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 3. Group Streaks */}
      <View style={[styles.groupStreakCard, Shadows.sm]}>
        <View style={styles.groupHeader}>
          <View style={styles.groupIconCircle}>
            <Users size={16} color={Colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.groupTextCol}>
            <Text style={styles.groupTitle}>Study & Focus Circle</Text>
            <Text style={styles.groupSub}>6 friends participating</Text>
          </View>
          <View style={styles.groupStreakBadge}>
            <Flame size={12} color="#D47E45" strokeWidth={2.4} />
            <Text style={styles.groupStreakText}>15d Group Streak</Text>
          </View>
        </View>
      </View>

      {/* 4. Weekly Leaderboard */}
      <View style={[styles.leaderboardCard, Shadows.sm]}>
        <View style={styles.leaderboardHeader}>
          <View style={styles.leaderboardTitleGroup}>
            <Trophy size={18} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.leaderboardTitle}>Weekly Encouragement Board</Text>
          </View>
          <Text style={styles.leaderboardSub}>Celebrating consistency & growth</Text>
        </View>

        {leaderboard.map((item, idx) => {
          const isTop3 = item.rank <= 3;
          const medalColors = ['#F5C542', '#B0B0B0', '#CD7F32'];

          return (
            <TouchableOpacity
              key={item.userId}
              style={[
                styles.leaderItem,
                item.isMe && styles.myLeaderItem,
                idx === leaderboard.length - 1 && styles.lastLeaderItem,
              ]}
              onPress={() => onUserPress(item.userId)}
              activeOpacity={0.7}
            >
              {/* Rank Badge */}
              <View
                style={[
                  styles.rankCircle,
                  isTop3 && { backgroundColor: medalColors[item.rank - 1] + '25' },
                ]}
              >
                {isTop3 ? (
                  <Award
                    size={14}
                    color={medalColors[item.rank - 1]}
                    strokeWidth={2.5}
                  />
                ) : (
                  <Text style={styles.rankNum}>{item.rank}</Text>
                )}
              </View>

              {/* User Avatar & Name */}
              <ProfileAvatar name={item.name} size={32} />

              <View style={styles.leaderInfo}>
                <View style={styles.leaderNameRow}>
                  <Text style={[styles.leaderName, item.isMe && styles.myNameText]}>
                    {item.name} {item.isMe ? '(You)' : ''}
                  </Text>
                </View>
                <Text style={styles.leaderHandle}>{item.handle}</Text>
              </View>

              {/* Points & Streak */}
              <View style={styles.pointsWrap}>
                <Text style={styles.pointsText}>{item.bloomPoints} pts</Text>
                <View style={styles.streakSmall}>
                  <Flame size={10} color="#D47E45" strokeWidth={2} />
                  <Text style={styles.streakSmallText}>{item.streakDays}d</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8F2',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F7E5DA',
    marginBottom: Spacing.lg,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flameCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFEBD9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  streakCount: {
    ...Typography.h2,
    fontSize: 22,
    color: '#3B2412',
  },
  onFireBadge: {
    backgroundColor: '#E8A87C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  onFireText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  streakSub: {
    ...Typography.caption,
    color: Colors.mutedText,
    fontSize: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.darkText,
  },
  sectionSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.lightText,
  },
  friendsStreakScroll: {
    gap: 10,
    paddingBottom: Spacing.md,
  },
  friendStreakPill: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    width: 72,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarWithFlame: {
    position: 'relative',
    marginBottom: 4,
  },
  miniFlameBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFEBD9',
    borderRadius: 6,
    padding: 1,
  },
  friendStreakName: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 1,
  },
  friendStreakVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D47E45',
  },
  groupStreakCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  groupTextCol: {
    flex: 1,
  },
  groupTitle: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 14,
    color: Colors.darkText,
  },
  groupSub: {
    ...Typography.caption,
    color: Colors.mutedText,
    fontSize: 11,
  },
  groupStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    gap: 3,
  },
  groupStreakText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D47E45',
  },
  leaderboardCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leaderboardHeader: {
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
  },
  leaderboardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  leaderboardTitle: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 15,
    color: Colors.darkText,
  },
  leaderboardSub: {
    ...Typography.caption,
    color: Colors.mutedText,
    fontSize: 11,
  },
  leaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 236, 233, 0.6)',
  },
  myLeaderItem: {
    backgroundColor: Colors.lightSage + '50',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xs,
  },
  lastLeaderItem: {
    borderBottomWidth: 0,
  },
  rankCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rankNum: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 11,
    color: Colors.mutedText,
  },
  leaderInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  leaderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderName: {
    ...Typography.body,
    fontWeight: '600',
    fontSize: 13,
    color: Colors.darkText,
  },
  myNameText: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  leaderHandle: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.lightText,
  },
  pointsWrap: {
    alignItems: 'flex-end',
  },
  pointsText: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 13,
    color: Colors.primary,
  },
  streakSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakSmallText: {
    fontSize: 10,
    color: '#D47E45',
    fontWeight: '600',
  },
});
