import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Sun,
  Moon,
  Smartphone,
  Sparkles,
  Bell,
  Clock,
  EyeOff,
  FileText,
  LogOut,
  Check,
  Shield,
  Smile,
} from 'lucide-react-native';
import { Spacing, BorderRadius } from '../constants/spacing';
import { Shadows } from '../constants/shadows';
import { useTheme, ThemeMode, AccentPalette } from '../context/ThemeContext';
import { ACCENT_PALETTES } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { MoodType } from '../types';
import { BackgroundGlow } from '../components/theme/BackgroundGlow';

const PRESET_TIMES = ['08:00 AM', '12:30 PM', '06:00 PM', '08:30 PM', '09:30 PM'];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const { user, userProfile, signOutUser } = useAuth();

  const {
    themeMode,
    themeColor,
    accentPalette,
    adaptToMood,
    currentMood,
    dailyMoodReminderEnabled,
    dailyMoodReminderTime,
    taskRemindersEnabled,
    taskReminderTime,
    hideNotificationContent,
    reportNotificationsEnabled,
    colors,
    isDark,
    setThemeMode,
    setThemeColor,
    setAccentPalette,
    setAdaptToMood,
    setDailyMoodReminderEnabled,
    setDailyMoodReminderTime,
    setTaskRemindersEnabled,
    setTaskReminderTime,
    setHideNotificationContent,
    setReportNotificationsEnabled,
  } = useTheme();

  // Time Picker Modal State
  const [timePickerTarget, setTimePickerTarget] = useState<'mood' | 'task' | null>(null);

  const activeMood: MoodType = currentMood || (userProfile?.currentMood as MoodType) || 'Calm';

  // Sign Out Modal State
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const executeSignOut = async () => {
    setSignOutModalVisible(false);
    try {
      await signOutUser();
      router.replace('/(auth)/login');
    } catch (err: any) {
      console.error('[Settings] Sign out error:', err);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(err?.message || 'Could not sign out.');
      } else {
        Alert.alert('Error', err?.message || 'Could not sign out.');
      }
    }
  };

  const handleSignOut = () => {
    setSignOutModalVisible(true);
  };

  const handleSelectTime = async (time: string) => {
    if (timePickerTarget === 'mood') {
      await setDailyMoodReminderTime(time);
    } else if (timePickerTarget === 'task') {
      await setTaskReminderTime(time);
    }
    setTimePickerTarget(null);
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <BackgroundGlow style={styles.screen}>
      {/* Top Header */}
      <View style={[styles.headerRow, { paddingTop: topPadding + 4 }]}>
        <TouchableOpacity
          style={[
            styles.backCircleBtn,
            Shadows.sm,
            { backgroundColor: colors.white, borderColor: colors.border },
          ]}
          onPress={handleGoBack}
          accessibilityRole="button"
          accessibilityLabel="Back to Dashboard"
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.darkText} strokeWidth={2.2} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.darkText }]}>Settings</Text>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================= */}
        {/* SECTION A: APPEARANCE                                         */}
        {/* ============================================================= */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.primaryDark }]}>
            Appearance
          </Text>

          <View style={[styles.card, Shadows.sm, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <Text style={[styles.itemTitle, { color: colors.darkText }]}>Theme Mode</Text>
            <Text style={[styles.itemSubtitle, { color: colors.mutedText }]}>
              Choose how BLOOM looks across the entire app.
            </Text>

            {/* Segmented Control */}
            <View style={[styles.segmentedTrack, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  themeMode === 'light' && [styles.segmentBtnActive, { backgroundColor: colors.white }],
                ]}
                onPress={() => setThemeMode('light')}
                activeOpacity={0.8}
              >
                <Sun
                  size={14}
                  color={themeMode === 'light' ? colors.primaryDark : colors.mutedText}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: themeMode === 'light' ? colors.darkText : colors.mutedText },
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  themeMode === 'dark' && [styles.segmentBtnActive, { backgroundColor: colors.white }],
                ]}
                onPress={() => setThemeMode('dark')}
                activeOpacity={0.8}
              >
                <Moon
                  size={14}
                  color={themeMode === 'dark' ? colors.primaryDark : colors.mutedText}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: themeMode === 'dark' ? colors.darkText : colors.mutedText },
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  themeMode === 'system' && [styles.segmentBtnActive, { backgroundColor: colors.white }],
                ]}
                onPress={() => setThemeMode('system')}
                activeOpacity={0.8}
              >
                <Smartphone
                  size={14}
                  color={themeMode === 'system' ? colors.primaryDark : colors.mutedText}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: themeMode === 'system' ? colors.darkText : colors.mutedText },
                  ]}
                >
                  System
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Dynamic Theme Color System (Green, Blue, Pink) */}
            <View style={{ marginTop: 14, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={[styles.itemTitle, { color: colors.darkText }]}>Theme Color Palette</Text>
                {adaptToMood && (
                  <View style={[styles.adaptiveBadge, { backgroundColor: colors.accentSoft }]}>
                    <Sparkles size={11} color={colors.accent} />
                    <Text style={[styles.adaptiveBadgeText, { color: colors.accentText }]}>
                      Mood-Linked
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.itemSubtitle, { color: colors.mutedText, marginBottom: 12 }]}>
                Select your signature ambient aura, particle tint, and active navigation indicator.
              </Text>

              <View style={styles.themePaletteColumn}>
                {[
                  {
                    key: 'green' as const,
                    name: 'Green Theme',
                    badge: 'Sage Green',
                    desc: 'Primary Sage (#789B83) · Light Sage (#E8F1E8) · Soft Green Aura',
                    primary: '#789B83',
                    soft: '#E8F1E8',
                    aura: 'rgba(120, 155, 131, 0.35)',
                  },
                  {
                    key: 'blue' as const,
                    name: 'Blue Theme',
                    badge: 'Ocean Blue',
                    desc: 'Ocean Blue (#5B8DEF) · Light Ice Blue (#E3F2FD) · Cool Blue Aura',
                    primary: '#5B8DEF',
                    soft: '#E3F2FD',
                    aura: 'rgba(91, 141, 239, 0.35)',
                  },
                  {
                    key: 'pink' as const,
                    name: 'Pink Theme',
                    badge: 'Rose Pink',
                    desc: 'Soft Rose Pink (#E57373) · Light Blush Pink (#FCE4EC) · Gentle Pink Aura',
                    primary: '#E57373',
                    soft: '#FCE4EC',
                    aura: 'rgba(229, 115, 115, 0.35)',
                  },
                ].map((item) => {
                  const isSelected = themeColor === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.themeOptionCard,
                        {
                          backgroundColor: isSelected
                            ? colors.frostedBg
                            : (isDark ? '#1C241E' : '#FFFFFF'),
                          borderColor: isSelected ? item.primary : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={async () => {
                        await setThemeColor(item.key);
                      }}
                      activeOpacity={0.8}
                    >
                      {/* Left: Color Dot with Inner Soft Circle */}
                      <View style={[styles.themeOptionSwatch, { backgroundColor: item.soft, borderColor: item.primary }]}>
                        <View style={[styles.themeOptionDot, { backgroundColor: item.primary }]}>
                          {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3.2} />}
                        </View>
                      </View>

                      {/* Middle: Details */}
                      <View style={styles.themeOptionDetails}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            style={[
                              styles.themeOptionTitle,
                              {
                                color: isSelected ? colors.darkText : colors.darkText,
                                fontWeight: isSelected ? '700' : '600',
                              },
                            ]}
                          >
                            {item.name}
                          </Text>
                          <View style={[styles.themePillTag, { backgroundColor: item.soft }]}>
                            <Text style={[styles.themePillTagText, { color: item.primary }]}>{item.badge}</Text>
                          </View>
                        </View>
                        <Text style={[styles.themeOptionDesc, { color: colors.mutedText }]} numberOfLines={1}>
                          {item.desc}
                        </Text>
                      </View>

                      {/* Right Selection Indicator */}
                      <View
                        style={[
                          styles.themeRadioCircle,
                          {
                            borderColor: isSelected ? item.primary : colors.border,
                            backgroundColor: isSelected ? item.primary : 'transparent',
                          },
                        ]}
                      >
                        {isSelected && <View style={styles.themeRadioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Mood-Based Theme Toggle */}
            <View style={styles.switchRow}>
              <View style={styles.switchTextCol}>
                <View style={styles.rowWithIcon}>
                  <Smile size={16} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.itemTitle, { color: colors.darkText }]}>
                    Adapt Theme to My Mood
                  </Text>
                </View>
                <Text style={[styles.itemSubtitle, { color: colors.mutedText }]}>
                  Applies subtle pastel accents reflecting your latest mood ({activeMood}).
                </Text>
              </View>

              <Switch
                value={adaptToMood}
                onValueChange={setAdaptToMood}
                trackColor={{ false: '#DCE2DE', true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* ============================================================= */}
        {/* SECTION B: REMINDERS                                          */}
        {/* ============================================================= */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.primaryDark }]}>
            Reminders
          </Text>

          <View style={[styles.card, Shadows.sm, { backgroundColor: colors.white, borderColor: colors.border }]}>
            {/* 1. Daily Mood Reminder */}
            <View style={styles.switchRow}>
              <View style={styles.switchTextCol}>
                <Text style={[styles.itemTitle, { color: colors.darkText }]}>
                  Daily Mood Reminder
                </Text>
                <Text style={[styles.itemSubtitle, { color: colors.mutedText }]}>
                  Receive a gentle prompt to check in with how you feel.
                </Text>
              </View>

              <Switch
                value={dailyMoodReminderEnabled}
                onValueChange={setDailyMoodReminderEnabled}
                trackColor={{ false: '#DCE2DE', true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            {dailyMoodReminderEnabled && (
              <View style={[styles.subSettingRow, { borderTopColor: colors.border }]}>
                <View style={styles.timeLabelWrap}>
                  <Clock size={15} color={colors.mutedText} strokeWidth={1.8} />
                  <Text style={[styles.timeLabelText, { color: colors.darkText }]}>
                    Reminder Time
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.timePill, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setTimePickerTarget('mood')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timePillText, { color: colors.primaryDark }]}>
                    {dailyMoodReminderTime}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* 2. Task Reminders */}
            <View style={styles.switchRow}>
              <View style={styles.switchTextCol}>
                <Text style={[styles.itemTitle, { color: colors.darkText }]}>
                  Task Reminders
                </Text>
                <Text style={[styles.itemSubtitle, { color: colors.mutedText }]}>
                  Daily reminder for upcoming or pending daily goals.
                </Text>
              </View>

              <Switch
                value={taskRemindersEnabled}
                onValueChange={setTaskRemindersEnabled}
                trackColor={{ false: '#DCE2DE', true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            {taskRemindersEnabled && (
              <View style={[styles.subSettingRow, { borderTopColor: colors.border }]}>
                <View style={styles.timeLabelWrap}>
                  <Clock size={15} color={colors.mutedText} strokeWidth={1.8} />
                  <Text style={[styles.timeLabelText, { color: colors.darkText }]}>
                    Task Reminder Time
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.timePill, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setTimePickerTarget('task')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timePillText, { color: colors.primaryDark }]}>
                    {taskReminderTime}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ============================================================= */}
        {/* SECTION C: PRIVACY                                            */}
        {/* ============================================================= */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.primaryDark }]}>
            Privacy
          </Text>

          <View style={[styles.card, Shadows.sm, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextCol}>
                <View style={styles.rowWithIcon}>
                  <EyeOff size={16} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.itemTitle, { color: colors.darkText }]}>
                    Hide Notification Content
                  </Text>
                </View>
                <Text style={[styles.itemSubtitle, { color: colors.mutedText }]}>
                  Shows generic previews ("BLOOM – You have a new update") without revealing
                  private tasks, mood notes, or AI messages.
                </Text>
              </View>

              <Switch
                value={hideNotificationContent}
                onValueChange={setHideNotificationContent}
                trackColor={{ false: '#DCE2DE', true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* ============================================================= */}
        {/* SECTION D: REPORTS                                            */}
        {/* ============================================================= */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.primaryDark }]}>
            Reports
          </Text>

          <View style={[styles.card, Shadows.sm, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextCol}>
                <Text style={[styles.itemTitle, { color: colors.darkText }]}>
                  Weekly Report Notifications
                </Text>
                <Text style={[styles.itemSubtitle, { color: colors.mutedText }]}>
                  Notify you every Sunday when your weekly wellness & focus summary is ready.
                </Text>
              </View>

              <Switch
                value={reportNotificationsEnabled}
                onValueChange={setReportNotificationsEnabled}
                trackColor={{ false: '#DCE2DE', true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* ============================================================= */}
        {/* SECTION E: ACCOUNT & SIGN OUT                                 */}
        {/* ============================================================= */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.primaryDark }]}>
            Account
          </Text>

          <View style={[styles.card, Shadows.sm, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <View style={styles.accountRow}>
              <View style={[styles.accountAvatar, { backgroundColor: colors.lightSage }]}>
                <Text style={[styles.accountAvatarText, { color: colors.primaryDark }]}>
                  {(userProfile?.fullName || user?.displayName || 'B').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.accountTextWrap}>
                <Text style={[styles.itemTitle, { color: colors.darkText }]}>
                  {userProfile?.fullName || user?.displayName || 'Bloom Member'}
                </Text>
                <Text style={[styles.itemSubtitle, { color: colors.mutedText }]}>
                  {user?.email || 'bloom.member@campus.edu'}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <LogOut size={16} color="#D9534F" strokeWidth={2} />
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* TIME PICKER MODAL */}
      <Modal
        visible={timePickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, Shadows.lg, { backgroundColor: colors.white }]}>
            <Text style={[styles.modalTitle, { color: colors.darkText }]}>
              Select Reminder Time
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedText }]}>
              {timePickerTarget === 'mood' ? 'Daily Mood Reminder' : 'Task Reminder'}
            </Text>

            <View style={styles.presetsList}>
              {PRESET_TIMES.map((time) => {
                const isSelected =
                  (timePickerTarget === 'mood' && dailyMoodReminderTime === time) ||
                  (timePickerTarget === 'task' && taskReminderTime === time);
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.presetTimeItem,
                      { borderColor: colors.border },
                      isSelected && { backgroundColor: colors.lightSage, borderColor: colors.primary },
                    ]}
                    onPress={() => handleSelectTime(time)}
                  >
                    <Text
                      style={[
                        styles.presetTimeText,
                        { color: colors.darkText },
                        isSelected && { fontWeight: '700', color: colors.primaryDark },
                      ]}
                    >
                      {time}
                    </Text>
                    {isSelected && <Check size={16} color={colors.primaryDark} strokeWidth={2.4} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.background }]}
              onPress={() => setTimePickerTarget(null)}
            >
              <Text style={[styles.modalCloseBtnText, { color: colors.mutedText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SIGN OUT CONFIRMATION MODAL */}
      <Modal
        visible={signOutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSignOutModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, Shadows.lg, { backgroundColor: colors.white }]}>
            <View style={styles.signOutModalHeader}>
              <View style={styles.signOutIconBg}>
                <LogOut size={22} color="#D9534F" strokeWidth={2.2} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.darkText }]}>Sign Out</Text>
              <Text style={[styles.modalSubtitle, { color: colors.mutedText, textAlign: 'center' }]}>
                Are you sure you want to sign out of your BLOOM account?
              </Text>
            </View>

            <View style={styles.signOutModalActions}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setSignOutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.darkText }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalConfirmBtn]}
                onPress={executeSignOut}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </BackgroundGlow>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  backCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: 20,
  },
  sectionWrap: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  rowWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentedTrack: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: 6,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.md - 2,
    gap: 6,
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchTextCol: {
    flex: 1,
  },
  subSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  timeLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeLabelText: {
    fontSize: 13,
    fontWeight: '500',
  },
  timePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  timePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  accountTextWrap: {
    flex: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  signOutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D9534F',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 25, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
  },
  presetsList: {
    gap: 8,
    marginTop: 6,
  },
  presetTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  presetTimeText: {
    fontSize: 14,
  },
  modalCloseBtn: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  signOutModalHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  signOutIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDECEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  signOutModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    backgroundColor: '#D9534F',
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  paletteCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  paletteDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteLabel: {
    fontSize: 11.5,
  },
  themePaletteColumn: {
    gap: 10,
    marginTop: 4,
  },
  themeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 12,
  },
  themeOptionSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionDetails: {
    flex: 1,
    gap: 2,
  },
  themeOptionTitle: {
    fontSize: 14,
  },
  themePillTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  themePillTagText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  themeOptionDesc: {
    fontSize: 11.5,
  },
  themeRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  adaptiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  adaptiveBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
