import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  X,
  Watch,
  HeartPulse,
  Layout,
  AlertOctagon,
  Moon,
  Activity,
  Target,
  ListChecks,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

export interface FeatureModalProps {
  visible: boolean;
  onClose: () => void;
  featureId: string | null;
}

interface FeatureInfo {
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  badge: string;
  description: string;
  nativeRequirements: string[];
  integrationDetails: string;
  privacyRule: string;
  actionText?: string;
}

const FEATURE_DATA: Record<string, FeatureInfo> = {
  '11': {
    title: 'Smartwatch Connection UI',
    subtitle: 'Wear OS & BLE Companion Service',
    icon: Watch,
    iconColor: Colors.primaryDark,
    badge: 'HARDWARE INTEGRATION',
    description:
      'Pair your Wear OS, Garmin, or Apple Watch to stream real-time physiological biometrics (PPG Heart Rate, HRV, Sleep SpO2).',
    nativeRequirements: [
      'android.permission.BLUETOOTH_SCAN (Android 12+)',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BODY_SENSORS_BACKGROUND',
      'Wear OS Companion Device Manager API',
    ],
    integrationDetails:
      'Smartwatch data is received via encrypted BLE GATT protocols or Wearable Data Layer API. No fake heart rates are displayed.',
    privacyRule: 'Telemetry data is processed on-device and never sold to third parties.',
    actionText: 'Scan for Bluetooth BLE Watches',
  },
  '12': {
    title: 'Health Connect UI',
    subtitle: 'Google Health Connect System API',
    icon: HeartPulse,
    iconColor: '#D98B8B',
    badge: 'ANDROID SYSTEM API',
    description:
      'Unify student sleep sessions, step counts, and active calories using Android 14+ native Health Connect.',
    nativeRequirements: [
      'androidx.health.connect.client.permission.READ_SLEEP',
      'androidx.health.connect.client.permission.READ_STEPS',
      'androidx.health.connect.client.permission.READ_HEART_RATE',
      'Google Play Services Health Connect client',
    ],
    integrationDetails:
      'Health Connect acts as the single source of truth across Google Fit, Samsung Health, and Whoop.',
    privacyRule: 'Granular permissions allow you to revoke individual biometric data permissions anytime.',
    actionText: 'Request Health Connect Permissions',
  },
  '13': {
    title: 'Widget Configuration UI',
    subtitle: 'Android AppWidgets & Glance API',
    icon: Layout,
    iconColor: '#7AA7C7',
    badge: 'HOME SCREEN GLANCE',
    description:
      'Configure quick glanceable widgets on your Android home screen: Screen Time Live Pill, Next Assignment Countdown, and 1-Tap SOS.',
    nativeRequirements: [
      'Android AppWidgetProvider',
      'Jetpack Glance for Compose',
      'Background Periodic WorkManager (15-min refresh)',
    ],
    integrationDetails:
      'Widgets render directly on your launcher home screen without needing to keep the app active in foreground.',
    privacyRule: 'Zero network calls are triggered from the widget background thread.',
    actionText: 'Add Widget to Home Screen',
  },
  '10': {
    title: 'SOS Emergency Signal',
    subtitle: 'Rapid Dispatch & Campus Safety',
    icon: AlertOctagon,
    iconColor: Colors.error,
    badge: 'SAFETY PROTOCOL',
    description:
      'Instant 5-second countdown to alert designated emergency contacts and campus safety with live GPS location coordinates.',
    nativeRequirements: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.SEND_SMS',
      'Direct Emergency Telephony Dial Intent',
    ],
    integrationDetails:
      'Generates a high-priority push dispatch to trusted circle members with an SOS Google Maps pin link.',
    privacyRule: 'Location coordinates are only queried when the emergency signal is deliberately triggered.',
    actionText: 'Set Emergency Contacts',
  },
  '6': {
    title: 'Sleep Tracking',
    subtitle: 'Circadian Architecture & Sleep Hygiene',
    icon: Moon,
    iconColor: '#7A68A7',
    badge: 'WELLNESS METRICS',
    description:
      'Analyze your sleep onset latency, night waking episodes, and restorative REM sleep based on bedtime screen time reduction.',
    nativeRequirements: [
      'Health Connect SleepSessionRecord',
      'Do Not Disturb Notification Policy Access',
      'Ambient Light Sensor (Lux calculation)',
    ],
    integrationDetails:
      'Correlates late-night screen time with next-day focus deficits to help you establish consistent sleep routines.',
    privacyRule: 'Sleep records remain securely encrypted in device storage.',
    actionText: 'Configure Bedtime Window',
  },
  '7': {
    title: 'Stress & HRV Tracking',
    subtitle: 'Autonomic Nervous System Balance',
    icon: Activity,
    iconColor: '#E8B86D',
    badge: 'PHYSIOLOGICAL SIGNALS',
    description:
      'Evaluate student academic stress using Heart Rate Variability (RMSSD) and sympathetic arousal indexes.',
    nativeRequirements: [
      'Optical PPG photoplethysmography sensor',
      'Standardized PSS-10 Perceived Stress Scale check-in',
      'Vagal tone breathing modulation',
    ],
    integrationDetails:
      'Provides real-time biofeedback and prompts you to enter the Heal Zone when stress spikes are detected.',
    privacyRule: 'Stress estimations are purely for wellness and not clinical diagnosis.',
    actionText: 'Take Stress Self-Check',
  },
  '5': {
    title: 'Goals & Habits',
    subtitle: 'Micro-Habits & Consistency Streaks',
    icon: Target,
    iconColor: Colors.primaryDark,
    badge: 'GROWTH SYSTEM',
    description:
      'Build unbreakable academic and wellness habits: morning hydration, 30m reading, and screen-free bedtimes.',
    nativeRequirements: [
      'Daily persistent notification triggers',
      'Streak counter state persistence',
    ],
    integrationDetails:
      'Syncs with your Daily Goals on the Bloom Home screen to track your 30-day growth curve.',
    privacyRule: 'Habit records stored locally on your device.',
    actionText: 'Create New Habit',
  },
  '3': {
    title: 'Student Tasks (Daily & Weekly)',
    subtitle: 'Academic Task Board',
    icon: ListChecks,
    iconColor: Colors.primaryDark,
    badge: 'PRODUCTIVITY',
    description:
      'Organize your lecture reviews, lab preparations, problem sets, and study groups into prioritized daily & weekly queues.',
    nativeRequirements: [
      'Real-time task synchronization',
      'Calendar Intent integration',
    ],
    integrationDetails:
      'Integrates seamlessly with the Assignment Tracker to ensure every study milestone is checked off.',
    privacyRule: 'Stored securely in Bloom local workspace.',
    actionText: 'Manage Student Tasks',
  },
};

export default function FeatureDetailsModal({
  visible,
  onClose,
  featureId,
}: FeatureModalProps) {
  if (!featureId) return null;
  const info = FEATURE_DATA[featureId];
  if (!info) return null;

  const IconComponent = info.icon;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.card, Shadows.lg]}>
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <IconComponent size={24} color={info.iconColor} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <View style={styles.badgeRow}>
                <Text style={styles.badgeText}>{info.badge}</Text>
              </View>
              <Text style={styles.title}>{info.title}</Text>
              <Text style={styles.subtitle}>{info.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.darkText} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            <Text style={styles.description}>{info.description}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>SUPPORTED NATIVE APIS & PERMISSIONS</Text>
              {info.nativeRequirements.map((req, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <ShieldCheck size={14} color={Colors.primary} strokeWidth={2} />
                  <Text style={styles.bulletText}>{req}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>INTEGRATION ARCHITECTURE</Text>
              <Text style={styles.infoText}>{info.integrationDetails}</Text>
            </View>

            <View style={[styles.section, styles.privacyBox]}>
              <Text style={styles.privacyHeader}>DATA INTEGRITY & PRIVACY</Text>
              <Text style={styles.privacyText}>{info.privacyRule}</Text>
            </View>
          </ScrollView>

          {info.actionText ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>{info.actionText}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  title: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 16,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.mutedText,
  },
  closeBtn: {
    padding: 4,
  },
  description: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.darkText,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.mutedText,
    marginBottom: Spacing.xs,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  bulletText: {
    ...Typography.bodySmall,
    color: Colors.darkText,
    fontSize: 12,
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.darkText,
    lineHeight: 18,
  },
  privacyBox: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  privacyHeader: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontSize: 10,
    marginBottom: 2,
  },
  privacyText: {
    ...Typography.caption,
    color: Colors.mutedText,
    lineHeight: 16,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  actionBtnText: {
    ...Typography.button,
    fontSize: 14,
  },
});

