import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Share,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Share2,
  Clock,
  Users,
  CheckCircle2,
  Circle,
  Calendar,
  Flame,
  Award,
  Sparkles,
  Check,
  Send,
  Trash2,
  Flag,
  AlertCircle,
  TrendingUp,
  X,
  Compass,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import {
  Challenge,
  ChallengeParticipant,
  ChallengeDailyCheckIn,
  ChallengeComment,
  ChallengeActivity,
} from '../../types/collabs';
import {
  getChallengeById,
  checkIsUserJoined,
  joinChallenge,
  leaveChallenge,
  getChallengeParticipants,
  getParticipantProgress,
  saveDailyCheckIn,
  getChallengeComments,
  addChallengeComment,
  deleteChallengeComment,
  getTodayDateString,
} from '../../services/challengeService';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ChallengeDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const { user, userProfile } = useAuth();
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();

  // Screen State
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoinLoading, setIsJoinLoading] = useState(false);

  // Leave Confirmation Modal
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);

  // Personal Progress & Today's Checklist State
  const [participant, setParticipant] = useState<ChallengeParticipant | null>(null);
  const [checkIns, setCheckIns] = useState<Record<string, ChallengeDailyCheckIn>>({});
  const [todayCompletedActivities, setTodayCompletedActivities] = useState<string[]>([]);
  const [isSavingCheckIn, setIsSavingCheckIn] = useState(false);
  const [milestoneCelebration, setMilestoneCelebration] = useState<string | null>(null);

  // Participants Tab/List State
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  // Community Discussion State
  const [comments, setComments] = useState<ChallengeComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  const todayStr = useMemo(() => getTodayDateString(), []);

  // 1. Load Challenge Document
  const loadChallengeData = useCallback(async () => {
    if (!challengeId) return;
    setIsLoading(true);
    try {
      const data = await getChallengeById(challengeId);
      setChallenge(data);

      if (user?.uid) {
        const joined = await checkIsUserJoined(challengeId, user.uid);
        setIsJoined(joined);

        if (joined) {
          const progressData = await getParticipantProgress(challengeId, user.uid);
          setParticipant(progressData.participant);
          setCheckIns(progressData.checkIns);

          // Today's activities
          const todayRecord = progressData.checkIns[todayStr];
          if (todayRecord) {
            setTodayCompletedActivities(todayRecord.completedActivities || []);
          }
        }
      }

      // Load participants and comments in background
      loadParticipants();
      loadComments();
    } catch (err) {
      console.warn('[ChallengeDetails] Error loading challenge:', err);
    } finally {
      setIsLoading(false);
    }
  }, [challengeId, user?.uid, todayStr]);

  const loadParticipants = async () => {
    if (!challengeId) return;
    setParticipantsLoading(true);
    try {
      const list = await getChallengeParticipants(challengeId, 25);
      setParticipants(list);
    } catch {
    } finally {
      setParticipantsLoading(false);
    }
  };

  const loadComments = async () => {
    if (!challengeId) return;
    setCommentsLoading(true);
    try {
      const list = await getChallengeComments(challengeId, 40);
      setComments(list);
    } catch {
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    loadChallengeData();
  }, [loadChallengeData]);

  // Handle Share
  const handleShare = async () => {
    if (!challenge) return;
    try {
      await Share.share({
        message: `Join me on BLOOM for the "${challenge.title}" challenge! 🌿 Let's grow together: https://bloom.app/challenge/${challenge.id}`,
        title: challenge.title,
      });
    } catch (_) {}
  };

  // Join Action
  const handleJoin = async () => {
    if (!challenge || !user) {
      Alert.alert('Sign In Required', 'Please log in to join community challenges.');
      return;
    }
    setIsJoinLoading(true);
    try {
      const displayName = userProfile?.fullName || user.displayName || 'Bloom Member';
      const avatar = userProfile?.photoURL || user.photoURL || '';
      await joinChallenge(challenge.id, {
        uid: user.uid,
        name: displayName,
        avatar,
      });

      setIsJoined(true);
      setChallenge((prev) =>
        prev ? { ...prev, participantsCount: prev.participantsCount + 1 } : null
      );

      // Reload progress state
      const progressData = await getParticipantProgress(challenge.id, user.uid);
      setParticipant(progressData.participant);
      setCheckIns(progressData.checkIns);
      loadParticipants();

      setMilestoneCelebration(`🎉 You joined ${challenge.title}! Let's do this.`);
      setTimeout(() => setMilestoneCelebration(null), 3500);
    } catch (err: any) {
      Alert.alert('Could Not Join', err?.message || 'Please try again later.');
    } finally {
      setIsJoinLoading(false);
    }
  };

  // Leave Action
  const confirmLeave = async () => {
    if (!challenge || !user) return;
    try {
      await leaveChallenge(challenge.id, user.uid);
      setIsJoined(false);
      setParticipant(null);
      setCheckIns({});
      setTodayCompletedActivities([]);
      setChallenge((prev) =>
        prev
          ? {
              ...prev,
              participantsCount: Math.max(0, prev.participantsCount - 1),
            }
          : null
      );
      setLeaveModalVisible(false);
      loadParticipants();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not leave challenge.');
    }
  };

  // Toggle Activity Checklist Item
  const handleToggleActivity = async (activityId: string) => {
    if (!challenge || !user) return;
    if (isSavingCheckIn) return;

    const currentCompleted = [...todayCompletedActivities];
    const isAlreadyChecked = currentCompleted.includes(activityId);

    const nextCompleted = isAlreadyChecked
      ? currentCompleted.filter((id) => id !== activityId)
      : [...currentCompleted, activityId];

    setTodayCompletedActivities(nextCompleted);
    setIsSavingCheckIn(true);

    try {
      const totalActivitiesCount = challenge.dailyActivities?.length || 1;
      const result = await saveDailyCheckIn(
        challenge.id,
        user.uid,
        todayStr,
        nextCompleted,
        totalActivitiesCount
      );

      // Update local checkIns map
      setCheckIns((prev) => ({
        ...prev,
        [todayStr]: {
          id: todayStr,
          date: todayStr,
          completedActivities: nextCompleted,
          completed: result.completed,
          completionPercentage: result.completionPercentage,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }));

      // Update participant stats
      setParticipant((prev) => {
        if (!prev) return null;
        const currentCompletedDays = prev.completedDays || 0;
        return {
          ...prev,
          completedDays: result.completed ? currentCompletedDays + 1 : currentCompletedDays,
          currentStreak: result.completed ? (prev.currentStreak || 0) + 1 : prev.currentStreak,
          completionPercentage: result.completionPercentage,
        };
      });

      if (result.completed) {
        setMilestoneCelebration(`🌟 Outstanding! You completed all activities for today!`);
        setTimeout(() => setMilestoneCelebration(null), 3500);
      }
    } catch (err: any) {
      console.warn('[CheckIn] Error saving check in:', err);
    } finally {
      setIsSavingCheckIn(false);
    }
  };

  // Post Discussion Comment
  const handlePostComment = async () => {
    if (!challenge || !user || !commentText.trim()) return;
    setIsPostingComment(true);
    try {
      const displayName = userProfile?.fullName || user.displayName || 'Bloom Member';
      const avatar = userProfile?.photoURL || user.photoURL || '';

      const newId = await addChallengeComment(
        challenge.id,
        { uid: user.uid, name: displayName, avatar },
        commentText
      );

      const optimisticComment: ChallengeComment = {
        id: newId,
        challengeId: challenge.id,
        uid: user.uid,
        displayName,
        avatarUrl: avatar,
        message: commentText.trim(),
        createdAt: new Date(),
      };

      setComments((prev) => [optimisticComment, ...prev]);
      setCommentText('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not post comment.');
    } finally {
      setIsPostingComment(false);
    }
  };

  // Delete User's Own Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!challenge) return;
    try {
      await deleteChallengeComment(challenge.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      Alert.alert('Error', 'Could not delete comment.');
    }
  };

  // DYNAMIC TIMELINE GENERATOR (Section 6-E)
  // Generates breakdown into weeks based on durationDays (7, 14, 21, 30, 75, 90, etc.)
  const timelineWeeks = useMemo(() => {
    const totalDays = challenge?.durationDays || 30;
    const weeks: Array<{
      weekNumber: number;
      label: string;
      days: Array<{
        dayNumber: number;
        isCompleted: boolean;
        isToday: boolean;
      }>;
    }> = [];

    const numWeeks = Math.ceil(totalDays / 7);

    // Compute which day number corresponds to today based on startDate
    let currentDayNumber = 1;
    if (challenge?.startDate) {
      const start = new Date(challenge.startDate).getTime();
      const now = new Date(todayStr).getTime();
      const diffDays = Math.floor((now - start) / 86400000) + 1;
      currentDayNumber = Math.min(Math.max(1, diffDays), totalDays);
    }

    const completedDaysCount = participant?.completedDays || 0;

    for (let w = 0; w < numWeeks; w++) {
      const startDay = w * 7 + 1;
      const endDay = Math.min((w + 1) * 7, totalDays);
      const days = [];

      for (let d = startDay; d <= endDay; d++) {
        days.push({
          dayNumber: d,
          isCompleted: d <= completedDaysCount,
          isToday: d === currentDayNumber,
        });
      }

      weeks.push({
        weekNumber: w + 1,
        label: `Week ${w + 1} (Days ${startDay}–${endDay})`,
        days,
      });
    }

    return { weeks, currentDayNumber, totalDays };
  }, [challenge?.durationDays, challenge?.startDate, participant?.completedDays, todayStr]);

  // Compute Completion %
  const totalDays = challenge?.durationDays || 30;
  const completedDays = participant?.completedDays || 0;
  const overallProgressPercent = Math.min(
    100,
    Math.round((completedDays / Math.max(1, totalDays)) * 100)
  );

  // --------------------------------------------------------------------------
  // RENDER STATES: Loading & Not Found
  // --------------------------------------------------------------------------
  if (isLoading) {
    return (
      <View style={[styles.loadingScreen, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color="#365B45" />
        <Text style={styles.loadingTitle}>Opening Challenge...</Text>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={[styles.loadingScreen, { paddingTop: topInset }]}>
        <Compass size={48} color="#789B83" strokeWidth={1.5} />
        <Text style={styles.notFoundTitle}>Challenge Not Found</Text>
        <Text style={styles.notFoundSubtitle}>
          This challenge may have been removed or is no longer available.
        </Text>
        <TouchableOpacity
          style={styles.backBtnPill}
          onPress={() => router.back()}
        >
          <ArrowLeft size={16} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={styles.backBtnPillText}>Back to Discovery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ------------------------------------------------------------- */}
      {/* A. TOP NAVIGATION BAR                                         */}
      {/* ------------------------------------------------------------- */}
      <View style={[styles.topNavRow, { paddingTop: topInset + 4 }]}>
        <TouchableOpacity
          style={[styles.navCircleBtn, Shadows.sm]}
          onPress={() => router.back()}
          accessibilityLabel="Back to Global Trends"
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#141E19" strokeWidth={2.2} />
        </TouchableOpacity>

        <Text style={styles.navHeaderTitle} numberOfLines={1}>
          {challenge.title}
        </Text>

        <TouchableOpacity
          style={[styles.navCircleBtn, Shadows.sm]}
          onPress={handleShare}
          accessibilityLabel="Share challenge"
          activeOpacity={0.7}
        >
          <Share2 size={18} color="#365B45" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* Floating Milestone Celebration Banner */}
      {milestoneCelebration && (
        <View style={[styles.celebrationToast, Shadows.md]}>
          <Sparkles size={16} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.celebrationToastText}>{milestoneCelebration}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ------------------------------------------------------------- */}
        {/* B. COVER SECTION                                              */}
        {/* ------------------------------------------------------------- */}
        <View style={[styles.coverContainer, Shadows.sm]}>
          <Image
            source={{
              uri:
                challenge.coverImageUrl ||
                'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=75',
            }}
            style={styles.coverImage}
            resizeMode="cover"
          />

          <View style={styles.coverBadgeRow}>
            <View style={styles.coverCategoryBadge}>
              <Text style={styles.coverCategoryBadgeText}>
                {challenge.category}
              </Text>
            </View>

            <View style={styles.coverStatusBadge}>
              <Text style={styles.coverStatusBadgeText}>
                {challenge.status || 'Active'}
              </Text>
            </View>
          </View>
        </View>

        {/* Title & Creator Row */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>{challenge.title}</Text>
          <Text style={styles.shortDescription}>
            {challenge.shortDescription || challenge.description}
          </Text>

          {challenge.creatorName && (
            <View style={styles.creatorRow}>
              <View style={styles.creatorAvatarCircle}>
                <Text style={styles.creatorAvatarText}>
                  {challenge.creatorName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.creatorLabel}>
                Created by <Text style={styles.creatorNameText}>{challenge.creatorName}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* ------------------------------------------------------------- */}
        {/* C. CHALLENGE INFORMATION ROW                                  */}
        {/* ------------------------------------------------------------- */}
        <View style={[styles.infoGridCard, Shadows.sm]}>
          <View style={styles.infoCol}>
            <Clock size={18} color="#365B45" strokeWidth={2} />
            <Text style={styles.infoVal}>
              {challenge.duration || `${challenge.durationDays || 30} Days`}
            </Text>
            <Text style={styles.infoLabel}>Duration</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoCol}>
            <Users size={18} color="#365B45" strokeWidth={2} />
            <Text style={styles.infoVal}>
              {(challenge.participantsCount || 0).toLocaleString()}
            </Text>
            <Text style={styles.infoLabel}>Participants</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoCol}>
            <Calendar size={18} color="#365B45" strokeWidth={2} />
            <Text style={styles.infoVal}>
              {challenge.startDate ? challenge.startDate.slice(5) : 'Today'}
            </Text>
            <Text style={styles.infoLabel}>Start Date</Text>
          </View>
        </View>

        {/* ------------------------------------------------------------- */}
        {/* F. JOIN / LEAVE ACTION BUTTON                                 */}
        {/* ------------------------------------------------------------- */}
        <View style={styles.actionWrap}>
          {isJoined ? (
            <View style={styles.joinedBannerRow}>
              <View style={styles.joinedIndicator}>
                <CheckCircle2 size={18} color="#365B45" strokeWidth={2.4} />
                <Text style={styles.joinedIndicatorText}>You have joined this challenge</Text>
              </View>

              <TouchableOpacity
                style={styles.leaveBtn}
                onPress={() => setLeaveModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.leaveBtnText}>Leave</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.primaryJoinBtn, Shadows.md]}
              onPress={handleJoin}
              disabled={isJoinLoading}
              activeOpacity={0.85}
            >
              {isJoinLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Sparkles size={18} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.primaryJoinBtnText}>Join Challenge 🌱</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ------------------------------------------------------------- */}
        {/* G. PERSONAL CHALLENGE PROGRESS (Visible when Joined)          */}
        {/* ------------------------------------------------------------- */}
        {isJoined && (
          <View style={[styles.progressCard, Shadows.md]}>
            <View style={styles.progressCardHeader}>
              <View>
                <Text style={styles.progressTitle}>Your Personal Progress</Text>
                <Text style={styles.progressSubtitle}>
                  Day {timelineWeeks.currentDayNumber} of {timelineWeeks.totalDays}
                </Text>
              </View>

              <View style={styles.streakBadge}>
                <Flame size={14} color="#E88B5D" strokeWidth={2.4} />
                <Text style={styles.streakBadgeText}>
                  {participant?.currentStreak || 0} Day Streak
                </Text>
              </View>
            </View>

            {/* Overall Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${overallProgressPercent}%` },
                ]}
              />
            </View>

            <View style={styles.progressStatsRow}>
              <Text style={styles.progressStatItem}>
                <Text style={styles.boldStat}>{completedDays}</Text> / {totalDays} days completed
              </Text>
              <Text style={styles.progressPercentText}>{overallProgressPercent}%</Text>
            </View>

            {/* TODAY'S DAILY ACTIVITIES CHECKLIST */}
            <View style={styles.todayTasksSection}>
              <Text style={styles.todaySectionTitle}>Today's Daily Activities</Text>
              <Text style={styles.todaySectionSubtitle}>
                Complete all activities below to count today as finished.
              </Text>

              <View style={styles.tasksList}>
                {(challenge.dailyActivities || []).map((activity) => {
                  const isChecked = todayCompletedActivities.includes(activity.id);
                  return (
                    <TouchableOpacity
                      key={activity.id}
                      style={[
                        styles.taskCheckRow,
                        isChecked && styles.taskCheckRowChecked,
                      ]}
                      onPress={() => handleToggleActivity(activity.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkSquare,
                          isChecked && styles.checkSquareChecked,
                        ]}
                      >
                        {isChecked && (
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        )}
                      </View>

                      <View style={styles.taskTextCol}>
                        <Text
                          style={[
                            styles.taskTitle,
                            isChecked && styles.taskTitleChecked,
                          ]}
                        >
                          {activity.title}
                        </Text>
                        {activity.description ? (
                          <Text style={styles.taskDesc}>{activity.description}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* E. DYNAMIC TIMELINE BREAKDOWN (Section 6-E)                   */}
        {/* ------------------------------------------------------------- */}
        <View style={[styles.timelineCard, Shadows.sm]}>
          <Text style={styles.sectionHeading}>Challenge Timeline</Text>
          <Text style={styles.sectionSubHeading}>
            {timelineWeeks.totalDays}-day milestone progression
          </Text>

          <View style={styles.weeksContainer}>
            {timelineWeeks.weeks.map((week) => (
              <View key={`week_${week.weekNumber}`} style={styles.weekBlock}>
                <Text style={styles.weekLabel}>{week.label}</Text>

                <View style={styles.daysRow}>
                  {week.days.map((d) => (
                    <View
                      key={`day_${d.dayNumber}`}
                      style={[
                        styles.dayCircle,
                        d.isCompleted && styles.dayCircleCompleted,
                        d.isToday && styles.dayCircleToday,
                      ]}
                    >
                      {d.isCompleted ? (
                        <Check size={10} color="#FFFFFF" strokeWidth={3} />
                      ) : (
                        <Text
                          style={[
                            styles.dayNumberText,
                            d.isToday && styles.dayNumberTextToday,
                          ]}
                        >
                          {d.dayNumber}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ------------------------------------------------------------- */}
        {/* D. ABOUT & RULES SECTION                                      */}
        {/* ------------------------------------------------------------- */}
        <View style={[styles.aboutCard, Shadows.sm]}>
          <Text style={styles.sectionHeading}>About this Challenge</Text>
          <Text style={styles.fullDescText}>{challenge.description}</Text>

          {challenge.rules && challenge.rules.length > 0 && (
            <View style={styles.rulesContainer}>
              <Text style={styles.rulesTitle}>Challenge Rules & Guidance</Text>
              {challenge.rules.map((rule, idx) => (
                <View key={idx} style={styles.ruleItem}>
                  <View style={styles.ruleDot} />
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ------------------------------------------------------------- */}
        {/* H. PARTICIPANTS SECTION (Section 8)                           */}
        {/* ------------------------------------------------------------- */}
        <View style={[styles.participantsCard, Shadows.sm]}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeading}>Participants</Text>
              <Text style={styles.sectionSubHeading}>
                Ranked by consistency & completed days
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {participants.length} Active
              </Text>
            </View>
          </View>

          {participantsLoading ? (
            <ActivityIndicator size="small" color="#365B45" style={{ padding: 16 }} />
          ) : participants.length === 0 ? (
            <Text style={styles.emptyNotice}>No participants listed yet.</Text>
          ) : (
            <View style={styles.participantList}>
              {participants.map((p, index) => (
                <View key={p.id || index} style={styles.participantRow}>
                  <View style={styles.rankCol}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>

                  <View style={styles.pAvatarCircle}>
                    <Text style={styles.pAvatarText}>
                      {(p.displayName || 'B').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.pInfoCol}>
                    <Text style={styles.pName} numberOfLines={1}>
                      {p.displayName}
                    </Text>
                    <Text style={styles.pStreak}>
                      {p.currentStreak || 0} day streak 🔥
                    </Text>
                  </View>

                  <View style={styles.pCompletedBadge}>
                    <Text style={styles.pCompletedText}>
                      {p.completedDays || 0} days
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ------------------------------------------------------------- */}
        {/* I. COMMUNITY DISCUSSION / COMMENTS (Section 9)               */}
        {/* ------------------------------------------------------------- */}
        <View style={[styles.commentsCard, Shadows.sm]}>
          <Text style={styles.sectionHeading}>Community Discussion</Text>
          <Text style={styles.sectionSubHeading}>
            Ask questions, share updates, and cheer each other on
          </Text>

          {/* Comment Input Box */}
          {user ? (
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your thought or question..."
                placeholderTextColor="#A5AEA8"
                value={commentText}
                onChangeText={setCommentText}
                maxLength={1000}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendCommentBtn,
                  !commentText.trim() && styles.sendCommentBtnDisabled,
                ]}
                onPress={handlePostComment}
                disabled={isPostingComment || !commentText.trim()}
              >
                {isPostingComment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={16} color="#FFFFFF" strokeWidth={2.4} />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.signInToCommentBox}>
              <Text style={styles.signInToCommentText}>
                Please log in to join the challenge discussion.
              </Text>
            </View>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <ActivityIndicator size="small" color="#365B45" style={{ padding: 16 }} />
          ) : comments.length === 0 ? (
            <Text style={styles.emptyNotice}>
              No comments yet. Start the conversation! 💬
            </Text>
          ) : (
            <View style={styles.commentsList}>
              {comments.map((comment) => {
                const isMyComment = user?.uid && comment.uid === user.uid;
                return (
                  <View key={comment.id} style={styles.commentBubble}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentAuthorRow}>
                        <View style={styles.commentAvatar}>
                          <Text style={styles.commentAvatarText}>
                            {(comment.displayName || 'B').slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.commentAuthorName}>
                          {comment.displayName}
                        </Text>
                      </View>

                      {isMyComment && (
                        <TouchableOpacity
                          onPress={() => handleDeleteComment(comment.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={13} color="#D98B8B" strokeWidth={2} />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.commentMessage}>{comment.message}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ------------------------------------------------------------- */}
      {/* LEAVE CONFIRMATION MODAL                                      */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={leaveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLeaveModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, Shadows.lg]}>
            <Text style={styles.modalTitle}>Leave Challenge?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to leave {challenge.title}? Your historical check-in
              records will be preserved if you choose to return later.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setLeaveModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalLeaveBtn}
                onPress={confirmLeave}
              >
                <Text style={styles.modalLeaveBtnText}>Leave Challenge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#FAF8F2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: 12,
  },
  loadingTitle: {
    fontSize: 14,
    color: '#365B45',
    fontWeight: '600',
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#141E19',
    marginTop: 8,
  },
  notFoundSubtitle: {
    fontSize: 13,
    color: Colors.mutedText,
    textAlign: 'center',
    maxWidth: 280,
  },
  backBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#365B45',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.round,
    marginTop: 12,
  },
  backBtnPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 10,
    backgroundColor: '#FAF8F2',
    zIndex: 10,
  },
  navCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  navHeaderTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#141E19',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  celebrationToast: {
    position: 'absolute',
    top: 90,
    left: 20,
    right: 20,
    backgroundColor: '#365B45',
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 999,
  },
  celebrationToastText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.huge,
    gap: 16,
  },
  coverContainer: {
    width: '100%',
    height: 120, // Compact landscape banner
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E8F1E8',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverBadgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
  },
  coverCategoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  coverCategoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },
  coverStatusBadge: {
    backgroundColor: 'rgba(54, 91, 69, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  coverStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  titleSection: {
    gap: 6,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#141E19',
    letterSpacing: -0.4,
  },
  shortDescription: {
    fontSize: 13,
    color: Colors.mutedText,
    lineHeight: 18,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  creatorAvatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#365B45',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  creatorLabel: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  creatorNameText: {
    fontWeight: '700',
    color: '#141E19',
  },
  infoGridCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  infoCol: {
    alignItems: 'center',
    gap: 3,
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#141E19',
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 10,
    color: Colors.mutedText,
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#F0F4F1',
  },
  actionWrap: {
    marginVertical: 2,
  },
  primaryJoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#365B45',
    paddingVertical: 14,
    borderRadius: BorderRadius.round,
  },
  primaryJoinBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  joinedBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F1E8',
    borderRadius: BorderRadius.round,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  joinedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  joinedIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#365B45',
  },
  leaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.white,
  },
  leaveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D98B8B',
  },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    gap: 12,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#141E19',
  },
  progressSubtitle: {
    fontSize: 12,
    color: '#789B83',
    fontWeight: '600',
    marginTop: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDF1EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  streakBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E88B5D',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F0F4F1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#365B45',
    borderRadius: 4,
  },
  progressStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressStatItem: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  boldStat: {
    fontWeight: '700',
    color: '#141E19',
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#365B45',
  },
  todayTasksSection: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F1',
    gap: 8,
  },
  todaySectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#141E19',
  },
  todaySectionSubtitle: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  tasksList: {
    gap: 8,
    marginTop: 4,
  },
  taskCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FAF8F2',
    borderRadius: BorderRadius.md,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  taskCheckRowChecked: {
    backgroundColor: '#E8F1E8',
    borderColor: '#789B83',
  },
  checkSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: '#789B83',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  checkSquareChecked: {
    backgroundColor: '#365B45',
    borderColor: '#365B45',
  },
  taskTextCol: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#141E19',
  },
  taskTitleChecked: {
    textDecorationLine: 'line-through',
    color: '#7B857F',
  },
  taskDesc: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 2,
  },
  timelineCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    gap: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#141E19',
  },
  sectionSubHeading: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  weeksContainer: {
    gap: 12,
    marginTop: 4,
  },
  weekBlock: {
    gap: 6,
  },
  weekLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleCompleted: {
    backgroundColor: '#365B45',
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: '#E88B5D',
  },
  dayNumberText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7B857F',
  },
  dayNumberTextToday: {
    color: '#E88B5D',
    fontWeight: '800',
  },
  aboutCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    gap: 8,
  },
  fullDescText: {
    fontSize: 13,
    color: '#29332E',
    lineHeight: 20,
  },
  rulesContainer: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F1',
    gap: 6,
  },
  rulesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#141E19',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  ruleDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#789B83',
    marginTop: 6,
  },
  ruleText: {
    flex: 1,
    fontSize: 12,
    color: Colors.mutedText,
    lineHeight: 18,
  },
  participantsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countBadge: {
    backgroundColor: '#E8F1E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#365B45',
  },
  participantList: {
    gap: 8,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F1',
    gap: 10,
  },
  rankCol: {
    width: 22,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#789B83',
  },
  pAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D9EEE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },
  pInfoCol: {
    flex: 1,
  },
  pName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#141E19',
  },
  pStreak: {
    fontSize: 10,
    color: Colors.mutedText,
  },
  pCompletedBadge: {
    backgroundColor: '#FAF8F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  pCompletedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#365B45',
  },
  commentsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    gap: 10,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#FAF8F2',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#141E19',
    maxHeight: 80,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  sendCommentBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#365B45',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendCommentBtnDisabled: {
    opacity: 0.5,
  },
  signInToCommentBox: {
    padding: Spacing.md,
    backgroundColor: '#FAF8F2',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  signInToCommentText: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  commentsList: {
    gap: 10,
    marginTop: 4,
  },
  commentBubble: {
    backgroundColor: '#FAF8F2',
    borderRadius: BorderRadius.md,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#789B83',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  commentAuthorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#141E19',
  },
  commentMessage: {
    fontSize: 12,
    color: '#29332E',
    lineHeight: 17,
  },
  emptyNotice: {
    fontSize: 12,
    color: Colors.mutedText,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 25, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#141E19',
  },
  modalMessage: {
    fontSize: 13,
    color: Colors.mutedText,
    lineHeight: 18,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  modalLeaveBtn: {
    backgroundColor: '#D98B8B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
  },
  modalLeaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
