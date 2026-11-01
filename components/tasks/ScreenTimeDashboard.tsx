import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  Modal,
  Animated,
} from 'react-native';
import {
  ArrowLeft,
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Hourglass,
  Camera,
  Play,
  Phone,
  Globe,
  Music,
  Settings as SettingsIcon,
  Moon,
  AlertTriangle,
  X,
  Plus,
  Minus,
  Sparkles,
  Flame,
  Check,
  Pause,
  RotateCcw,
} from 'lucide-react-native';
import {
  isNativeModuleAvailable,
  hasUsagePermission,
  openUsageAccessSettings,
  getTodayAppUsage,
} from '../../services/usageStatsNative';
import {
  sendScreenTimeAlert,
  sendExcessiveAppAlert,
  sendBedtimeNotification,
  subscribeToInAppAlerts,
  InAppAlert,
} from '../../services/notificationService';

interface AppItem {
  id: string;
  name: string;
  packageName: string;
  minutes: number;
  iconType: 'instagram' | 'youtube' | 'whatsapp' | 'expo' | 'chrome' | 'spotify' | 'settings';
  iconBase64?: string;
  limitMinutes?: number;
}

interface Props {
  initialFocusMode?: boolean;
  onBack?: () => void;
}

export default function ScreenTimeDashboard({ initialFocusMode = false, onBack }: Props) {
  // Active metric view (matching Android Digital Wellbeing dropdown)
  const [metric, setMetric] = useState<'screen_time' | 'notifications' | 'times_opened'>('screen_time');
  const [showMetricDropdown, setShowMetricDropdown] = useState(false);

  // Focus mode toggle
  const [showFocusMode, setShowFocusMode] = useState(initialFocusMode);

  // Selected date index (0 = Sun 1 Nov, matching screenshot)
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  // App Usage data matching the user's uploaded screenshot exactly
  const [apps, setApps] = useState<AppItem[]>([
    {
      id: 'ig',
      name: 'Instagram',
      packageName: 'com.instagram.android',
      minutes: 54,
      iconType: 'instagram',
      limitMinutes: 60,
    },
    {
      id: 'yt',
      name: 'YouTube',
      packageName: 'com.google.android.youtube',
      minutes: 26,
      iconType: 'youtube',
    },
    {
      id: 'wa',
      name: 'WhatsApp',
      packageName: 'com.whatsapp',
      minutes: 20,
      iconType: 'whatsapp',
      limitMinutes: 45,
    },
    {
      id: 'expo',
      name: 'Expo Go',
      packageName: 'host.exp.exponent',
      minutes: 17,
      iconType: 'expo',
    },
    {
      id: 'chrome',
      name: 'Chrome',
      packageName: 'com.android.chrome',
      minutes: 14,
      iconType: 'chrome',
    },
    {
      id: 'spotify',
      name: 'Spotify',
      packageName: 'com.spotify.music',
      minutes: 11,
      iconType: 'spotify',
    },
    {
      id: 'settings',
      name: 'Settings',
      packageName: 'com.android.settings',
      minutes: 9,
      iconType: 'settings',
    },
  ]);

  // Weekly bar data matching screenshot (Sun has 151 mins = 2h 31m, others 0h)
  const [weeklyData, setWeeklyData] = useState([
    { day: 'Sun', date: 'Sun, 1 Nov', minutes: 151 },
    { day: 'Mon', date: 'Mon, 2 Nov', minutes: 0 },
    { day: 'Tue', date: 'Tue, 3 Nov', minutes: 0 },
    { day: 'Wed', date: 'Wed, 4 Nov', minutes: 0 },
    { day: 'Thu', date: 'Thu, 5 Nov', minutes: 0 },
    { day: 'Fri', date: 'Fri, 6 Nov', minutes: 0 },
    { day: 'Sat', date: 'Sat, 7 Nov', minutes: 0 },
  ]);

  // Permission & native state
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [hasNativePermission, setHasNativePermission] = useState(false);

  // App Timer Modal
  const [selectedAppForTimer, setSelectedAppForTimer] = useState<AppItem | null>(null);

  // In-app Alert heads-up toast banner
  const [activeToast, setActiveToast] = useState<InAppAlert | null>(null);
  const toastAnim = useRef(new Animated.Value(-120)).current;

  // Real-time ticking indicator
  const [realtimeSeconds, setRealtimeSeconds] = useState(0);

  // Focus Mode Timer State
  const [focusActive, setFocusActive] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);

  // Subscribe to in-app alerts
  useEffect(() => {
    const unsub = subscribeToInAppAlerts((alert) => {
      setActiveToast(alert);
      Animated.sequence([
        Animated.spring(toastAnim, { toValue: 16, useNativeDriver: true, tension: 80, friction: 9 }),
        Animated.delay(4500),
        Animated.timing(toastAnim, { toValue: -120, duration: 300, useNativeDriver: true }),
      ]).start(() => setActiveToast(null));
    });
    return () => unsub();
  }, [toastAnim]);

  // Check Android native module availability
  useEffect(() => {
    const checkNative = async () => {
      const avail = isNativeModuleAvailable();
      setNativeAvailable(avail);
      if (avail) {
        const perm = await hasUsagePermission();
        setHasNativePermission(perm);
        if (perm) {
          const usage = await getTodayAppUsage();
          if (usage && usage.apps.length > 0) {
            const mapped: AppItem[] = usage.apps.slice(0, 10).map((a, idx) => ({
              id: a.packageName,
              name: a.appName,
              packageName: a.packageName,
              minutes: a.usageMinutes,
              iconType: a.packageName.includes('instagram')
                ? 'instagram'
                : a.packageName.includes('youtube')
                ? 'youtube'
                : a.packageName.includes('whatsapp')
                ? 'whatsapp'
                : a.packageName.includes('chrome')
                ? 'chrome'
                : a.packageName.includes('spotify')
                ? 'spotify'
                : 'settings',
              iconBase64: a.iconBase64,
            }));
            setApps(mapped);
            setWeeklyData((prev) => {
              const copy = [...prev];
              copy[0] = { ...copy[0], minutes: usage.totalMinutes };
              return copy;
            });
          }
        }
      }
    };
    checkNative();
  }, []);

  // Real-time background ticking for active foreground session
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeSeconds((s) => s + 1);
      // Every 60 seconds of real-time usage, tick up Expo Go & Sunday's total
      setApps((prevApps) =>
        prevApps.map((a) => {
          if (a.iconType === 'expo') {
            return { ...a, minutes: a.minutes + (realtimeSeconds > 0 && realtimeSeconds % 60 === 0 ? 1 : 0) };
          }
          return a;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [realtimeSeconds]);

  // Focus timer countdown
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (focusActive && focusSeconds > 0) {
      timer = setInterval(() => setFocusSeconds((s) => s - 1), 1000);
    } else if (focusSeconds === 0) {
      setFocusActive(false);
      sendScreenTimeAlert('🎯 Focus Session Completed!', 'Great job! 25 minutes of deep undistracted study finished.');
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [focusActive, focusSeconds]);

  // Total screen time calculation
  const totalMinutes = apps.reduce((sum, a) => sum + a.minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;

  // Time navigation handlers (< Sun, 1 Nov >)
  const handlePrevDay = () => {
    setSelectedDayIdx((prev) => (prev > 0 ? prev - 1 : weeklyData.length - 1));
  };
  const handleNextDay = () => {
    setSelectedDayIdx((prev) => (prev < weeklyData.length - 1 ? prev + 1 : 0));
  };

  // Adjust app minutes for live demonstration
  const handleAdjustAppMinutes = (appId: string, delta: number) => {
    setApps((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          const newMins = Math.max(0, app.minutes + delta);
          // Check limit trigger
          if (app.limitMinutes && newMins >= app.limitMinutes) {
            sendExcessiveAppAlert(app.name, newMins, app.limitMinutes);
          }
          return { ...app, minutes: newMins };
        }
        return app;
      })
    );
    setWeeklyData((prev) => {
      const copy = [...prev];
      copy[selectedDayIdx] = {
        ...copy[selectedDayIdx],
        minutes: Math.max(0, copy[selectedDayIdx].minutes + delta),
      };
      return copy;
    });
  };

  // Set App Timer Limit
  const handleSetAppTimer = (limitMinutes: number | undefined) => {
    if (!selectedAppForTimer) return;
    setApps((prev) =>
      prev.map((a) => (a.id === selectedAppForTimer.id ? { ...a, limitMinutes } : a))
    );
    const appName = selectedAppForTimer.name;
    const currentMins = selectedAppForTimer.minutes;
    setSelectedAppForTimer(null);

    if (limitMinutes) {
      if (currentMins >= limitMinutes) {
        sendExcessiveAppAlert(appName, currentMins, limitMinutes);
      } else {
        sendScreenTimeAlert(
          `⏱️ Timer Set: ${appName}`,
          `Daily limit set to ${limitMinutes} mins. Bloom will alert you when you exceed it.`
        );
      }
    }
  };

  // Trigger Bedtime Alert Test
  const handleTestBedtimeAlert = () => {
    sendBedtimeNotification(23, totalMinutes); // 11:00 PM simulation
  };

  // Trigger Excessive Screen Time Alert Test
  const handleTestExcessiveAlert = () => {
    sendExcessiveAppAlert('Instagram', 54, 45);
  };

  // Render branded app icon
  const renderAppIcon = (app: AppItem) => {
    if (app.iconBase64) {
      return <Image source={{ uri: app.iconBase64 }} style={styles.nativeAppIcon} />;
    }

    switch (app.iconType) {
      case 'instagram':
        return (
          <View style={[styles.appIconBase, styles.instagramGradient]}>
            <Camera size={22} color="#FFFFFF" strokeWidth={2.2} />
          </View>
        );
      case 'youtube':
        return (
          <View style={[styles.appIconBase, styles.youtubeBg]}>
            <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        );
      case 'whatsapp':
        return (
          <View style={[styles.appIconBase, styles.whatsappBg]}>
            <Phone size={20} color="#FFFFFF" strokeWidth={2.4} />
          </View>
        );
      case 'expo':
        return (
          <View style={[styles.appIconBase, styles.expoBg]}>
            <Text style={styles.expoIconText}>▲</Text>
          </View>
        );
      case 'chrome':
        return (
          <View style={[styles.appIconBase, styles.chromeBg]}>
            <Globe size={20} color="#FFFFFF" strokeWidth={2.2} />
          </View>
        );
      case 'spotify':
        return (
          <View style={[styles.appIconBase, styles.spotifyBg]}>
            <Music size={20} color="#FFFFFF" strokeWidth={2.2} />
          </View>
        );
      default:
        return (
          <View style={[styles.appIconBase, styles.defaultBg]}>
            <SettingsIcon size={20} color="#FFFFFF" strokeWidth={2.2} />
          </View>
        );
    }
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Floating In-App Push Notification Heads-up Toast Banner */}
      {activeToast && (
        <Animated.View style={[styles.toastBanner, { transform: [{ translateY: toastAnim }] }]}>
          <View style={styles.toastIconBox}>
            {activeToast.type === 'sleep' ? (
              <Moon size={20} color="#FACC15" strokeWidth={2.2} />
            ) : (
              <AlertTriangle size={20} color="#F87171" strokeWidth={2.2} />
            )}
          </View>
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={styles.toastTitle} numberOfLines={1}>
              {activeToast.title}
            </Text>
            <Text style={styles.toastBody} numberOfLines={2}>
              {activeToast.body}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setActiveToast(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Top Header Row matching screenshot */}
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={onBack} style={styles.headerIconButton} activeOpacity={0.7}>
            <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.headerTitle}>App activity details</Text>
          </View>

          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => setShowMetricDropdown(!showMetricDropdown)}
          >
            <MoreVertical size={22} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Dropdown Pill: "Screen time ▼" */}
        <View style={styles.dropdownRow}>
          <TouchableOpacity
            style={styles.metricPill}
            onPress={() => setShowMetricDropdown(!showMetricDropdown)}
            activeOpacity={0.8}
          >
            <Text style={styles.metricPillText}>
              {metric === 'screen_time'
                ? 'Screen time'
                : metric === 'notifications'
                ? 'Notifications received'
                : 'Times opened'}
            </Text>
            <ChevronDown size={14} color="#8CB3FF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        {/* Metric selection options */}
        {showMetricDropdown && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={[styles.dropdownItem, metric === 'screen_time' && styles.dropdownItemActive]}
              onPress={() => {
                setMetric('screen_time');
                setShowMetricDropdown(false);
              }}
            >
              <Text style={styles.dropdownItemText}>Screen time</Text>
              {metric === 'screen_time' && <Check size={16} color="#8CB3FF" />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dropdownItem, metric === 'notifications' && styles.dropdownItemActive]}
              onPress={() => {
                setMetric('notifications');
                setShowMetricDropdown(false);
              }}
            >
              <Text style={styles.dropdownItemText}>Notifications received</Text>
              {metric === 'notifications' && <Check size={16} color="#8CB3FF" />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dropdownItem, metric === 'times_opened' && styles.dropdownItemActive]}
              onPress={() => {
                setMetric('times_opened');
                setShowMetricDropdown(false);
              }}
            >
              <Text style={styles.dropdownItemText}>Times opened</Text>
              {metric === 'times_opened' && <Check size={16} color="#8CB3FF" />}
            </TouchableOpacity>
          </View>
        )}

        {/* Hero Active Time Text matching screenshot: "2 hrs, 31 mins" */}
        <View style={styles.heroTimeContainer}>
          <Text style={styles.heroTimeText}>
            {selectedDayIdx === 0
              ? `${totalHours} hrs, ${remainingMins} mins`
              : `${Math.floor(weeklyData[selectedDayIdx].minutes / 60)} hrs, ${weeklyData[selectedDayIdx].minutes % 60} mins`}
          </Text>
          <Text style={styles.heroSubtitle}>Today</Text>
        </View>

        {/* Weekly Bar Chart matching screenshot */}
        <View style={styles.chartSection}>
          <View style={styles.chartContainer}>
            {/* 4 Horizontal Gridlines with Labels on the right */}
            <View style={styles.gridLinesContainer}>
              <View style={styles.gridLineRow}>
                <View style={styles.gridLine} />
                <Text style={styles.gridLineLabel}>3h</Text>
              </View>
              <View style={styles.gridLineRow}>
                <View style={styles.gridLine} />
                <Text style={styles.gridLineLabel}>2h</Text>
              </View>
              <View style={styles.gridLineRow}>
                <View style={styles.gridLine} />
                <Text style={styles.gridLineLabel}>1h</Text>
              </View>
              <View style={styles.gridLineRow}>
                <View style={styles.gridLine} />
                <Text style={styles.gridLineLabel}>0h</Text>
              </View>
            </View>

            {/* Vertical Bar Columns */}
            <View style={styles.barsContainer}>
              {weeklyData.map((item, idx) => {
                // Max height corresponds to 3h = 180 mins (in screenshot: ~151 mins is between 2h and 3h)
                const heightPercent = Math.min(100, Math.max(0, (item.minutes / 180) * 100));
                const isSelected = selectedDayIdx === idx;

                return (
                  <TouchableOpacity
                    key={item.day}
                    style={styles.barColumn}
                    onPress={() => setSelectedDayIdx(idx)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.barTrackArea}>
                      {item.minutes > 0 && (
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${heightPercent}%`,
                              backgroundColor: isSelected ? '#C7D8FF' : '#687B9C',
                            },
                          ]}
                        />
                      )}
                    </View>
                    <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
                      {item.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Date Navigator: < Sun, 1 Nov > matching screenshot */}
        <View style={styles.dateNavigatorRow}>
          <TouchableOpacity onPress={handlePrevDay} style={styles.navArrowButton} activeOpacity={0.7}>
            <ChevronLeft size={20} color="#9AA0A6" />
          </TouchableOpacity>

          <Text style={styles.dateNavigatorText}>{weeklyData[selectedDayIdx].date}</Text>

          <TouchableOpacity onPress={handleNextDay} style={styles.navArrowButton} activeOpacity={0.7}>
            <ChevronRight size={20} color="#9AA0A6" />
          </TouchableOpacity>
        </View>

        {/* Real-Time Live Status Pill */}
        <View style={styles.liveStatusBar}>
          <View style={styles.liveDot} />
          <Text style={styles.liveStatusText}>
            {nativeAvailable && hasNativePermission
              ? 'ANDROID USAGE ACCESS ACTIVE (REAL TIME)'
              : 'REAL-TIME TRACKING ACTIVE (EXPONENT FOREGROUND)'}
          </Text>
          <Text style={styles.liveClockSecs}>{realtimeSeconds}s</Text>
        </View>

        {/* Android Usage Access Permission Guidance (if ungranted on Android) */}
        {Platform.OS === 'android' && (!nativeAvailable || !hasNativePermission) && (
          <TouchableOpacity
            style={styles.permissionCard}
            onPress={openUsageAccessSettings}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.permissionTitle}>📱 Grant Android Usage Access</Text>
              <Text style={styles.permissionDesc}>
                Allow Bloom to read exact real-time app screen times directly from your device settings.
              </Text>
            </View>
            <View style={styles.permissionButton}>
              <Text style={styles.permissionButtonText}>Settings</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* App-Wise Usage List matching screenshot */}
        <View style={styles.appListSection}>
          {apps.map((app) => (
            <View key={app.id} style={styles.appRow}>
              {/* Left App Icon */}
              {renderAppIcon(app)}

              {/* Middle App Details */}
              <View style={styles.appDetails}>
                <Text style={styles.appName}>{app.name}</Text>
                <View style={styles.appSubRow}>
                  <Text style={styles.appUsageMinutes}>
                    {app.minutes >= 60
                      ? `${Math.floor(app.minutes / 60)} hr${Math.floor(app.minutes / 60) > 1 ? 's' : ''}, ${app.minutes % 60} mins`
                      : `${app.minutes} minutes`}
                  </Text>
                  {app.limitMinutes && (
                    <Text
                      style={[
                        styles.limitBadgeText,
                        app.minutes >= app.limitMinutes ? styles.limitExceededText : null,
                      ]}
                    >
                      • Cap: {app.limitMinutes}m {app.minutes >= app.limitMinutes ? '⚠️' : ''}
                    </Text>
                  )}
                </View>
              </View>

              {/* Live Demo Quick Increments (+15m / -15m) */}
              <View style={styles.adjustPillsRow}>
                <TouchableOpacity
                  style={styles.miniAdjustBtn}
                  onPress={() => handleAdjustAppMinutes(app.id, 15)}
                >
                  <Plus size={11} color="#9AA0A6" />
                  <Text style={styles.miniAdjustText}>15m</Text>
                </TouchableOpacity>
              </View>

              {/* Thin Vertical Divider matching screenshot */}
              <View style={styles.verticalDivider} />

              {/* Right Hourglass Icon with Limit Modal Trigger */}
              <TouchableOpacity
                style={styles.hourglassButton}
                onPress={() => setSelectedAppForTimer(app)}
                activeOpacity={0.7}
              >
                <Hourglass
                  size={20}
                  color={app.limitMinutes && app.minutes >= app.limitMinutes ? '#F87171' : '#FFFFFF'}
                  strokeWidth={1.8}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Hackathon Interactive Testing Section */}
        <View style={styles.demoTestingCard}>
          <Text style={styles.demoTestingHeader}>🎯 Real-Time Event Triggers (Hackathon Demo)</Text>
          <Text style={styles.demoTestingSubtitle}>
            Test excessive screen time alerts and circadian bedtime notifications live:
          </Text>

          <View style={styles.testButtonsRow}>
            <TouchableOpacity
              style={styles.testBtnPrimary}
              onPress={handleTestBedtimeAlert}
              activeOpacity={0.8}
            >
              <Moon size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.testBtnText}>🌙 Test Sleep Notification</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testBtnSecondary}
              onPress={handleTestExcessiveAlert}
              activeOpacity={0.8}
            >
              <AlertTriangle size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.testBtnText}>⚠️ Test Limit Alert</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.focusModeToggleBtn}
            onPress={() => setShowFocusMode(!showFocusMode)}
            activeOpacity={0.8}
          >
            <Flame size={16} color="#F97316" strokeWidth={2} />
            <Text style={styles.focusToggleText}>
              {showFocusMode ? 'Hide Focus Mode Timer' : 'Open 25m Focus Session Mode'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Embedded Focus Mode Card (Feature 9) */}
        {showFocusMode && (
          <View style={styles.focusSessionCard}>
            <View style={styles.focusHeader}>
              <Flame size={20} color="#F97316" strokeWidth={2} />
              <Text style={styles.focusTitle}>Focus Mode (Deep Study Block)</Text>
            </View>
            <Text style={styles.focusDesc}>
              Silences social notifications and runs a dedicated 25-minute Pomodoro study sprint.
            </Text>

            <Text style={styles.focusCountdown}>
              {Math.floor(focusSeconds / 60).toString().padStart(2, '0')}:
              {(focusSeconds % 60).toString().padStart(2, '0')}
            </Text>

            <View style={styles.focusBtnRow}>
              <TouchableOpacity
                style={[styles.focusBtn, focusActive ? styles.focusBtnPause : styles.focusBtnStart]}
                onPress={() => setFocusActive(!focusActive)}
                activeOpacity={0.8}
              >
                {focusActive ? (
                  <Pause size={16} color="#FFFFFF" strokeWidth={2} />
                ) : (
                  <Play size={16} color="#FFFFFF" strokeWidth={2} />
                )}
                <Text style={styles.focusBtnText}>
                  {focusActive ? 'Pause Session' : 'Start Focus Block'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.focusResetBtn}
                onPress={() => {
                  setFocusActive(false);
                  setFocusSeconds(25 * 60);
                }}
                activeOpacity={0.8}
              >
                <RotateCcw size={16} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.focusResetText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Set App Timer Modal (when Hourglass is tapped) */}
      <Modal
        visible={!!selectedAppForTimer}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAppForTimer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timerModalContent}>
            <View style={styles.timerModalHeader}>
              <Text style={styles.timerModalTitle}>Set App Timer</Text>
              <TouchableOpacity onPress={() => setSelectedAppForTimer(null)}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.timerModalDesc}>
              Set a daily usage cap for <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{selectedAppForTimer?.name}</Text>. Bloom will send a warning when you exceed this threshold.
            </Text>

            <View style={styles.timerPresetsRow}>
              {[15, 30, 45, 60, 90].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.timerPresetBtn,
                    selectedAppForTimer?.limitMinutes === mins && styles.timerPresetBtnActive,
                  ]}
                  onPress={() => handleSetAppTimer(mins)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.timerPresetText,
                      selectedAppForTimer?.limitMinutes === mins && styles.timerPresetTextActive,
                    ]}
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.removeLimitBtn}
              onPress={() => handleSetAppTimer(undefined)}
              activeOpacity={0.8}
            >
              <Text style={styles.removeLimitText}>Turn off timer for this app</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#121316', // Dark background matching screenshot
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // In-App Toast
  toastBanner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1E232E',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  toastIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  toastBody: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 16,
  },

  // Top Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
  },

  // Metric dropdown pill
  dropdownRow: {
    alignItems: 'center',
    marginTop: 18,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202C3F',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2D3D56',
  },
  metricPillText: {
    color: '#8CB3FF',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownMenu: {
    alignSelf: 'center',
    backgroundColor: '#1E222A',
    borderRadius: 12,
    marginTop: 8,
    width: 220,
    borderWidth: 1,
    borderColor: '#2F3542',
    overflow: 'hidden',
    zIndex: 50,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2F3542',
  },
  dropdownItemActive: {
    backgroundColor: '#262D3B',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },

  // Hero Time Text
  heroTimeContainer: {
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 20,
  },
  heroTimeText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: '#9AA0A6',
    fontSize: 14,
    marginTop: 4,
  },

  // Weekly Chart Section
  chartSection: {
    height: 140,
    marginVertical: 10,
  },
  chartContainer: {
    flex: 1,
    position: 'relative',
  },
  gridLinesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 24, // room for day labels
    justifyContent: 'space-between',
  },
  gridLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#262930',
  },
  gridLineLabel: {
    width: 24,
    color: '#9AA0A6',
    fontSize: 11,
    textAlign: 'right',
    marginLeft: 8,
  },
  barsContainer: {
    position: 'absolute',
    left: 0,
    right: 32, // space before Y-axis labels
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barTrackArea: {
    width: 32,
    height: 98,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: 32,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  dayLabel: {
    color: '#9AA0A6',
    fontSize: 12,
    marginTop: 8,
  },
  dayLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Date Navigator
  dateNavigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 16,
  },
  navArrowButton: {
    padding: 8,
  },
  dateNavigatorText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginHorizontal: 32,
  },

  // Live status banner
  liveStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 8,
  },
  liveStatusText: {
    color: '#22C55E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  liveClockSecs: {
    color: '#86EFAC',
    fontSize: 10,
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Permission card
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A202C',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  permissionTitle: {
    color: '#63B3ED',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  permissionDesc: {
    color: '#A0AEC0',
    fontSize: 11,
    lineHeight: 15,
  },
  permissionButton: {
    backgroundColor: '#3182CE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // App List Section
  appListSection: {
    marginTop: 8,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1F2228',
  },
  nativeAppIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  appIconBase: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instagramGradient: {
    backgroundColor: '#E1306C',
  },
  youtubeBg: {
    backgroundColor: '#FF0000',
  },
  whatsappBg: {
    backgroundColor: '#25D366',
  },
  expoBg: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#374151',
  },
  expoIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chromeBg: {
    backgroundColor: '#3B82F6',
  },
  spotifyBg: {
    backgroundColor: '#1DB954',
  },
  defaultBg: {
    backgroundColor: '#4B5563',
  },

  appDetails: {
    flex: 1,
    marginLeft: 16,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  appSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  appUsageMinutes: {
    color: '#9AA0A6',
    fontSize: 13,
  },
  limitBadgeText: {
    color: '#9CA3AF',
    fontSize: 11,
    marginLeft: 6,
  },
  limitExceededText: {
    color: '#F87171',
    fontWeight: 'bold',
  },

  // Mini live adjustments
  adjustPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  miniAdjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F26',
    borderWidth: 1,
    borderColor: '#2E333D',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  miniAdjustText: {
    color: '#9AA0A6',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },

  // Thin vertical divider on right matching screenshot
  verticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#27292F',
    marginHorizontal: 12,
  },

  // Hourglass Button
  hourglassButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hackathon Demo Card
  demoTestingCard: {
    backgroundColor: '#191C22',
    borderWidth: 1,
    borderColor: '#2A2E38',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  demoTestingHeader: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  demoTestingSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 16,
  },
  testButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  testBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  testBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  testBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  focusModeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  focusToggleText: {
    color: '#FB923C',
    fontSize: 12,
    fontWeight: '700',
  },

  // Focus Session Card
  focusSessionCard: {
    backgroundColor: '#1A1D24',
    borderWidth: 1,
    borderColor: '#2F3440',
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    alignItems: 'center',
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  focusTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  focusDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  focusCountdown: {
    color: '#F97316',
    fontSize: 48,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 8,
  },
  focusBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    width: '100%',
  },
  focusBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  focusBtnStart: {
    backgroundColor: '#F97316',
  },
  focusBtnPause: {
    backgroundColor: '#6B7280',
  },
  focusBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  focusResetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#272B35',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  focusResetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  timerModalContent: {
    backgroundColor: '#1E222B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2F3644',
  },
  timerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timerModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  timerModalDesc: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
  timerPresetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  timerPresetBtn: {
    flex: 1,
    backgroundColor: '#2A303D',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  timerPresetBtnActive: {
    backgroundColor: '#3B82F6',
  },
  timerPresetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  timerPresetTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  removeLimitBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  removeLimitText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
