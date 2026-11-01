import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Leaf,
  ArrowRight,
  ArrowLeft,
  Check,
  Smile,
  Sparkles,
  Heart,
  Target,
  GraduationCap,
  Briefcase,
  Compass,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

// Onboarding Steps Definition
const TOTAL_STEPS = 6;

const MOOD_OPTIONS = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Calm', emoji: '🌿' },
  { label: 'Motivated', emoji: '🔥' },
  { label: 'Okay', emoji: '😌' },
  { label: 'Stressed', emoji: '😰' },
  { label: 'Anxious', emoji: '🌪️' },
  { label: 'Sad', emoji: '🌧️' },
  { label: 'Overwhelmed', emoji: '🤯' },
];

const WHY_BLOOM_OPTIONS = [
  'Mental wellness',
  'Better productivity',
  'Task management',
  'Digital wellbeing',
  'Connecting with people',
  'Building healthy habits',
];

const ROLE_OPTIONS = [
  { label: 'Student', icon: GraduationCap, description: 'High school, college, or university' },
  { label: 'Working Professional', icon: Briefcase, description: 'Early career or corporate' },
  { label: 'Freelancer / Creator', icon: Sparkles, description: 'Self-employed or independent' },
  { label: 'Exploring / Other', icon: Compass, description: 'Taking time to grow' },
];

const GOAL_OPTIONS = [
  'Reduce stress & anxiety',
  'Build study & focus streaks',
  'Master time management',
  'Sleep better & recharge',
  'Mindful breathing & calm breaks',
  'Connect with peers & share growth',
];

const IMPROVE_OPTIONS = [
  'Daily study focus sessions',
  'Emotional awareness & tracking',
  'Screen time & scrolling balance',
  'Habit consistency & streaks',
  'AI companion daily reflections',
  'Healthy lifestyle routines',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, userProfile, completeUserOnboarding } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load persisted onboarding step for returning user
  useEffect(() => {
    if (!user?.uid) return;
    AsyncStorage.getItem(`@bloom_onboarding_step_${user.uid}`)
      .then((savedStep) => {
        if (savedStep) {
          const stepNum = parseInt(savedStep, 10);
          if (stepNum >= 1 && stepNum <= TOTAL_STEPS) {
            setCurrentStep(stepNum);
          }
        }
      })
      .catch(() => {});
  }, [user?.uid]);

  // Keep name synced if profile loads after initial mount
  useEffect(() => {
    if (!name && (userProfile?.fullName || user?.displayName)) {
      setName(userProfile?.fullName || user?.displayName || '');
    }
  }, [userProfile?.fullName, user?.displayName]);

  const changeStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (user?.uid) {
      AsyncStorage.setItem(`@bloom_onboarding_step_${user.uid}`, newStep.toString()).catch(() => {});
    }
  };

  // Form State
  const [name, setName] = useState(userProfile?.fullName || user?.displayName || '');
  const [selectedMood, setSelectedMood] = useState<string>('Calm');
  const [selectedReasons, setSelectedReasons] = useState<string[]>(['Mental wellness']);
  const [selectedRole, setSelectedRole] = useState<string>('Student');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Reduce stress & anxiety',
    'Build study & focus streaks',
  ]);
  const [selectedImprovements, setSelectedImprovements] = useState<string[]>([
    'Daily study focus sessions',
  ]);

  // Toggle multi-select options
  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const toggleImprovement = (imp: string) => {
    setSelectedImprovements((prev) =>
      prev.includes(imp) ? prev.filter((i) => i !== imp) : [...prev, imp]
    );
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep === 1 && !name.trim()) {
      Alert.alert('Please enter your name', 'We would love to know what to call you in BLOOM!');
      return;
    }
    if (currentStep < TOTAL_STEPS) {
      changeStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    if (currentStep < TOTAL_STEPS) {
      changeStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      changeStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      if (user?.uid) {
        await AsyncStorage.removeItem(`@bloom_onboarding_step_${user.uid}`).catch(() => {});
      }
      await completeUserOnboarding({
        fullName: name.trim() || 'Bloom Member',
        currentMood: selectedMood,
        reasons: selectedReasons.length ? selectedReasons : ['Mental wellness'],
        userType: selectedRole,
        wellnessGoals: selectedGoals.length ? selectedGoals : ['Mindful balance'],
        improvements: selectedImprovements.length
          ? selectedImprovements
          : ['Daily study focus sessions'],
      });
      router.replace('/(tabs)');
    } catch (_) {
      router.replace('/(tabs)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  return (
    <View style={styles.screen}>
      {/* Top Bar with Step Progress */}
      <View style={styles.topBar}>
        <View style={styles.navRow}>
          {currentStep > 1 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backIconButton} activeOpacity={0.7}>
              <ArrowLeft size={20} color={Colors.darkText} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}

          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              Step {currentStep} of {TOTAL_STEPS}
            </Text>
          </View>

          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Name */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconBg}>
              <Smile size={32} color={Colors.primary} strokeWidth={1.8} />
            </View>
            <Text style={styles.stepTitle}>What is your name?</Text>
            <Text style={styles.stepSubtitle}>
              Let's make your BLOOM sanctuary feel warm and personal.
            </Text>

            <View style={styles.nameInputWrapper}>
              <TextInput
                style={styles.nameInput}
                placeholder="Enter your name"
                placeholderTextColor={Colors.lightText}
                value={name}
                onChangeText={setName}
                autoFocus={true}
                autoCapitalize="words"
              />
            </View>
          </View>
        )}

        {/* Step 2: Current Mood */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconBg}>
              <Heart size={32} color={Colors.primary} strokeWidth={1.8} />
            </View>
            <Text style={styles.stepTitle}>How are you feeling today?</Text>
            <Text style={styles.stepSubtitle}>
              Select the mood that describes your headspace right now.
            </Text>

            <View style={styles.gridOptions}>
              {MOOD_OPTIONS.map((item) => {
                const isSelected = selectedMood === item.label;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.moodCard,
                      isSelected && styles.moodCardSelected,
                      Shadows.sm,
                    ]}
                    onPress={() => setSelectedMood(item.label)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.moodEmoji}>{item.emoji}</Text>
                    <Text
                      style={[
                        styles.moodLabel,
                        isSelected && styles.moodLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 3: Why BLOOM */}
        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconBg}>
              <Leaf size={32} color={Colors.primary} strokeWidth={1.8} />
            </View>
            <Text style={styles.stepTitle}>Why are you using BLOOM?</Text>
            <Text style={styles.stepSubtitle}>
              Select all reasons that align with what you're seeking.
            </Text>

            <View style={styles.chipList}>
              {WHY_BLOOM_OPTIONS.map((reason) => {
                const isSelected = selectedReasons.includes(reason);
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.chipItem, isSelected && styles.chipItemSelected]}
                    onPress={() => toggleReason(reason)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.chipCheck,
                        isSelected && styles.chipCheckSelected,
                      ]}
                    >
                      {isSelected ? (
                        <Check size={12} color={Colors.white} strokeWidth={3} />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 4: Role */}
        {currentStep === 4 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconBg}>
              <Target size={32} color={Colors.primary} strokeWidth={1.8} />
            </View>
            <Text style={styles.stepTitle}>What best describes you?</Text>
            <Text style={styles.stepSubtitle}>
              This tailors your daily routines, timers, and AI support.
            </Text>

            <View style={styles.roleList}>
              {ROLE_OPTIONS.map((item) => {
                const isSelected = selectedRole === item.label;
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.roleCard,
                      isSelected && styles.roleCardSelected,
                      Shadows.sm,
                    ]}
                    onPress={() => setSelectedRole(item.label)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.roleIconBg,
                        isSelected && styles.roleIconBgSelected,
                      ]}
                    >
                      <IconComponent
                        size={22}
                        color={isSelected ? Colors.white : Colors.primaryDark}
                        strokeWidth={1.8}
                      />
                    </View>
                    <View style={styles.roleTextContainer}>
                      <Text
                        style={[
                          styles.roleLabel,
                          isSelected && styles.roleLabelSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={styles.roleDescription}>
                        {item.description}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.roleRadio,
                        isSelected && styles.roleRadioSelected,
                      ]}
                    >
                      {isSelected ? <View style={styles.roleRadioInner} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 5: Goals */}
        {currentStep === 5 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconBg}>
              <Target size={32} color={Colors.primary} strokeWidth={1.8} />
            </View>
            <Text style={styles.stepTitle}>Main wellness & productivity goals?</Text>
            <Text style={styles.stepSubtitle}>
              Choose what matters most to you right now.
            </Text>

            <View style={styles.chipList}>
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = selectedGoals.includes(goal);
                return (
                  <TouchableOpacity
                    key={goal}
                    style={[styles.chipItem, isSelected && styles.chipItemSelected]}
                    onPress={() => toggleGoal(goal)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.chipCheck,
                        isSelected && styles.chipCheckSelected,
                      ]}
                    >
                      {isSelected ? (
                        <Check size={12} color={Colors.white} strokeWidth={3} />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {goal}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 6: Improvements */}
        {currentStep === 6 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconBg}>
              <Sparkles size={32} color={Colors.primary} strokeWidth={1.8} />
            </View>
            <Text style={styles.stepTitle}>What can BLOOM help you improve?</Text>
            <Text style={styles.stepSubtitle}>
              We'll highlight these in your daily overview and recommendations.
            </Text>

            <View style={styles.chipList}>
              {IMPROVE_OPTIONS.map((imp) => {
                const isSelected = selectedImprovements.includes(imp);
                return (
                  <TouchableOpacity
                    key={imp}
                    style={[styles.chipItem, isSelected && styles.chipItemSelected]}
                    onPress={() => toggleImprovement(imp)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.chipCheck,
                        isSelected && styles.chipCheckSelected,
                      ]}
                    >
                      {isSelected ? (
                        <Check size={12} color={Colors.white} strokeWidth={3} />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {imp}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, Shadows.lg]}>
        <TouchableOpacity
          style={[styles.actionButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <View style={styles.actionButtonInner}>
              <Text style={styles.actionButtonText}>
                {currentStep === TOTAL_STEPS ? 'Complete & Enter BLOOM' : 'Continue'}
              </Text>
              <ArrowRight size={18} color={Colors.white} strokeWidth={2.2} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.massive,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadge: {
    backgroundColor: Colors.lightSage,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  stepBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  skipButtonText: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepTitle: {
    ...Typography.h2,
    color: Colors.darkText,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  nameInputWrapper: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  nameInput: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.darkText,
    textAlign: 'center',
  },
  gridOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: Spacing.md,
  },
  moodCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  moodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightSage,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  moodLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.darkText,
  },
  moodLabelSelected: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  chipList: {
    width: '100%',
    gap: Spacing.sm,
  },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightSage,
  },
  chipCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.mutedText,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  chipCheckSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.body,
    color: Colors.darkText,
    flex: 1,
  },
  chipTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  roleList: {
    width: '100%',
    gap: Spacing.md,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  roleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightSage,
  },
  roleIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  roleIconBgSelected: {
    backgroundColor: Colors.primary,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleLabel: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.darkText,
  },
  roleLabelSelected: {
    color: Colors.primaryDark,
  },
  roleDescription: {
    ...Typography.caption,
    color: Colors.mutedText,
    marginTop: 2,
  },
  roleRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.mutedText,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  roleRadioSelected: {
    borderColor: Colors.primary,
  },
  roleRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    ...Typography.button,
    fontSize: 16,
    fontWeight: '700',
  },
});
