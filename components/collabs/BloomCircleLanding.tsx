import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Globe,
  Users,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { CircleScreenView } from '../../types/collabs';

interface BloomCircleLandingProps {
  onSelectScreen: (screen: CircleScreenView) => void;
  onBackPress?: () => void;
  onLogoPress?: () => void;
  pendingRequestsCount?: number;
  userInitials?: string;
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_DIAMETER = Math.min(230, Math.max(210, SCREEN_WIDTH * 0.58));

export const BloomCircleLanding: React.FC<BloomCircleLandingProps> = ({
  onSelectScreen,
  onBackPress,
  onLogoPress,
  pendingRequestsCount = 0,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topInset + 4 }]}>
      {/* Top Header Bar:
          Left Back Arrow | Centered "Bloom Circle" & Subtitle | Right Bloom Botanical Logo */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={[styles.headerCircleBtn, Shadows.sm]}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color="#141E19" strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle}>Bloom Circle</Text>
          <Text style={styles.headerSubtitle}>Grow together. Connect. Inspire.</Text>
        </View>

        <TouchableOpacity
          style={[styles.headerCircleBtn, Shadows.sm]}
          onPress={onLogoPress}
          activeOpacity={0.8}
          accessibilityLabel="Bloom Logo"
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2C12 2 8 8 8 13C8 16.5 10 19 12 21C14 19 16 16.5 16 13C16 8 12 2 12 2Z"
              stroke="#365B45"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M8.5 12C6.5 10.5 3 11 2 14C3.5 16.5 6.5 17 9 15.5"
              stroke="#365B45"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M15.5 12C17.5 10.5 21 11 22 14C20.5 16.5 17.5 17 15 15.5"
              stroke="#365B45"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Main Content: Two Large Circular Navigation Elements (Clean & Minimal) */}
      <View style={styles.circlesCenterWrapper}>
        {/* CIRCLE 1: Global Circle */}
        <TouchableOpacity
          style={[styles.circleButton, styles.globalCircle, Shadows.md]}
          onPress={() => onSelectScreen('global')}
          activeOpacity={0.88}
          accessibilityLabel="Open Global Circle"
        >
          <View style={styles.circleIconContainerGlobal}>
            <Globe size={36} color={Colors.white} strokeWidth={2} />
          </View>
          <Text style={styles.globalCircleTitle}>Global Circle</Text>
          <Text style={styles.globalCircleSubtitle}>
            Explore community & trending
          </Text>
        </TouchableOpacity>

        {/* Spacing between the two large circles */}
        <View style={styles.circleSeparator} />

        {/* CIRCLE 2: My Circle */}
        <TouchableOpacity
          style={[styles.circleButton, styles.myCircle, Shadows.sm]}
          onPress={() => onSelectScreen('my_circle')}
          activeOpacity={0.88}
          accessibilityLabel="Open My Circle"
        >
          {/* Subtle pending badge indicator if requests exist */}
          {pendingRequestsCount > 0 && (
            <View style={styles.badgeIndicator}>
              <Text style={styles.badgeIndicatorText}>{pendingRequestsCount}</Text>
            </View>
          )}

          <View style={styles.circleIconContainerMy}>
            <Users size={34} color={Colors.primaryDark} strokeWidth={2} />
          </View>
          <Text style={styles.myCircleTitle}>My Circle</Text>
          <Text style={styles.myCircleSubtitle}>
            Your friends & connections
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F1E8', // Light sage greenish background
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  headerCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  titleWrap: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#141E19',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 2,
  },
  circlesCenterWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.md,
  },
  circleButton: {
    width: CIRCLE_DIAMETER,
    height: CIRCLE_DIAMETER,
    borderRadius: CIRCLE_DIAMETER / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  circleSeparator: {
    height: 32,
  },
  // Global Circle
  globalCircle: {
    backgroundColor: Colors.primary, // #789B83
    borderWidth: 2.5,
    borderColor: '#000000',
  },
  circleIconContainerGlobal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  globalCircleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  globalCircleSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    maxWidth: 160,
    lineHeight: 16,
  },
  // My Circle
  myCircle: {
    backgroundColor: Colors.white,
    borderWidth: 2.5,
    borderColor: '#000000',
    position: 'relative',
  },
  badgeIndicator: {
    position: 'absolute',
    top: 20,
    right: 28,
    backgroundColor: '#F7E5DA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  badgeIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#342A23',
  },
  circleIconContainerMy: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F1E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  myCircleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#141E19',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  myCircleSubtitle: {
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: 'center',
    maxWidth: 160,
    lineHeight: 16,
  },
});

export default BloomCircleLanding;
