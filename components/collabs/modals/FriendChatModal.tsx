import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Phone,
  Video,
  Send,
  Image as ImageIcon,
  X,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Check,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';
import { UserProfile, ChatMessage } from '../../../types/collabs';

interface FriendChatModalProps {
  visible: boolean;
  onClose: () => void;
  friend: UserProfile | null;
}

// Preset photo options for quick sharing
const SAMPLE_PHOTOS = [
  {
    id: 'p1',
    title: 'Study Desk',
    uri: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'p2',
    title: 'Morning Matcha',
    uri: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'p3',
    title: 'Mindful Walk',
    uri: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'p4',
    title: 'Botanical Journal',
    uri: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80',
  },
];

export const FriendChatModal: React.FC<FriendChatModalProps> = ({
  visible,
  onClose,
  friend,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const bottomInset = Math.max(insets.bottom, 12);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [activeCall, setActiveCall] = useState<'audio' | 'video' | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<any>(null);

  // Initialize conversation with friend
  useEffect(() => {
    if (friend) {
      setMessages([]);
      setSelectedImage(null);
      setShowImagePicker(false);
      setActiveCall(null);
    }
  }, [friend, visible]);

  // Call duration timer
  useEffect(() => {
    let timer: any;
    if (activeCall) {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [activeCall]);

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if ((!inputText.trim() && !selectedImage) || !friend) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      senderId: 'user_me',
      senderName: 'You',
      text: inputText.trim(),
      image: selectedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setSelectedImage(null);
    setShowImagePicker(false);

    // Live chat with friend

  };

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, selectedImage]);

  if (!friend) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.screenContainer}>
        {/* Full-Screen Top Header Bar (extends seamlessly to top) */}
        <View style={[styles.header, { paddingTop: topInset + 6 }]}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityLabel="Back to My Circle"
          >
            <ArrowLeft size={22} color="#141E19" strokeWidth={2.2} />
          </TouchableOpacity>

          {/* Friend Profile & Status */}
          <View style={styles.friendHeaderInfo}>
            <View style={styles.avatarWrap}>
              {friend.avatar ? (
                <Image source={{ uri: friend.avatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{friend.initials}</Text>
                </View>
              )}
              <View style={styles.onlineBadge} />
            </View>

            <View style={styles.nameCol}>
              <Text style={styles.friendName} numberOfLines={1}>
                {friend.name}
              </Text>
              <View style={styles.statusRow}>
                <View style={styles.activeDot} />
                <Text style={styles.statusText}>Active now</Text>
              </View>
            </View>
          </View>

          {/* Top Right Call & Video Call Options */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => setActiveCall('audio')}
              activeOpacity={0.75}
              accessibilityLabel={`Call ${friend.name}`}
            >
              <Phone size={19} color="#365B45" strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => setActiveCall('video')}
              activeOpacity={0.75}
              accessibilityLabel={`Video call ${friend.name}`}
            >
              <Video size={20} color="#365B45" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages Feed */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.messageScroll}
            contentContainerStyle={styles.messageContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Timestamp Header */}
            <View style={styles.timestampBadgeWrap}>
              <Text style={styles.timestampBadgeText}>Today · Bloom Circle</Text>
            </View>

            {messages.map(msg => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.isMe ? styles.messageMe : styles.messageFriend,
                ]}
              >
                {/* Optional Attached Image in Message */}
                {msg.image ? (
                  <View style={styles.bubbleImageWrap}>
                    <Image
                      source={{ uri: msg.image }}
                      style={styles.bubbleImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}

                {/* Message Text */}
                {msg.text ? (
                  <Text
                    style={[
                      styles.messageText,
                      msg.isMe ? styles.messageTextMe : styles.messageTextFriend,
                    ]}
                  >
                    {msg.text}
                  </Text>
                ) : null}

                {/* Timestamp */}
                <Text
                  style={[
                    styles.timeText,
                    msg.isMe ? styles.timeTextMe : styles.timeTextFriend,
                  ]}
                >
                  {msg.timestamp}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Attached Image Preview Bar (Above Composer) */}
          {selectedImage && (
            <View style={styles.imagePreviewBar}>
              <View style={styles.previewImageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.previewThumb} />
                <View style={styles.previewMeta}>
                  <Text style={styles.previewTitle}>Photo attached</Text>
                  <Text style={styles.previewSubtitle}>Ready to send</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.removePreviewBtn}
                onPress={() => setSelectedImage(null)}
                activeOpacity={0.7}
              >
                <X size={16} color="#45504A" />
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Image Picker Tray (Toggled via Image Button) */}
          {showImagePicker && (
            <View style={styles.imagePickerTray}>
              <View style={styles.pickerTrayHeader}>
                <Text style={styles.pickerTrayTitle}>Select a photo to share</Text>
                <TouchableOpacity
                  onPress={() => setShowImagePicker(false)}
                  activeOpacity={0.7}
                >
                  <X size={16} color={Colors.mutedText} />
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pickerScroll}
              >
                {SAMPLE_PHOTOS.map(photo => (
                  <TouchableOpacity
                    key={photo.id}
                    style={[
                      styles.photoOptionCard,
                      selectedImage === photo.uri && styles.photoOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedImage(photo.uri);
                      setShowImagePicker(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.photoOptionImg} />
                    <Text style={styles.photoOptionTitle} numberOfLines={1}>
                      {photo.title}
                    </Text>
                    {selectedImage === photo.uri && (
                      <View style={styles.selectedCheckOverlay}>
                        <Check size={14} color={Colors.white} strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Bottom Chat Composer Bar */}
          <View style={[styles.composerContainer, { paddingBottom: bottomInset }]}>
            <View style={styles.composerRow}>
              {/* Add Image Button */}
              <TouchableOpacity
                style={[
                  styles.imageBtn,
                  (showImagePicker || selectedImage) && styles.imageBtnActive,
                ]}
                onPress={() => setShowImagePicker(prev => !prev)}
                activeOpacity={0.75}
                accessibilityLabel="Add image"
              >
                <ImageIcon
                  size={20}
                  color={showImagePicker || selectedImage ? '#365B45' : '#4E5A53'}
                  strokeWidth={2}
                />
              </TouchableOpacity>

              {/* Text Input */}
              <TextInput
                style={styles.textInput}
                placeholder={`Message ${friend.name.split(' ')[0]}...`}
                placeholderTextColor="#7B857F"
                value={inputText}
                onChangeText={setInputText}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />

              {/* Send Button */}
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (inputText.trim().length > 0 || selectedImage) &&
                    styles.sendBtnActive,
                ]}
                onPress={handleSend}
                activeOpacity={0.8}
                accessibilityLabel="Send message"
              >
                <Send size={16} color={Colors.white} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Interactive Simulated Call Modal */}
        {activeCall && (
          <Modal
            visible={true}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setActiveCall(null)}
          >
            <View style={styles.callOverlay}>
              <View style={[styles.callCard, Shadows.lg]}>
                {/* Friend Call Avatar */}
                <View style={styles.callAvatarWrap}>
                  {friend.avatar ? (
                    <Image source={{ uri: friend.avatar }} style={styles.callAvatarImg} />
                  ) : (
                    <View style={styles.callAvatarFallback}>
                      <Text style={styles.callAvatarInitials}>{friend.initials}</Text>
                    </View>
                  )}
                  {activeCall === 'video' && (
                    <View style={styles.callVideoBadge}>
                      <Video size={14} color={Colors.white} strokeWidth={2.2} />
                    </View>
                  )}
                </View>

                {/* Call Status & Info */}
                <Text style={styles.callFriendName}>{friend.name}</Text>
                <Text style={styles.callTypeLabel}>
                  {activeCall === 'video' ? 'Bloom Video Call' : 'Bloom Voice Call'}
                </Text>
                <Text style={styles.callDurationText}>
                  {callDuration > 0 ? formatCallTime(callDuration) : 'Connecting...'}
                </Text>

                {/* Call Action Controls */}
                <View style={styles.callControlsRow}>
                  {/* Mute */}
                  <TouchableOpacity
                    style={[styles.callControlBtn, isMuted && styles.callControlBtnActive]}
                    onPress={() => setIsMuted(prev => !prev)}
                    activeOpacity={0.7}
                  >
                    {isMuted ? (
                      <MicOff size={20} color={Colors.white} />
                    ) : (
                      <Mic size={20} color="#365B45" />
                    )}
                  </TouchableOpacity>

                  {/* End Call */}
                  <TouchableOpacity
                    style={styles.endCallBtn}
                    onPress={() => setActiveCall(null)}
                    activeOpacity={0.8}
                    accessibilityLabel="End call"
                  >
                    <PhoneOff size={24} color={Colors.white} strokeWidth={2.2} />
                  </TouchableOpacity>

                  {/* Speaker */}
                  <TouchableOpacity
                    style={styles.callControlBtn}
                    activeOpacity={0.7}
                  >
                    <Volume2 size={20} color="#365B45" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#E8F1E8', // Light sage greenish theme
  },
  // Full-Screen Top Header Bar
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#DCE8DE',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 4,
  },
  avatarWrap: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#365B45',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  nameCol: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#141E19',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#529E6B',
  },
  statusText: {
    fontSize: 11,
    color: '#529E6B',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Messages Feed
  keyboardContainer: {
    flex: 1,
  },
  messageScroll: {
    flex: 1,
  },
  messageContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 12,
  },
  timestampBadgeWrap: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    marginBottom: 8,
  },
  timestampBadgeText: {
    fontSize: 11,
    color: '#65736B',
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageFriend: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  messageMe: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderTopRightRadius: 4,
  },
  bubbleImageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
  },
  bubbleImage: {
    width: 220,
    height: 140,
    borderRadius: 12,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  messageTextFriend: {
    color: '#141E19',
  },
  messageTextMe: {
    color: Colors.white,
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
  },
  timeTextFriend: {
    color: Colors.mutedText,
  },
  timeTextMe: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
  },
  // Attached Image Preview Bar
  imagePreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: 8,
    padding: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  previewImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  previewMeta: {
    gap: 2,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#141E19',
  },
  previewSubtitle: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  removePreviewBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Quick Image Picker Tray
  imagePickerTray: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#DCE8DE',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  pickerTrayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  pickerTrayTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#141E19',
  },
  pickerScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  photoOptionCard: {
    width: 80,
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoOptionSelected: {
    borderWidth: 2,
    borderColor: '#365B45',
  },
  photoOptionImg: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  photoOptionTitle: {
    fontSize: 10,
    color: Colors.darkText,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedCheckOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#365B45',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bottom Chat Composer Bar
  composerContainer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#DCE8DE',
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBtnActive: {
    backgroundColor: '#CDE5D3',
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#E8F1E8',
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#141E19',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#B5CABA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: Colors.primary,
  },
  // Simulated Call Overlay
  callOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 25, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  callCard: {
    width: '90%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  callAvatarWrap: {
    position: 'relative',
    width: 80,
    height: 80,
    marginBottom: Spacing.md,
  },
  callAvatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  callAvatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callAvatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#365B45',
  },
  callVideoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#365B45',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  callFriendName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#141E19',
    marginBottom: 4,
  },
  callTypeLabel: {
    fontSize: 13,
    color: Colors.mutedText,
    marginBottom: 2,
  },
  callDurationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#365B45',
    marginBottom: Spacing.xl,
  },
  callControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  callControlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callControlBtnActive: {
    backgroundColor: '#365B45',
  },
  endCallBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E05D5D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
