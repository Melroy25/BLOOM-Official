import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { X, Check, Plus, Clock, Users, Flame, Sparkles } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { Challenge } from '../../types/collabs';

interface ChallengeDetailModalProps {
  visible: boolean;
  challenge: Challenge | null;
  onClose: () => void;
  onJoinToggle: (challengeId: string) => void;
  onLogProgress: (challengeId: string) => void;
}

export const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({
  visible,
  challenge,
  onClose,
  onJoinToggle,
  onLogProgress,
}) => {
  if (!challenge) return null;

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
                {/* Category Badge & Title */}
                <View style={styles.topBadge}>
                  <Sparkles size={12} color={Colors.primary} strokeWidth={2} />
                  <Text style={styles.badgeText}>{challenge.category} Challenge</Text>
                </View>

                <Text style={styles.title}>{challenge.title}</Text>
                <Text style={styles.description}>{challenge.description}</Text>

                {/* Meta stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Clock size={16} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.statVal}>{challenge.duration}</Text>
                    <Text style={styles.statLabel}>Duration</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Users size={16} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.statVal}>
                      {challenge.participantsCount.toLocaleString()}
                    </Text>
                    <Text style={styles.statLabel}>Participants</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Flame size={16} color="#E8A87C" strokeWidth={2} />
                    <Text style={styles.statVal}>{challenge.userProgress ?? 0}%</Text>
                    <Text style={styles.statLabel}>Your Progress</Text>
                  </View>
                </View>

                {/* Daily Checklist Tasks */}
                <Text style={styles.sectionHeader}>Challenge Milestones</Text>
                <View style={styles.tasksList}>
                  {challenge.dailyTasks?.map((task: string, idx: number) => (
                    <View key={idx} style={styles.taskItem}>
                      <View
                        style={[
                          styles.checkIcon,
                          challenge.isJoined && (challenge.userProgress ?? 0) >= (idx + 1) * 20
                            ? styles.checkIconDone
                            : null,
                        ]}
                      >
                        <Check
                          size={12}
                          color={
                            challenge.isJoined && (challenge.userProgress ?? 0) >= (idx + 1) * 20
                              ? Colors.white
                              : Colors.mutedText
                          }
                          strokeWidth={2.4}
                        />
                      </View>
                      <Text style={styles.taskText}>{task}</Text>
                    </View>
                  ))}
                </View>

                {/* Progress Log Action (if joined) */}
                {challenge.isJoined && (challenge.userProgress ?? 0) < 100 && (
                  <TouchableOpacity
                    style={styles.logProgressBtn}
                    onPress={() => onLogProgress(challenge.id)}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={16} color={Colors.primaryDark} strokeWidth={2} />
                    <Text style={styles.logProgressText}>
                      Log Today's Milestone (+15%)
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Join / Leave Button */}
                <TouchableOpacity
                  style={[
                    styles.joinBtn,
                    challenge.isJoined ? styles.leaveBtn : styles.joinBtnPrimary,
                  ]}
                  onPress={() => onJoinToggle(challenge.id)}
                  activeOpacity={0.8}
                >
                  {challenge.isJoined ? (
                    <Text style={styles.leaveBtnText}>Leave Challenge</Text>
                  ) : (
                    <>
                      <Plus size={16} color={Colors.white} strokeWidth={2.4} />
                      <Text style={styles.joinBtnText}>Join This Challenge</Text>
                    </>
                  )}
                </TouchableOpacity>

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
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightSage,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  badgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  title: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.darkText,
    marginBottom: 6,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    lineHeight: 20,
    marginBottom: Spacing.lg,
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
  statVal: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 14,
    color: Colors.darkText,
    marginTop: 4,
  },
  statLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.mutedText,
  },
  sectionHeader: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: Spacing.sm,
  },
  tasksList: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: 10,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  checkIconDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  taskText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.darkText,
    flex: 1,
  },
  logProgressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lightSage,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    gap: 8,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  logProgressText: {
    ...Typography.button,
    color: Colors.primaryDark,
    fontSize: 14,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    gap: 6,
  },
  joinBtnPrimary: {
    backgroundColor: Colors.primary,
  },
  leaveBtn: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  joinBtnText: {
    ...Typography.button,
    fontSize: 15,
    color: Colors.white,
  },
  leaveBtnText: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.error,
  },
});
