import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Plus,
  Radio,
  MessageSquare,
  Sprout,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { ConversationThread } from '../../services/aiCompanionService';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVoiceMode: () => void;
  onSelectChatMode: () => void;
  onNewChat: () => void;
  onSelectThread: (thread: ConversationThread) => void;
  activeMode: 'VOICE' | 'CHAT';
  activeThreadId?: string;
  threads: ConversationThread[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(320, SCREEN_WIDTH * 0.82);

export function SidebarDrawer({
  isOpen,
  onClose,
  onSelectVoiceMode,
  onSelectChatMode,
  onNewChat,
  onSelectThread,
  activeMode,
  activeThreadId,
  threads,
}: SidebarDrawerProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, slideAnim, fadeAnim]);

  if (!isOpen && (slideAnim as any)._value === -DRAWER_WIDTH) {
    return null;
  }

  return (
    <View
      style={[
        styles.rootOverlay,
        StyleSheet.absoluteFill,
      ]}
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      {/* Dimmed Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Solid White Opaque Drawer Container */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 16),
            paddingBottom: Math.max(insets.bottom, 16),
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.brandIconContainer}>
                <Sprout size={20} color={Colors.primary} strokeWidth={2.2} />
              </View>
              <Text style={styles.brandTitle}>BLOOM</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              accessibilityLabel="Close menu"
            >
              <X size={20} color={Colors.darkText} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* New Chat Primary Button */}
          <View style={styles.newChatWrapper}>
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={() => {
                onNewChat();
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Plus size={18} color={Colors.white} strokeWidth={2.4} />
              <Text style={styles.newChatText}>New chat</Text>
            </TouchableOpacity>
          </View>

          {/* Communication Modes Section */}
          <View style={styles.navSection}>
            {/* AI Companion Voice Bot */}
            <TouchableOpacity
              style={[styles.navItem, activeMode === 'VOICE' && styles.navItemActive]}
              onPress={() => {
                onSelectVoiceMode();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Radio
                size={18}
                color={activeMode === 'VOICE' ? Colors.primaryDark : Colors.mutedText}
                strokeWidth={2.2}
              />
              <View style={styles.navTextContainer}>
                <Text style={[styles.navItemText, activeMode === 'VOICE' && styles.navItemTextActive]}>
                  AI Companion
                </Text>
                <Text style={styles.navItemBadge}>Voice Bot</Text>
              </View>
            </TouchableOpacity>

            {/* Text Chat Mode */}
            <TouchableOpacity
              style={[styles.navItem, activeMode === 'CHAT' && styles.navItemActive]}
              onPress={() => {
                onSelectChatMode();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <MessageSquare
                size={18}
                color={activeMode === 'CHAT' ? Colors.primaryDark : Colors.mutedText}
                strokeWidth={2.2}
              />
              <View style={styles.navTextContainer}>
                <Text style={[styles.navItemText, activeMode === 'CHAT' && styles.navItemTextActive]}>
                  Chat
                </Text>
                <Text style={styles.navItemBadge}>Text Only</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Recent Check-ins (Direct Text Conversations) */}
          <View style={styles.recentHeader}>
            <Text style={styles.recentHeaderText}>RECENT CHECK-INS</Text>
          </View>

          <ScrollView style={styles.recentList} showsVerticalScrollIndicator={false}>
            {threads.map((thread) => {
              const isSelected = activeMode === 'CHAT' && activeThreadId === thread.id;
              return (
                <TouchableOpacity
                  key={thread.id}
                  style={[styles.threadItem, isSelected && styles.threadItemActive]}
                  onPress={() => {
                    onSelectThread(thread);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <MessageSquare
                    size={16}
                    color={isSelected ? Colors.primaryDark : Colors.mutedText}
                    strokeWidth={1.8}
                  />
                  <Text
                    style={[styles.threadTitle, isSelected && styles.threadTitleActive]}
                    numberOfLines={1}
                  >
                    {thread.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Student Profile Card Footer */}
          <View style={styles.footerProfile}>
            <View style={styles.avatarWrapper}>
              <Image
                source={require('../../assets/maya-avatar.png')}
                style={styles.profileAvatar}
                resizeMode="cover"
              />
              <View style={styles.onlineBadge} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                Maya S.
              </Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>Student Bloom</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(36, 51, 44, 0.45)',
    zIndex: 1001,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FFFFFF', // Solid 100% opaque white
    zIndex: 1002,
    elevation: 1002,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAF4EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F6F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 9999,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  newChatText: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.white,
    fontSize: 14,
  },
  navSection: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    backgroundColor: '#FFFFFF',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  navItemActive: {
    backgroundColor: '#EAF3ED',
  },
  navTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navItemText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.darkText,
    fontWeight: '600',
  },
  navItemTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  navItemBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.mutedText,
    backgroundColor: '#F3F6F4',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2EF',
    marginHorizontal: 16,
    marginVertical: 10,
  },
  recentHeader: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  recentHeaderText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.mutedText,
    letterSpacing: 0.8,
  },
  recentList: {
    flex: 1,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  threadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  threadItemActive: {
    backgroundColor: '#F3F8F5',
  },
  threadTitle: {
    ...Typography.bodySmall,
    color: Colors.darkText,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  threadTitleActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  footerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F8FAF9',
    borderTopWidth: 1,
    borderTopColor: '#EEF2EF',
  },
  avatarWrapper: {
    position: 'relative',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 14,
    color: Colors.darkText,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E4EFF8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    marginTop: 2,
  },
  roleBadgeText: {
    fontSize: 10,
    color: '#45617A',
    fontWeight: '600',
  },
});
