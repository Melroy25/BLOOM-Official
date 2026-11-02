import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ShieldAlert,
  Phone,
  MessageSquare,
  Wind,
  AlertTriangle,
  HeartHandshake,
  ExternalLink,
  Info,
} from 'lucide-react-native';
import { Spacing, BorderRadius } from '../constants/spacing';
import { Shadows } from '../constants/shadows';
import { useTheme } from '../context/ThemeContext';

interface HelplineResource {
  id: string;
  name: string;
  description: string;
  contactNumber?: string;
  smsCode?: string;
  hours: string;
  badge: string;
  actionType: 'call' | 'sms' | 'link';
  actionUrl: string;
}

const HELPLINES: HelplineResource[] = [
  {
    id: '988',
    name: '988 Suicide & Crisis Lifeline',
    description: 'Free, confidential support for anyone experiencing mental distress or emotional crisis.',
    contactNumber: '988',
    hours: '24/7 • Free • Confidential',
    badge: 'Immediate Help',
    actionType: 'call',
    actionUrl: 'tel:988',
  },
  {
    id: 'crisis-text',
    name: 'Crisis Text Line',
    description: 'Text HOME to speak with a trained volunteer crisis counselor anytime.',
    smsCode: '741741',
    hours: '24/7 • Free Text Support',
    badge: 'Text Support',
    actionType: 'sms',
    actionUrl: 'sms:741741?body=HOME',
  },
  {
    id: 'trevor-project',
    name: 'The Trevor Project',
    description: 'Confidential crisis intervention and suicide prevention for LGBTQ young people.',
    contactNumber: '1-866-488-7386',
    hours: '24/7 • LGBTQ+ Focused',
    badge: 'Specialized',
    actionType: 'call',
    actionUrl: 'tel:18664887386',
  },
  {
    id: 'student-support',
    name: 'National Student Helpline',
    description: 'Peer support and crisis resources specifically tailored for students and young adults.',
    contactNumber: '1-800-273-8255',
    hours: '24/7 Support Network',
    badge: 'Students',
    actionType: 'call',
    actionUrl: 'tel:18002738255',
  },
];

export default function SOSScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const { colors, isDark } = useTheme();

  const handleAction = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      // Fallback
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.white, borderColor: colors.border }]}
          onPress={handleGoBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={colors.darkText} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.darkText }]}>SOS Crisis Support</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Critical Disclaimer Card */}
        <View style={[styles.disclaimerCard, Shadows.sm]}>
          <View style={styles.disclaimerIconWrap}>
            <AlertTriangle size={22} color="#D9534F" strokeWidth={2.2} />
          </View>
          <View style={styles.disclaimerTextWrap}>
            <Text style={styles.disclaimerTitle}>Emergency Notice</Text>
            <Text style={styles.disclaimerText}>
              If you or someone you know is in immediate life-threatening danger, please call emergency services (911 / 112) or go to the nearest emergency room immediately.
            </Text>
            <View style={styles.disclaimerNoteWrap}>
              <Info size={13} color="#A73A38" strokeWidth={1.8} />
              <Text style={styles.disclaimerNote}>
                BLOOM is a wellness companion and does not automatically dispatch emergency personnel.
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Grounding Action */}
        <TouchableOpacity
          style={[
            styles.groundingCard,
            Shadows.sm,
            { backgroundColor: colors.white, borderColor: colors.border },
          ]}
          onPress={() => router.push('/heal-bubble')}
          activeOpacity={0.8}
        >
          <View style={[styles.groundingIconWrap, { backgroundColor: colors.lightSage }]}>
            <Wind size={24} color={colors.primaryDark} strokeWidth={2} />
          </View>
          <View style={styles.groundingContent}>
            <Text style={[styles.groundingTitle, { color: colors.darkText }]}>
              Feeling Overwhelmed?
            </Text>
            <Text style={[styles.groundingDesc, { color: colors.mutedText }]}>
              Take 2 minutes to center yourself with Guided Breathing in Heal Bubble.
            </Text>
          </View>
          <View style={[styles.groundingBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.groundingBtnText}>Breathe</Text>
          </View>
        </TouchableOpacity>

        {/* Verified Helplines Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.darkText }]}>Verified Helplines</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
            Confidential, free crisis counselors ready to support you.
          </Text>
        </View>

        {HELPLINES.map((item) => (
          <View
            key={item.id}
            style={[
              styles.helplineCard,
              Shadows.sm,
              { backgroundColor: colors.white, borderColor: colors.border },
            ]}
          >
            <View style={styles.helplineHeader}>
              <View style={[styles.badgeWrap, { backgroundColor: colors.lightSage }]}>
                <Text style={[styles.badgeText, { color: colors.primaryDark }]}>{item.badge}</Text>
              </View>
              <Text style={[styles.hoursText, { color: colors.mutedText }]}>{item.hours}</Text>
            </View>

            <Text style={[styles.helplineName, { color: colors.darkText }]}>{item.name}</Text>
            <Text style={[styles.helplineDesc, { color: colors.mutedText }]}>{item.description}</Text>

            <View style={styles.helplineFooter}>
              {item.contactNumber && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleAction(item.actionUrl)}
                  activeOpacity={0.8}
                >
                  <Phone size={15} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.actionBtnText}>Call {item.contactNumber}</Text>
                </TouchableOpacity>
              )}

              {item.smsCode && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#4A6B82' }]}
                  onPress={() => handleAction(item.actionUrl)}
                  activeOpacity={0.8}
                >
                  <MessageSquare size={15} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.actionBtnText}>Text HOME to {item.smsCode}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Student Resources Tip */}
        <View
          style={[
            styles.tipCard,
            { backgroundColor: colors.white, borderColor: colors.border },
          ]}
        >
          <HeartHandshake size={20} color={colors.primary} strokeWidth={2} />
          <View style={styles.tipTextWrap}>
            <Text style={[styles.tipTitle, { color: colors.darkText }]}>Campus Counseling</Text>
            <Text style={[styles.tipBody, { color: colors.mutedText }]}>
              Most colleges and universities provide free, on-campus mental health services and confidential walk-in hours for enrolled students. Check your student health portal.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRightSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.huge,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5',
    borderColor: '#FED7D7',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  disclaimerIconWrap: {
    paddingTop: 2,
  },
  disclaimerTextWrap: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#C53030',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#742A2A',
    lineHeight: 18,
    marginBottom: 8,
  },
  disclaimerNoteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#FED7D7',
  },
  disclaimerNote: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9B2C2C',
    flex: 1,
  },
  groundingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  groundingIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groundingContent: {
    flex: 1,
  },
  groundingTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  groundingDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  groundingBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
  },
  groundingBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  helplineCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  helplineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  badgeWrap: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  hoursText: {
    fontSize: 11,
    fontWeight: '500',
  },
  helplineName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  helplineDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  helplineFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipBody: {
    fontSize: 12,
    lineHeight: 17,
  },
});
