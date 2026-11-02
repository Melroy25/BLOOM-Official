import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  PlusCircle,
  ExternalLink,
  Eye,
  X,
  Smartphone,
  Bell,
  Check,
} from 'lucide-react-native';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { useTheme } from '../../context/ThemeContext';
import { pinBloomWidget, getWidgetData } from '../../services/widgetDataService';
import {
  displayBloomNotificationWidget,
  dismissBloomNotificationWidget,
  isNotificationWidgetActive,
} from '../../services/notificationWidgetService';

interface AddWidgetCardProps {
  onPress?: () => void;
}

export const AddWidgetCard: React.FC<AddWidgetCardProps> = ({ onPress }) => {
  const { colors } = useTheme();
  const router = useRouter();

  // Home Screen Widget Pinning State
  const [isPinning, setIsPinning] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [screenTimeText, setScreenTimeText] = useState('1h 45m today');
  const [healBubbleStatus, setHealBubbleStatus] = useState('Breathe & Calm');

  // Persistent Notification Tray Widget State
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isTogglingNotification, setIsTogglingNotification] = useState(false);

  useEffect(() => {
    // 1. Fetch widget data
    getWidgetData()
      .then((data) => {
        setScreenTimeText(data.screenTimeText);
        setHealBubbleStatus(data.healBubbleStatus);
      })
      .catch(() => { });

    // 2. Fetch persistent notification toggle state
    isNotificationWidgetActive()
      .then((active) => {
        setIsNotificationEnabled(active);
      })
      .catch(() => { });
  }, [showTestModal]);

  const handlePin = async () => {
    if (onPress) {
      onPress();
      return;
    }
    try {
      setIsPinning(true);
      await pinBloomWidget();
    } finally {
      setIsPinning(false);
    }
  };

  const handleToggleNotification = async (enabled: boolean) => {
    try {
      setIsTogglingNotification(true);
      if (enabled) {
        const success = await displayBloomNotificationWidget();
        setIsNotificationEnabled(success);
      } else {
        await dismissBloomNotificationWidget();
        setIsNotificationEnabled(false);
      }
    } finally {
      setIsTogglingNotification(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Main Action Card */}
      <View
        style={[
          styles.card,
          Shadows.sm,
          {
            backgroundColor: colors.white,
            borderColor: colors.border,
          },
        ]}
      >
        {/* SECTION A: Home Screen Widget */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.leftInfo}
            onPress={() => setShowTestModal(true)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.accentSoft }]}>
              <PlusCircle size={20} color={colors.accent} strokeWidth={2.2} />
            </View>
            <View style={styles.titleWrap}>
              <View style={styles.badgeRow}>
                <Text style={[styles.title, { color: colors.darkText }]}>
                  + Add Widget to Home Screen
                </Text>
              </View>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Pin SOS, Screen Time & Heal Bubble shortcuts
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pinActionPill, { backgroundColor: colors.accentSoft }]}
            onPress={handlePin}
            activeOpacity={0.7}
            disabled={isPinning}
          >
            {isPinning ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <>
                <Text style={[styles.pinActionText, { color: colors.accent }]}>Pin</Text>
                <ExternalLink size={12} color={colors.accent} strokeWidth={2.2} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 3 Shortcut Badges & Quick Test Button */}
        <View style={styles.badgesContainer}>
          <TouchableOpacity
            style={[styles.miniBadge, { backgroundColor: '#FDECEC', borderColor: '#F8D7DA' }]}
            onPress={() => router.push('/sos')}
            activeOpacity={0.7}
          >
            <Text style={[styles.miniBadgeText, { color: '#E06D53' }]}>🆘 SOS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.miniBadge, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}
            onPress={() => router.push('/tasks')}
            activeOpacity={0.7}
          >
            <Text style={[styles.miniBadgeText, { color: colors.accent }]}>⏳ {screenTimeText}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.miniBadge, { backgroundColor: '#EAF1F8', borderColor: '#D7E4F2' }]}
            onPress={() => router.push('/heal-bubble')}
            activeOpacity={0.7}
          >
            <Text style={[styles.miniBadgeText, { color: '#2D5B7B' }]}>🫧 Heal Bubble</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => setShowTestModal(true)}
            activeOpacity={0.7}
          >
            <Eye size={13} color={colors.accent} />
            <Text style={[styles.testButtonText, { color: colors.accent }]}>Test</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={[styles.cardDivider, { backgroundColor: '#F0F3F1' }]} />

        {/* SECTION B: Persistent Notification Tray Widget (Duolingo-style) */}
        <View style={styles.notificationSection}>
          <View style={styles.notificationLeft}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accentSoft }]}>
              <Bell size={18} color={colors.accent} strokeWidth={2.2} />
            </View>
            <View style={styles.titleWrap}>
              <View style={styles.badgeRow}>
                <Text style={[styles.title, { color: colors.darkText }]}>
                  Notification Tray Widget
                </Text>
                {isNotificationEnabled && (
                  <View style={[styles.activeDotPill, { backgroundColor: colors.accentSoft }]}>
                    <View style={[styles.activeGreenDot, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.activeDotText, { color: colors.accent }]}>Active</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Personalize it.
              </Text>
            </View>
          </View>

          <View style={styles.toggleWrap}>
            {isTogglingNotification ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Switch
                value={isNotificationEnabled}
                onValueChange={handleToggleNotification}
                trackColor={{ false: '#E8ECE9', true: colors.accentSoft }}
                thumbColor={isNotificationEnabled ? colors.accent : '#FFFFFF'}
              />
            )}
          </View>
        </View>
      </View>

      {/* 2. Interactive Widget Test & Preview Modal */}
      <Modal
        visible={showTestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.white }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconWrap, { backgroundColor: '#E8F1E8' }]}>
                  <Smartphone size={18} color="#365B45" />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.darkText }]}>
                    Bloom Home Screen Widget
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: colors.mutedText }]}>
                    Interactive 4×2 Widget Simulator
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowTestModal(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.previewSectionLabel, { color: colors.mutedText }]}>
                TAP ANY SHORTCUT TO TEST DEEP LINK NAVIGATION:
              </Text>

              {/* Live Simulated 4x2 Widget Preview */}
              <View style={styles.widgetBox}>
                <View style={styles.widgetBoxHeader}>
                  <View style={styles.widgetBrandRow}>
                    <Text style={styles.widgetBrandTitle}>🌿 BLOOM</Text>
                    <Text style={styles.widgetBrandSub}> • Mindful Daily Actions</Text>
                  </View>
                  <Text style={styles.widgetQuickAccess}>Quick Access</Text>
                </View>

                <View style={styles.shortcutsRow}>
                  {/* 1. SOS Button */}
                  <TouchableOpacity
                    style={[styles.shortcutCard, { borderColor: '#F8D7DA' }]}
                    onPress={() => {
                      setShowTestModal(false);
                      router.push('/sos');
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.badgePill, { backgroundColor: '#E06D53' }]}>
                      <Text style={styles.badgePillText}>🆘 SOS</Text>
                    </View>
                    <View style={styles.shortcutContent}>
                      <Text style={[styles.shortcutName, { color: '#E06D53' }]}>SOS Help</Text>
                      <Text style={styles.shortcutDesc}>Emergency</Text>
                    </View>
                  </TouchableOpacity>

                  {/* 2. Screen Time Button */}
                  <TouchableOpacity
                    style={[styles.shortcutCard, { borderColor: '#E8ECE9' }]}
                    onPress={() => {
                      setShowTestModal(false);
                      router.push('/tasks');
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.badgePill, { backgroundColor: colors.accent }]}>
                      <Text style={styles.badgePillText}>⏳ Usage</Text>
                    </View>
                    <View style={styles.shortcutContent}>
                      <Text style={[styles.shortcutName, { color: colors.darkText }]} numberOfLines={1}>
                        {screenTimeText}
                      </Text>
                      <Text style={[styles.shortcutDesc, { color: colors.mutedText }]}>Screen Time</Text>
                    </View>
                  </TouchableOpacity>

                  {/* 3. Heal Bubble Button */}
                  <TouchableOpacity
                    style={[styles.shortcutCard, { borderColor: colors.border }]}
                    onPress={() => {
                      setShowTestModal(false);
                      router.push('/heal-bubble');
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.badgePill, { backgroundColor: colors.accentSoft }]}>
                      <Text style={[styles.badgePillText, { color: colors.primaryDark }]}>🫧 Heal</Text>
                    </View>
                    <View style={styles.shortcutContent}>
                      <Text style={[styles.shortcutName, { color: colors.darkText }]}>Heal Bubble</Text>
                      <Text style={[styles.shortcutDesc, { color: colors.mutedText }]} numberOfLines={1}>
                        {healBubbleStatus}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Pin Request Action */}
              <TouchableOpacity
                style={[styles.pinSystemButton, { backgroundColor: colors.accent }]}
                onPress={handlePin}
                activeOpacity={0.8}
                disabled={isPinning}
              >
                {isPinning ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.pinSystemButtonText}>Pin to Device Home Screen</Text>
                    <ExternalLink size={16} color="#FFFFFF" strokeWidth={2.2} />
                  </>
                )}
              </TouchableOpacity>

              {/* Instructions Callout */}
              <View style={styles.infoCallout}>
                <Text style={styles.infoCalloutTitle}>📌 Home Screen Widget Placement</Text>
                <Text style={styles.infoCalloutBody}>
                  1. Tap "Pin to Device Home Screen" above to trigger native Android launcher pinning.{'\n'}
                  2. Alternatively, touch and hold any empty area on your phone's home screen, tap{' '}
                  <Text style={{ fontWeight: '700' }}>Widgets</Text>, and drag{' '}
                  <Text style={{ fontWeight: '700' }}>Bloom Quick Actions</Text> onto your home screen.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  card: {
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  pinActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  pinActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#365B45',
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F1',
    flexWrap: 'wrap',
  },
  miniBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  miniBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#FAF8F2',
    borderWidth: 1,
    borderColor: '#E8ECE9',
    marginLeft: 'auto',
  },
  testButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#789B83',
  },
  cardDivider: {
    height: 1,
    marginVertical: 4,
  },
  notificationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  toggleWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F1E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#365B45',
  },
  activeDotText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#365B45',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
  },
  closeBtn: {
    padding: 4,
  },
  previewSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  widgetBox: {
    backgroundColor: '#FAF8F2',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E8ECE9',
    marginBottom: 16,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  widgetBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  widgetBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  widgetBrandTitle: {
    color: '#365B45',
    fontSize: 13,
    fontWeight: '700',
  },
  widgetBrandSub: {
    color: '#7B857F',
    fontSize: 10,
  },
  widgetQuickAccess: {
    color: '#789B83',
    fontSize: 10,
    fontWeight: '700',
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 88,
  },
  badgePill: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  shortcutContent: {
    alignItems: 'center',
    marginTop: 4,
  },
  shortcutName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  shortcutDesc: {
    color: '#7B857F',
    fontSize: 9,
    textAlign: 'center',
  },
  pinSystemButton: {
    backgroundColor: '#789B83',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  pinSystemButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  infoCallout: {
    backgroundColor: '#F5F8F6',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    gap: 6,
  },
  infoCalloutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#365B45',
  },
  infoCalloutBody: {
    fontSize: 11,
    color: '#55655D',
    lineHeight: 17,
  },
});
