import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  Dimensions,
  Alert,
  Animated,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import {
  ChevronLeft,
  HelpCircle,
  Hourglass,
  Bell,
  Sparkles,
  Plus,
  Minus,
  Check,
  X,
  Play,
  Wind,
  Moon,
  SlidersHorizontal,
  Smartphone,
  Volume2,
  Trash2,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';
import {
  sendScreenTimeAlert,
  sendExcessiveAppAlert,
  sendBedtimeNotification,
  subscribeToInAppAlerts,
  InAppAlert,
} from '../../../services/notificationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface AppIntention {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  todayDuration: string;
  limitMinutes: number;
  spentMinutes: number;
  statusType: 'exceeded' | 'ontrack';
}

// Mockup dataset matching Image 2 & 3
const MOCKUP_APPS: AppIntention[] = [
  {
    id: 'ig',
    name: 'Instagram',
    initials: 'IG',
    avatarBg: '#F7E5DA', // Soft peach
    avatarColor: '#D98B8B',
    todayDuration: '1h 42m today',
    limitMinutes: 135, // 2h 15m
    spentMinutes: 102,
    statusType: 'ontrack',
  },
  {
    id: 'yt',
    name: 'YouTube',
    initials: 'YT',
    avatarBg: '#FBE8E8', // Soft rose
    avatarColor: '#C25454',
    todayDuration: '1h 12m today',
    limitMinutes: 90, // 1h 30m
    spentMinutes: 72,
    statusType: 'ontrack',
  },
  {
    id: 'tt',
    name: 'TikTok',
    initials: 'TT',
    avatarBg: '#EAE5F4', // Soft lavender
    avatarColor: '#7C3AED',
    todayDuration: '58m today',
    limitMinutes: 45, // 45m
    spentMinutes: 58,
    statusType: 'exceeded',
  },
  {
    id: 'wa',
    name: 'WhatsApp',
    initials: 'WA',
    avatarBg: '#D9EEE5', // Soft mint
    avatarColor: '#365B45',
    todayDuration: '39m today',
    limitMinutes: 45, // 45m
    spentMinutes: 39,
    statusType: 'ontrack',
  },
];

// Real phone dataset matching user's Image 1 (Android App activity details)
const PHONE_APPS: AppIntention[] = [
  {
    id: 'ig',
    name: 'Instagram',
    initials: 'IG',
    avatarBg: '#F7E5DA',
    avatarColor: '#D98B8B',
    todayDuration: '54 minutes',
    limitMinutes: 60, // 1h 00m
    spentMinutes: 54,
    statusType: 'ontrack',
  },
  {
    id: 'yt',
    name: 'YouTube',
    initials: 'YT',
    avatarBg: '#FBE8E8',
    avatarColor: '#C25454',
    todayDuration: '26 minutes',
    limitMinutes: 45, // 45m
    spentMinutes: 26,
    statusType: 'ontrack',
  },
  {
    id: 'wa',
    name: 'WhatsApp',
    initials: 'WA',
    avatarBg: '#D9EEE5',
    avatarColor: '#365B45',
    todayDuration: '20 minutes',
    limitMinutes: 30, // 30m
    spentMinutes: 20,
    statusType: 'ontrack',
  },
  {
    id: 'eg',
    name: 'Expo Go',
    initials: 'EG',
    avatarBg: '#29332E',
    avatarColor: '#FFFFFF',
    todayDuration: '17 minutes',
    limitMinutes: 45, // 45m
    spentMinutes: 17,
    statusType: 'ontrack',
  },
];

const INITIAL_WEEKLY_DAYS = [
  { day: 'M', hours: 3.1, label: '3h 10m', isHighlighted: false },
  { day: 'T', hours: 2.7, label: '2h 45m', isHighlighted: false },
  { day: 'W', hours: 3.5, label: '3h 30m', isHighlighted: false },
  { day: 'T', hours: 3.1, label: '3h 05m', isHighlighted: false },
  { day: 'F', hours: 4.5, label: '4h 31m', isHighlighted: true }, // Highlighted Friday in mockup
  { day: 'S', hours: 2.2, label: '2h 15m', isHighlighted: false },
  { day: 'S', hours: 2.8, label: '2h 50m', isHighlighted: false },
];

export default function ScreenTimeDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 20 : 16);

  // Active data mode
  const [dataMode, setDataMode] = useState<'mockup' | 'phone'>('mockup');
  const [apps, setApps] = useState<AppIntention[]>(MOCKUP_APPS);
  const [weeklyDays, setWeeklyDays] = useState(INITIAL_WEEKLY_DAYS);
  const [highlightedIndex, setHighlightedIndex] = useState(4); // Friday

  // Set Daily Limit Modal State
  const [selectedApp, setSelectedApp] = useState<AppIntention | null>(null);
  const [limitHours, setLimitHours] = useState(1);
  const [limitMinutes, setLimitMinutes] = useState(15);

  // Info Modal
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Sync & Manual Control Modal
  const [showControlModal, setShowControlModal] = useState(false);

  // Mindful Break 3-Breaths Modal
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathCount, setBreathCount] = useState(1);
  const breathAnim = useRef(new Animated.Value(1)).current;

  // Evening Wind-Down Modal
  const [showWindDownModal, setShowWindDownModal] = useState(false);
  const [windDownTime, setWindDownTime] = useState('10:30 PM');
  const [windDownEnabled, setWindDownEnabled] = useState(true);

  // Learn More Evening Modal
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);

  // Add App State
  const [newAppName, setNewAppName] = useState('');
  const [newAppMinutes, setNewAppMinutes] = useState('');
  const [newAppLimit, setNewAppLimit] = useState('');

  // Floating Toast Alert
  const [toastAlert, setToastAlert] = useState<InAppAlert | null>(null);
  const toastY = useRef(new Animated.Value(-120)).current;

  // Subscribe to in-app alerts so notifications show immediately on device
  useEffect(() => {
    const unsubscribe = subscribeToInAppAlerts((alert) => {
      setToastAlert(alert);
      Animated.sequence([
        Animated.spring(toastY, {
          toValue: topPadding + 10,
          useNativeDriver: true,
          bounciness: 6,
        }),
        Animated.delay(4000),
        Animated.timing(toastY, {
          toValue: -120,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setToastAlert(null));
    });

    return () => unsubscribe();
  }, [topPadding]);

  // Handle switching to real phone dataset from Image 1
  const handleLoadPhoneData = () => {
    setDataMode('phone');
    setApps(PHONE_APPS);
    setWeeklyDays([
      { day: 'Sun', hours: 2.51, label: '2h 31m', isHighlighted: true },
      { day: 'Mon', hours: 0.1, label: '0h 00m', isHighlighted: false },
      { day: 'Tue', hours: 0.1, label: '0h 00m', isHighlighted: false },
      { day: 'Wed', hours: 0.1, label: '0h 00m', isHighlighted: false },
      { day: 'Thu', hours: 0.1, label: '0h 00m', isHighlighted: false },
      { day: 'Fri', hours: 0.1, label: '0h 00m', isHighlighted: false },
      { day: 'Sat', hours: 0.1, label: '0h 00m', isHighlighted: false },
    ]);
    setHighlightedIndex(0);
    setShowControlModal(false);

    sendScreenTimeAlert(
      '📱 Synced Device Activity',
      'Loaded Sun, 1 Nov stats: 2 hrs 31 mins total across Instagram, YouTube, WhatsApp & Expo Go.'
    );
  };

  // Handle switching back to Mockup preset from Image 2 & 3
  const handleLoadMockupData = () => {
    setDataMode('mockup');
    setApps(MOCKUP_APPS);
    setWeeklyDays(INITIAL_WEEKLY_DAYS);
    setHighlightedIndex(4);
    setShowControlModal(false);

    sendScreenTimeAlert(
      '🎨 Restored Bloom Mockup Profile',
      'Displaying standard design reference: 4h 31m daily total with Friday pattern.'
    );
  };

  // Helper to open Limit Modal
  const handleOpenLimitModal = (app: AppIntention) => {
    setSelectedApp(app);
    const hrs = Math.floor(app.limitMinutes / 60);
    const mins = app.limitMinutes % 60;
    setLimitHours(hrs);
    setLimitMinutes(mins);
  };

  // Save new timer for selected app
  const handleSaveTimer = () => {
    if (!selectedApp) return;
    const totalMins = limitHours * 60 + limitMinutes;

    setApps((prev) =>
      prev.map((a) => {
        if (a.id === selectedApp.id) {
          const isExceeded = a.spentMinutes > totalMins;
          const hrs = Math.floor(totalMins / 60);
          const mins = totalMins % 60;
          const limitStr = hrs > 0 ? `${hrs}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

          return {
            ...a,
            limitMinutes: totalMins,
            statusType: isExceeded ? 'exceeded' : 'ontrack',
            todayDuration: a.todayDuration.includes('today')
              ? `${Math.floor(a.spentMinutes / 60) > 0 ? `${Math.floor(a.spentMinutes / 60)}h ` : ''}${a.spentMinutes % 60}m today`
              : `${a.spentMinutes} minutes`,
          };
        }
        return a;
      })
    );

    const appName = selectedApp.name;
    const isOver = selectedApp.spentMinutes > totalMins;
    setSelectedApp(null);

    if (isOver) {
      sendExcessiveAppAlert(appName, selectedApp.spentMinutes, totalMins);
    } else {
      sendScreenTimeAlert(
        `⏱️ Mindful Boundary Set: ${appName}`,
        `Limit set to ${limitHours}h ${limitMinutes}m. Bloom will send a soft chime 10m before your limit closes.`
      );
    }
  };

  // Handle manual usage update for an app
  const handleUpdateAppSpent = (id: string, newSpentMinutes: number) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const isExceeded = newSpentMinutes > a.limitMinutes;
          const hrs = Math.floor(newSpentMinutes / 60);
          const mins = newSpentMinutes % 60;
          const durationStr =
            dataMode === 'phone'
              ? `${newSpentMinutes} minutes`
              : `${hrs > 0 ? `${hrs}h ` : ''}${mins}m today`;

          return {
            ...a,
            spentMinutes: newSpentMinutes,
            statusType: isExceeded ? 'exceeded' : 'ontrack',
            todayDuration: durationStr,
          };
        }
        return a;
      })
    );
  };

  // Handle adding custom app
  const handleAddCustomApp = () => {
    if (!newAppName.trim()) {
      Alert.alert('App Name Required', 'Please enter a name for the app.');
      return;
    }
    const spent = parseInt(newAppMinutes, 10) || 0;
    const limit = parseInt(newAppLimit, 10) || 60;
    const isExceeded = spent > limit;
    const initials = newAppName.substring(0, 2).toUpperCase();

    const newApp: AppIntention = {
      id: `app_${Date.now()}`,
      name: newAppName.trim(),
      initials,
      avatarBg: '#E8ECE9',
      avatarColor: '#365B45',
      todayDuration: `${spent} minutes`,
      limitMinutes: limit,
      spentMinutes: spent,
      statusType: isExceeded ? 'exceeded' : 'ontrack',
    };

    setApps((prev) => [...prev, newApp]);
    setNewAppName('');
    setNewAppMinutes('');
    setNewAppLimit('');

    sendScreenTimeAlert(
      `✨ Added App: ${newApp.name}`,
      `Logged ${spent} mins with a ${Math.floor(limit / 60)}h ${limit % 60}m boundary.`
    );
  };

  // Steppers for modal
  const incrementHours = () => setLimitHours((h) => Math.min(12, h + 1));
  const decrementHours = () => setLimitHours((h) => Math.max(0, h - 1));
  const incrementMinutes = () => setLimitMinutes((m) => (m + 15 >= 60 ? 0 : m + 15));
  const decrementMinutes = () => setLimitMinutes((m) => (m - 15 < 0 ? 45 : m - 15));

  // Breathing animation logic
  const startBreathingCycle = () => {
    setShowBreathingModal(true);
    setBreathCount(1);
    setBreathPhase('Inhale');

    const runPhase = (currentPhase: 'Inhale' | 'Hold' | 'Exhale', cycle: number) => {
      setBreathPhase(currentPhase);
      if (currentPhase === 'Inhale') {
        Animated.timing(breathAnim, {
          toValue: 1.45,
          duration: 4000,
          useNativeDriver: true,
        }).start(() => runPhase('Hold', cycle));
      } else if (currentPhase === 'Hold') {
        setTimeout(() => runPhase('Exhale', cycle), 3500);
      } else if (currentPhase === 'Exhale') {
        Animated.timing(breathAnim, {
          toValue: 1.0,
          duration: 4000,
          useNativeDriver: true,
        }).start(() => {
          if (cycle < 3) {
            setBreathCount(cycle + 1);
            runPhase('Inhale', cycle + 1);
          } else {
            setTimeout(() => {
              setShowBreathingModal(false);
              sendScreenTimeAlert(
                '🌿 Mindful Break Completed',
                'Great job resting your eyes. Your cognitive clarity is restored!'
              );
            }, 800);
          }
        });
      }
    };

    runPhase('Inhale', 1);
  };

  // Compute active screen time
  const totalSpentMinutes = apps.reduce((acc, a) => acc + a.spentMinutes, 0);
  const displayTotalTime =
    dataMode === 'phone'
      ? '2h 31m' // Exactly matching Image 1
      : '4h 31m'; // Exactly matching Image 2

  // Circular Ring Metrics
  const ringSize = 170;
  const strokeOuter = 10;
  const radiusOuter = (ringSize - strokeOuter) / 2;
  const circOuter = 2 * Math.PI * radiusOuter;
  const strokeDashoffsetOuter =
    circOuter * (1 - (dataMode === 'phone' ? 0.42 : 0.76));

  const strokeInner = 8;
  const radiusInner = radiusOuter - 14;
  const circInner = 2 * Math.PI * radiusInner;
  const strokeDashoffsetInner =
    circInner * (1 - (dataMode === 'phone' ? 0.35 : 0.52));

  return (
    <View style={styles.screen}>
      {/* ── Top Floating Toast Banner ─────────────────────────────────── */}
      {toastAlert && (
        <Animated.View
          style={[
            styles.toastContainer,
            Shadows.md,
            { transform: [{ translateY: toastY }] },
          ]}
        >
          <View style={styles.toastIconBox}>
            {toastAlert.type === 'sleep' ? (
              <Moon size={18} color="#FFFFFF" />
            ) : (
              <Bell size={18} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.toastTextWrap}>
            <Text style={styles.toastTitle} numberOfLines={1}>
              {toastAlert.title}
            </Text>
            <Text style={styles.toastBody} numberOfLines={2}>
              {toastAlert.body}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setToastAlert(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color="#7B857F" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Top Header Navigation Bar ─────────────────────────────────── */}
      <View style={[styles.headerBar, { paddingTop: topPadding }]}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#29332E" strokeWidth={2.2} />
        </TouchableOpacity>

        <Text style={styles.headerBarTitle}>Screen Time</Text>

        {/* Right Settings / Sync / Control Button */}
        <TouchableOpacity
          style={styles.settingsBtn}
          activeOpacity={0.7}
          onPress={() => setShowControlModal(true)}
        >
          <SlidersHorizontal size={18} color="#365B45" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Hero & Eyebrow Section (Matching Image 2) ──────────────── */}
        <View style={styles.heroSection}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrowText}>DIGITAL WELLBEING</Text>
            <View style={styles.bloomBalancePill}>
              <Text style={styles.bloomBalanceText}>Bloom Balance</Text>
            </View>
          </View>

          <View style={styles.mainTitleRow}>
            <Text style={styles.mainTitle}>Restorative Balance</Text>
            <TouchableOpacity
              onPress={() => setShowInfoModal(true)}
              style={styles.titleInfoTouch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <HelpCircle size={18} color="#789B83" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroDesc}>
            Nurturing conscious focus, gentle boundaries, and mindful screen rest.
          </Text>
        </View>

        {/* ── 2. Daily Screen Time Card (Matching Image 2) ──────────────── */}
        <View style={[styles.dailyCard, Shadows.sm]}>
          <View style={styles.ringContainer}>
            <Svg width={ringSize} height={ringSize}>
              {/* Outer Track (Dark Forest Green) */}
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radiusOuter}
                stroke="#E8ECE9"
                strokeWidth={strokeOuter}
                fill="none"
              />
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radiusOuter}
                stroke="#365B45"
                strokeWidth={strokeOuter}
                strokeDasharray={`${circOuter} ${circOuter}`}
                strokeDashoffset={strokeDashoffsetOuter}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              />

              {/* Inner Track (Primary Sage) */}
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radiusInner}
                stroke="#E8ECE9"
                strokeWidth={strokeInner}
                fill="none"
              />
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radiusInner}
                stroke="#789B83"
                strokeWidth={strokeInner}
                strokeDasharray={`${circInner} ${circInner}`}
                strokeDashoffset={strokeDashoffsetInner}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              />
            </Svg>

            {/* Centered Time Text */}
            <View style={styles.ringCenterTextWrap}>
              <Text style={styles.ringBigTime}>{displayTotalTime}</Text>
              <Text style={styles.ringSubtext}>Daily screen time</Text>
            </View>
          </View>

          {/* Sub-pill badge */}
          <View style={styles.lessYesterdayPill}>
            <Text style={styles.lessYesterdayText}>
              {dataMode === 'phone' ? 'Sun, 1 Nov Active' : '14% less than yesterday'}
            </Text>
          </View>

          {/* Status Note */}
          <View style={styles.statusNoteBox}>
            <Sparkles size={16} color="#365B45" strokeWidth={2} style={{ marginTop: 2 }} />
            <Text style={styles.statusNoteText}>
              Gentle progress. You spent 45 uninterrupted minutes in Study Focus mode today.
            </Text>
          </View>
        </View>

        {/* ── 3. Mindful Break Suggestion Banner (Matching Image 2) ─────── */}
        <TouchableOpacity
          style={[styles.mindfulBreakBanner, Shadows.sm]}
          activeOpacity={0.85}
          onPress={startBreathingCycle}
        >
          <View style={styles.breakIconCircle}>
            <Wind size={20} color="#365B45" strokeWidth={2.2} />
          </View>
          <View style={styles.breakTextWrap}>
            <Text style={styles.breakText}>
              Mindful break suggested: Rest your eyes with 3 deep breaths...
            </Text>
          </View>
          <View style={styles.breakPlayBtn}>
            <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* ── 4. Weekly Pattern Graph Card (Matching Image 2) ──────────── */}
        <View style={[styles.weeklyCard, Shadows.sm]}>
          <View style={styles.weeklyHeaderRow}>
            <Text style={styles.weeklyEyebrow}>WEEKLY PATTERN</Text>
            <View style={styles.onTrackPill}>
              <Text style={styles.onTrackPillText}>On track</Text>
            </View>
          </View>

          <Text style={styles.weeklyAvgTime}>3 hrs, 18 min avg</Text>

          {/* Vertical Bar Chart with Interactive Highlight Tooltip */}
          <View style={styles.chartArea}>
            <View style={styles.chartBarsRow}>
              {weeklyDays.map((item, idx) => {
                const isSelected = idx === highlightedIndex;
                const barHeightPercent = Math.min(100, Math.max(15, (item.hours / 5) * 100));

                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.barColumn}
                    activeOpacity={0.7}
                    onPress={() => setHighlightedIndex(idx)}
                  >
                    {/* Floating dark tooltip badge above selected bar */}
                    {isSelected && (
                      <View style={styles.tooltipPill}>
                        <Text style={styles.tooltipPillText}>{item.label}</Text>
                        <View style={styles.tooltipArrow} />
                      </View>
                    )}

                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${barHeightPercent}%`,
                            backgroundColor: isSelected ? '#365B45' : '#D9EEE5',
                          },
                        ]}
                      />
                    </View>

                    <Text
                      style={[
                        styles.dayChar,
                        isSelected && styles.dayCharSelected,
                      ]}
                    >
                      {item.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Legend */}
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#365B45' }]} />
              <Text style={styles.legendLabel}>Today</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#D9EEE5' }]} />
              <Text style={styles.legendLabel}>Past Days</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#789B83' }]} />
              <Text style={styles.legendLabel}>Target</Text>
            </View>
          </View>
        </View>

        {/* ── 5. App Intentions Section (Matching Image 3 & Image 1) ────── */}
        <View style={styles.intentionsSection}>
          <View style={styles.intentionsHeaderRow}>
            <View>
              <Text style={styles.intentionsHeading}>App Intentions</Text>
              <Text style={styles.intentionsSubheading}>
                Tap hourglass to set mindful gentle boundary
              </Text>
            </View>

            <TouchableOpacity
              style={styles.syncSmallBadge}
              onPress={() => setShowControlModal(true)}
              activeOpacity={0.7}
            >
              <Smartphone size={12} color="#365B45" />
              <Text style={styles.syncSmallText}>
                {dataMode === 'phone' ? 'Phone Stats' : 'Mockup'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* App Cards List */}
          <View style={styles.appsList}>
            {apps.map((app) => (
              <View key={app.id} style={[styles.appCardItem, Shadows.sm]}>
                {/* Avatar with Initials */}
                <View style={[styles.appAvatar, { backgroundColor: app.avatarBg }]}>
                  <Text style={[styles.appAvatarText, { color: app.avatarColor }]}>
                    {app.initials}
                  </Text>
                </View>

                {/* Middle Details */}
                <View style={styles.appMiddleDetails}>
                  <View style={styles.appNameRow}>
                    <Text style={styles.appNameText}>{app.name}</Text>
                    {app.statusType === 'exceeded' ? (
                      <View style={styles.badgeExceeded}>
                        <Text style={styles.badgeExceededText}>Exceeded</Text>
                      </View>
                    ) : (
                      <View style={styles.badgeLimitMint}>
                        <Text style={styles.badgeLimitMintText}>
                          {Math.floor(app.limitMinutes / 60) > 0
                            ? `${Math.floor(app.limitMinutes / 60)}h ${app.limitMinutes % 60 > 0 ? `${app.limitMinutes % 60}m` : ''}`
                            : `${app.limitMinutes}m`}{' '}
                          limit
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.appSubDetails}>
                    {app.todayDuration} — Limit:{' '}
                    {Math.floor(app.limitMinutes / 60) > 0
                      ? `${Math.floor(app.limitMinutes / 60)}h `
                      : ''}
                    {app.limitMinutes % 60 > 0 ? `${app.limitMinutes % 60}m` : ''}
                  </Text>
                </View>

                {/* Hourglass Action Button */}
                <TouchableOpacity
                  style={styles.appHourglassBtn}
                  activeOpacity={0.8}
                  onPress={() => handleOpenLimitModal(app)}
                >
                  <Hourglass size={16} color="#FFFFFF" strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* ── 6. Evening Transition Card (Matching Image 3) ─────────────── */}
        <View style={[styles.eveningBanner, Shadows.md]}>
          <View style={styles.eveningTopRow}>
            <Moon size={15} color="#D9EEE5" strokeWidth={2.2} />
            <Text style={styles.eveningEyebrow}>EVENING TRANSITION</Text>
          </View>

          <Text style={styles.eveningTitle}>Schedule Wind-Down Routine</Text>
          <Text style={styles.eveningDesc}>
            Dim bright feeds at 10:30 PM with ambient study soundscapes and light journaling.
          </Text>

          <View style={styles.eveningButtonsRow}>
            <TouchableOpacity
              style={styles.eveningOutlineBtn}
              activeOpacity={0.8}
              onPress={() => setShowWindDownModal(true)}
            >
              <Text style={styles.eveningOutlineText}>Set Gentle Limit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.eveningSolidBtn}
              activeOpacity={0.8}
              onPress={() => setShowLearnMoreModal(true)}
            >
              <Text style={styles.eveningSolidText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── MODAL 1: Set Daily Limit Modal (Matching Image 3 specs) ───── */}
      <Modal
        visible={selectedApp !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedApp(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetContent}>
            <Text style={styles.modalEyebrow}>MINDFUL BOUNDARY</Text>
            <Text style={styles.modalMainTitle}>Set Daily Limit</Text>
            <Text style={styles.modalSubheading}>
              Tailor your daily balance for{' '}
              <Text style={{ fontWeight: '700', color: '#365B45' }}>{selectedApp?.name}</Text>
            </Text>

            {/* Number Spinners for Hours & Minutes */}
            <View style={styles.spinnersRow}>
              {/* Hours Column */}
              <View style={styles.spinnerColumn}>
                <Text style={styles.spinnerLabel}>HOURS</Text>
                <View style={styles.spinnerBox}>
                  <Text style={styles.spinnerText}>
                    {limitHours.toString().padStart(2, '0')}
                  </Text>
                </View>
                <View style={styles.adjustButtonsRow}>
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={decrementHours}
                    activeOpacity={0.7}
                  >
                    <Minus size={16} color="#365B45" strokeWidth={2.5} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={incrementHours}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color="#365B45" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.spinnerColon}>:</Text>

              {/* Minutes Column */}
              <View style={styles.spinnerColumn}>
                <Text style={styles.spinnerLabel}>MINUTES</Text>
                <View style={styles.spinnerBox}>
                  <Text style={styles.spinnerText}>
                    {limitMinutes.toString().padStart(2, '0')}
                  </Text>
                </View>
                <View style={styles.adjustButtonsRow}>
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={decrementMinutes}
                    activeOpacity={0.7}
                  >
                    <Minus size={16} color="#365B45" strokeWidth={2.5} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={incrementMinutes}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color="#365B45" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Soft Chime Notice Banner */}
            <View style={styles.softChimeBanner}>
              <Bell size={18} color="#365B45" strokeWidth={2} style={{ marginTop: 2 }} />
              <Text style={styles.softChimeText}>
                We will send a soft chime 10 minutes before your window closes.
              </Text>
            </View>

            {/* Action Buttons: Cancel and Set Timer */}
            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.8}
                onPress={() => setSelectedApp(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.setTimerBtn}
                activeOpacity={0.8}
                onPress={handleSaveTimer}
              >
                <Text style={styles.setTimerBtnText}>Set Timer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: Device Sync & Manual Entry Hub ──────────────────── */}
      <Modal
        visible={showControlModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowControlModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheetContent, { maxHeight: '90%' }]}>
            <View style={styles.controlModalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>DEVICE INTEGRATION</Text>
                <Text style={styles.modalMainTitle}>Screen Time Settings</Text>
              </View>
              <TouchableOpacity
                style={styles.closeRoundBtn}
                onPress={() => setShowControlModal(false)}
              >
                <X size={20} color="#29332E" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Quick Preset Selector Buttons */}
              <Text style={styles.sectionSubtitle}>QUICK PRESETS</Text>
              <View style={styles.presetButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    dataMode === 'phone' && styles.presetBtnActive,
                  ]}
                  onPress={handleLoadPhoneData}
                  activeOpacity={0.8}
                >
                  <Smartphone
                    size={18}
                    color={dataMode === 'phone' ? '#FFFFFF' : '#365B45'}
                  />
                  <Text
                    style={[
                      styles.presetBtnText,
                      dataMode === 'phone' && styles.presetBtnTextActive,
                    ]}
                  >
                    Phone Activity (2h 31m)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    dataMode === 'mockup' && styles.presetBtnActive,
                  ]}
                  onPress={handleLoadMockupData}
                  activeOpacity={0.8}
                >
                  <Sparkles
                    size={18}
                    color={dataMode === 'mockup' ? '#FFFFFF' : '#365B45'}
                  />
                  <Text
                    style={[
                      styles.presetBtnText,
                      dataMode === 'mockup' && styles.presetBtnTextActive,
                    ]}
                  >
                    Mockup (4h 31m)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Notification Triggers (Hackathon testing) */}
              <Text style={styles.sectionSubtitle}>NOTIFICATION TRIGGERS</Text>
              <View style={styles.notifTriggersRow}>
                <TouchableOpacity
                  style={styles.notifTestBtn}
                  onPress={() => {
                    sendExcessiveAppAlert('Instagram', 105, 90);
                    setShowControlModal(false);
                  }}
                >
                  <Bell size={16} color="#365B45" />
                  <Text style={styles.notifTestBtnText}>Test Overuse Alert</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.notifTestBtn}
                  onPress={() => {
                    sendBedtimeNotification(23, totalSpentMinutes);
                    setShowControlModal(false);
                  }}
                >
                  <Moon size={16} color="#365B45" />
                  <Text style={styles.notifTestBtnText}>Test Bedtime Alert</Text>
                </TouchableOpacity>
              </View>

              {/* Manual App Usage Entry Section */}
              <Text style={styles.sectionSubtitle}>MANUAL USAGE LOG (TODAY)</Text>
              {apps.map((a) => (
                <View key={a.id} style={styles.manualAppRow}>
                  <View style={styles.manualAppInfo}>
                    <Text style={styles.manualAppName}>{a.name}</Text>
                    <Text style={styles.manualAppCurrent}>
                      Current: {a.spentMinutes} mins (Limit: {a.limitMinutes}m)
                    </Text>
                  </View>

                  <View style={styles.manualAppSteppers}>
                    <TouchableOpacity
                      style={styles.manualMinusBtn}
                      onPress={() =>
                        handleUpdateAppSpent(a.id, Math.max(0, a.spentMinutes - 15))
                      }
                    >
                      <Minus size={14} color="#365B45" />
                    </TouchableOpacity>
                    <Text style={styles.manualMinutesValue}>{a.spentMinutes}m</Text>
                    <TouchableOpacity
                      style={styles.manualPlusBtn}
                      onPress={() => handleUpdateAppSpent(a.id, a.spentMinutes + 15)}
                    >
                      <Plus size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Add New App Section */}
              <Text style={styles.sectionSubtitle}>+ ADD CUSTOM APP</Text>
              <View style={styles.addAppBox}>
                <TextInput
                  style={styles.addAppInput}
                  placeholder="App Name (e.g. Netflix, Discord)"
                  placeholderTextColor="#7B857F"
                  value={newAppName}
                  onChangeText={setNewAppName}
                />
                <View style={styles.addAppInputsRow}>
                  <TextInput
                    style={[styles.addAppInput, { flex: 1 }]}
                    placeholder="Minutes spent (e.g. 45)"
                    placeholderTextColor="#7B857F"
                    keyboardType="numeric"
                    value={newAppMinutes}
                    onChangeText={setNewAppMinutes}
                  />
                  <TextInput
                    style={[styles.addAppInput, { flex: 1 }]}
                    placeholder="Limit mins (e.g. 60)"
                    placeholderTextColor="#7B857F"
                    keyboardType="numeric"
                    value={newAppLimit}
                    onChangeText={setNewAppLimit}
                  />
                </View>
                <TouchableOpacity
                  style={styles.addAppSaveBtn}
                  onPress={handleAddCustomApp}
                >
                  <Text style={styles.addAppSaveBtnText}>Add App to Tracking</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: Mindful 3-Breaths Visual Exercise ────────────────── */}
      <Modal
        visible={showBreathingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBreathingModal(false)}
      >
        <View style={styles.breathingBackdrop}>
          <View style={styles.breathingCard}>
            <TouchableOpacity
              style={styles.breathingCloseBtn}
              onPress={() => setShowBreathingModal(false)}
            >
              <X size={20} color="#7B857F" />
            </TouchableOpacity>

            <Text style={styles.breathingEyebrow}>STUDY BREAK OASIS</Text>
            <Text style={styles.breathingTitle}>Rest Your Eyes</Text>
            <Text style={styles.breathingSub}>
              Cycle {breathCount} of 3 • Follow the circle
            </Text>

            <View style={styles.breathingCircleContainer}>
              <Animated.View
                style={[
                  styles.breathingCircle,
                  {
                    transform: [{ scale: breathAnim }],
                  },
                ]}
              >
                <Text style={styles.breathPhaseText}>{breathPhase}</Text>
              </Animated.View>
            </View>

            <Text style={styles.breathingInstructions}>
              {breathPhase === 'Inhale'
                ? 'Gently draw air through your nose, relaxing your temples...'
                : breathPhase === 'Hold'
                ? 'Softly hold your breath. Feel stillness in your mind...'
                : 'Slowly release through your mouth, letting screen tension dissolve.'}
            </Text>

            <TouchableOpacity
              style={styles.completeBreathBtn}
              onPress={() => setShowBreathingModal(false)}
            >
              <Text style={styles.completeBreathBtnText}>Finish Break</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 4: Wind-Down Routine Modal ──────────────────────────── */}
      <Modal
        visible={showWindDownModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWindDownModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetContent}>
            <Text style={styles.modalEyebrow}>EVENING CIRCADIAN SYNC</Text>
            <Text style={styles.modalMainTitle}>Schedule Wind-Down</Text>
            <Text style={styles.modalSubheading}>
              Set a gentle cutoff to dim feeds and prepare your nervous system for sleep.
            </Text>

            <View style={styles.windDownPickerBox}>
              <Moon size={22} color="#365B45" />
              <View style={{ flex: 1 }}>
                <Text style={styles.windDownTimeLabel}>Wind-Down Target</Text>
                <Text style={styles.windDownTimeVal}>{windDownTime}</Text>
              </View>
              <TouchableOpacity
                style={styles.toggleTimeBtn}
                onPress={() =>
                  setWindDownTime((t) => (t === '10:30 PM' ? '11:00 PM' : '10:30 PM'))
                }
              >
                <Text style={styles.toggleTimeBtnText}>Change</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.softChimeBanner}>
              <ShieldCheck size={18} color="#365B45" strokeWidth={2} />
              <Text style={styles.softChimeText}>
                Bloom will dispatch a gentle reminder notification at {windDownTime} to encourage digital disconnection.
              </Text>
            </View>

            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowWindDownModal(false)}
              >
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.setTimerBtn}
                onPress={() => {
                  setShowWindDownModal(false);
                  sendBedtimeNotification(22, totalSpentMinutes);
                  sendScreenTimeAlert(
                    '🌙 Wind-Down Routine Active',
                    `Scheduled for ${windDownTime}. Your sleep sanctuary is primed!`
                  );
                }}
              >
                <Text style={styles.setTimerBtnText}>Save Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 5: Restorative Balance Info Modal ───────────────────── */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.infoModalContent}>
            <View style={styles.infoTopRow}>
              <Text style={styles.infoTitle}>Restorative Balance</Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <X size={18} color="#7B857F" />
              </TouchableOpacity>
            </View>
            <Text style={styles.infoBody}>
              Bloom tracks both active screen time and mindful focus periods. Rather than punitive lockouts, we encourage mindful boundaries and evening wind-down habits that protect your REM sleep architecture.
            </Text>
            <TouchableOpacity
              style={styles.infoCloseBtn}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.infoCloseBtnText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 6: Learn More Modal ─────────────────────────────────── */}
      <Modal
        visible={showLearnMoreModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLearnMoreModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.infoModalContent}>
            <View style={styles.infoTopRow}>
              <Text style={styles.infoTitle}>Circadian Wind-Down</Text>
              <TouchableOpacity onPress={() => setShowLearnMoreModal(false)}>
                <X size={18} color="#7B857F" />
              </TouchableOpacity>
            </View>
            <Text style={styles.infoBody}>
              Blue light emission from social feeds suppresses melatonin secretion by up to 50%. Setting a mindful 10:30 PM cutoff gives your pineal gland 90 minutes of darkness adaptation before sleep, yielding deeper stage 3 slow-wave physical recovery.
            </Text>
            <TouchableOpacity
              style={styles.infoCloseBtn}
              onPress={() => setShowLearnMoreModal(false)}
            >
              <Text style={styles.infoCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F2', // Off-white / Cream
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: '#FAF8F2',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#29332E',
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D9EEE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 6,
  },

  // Toast Banner
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    backgroundColor: '#365B45',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 9999,
  },
  toastIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTextWrap: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toastBody: {
    fontSize: 11.5,
    color: '#D9EEE5',
    marginTop: 2,
    lineHeight: 15,
  },

  // 1. Hero Section (Image 2)
  heroSection: {
    marginBottom: 20,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#789B83', // Primary Sage
    letterSpacing: 0.8,
  },
  bloomBalancePill: {
    backgroundColor: '#D9EEE5', // Soft Mint
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  bloomBalanceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#365B45', // Dark Forest Green
  },
  mainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#29332E',
    letterSpacing: -0.4,
  },
  titleInfoTouch: {
    padding: 2,
  },
  heroDesc: {
    fontSize: 13.5,
    color: '#7B857F',
    lineHeight: 19,
  },

  // 2. Daily Screen Time Card (Image 2)
  dailyCard: {
    backgroundColor: '#FFFFFF', // Pure White
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  ringContainer: {
    position: 'relative',
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  ringCenterTextWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBigTime: {
    fontSize: 32,
    fontWeight: '800',
    color: '#29332E',
    letterSpacing: -0.5,
  },
  ringSubtext: {
    fontSize: 12,
    color: '#7B857F',
    marginTop: 2,
  },
  lessYesterdayPill: {
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    marginBottom: 14,
  },
  lessYesterdayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#365B45',
  },
  statusNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAF8F2',
    borderRadius: BorderRadius.md,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    width: '100%',
  },
  statusNoteText: {
    fontSize: 12,
    color: '#29332E',
    lineHeight: 17,
    flex: 1,
    fontWeight: '500',
  },

  // 3. Mindful Break Banner (Image 2)
  mindfulBreakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9EEE5',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#CDE5DB',
  },
  breakIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  breakTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  breakText: {
    fontSize: 13,
    color: '#365B45',
    fontWeight: '600',
    lineHeight: 18,
  },
  breakPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#365B45',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 4. Weekly Pattern Card (Image 2)
  weeklyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  weeklyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  weeklyEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7B857F',
    letterSpacing: 0.8,
  },
  onTrackPill: {
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  onTrackPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#365B45',
  },
  weeklyAvgTime: {
    fontSize: 17,
    fontWeight: '700',
    color: '#29332E',
    marginBottom: 16,
  },
  chartArea: {
    height: 140,
    justifyContent: 'flex-end',
    marginBottom: 14,
  },
  chartBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 110,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  tooltipPill: {
    backgroundColor: '#29332E',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 4,
    position: 'relative',
    alignItems: 'center',
  },
  tooltipPillText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#29332E',
    position: 'absolute',
    bottom: -4,
  },
  barTrack: {
    width: 22,
    height: 80,
    justifyContent: 'flex-end',
    backgroundColor: '#FAF8F2',
    borderRadius: 11,
    overflow: 'hidden',
  },
  barFill: {
    width: 22,
    borderRadius: 11,
  },
  dayChar: {
    fontSize: 11,
    color: '#7B857F',
    marginTop: 6,
    fontWeight: '500',
  },
  dayCharSelected: {
    color: '#365B45',
    fontWeight: '800',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#E8ECE9',
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: '#7B857F',
    fontWeight: '500',
  },

  // 5. App Intentions Section (Image 3)
  intentionsSection: {
    marginBottom: 20,
  },
  intentionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  intentionsHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#29332E',
  },
  intentionsSubheading: {
    fontSize: 12,
    color: '#7B857F',
    marginTop: 2,
  },
  syncSmallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  syncSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#365B45',
  },
  appsList: {
    gap: 10,
  },
  appCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  appAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appAvatarText: {
    fontSize: 15,
    fontWeight: '800',
  },
  appMiddleDetails: {
    flex: 1,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  appNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#29332E',
  },
  badgeExceeded: {
    backgroundColor: '#F7E5DA', // Soft peach
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  badgeExceededText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C25454',
  },
  badgeLimitMint: {
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  badgeLimitMintText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#365B45',
  },
  appSubDetails: {
    fontSize: 11.5,
    color: '#7B857F',
  },
  appHourglassBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#365B45',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  // 6. Evening Transition Card (Image 3)
  eveningBanner: {
    backgroundColor: '#365B45', // Dark Forest Green
    borderRadius: 24,
    padding: 22,
  },
  eveningTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eveningEyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#D9EEE5',
    letterSpacing: 1,
  },
  eveningTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  eveningDesc: {
    fontSize: 13,
    color: '#D9EEE5',
    lineHeight: 18,
    marginTop: 6,
  },
  eveningButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  eveningOutlineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.round,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
  },
  eveningOutlineText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  eveningSolidBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.round,
    backgroundColor: '#D9EEE5',
    alignItems: 'center',
  },
  eveningSolidText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#365B45',
  },

  // Modals Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(41, 51, 46, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#789B83',
    letterSpacing: 1,
    textAlign: 'center',
  },
  modalMainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#29332E',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  modalSubheading: {
    fontSize: 13,
    color: '#7B857F',
    textAlign: 'center',
    marginBottom: 20,
  },
  spinnersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  spinnerColumn: {
    alignItems: 'center',
  },
  spinnerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7B857F',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  spinnerBox: {
    width: 76,
    height: 60,
    backgroundColor: '#D9EEE5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  spinnerText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#365B45',
  },
  spinnerColon: {
    fontSize: 28,
    fontWeight: '800',
    color: '#365B45',
    marginTop: 18,
  },
  adjustButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF8F2',
    borderWidth: 1,
    borderColor: '#E8ECE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  softChimeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAF8F2',
    borderRadius: BorderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    gap: 10,
    marginBottom: 20,
  },
  softChimeText: {
    fontSize: 12,
    color: '#29332E',
    lineHeight: 17,
    flex: 1,
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.round,
    backgroundColor: '#D9EEE5',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#365B45',
  },
  setTimerBtn: {
    flex: 1.2,
    paddingVertical: 14,
    borderRadius: BorderRadius.round,
    backgroundColor: '#365B45',
    alignItems: 'center',
  },
  setTimerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Control Hub Styles
  controlModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  closeRoundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF8F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#789B83',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FAF8F2',
    borderWidth: 1.5,
    borderColor: '#E8ECE9',
  },
  presetBtnActive: {
    backgroundColor: '#365B45',
    borderColor: '#365B45',
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#365B45',
  },
  presetBtnTextActive: {
    color: '#FFFFFF',
  },
  notifTriggersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  notifTestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#D9EEE5',
  },
  notifTestBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#365B45',
  },
  manualAppRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F2',
  },
  manualAppInfo: {
    flex: 1,
  },
  manualAppName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#29332E',
  },
  manualAppCurrent: {
    fontSize: 11,
    color: '#7B857F',
    marginTop: 2,
  },
  manualAppSteppers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manualMinusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FAF8F2',
    borderWidth: 1,
    borderColor: '#E8ECE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualMinutesValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#29332E',
    minWidth: 42,
    textAlign: 'center',
  },
  manualPlusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#365B45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAppBox: {
    backgroundColor: '#FAF8F2',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  addAppInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#29332E',
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  addAppInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addAppSaveBtn: {
    backgroundColor: '#365B45',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addAppSaveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },

  // Breathing Modal
  breathingBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(41, 51, 46, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  breathingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 26,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  breathingCloseBtn: {
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  breathingEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#789B83',
    letterSpacing: 1,
  },
  breathingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#29332E',
    marginTop: 2,
  },
  breathingSub: {
    fontSize: 12.5,
    color: '#7B857F',
    marginTop: 4,
    marginBottom: 20,
  },
  breathingCircleContainer: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  breathingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D9EEE5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#789B83',
  },
  breathPhaseText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#365B45',
  },
  breathingInstructions: {
    fontSize: 13,
    color: '#7B857F',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    minHeight: 36,
  },
  completeBreathBtn: {
    backgroundColor: '#365B45',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.round,
  },
  completeBreathBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Wind-Down Picker
  windDownPickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FAF8F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  windDownTimeLabel: {
    fontSize: 11,
    color: '#7B857F',
    fontWeight: '600',
  },
  windDownTimeVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#29332E',
    marginTop: 2,
  },
  toggleTimeBtn: {
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  toggleTimeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#365B45',
  },

  // Info Modal Styles
  infoModalContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 22,
    alignSelf: 'center',
    width: SCREEN_WIDTH - 48,
  },
  infoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#29332E',
  },
  infoBody: {
    fontSize: 13.5,
    color: '#7B857F',
    lineHeight: 20,
    marginBottom: 18,
  },
  infoCloseBtn: {
    backgroundColor: '#365B45',
    paddingVertical: 12,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
  },
  infoCloseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
