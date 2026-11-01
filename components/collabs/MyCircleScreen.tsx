import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Edit3,
  UserPlus,
  Users,
  Compass,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import {
  MyCircleTab as TabType,
  UserProfile,
} from '../../types/collabs';
import { FriendsTab } from './mycircle/FriendsTab';
import { RequestsTab } from './mycircle/RequestsTab';
import { DiscoverTab } from './mycircle/DiscoverTab';

// Reusable Botanical Bloom Logo Mark
const BloomLogoMark = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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
);

interface MyCircleScreenProps {
  onBackToLanding: () => void;
  onSearchPress?: () => void;
  currentUser: UserProfile;
  friends: UserProfile[];
  requests: UserProfile[];
  suggestions: UserProfile[];
  onOpenEditProfile: () => void;
  onOpenShareProfile?: () => void;
  onOpenFriendChat: (friend: UserProfile) => void;
  onOpenFriendProfile: (friend: UserProfile) => void;
  onRemoveFriend?: (friendId: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  onAddFriend: (userId: string) => void;
  onOpenCreatePost?: () => void;
}

export const MyCircleScreen: React.FC<MyCircleScreenProps> = ({
  onBackToLanding,
  onSearchPress,
  currentUser,
  friends,
  requests,
  suggestions,
  onOpenEditProfile,
  onOpenShareProfile,
  onOpenFriendChat,
  onOpenFriendProfile,
  onRemoveFriend,
  onAcceptRequest,
  onDeclineRequest,
  onAddFriend,
  onOpenCreatePost,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const [activeView, setActiveView] = useState<'friends' | 'requests'>('friends');
  const [subTab, setSubTab] = useState<'friends' | 'discover'>('friends');
  const isRequestsView = activeView === 'requests';

  const handleBack = () => {
    if (isRequestsView) {
      setActiveView('friends');
    } else {
      onBackToLanding();
    }
  };

  return (
    <View style={styles.container}>
      {/* Floating Header Bar (Seamless on light sage background, matches Bloom Circle Landing) */}
      <View style={[styles.headerRow, { paddingTop: topInset + 4 }]}>
        <TouchableOpacity
          style={[styles.headerCircleBtn, Shadows.sm]}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityLabel={isRequestsView ? 'Back to My Circle' : 'Back to Bloom Circle'}
        >
          <ArrowLeft size={20} color="#141E19" strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle}>
            {isRequestsView ? 'Requests' : 'My Circle'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isRequestsView
              ? `${requests.length} pending request${requests.length === 1 ? '' : 's'}`
              : 'Your friends & connections'}
          </Text>
        </View>

        {/* Requests Button on Top-Right */}
        <TouchableOpacity
          style={[
            styles.headerCircleBtn,
            isRequestsView && styles.headerCircleBtnActive,
            Shadows.sm,
          ]}
          onPress={() => setActiveView(prev => (prev === 'requests' ? 'friends' : 'requests'))}
          activeOpacity={0.7}
          accessibilityLabel={isRequestsView ? 'View My Friends' : 'View Friend Requests'}
        >
          {isRequestsView ? (
            <Users size={20} color="#365B45" strokeWidth={2.2} />
          ) : (
            <UserPlus size={20} color="#365B45" strokeWidth={2.2} />
          )}
          {!isRequestsView && requests.length > 0 && (
            <View style={styles.instaRedDot} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Instagram-Inspired Profile Card (Rounded Floating) */}
        <View style={[styles.profileSection, Shadows.sm]}>
          <View style={styles.profileRow}>
            {/* Small Circular Profile Avatar */}
            <View style={styles.avatarWrap}>
              {currentUser.avatar ? (
                <Image
                  source={{ uri: currentUser.avatar }}
                  style={styles.avatarImg}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {currentUser.initials}
                  </Text>
                </View>
              )}
            </View>

            {/* Profile Info */}
            <View style={styles.infoCol}>
              <Text style={styles.displayName}>{currentUser.name}</Text>
              <Text style={styles.displayHandle}>{currentUser.handle}</Text>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <Text style={styles.statText}>
                  <Text style={styles.statBold}>{friends.length}</Text> friends
                </Text>
                <Text style={styles.statDot}>•</Text>
                <Text style={styles.statText}>
                  <Text style={styles.statBold}>{currentUser.challengesJoined}</Text> challenges
                </Text>
              </View>
            </View>
          </View>

          {/* Short Bio */}
          {currentUser.bio ? (
            <Text style={styles.bioText} numberOfLines={3}>
              {currentUser.bio}
            </Text>
          ) : null}

          {/* Small Edit Profile Action */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={onOpenEditProfile}
            activeOpacity={0.75}
          >
            <Edit3 size={13} color="#141E19" strokeWidth={2} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {activeView === 'friends' ? (
          <>
            {/* Friends & Discover Switcher */}
            <View style={[styles.subTabRow, Shadows.sm]}>
              <TouchableOpacity
                style={[styles.subTabBtn, subTab === 'friends' && styles.subTabBtnActive]}
                onPress={() => setSubTab('friends')}
                activeOpacity={0.7}
                accessibilityLabel="My Friends"
              >
                <Text
                  style={[
                    styles.subTabText,
                    subTab === 'friends' && styles.subTabTextActive,
                  ]}
                >
                  Friends ({friends.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subTabBtn, subTab === 'discover' && styles.subTabBtnActive]}
                onPress={() => setSubTab('discover')}
                activeOpacity={0.7}
                accessibilityLabel="Discover Friends"
              >
                <Compass
                  size={14}
                  color={subTab === 'discover' ? Colors.white : '#365B45'}
                  strokeWidth={2.2}
                />
                <Text
                  style={[
                    styles.subTabText,
                    subTab === 'discover' && styles.subTabTextActive,
                  ]}
                >
                  Discover Friends
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sub Tab Content */}
            <View style={styles.tabContentContainer}>
              {subTab === 'friends' ? (
                <FriendsTab
                  friends={friends}
                  onOpenFriendChat={onOpenFriendChat}
                  onOpenFriendProfile={onOpenFriendProfile}
                  onRemoveFriend={onRemoveFriend}
                />
              ) : (
                <DiscoverTab
                  suggestions={suggestions}
                  onAddFriend={onAddFriend}
                />
              )}
            </View>
          </>
        ) : (
          /* Requests View */
          <View style={styles.tabContentContainer}>
            <RequestsTab
              requests={requests}
              onAcceptRequest={onAcceptRequest}
              onDeclineRequest={onDeclineRequest}
            />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F1E8', // Light sage greenish background
  },
  // Floating Header Bar (Seamless on light sage background)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  titleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#141E19',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 2,
    fontWeight: '500',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.xs,
  },
  // Compact Floating Profile Card
  profileSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    borderRadius: 22,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#DCE8DE',
    gap: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#E8F1E8',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#365B45',
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#141E19',
  },
  displayHandle: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statText: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  statBold: {
    fontWeight: '700',
    color: '#141E19',
  },
  statDot: {
    fontSize: 10,
    color: Colors.mutedText,
  },
  bioText: {
    fontSize: 13,
    color: '#29332E',
    lineHeight: 18,
  },
  editProfileBtn: {
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: '#E8F1E8',
    borderWidth: 1,
    borderColor: '#D4E2D7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#141E19',
  },
  headerCircleBtnActive: {
    backgroundColor: '#DCE8DE',
  },
  instaRedDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  tabContentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  subTabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: 12,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.round,
    padding: 3,
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: BorderRadius.round,
  },
  subTabBtnActive: {
    backgroundColor: '#365B45',
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  subTabTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
});

export default MyCircleScreen;
