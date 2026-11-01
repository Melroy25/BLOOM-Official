import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Plus,
  Smile,
  Send,
  Check,
  X,
  BarChart2,
  Sparkles,
  Image as ImageIcon,
  Video,
  FileText,
  Headphones,
  MapPin,
  Play,
  Download,
  Trash2,
  Copy,
  Search,
  CheckCheck,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';
import { ChatMessage, ChatPoll } from '../../../types/collabs';

interface GlobalChatTabProps {
  messages: ChatMessage[];
  onSendMessage: (
    text: string,
    media?: {
      image?: string;
      video?: string;
      fileDoc?: { name: string; size: string };
      audioNote?: { duration: string };
    }
  ) => void;
  onVotePoll?: (messageId: string, optionId: string) => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  onCreatePoll?: (question: string, options: string[]) => void;
  onDeleteSingleMessage?: (messageId: string) => void;
  isSearchActive?: boolean;
  onCloseSearch?: () => void;
}

const EMOJI_PICKER_LIST = ['❤️', '🌿', '✨', '🙌', '👏', '🍵', '🔥', '💯'];

// Quick Presets for 1-Tap Media Testing
const QUICK_PRESETS = [
  {
    id: 'qp1',
    title: 'Study Desk',
    type: 'image' as const,
    uri: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
    caption: 'Clean desk, peaceful mind for study block 🍵',
  },
  {
    id: 'qp2',
    title: 'Matcha Ritual',
    type: 'image' as const,
    uri: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
    caption: 'Balcony matcha breather before organic chem sprint! 🌿',
  },
  {
    id: 'qp3',
    title: 'Campus Sunset Walk',
    type: 'image' as const,
    uri: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
    caption: 'Golden hour leaves outside the library 🍂',
  },
  {
    id: 'qp4',
    title: 'Study Time-lapse',
    type: 'video' as const,
    uri: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80',
    duration: '0:15',
    caption: '15-sec study sprint time-lapse with lo-fi beats 🎥✨',
  },
];

export const GlobalChatTab: React.FC<GlobalChatTabProps> = ({
  messages,
  onSendMessage,
  onVotePoll,
  onReactMessage,
  onCreatePoll,
  onDeleteSingleMessage,
  isSearchActive = false,
  onCloseSearch,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);
  const [inputText, setInputText] = useState('');
  const [activeReactionPickerMessageId, setActiveReactionPickerMessageId] = useState<string | null>(null);

  // WhatsApp Attachment Sheet State
  const [isAttachmentSheetVisible, setIsAttachmentSheetVisible] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{
    type: 'image' | 'video' | 'file' | 'audio';
    uri?: string;
    name?: string;
    size?: string;
    duration?: string;
  } | null>(null);

  // Fullscreen Image Preview
  const [fullscreenImageUri, setFullscreenImageUri] = useState<string | null>(null);

  // Single Message Action Context Menu (WhatsApp Long-Press / Tap)
  const [selectedMessageForAction, setSelectedMessageForAction] = useState<ChatMessage | null>(null);

  // Search Filter Query
  const [searchQuery, setSearchQuery] = useState('');

  // Create Poll Modal State
  const [isPollModalVisible, setIsPollModalVisible] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOption1, setPollOption1] = useState('');
  const [pollOption2, setPollOption2] = useState('');
  const [pollOption3, setPollOption3] = useState('');

  const scrollViewRef = useRef<any>(null);

  // Handle Pick Image from Gallery
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Library Access',
          'Please grant access to your device photos to select a picture.'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPendingAttachment({
          type: 'image',
          uri: result.assets[0].uri,
        });
        setIsAttachmentSheetVisible(false);
      }
    } catch (err) {
      console.warn('Error picking image:', err);
    }
  };

  // Handle Pick Video
  const handlePickVideo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Media Access',
          'Please grant media access to select a video clip from your device.'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPendingAttachment({
          type: 'video',
          uri: result.assets[0].uri,
          duration: '0:15',
        });
        setIsAttachmentSheetVisible(false);
      }
    } catch (err) {
      console.warn('Error picking video:', err);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() && !pendingAttachment) return;

    if (pendingAttachment) {
      if (pendingAttachment.type === 'image') {
        onSendMessage(inputText.trim(), { image: pendingAttachment.uri });
      } else if (pendingAttachment.type === 'video') {
        onSendMessage(inputText.trim(), { video: pendingAttachment.uri });
      } else if (pendingAttachment.type === 'file') {
        onSendMessage(inputText.trim(), {
          fileDoc: {
            name: pendingAttachment.name || '🌿 Midterm_Stress_Reset_Guide.pdf',
            size: pendingAttachment.size || '420 KB',
          },
        });
      } else if (pendingAttachment.type === 'audio') {
        onSendMessage(inputText.trim(), {
          audioNote: {
            duration: pendingAttachment.duration || '0:45',
          },
        });
      }
      setPendingAttachment(null);
      setInputText('');
      return;
    }

    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleSelectReaction = (messageId: string, emoji: string) => {
    onReactMessage?.(messageId, emoji);
    setActiveReactionPickerMessageId(null);
  };

  const handleCreatePollSubmit = () => {
    const q = pollQuestion.trim();
    const opts = [pollOption1.trim(), pollOption2.trim(), pollOption3.trim()].filter(
      Boolean
    );
    if (!q || opts.length < 2) return;

    onCreatePoll?.(q, opts);
    setPollQuestion('');
    setPollOption1('');
    setPollOption2('');
    setPollOption3('');
    setIsPollModalVisible(false);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Filter messages based on search query
  const filteredMessages = searchQuery.trim()
    ? messages.filter(
        m =>
          (m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (m.senderName && m.senderName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (m.poll && m.poll.question.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : messages;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* IN-CHAT SEARCH BAR (Activated from 3-dots top menu) */}
      {isSearchActive && (
        <View style={[styles.searchBarWrap, Shadows.sm]}>
          <Search size={16} color="#365B45" strokeWidth={2.2} />
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search in global chat..."
            placeholderTextColor="#7B857F"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchIconBtn}>
              <X size={15} color="#7B857F" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onCloseSearch} style={styles.searchCloseBtn}>
            <Text style={styles.searchCloseBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Message Stream */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={[styles.messageContent, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filteredMessages.length === 0 && searchQuery.trim().length > 0 ? (
          <View style={styles.emptySearchWrap}>
            <Search size={32} color="#A8C5B2" strokeWidth={1.5} />
            <Text style={styles.emptySearchTitle}>No messages found</Text>
            <Text style={styles.emptySearchSubtitle}>
              Try searching with another keyword or term.
            </Text>
          </View>
        ) : null}

        {filteredMessages.map(msg => {
          const reactions = msg.reactions || {};
          const myReactions = msg.myReactions || [];
          const isPickerOpen = activeReactionPickerMessageId === msg.id;

          // 1. POLL MESSAGE
          if (msg.poll) {
            const poll = msg.poll;
            const total = Math.max(poll.totalVotes, 1);

            return (
              <View key={msg.id} style={styles.pollWrapper}>
                <TouchableOpacity
                  activeOpacity={0.95}
                  onLongPress={() => setSelectedMessageForAction(msg)}
                  style={[styles.pollCard, Shadows.sm]}
                >
                  {/* Poll Header */}
                  <View style={styles.pollHeaderRow}>
                    <View style={styles.pollBadge}>
                      <BarChart2 size={13} color="#2A5C3C" strokeWidth={2.4} />
                      <Text style={styles.pollBadgeText}>Community Poll</Text>
                    </View>
                    <Text style={styles.pollVotesCount}>
                      {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
                    </Text>
                  </View>

                  <Text style={styles.pollQuestion}>{poll.question}</Text>

                  {/* Poll Options (Interactive Voting) */}
                  <View style={styles.pollOptionsContainer}>
                    {poll.options.map(opt => {
                      const isVoted = poll.userVotedOptionId === opt.id;
                      const percent = Math.round((opt.votes / total) * 100);

                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.pollOptionBtn,
                            isVoted && styles.pollOptionBtnVoted,
                          ]}
                          onPress={() => onVotePoll?.(msg.id, opt.id)}
                          activeOpacity={0.8}
                        >
                          {/* Progress fill bar */}
                          {poll.totalVotes > 0 && (
                            <View
                              style={[
                                styles.pollOptionFill,
                                isVoted
                                  ? styles.pollOptionFillVoted
                                  : styles.pollOptionFillNormal,
                                { width: `${percent}%` },
                              ]}
                            />
                          )}

                          <View style={styles.pollOptionContentRow}>
                            <View style={styles.pollOptionLeft}>
                              <View
                                style={[
                                  styles.pollRadio,
                                  isVoted && styles.pollRadioVoted,
                                ]}
                              >
                                {isVoted && (
                                  <Check size={11} color="#FFFFFF" strokeWidth={3} />
                                )}
                              </View>
                              <Text
                                style={[
                                  styles.pollOptionText,
                                  isVoted && styles.pollOptionTextVoted,
                                ]}
                              >
                                {opt.text}
                              </Text>
                            </View>

                            {poll.totalVotes > 0 && (
                              <Text
                                style={[
                                  styles.pollPercentText,
                                  isVoted && styles.pollPercentTextVoted,
                                ]}
                              >
                                {percent}%
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Poll Footer */}
                  <View style={styles.pollFooterRow}>
                    <Text style={styles.pollTimestamp}>{msg.timestamp}</Text>
                    <TouchableOpacity
                      onPress={() => setSelectedMessageForAction(msg)}
                      style={styles.pollMoreBtn}
                    >
                      <Smile size={14} color="#7B857F" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {/* Reaction Pills for Poll */}
                <View style={styles.reactionsAlignLeft}>
                  {Object.entries(reactions).map(([emoji, count]) => {
                    const hasReacted = myReactions.includes(emoji);
                    return (
                      <TouchableOpacity
                        key={emoji}
                        style={[
                          styles.reactionPill,
                          hasReacted && styles.reactionPillActive,
                        ]}
                        onPress={() => onReactMessage?.(msg.id, emoji)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.reactionEmoji}>{emoji}</Text>
                        <Text
                          style={[
                            styles.reactionCount,
                            hasReacted && styles.reactionCountActive,
                          ]}
                        >
                          {count}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.addReactionMiniBtn}
                    onPress={() =>
                      setActiveReactionPickerMessageId(prev =>
                        prev === msg.id ? null : msg.id
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Smile size={13} color="#55655B" />
                  </TouchableOpacity>
                </View>

                {/* Inline Reaction Picker for Poll */}
                {isPickerOpen && (
                  <View style={[styles.reactionPickerTrayLeft, Shadows.md]}>
                    {EMOJI_PICKER_LIST.map(emoji => (
                      <TouchableOpacity
                        key={emoji}
                        style={styles.pickerEmojiTouch}
                        onPress={() => handleSelectReaction(msg.id, emoji)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.pickerEmojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          }

          // 2. OUTGOING MESSAGE (Right side - You)
          if (msg.isMe) {
            return (
              <View key={msg.id} style={styles.outgoingRow}>
                <View style={styles.outgoingContent}>
                  <View style={styles.metaRight}>
                    <Text style={styles.metaTimestamp}>{msg.timestamp}</Text>
                    <Text style={styles.metaSenderMe}>You</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    onLongPress={() => setSelectedMessageForAction(msg)}
                    style={[styles.outgoingBubble, Shadows.sm]}
                  >
                    {/* Media: Image Attachment */}
                    {msg.image && (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setFullscreenImageUri(msg.image || null)}
                        style={styles.mediaContainer}
                      >
                        <Image
                          source={{ uri: msg.image }}
                          style={styles.bubbleImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    )}

                    {/* Media: Video Attachment */}
                    {msg.video && (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setFullscreenImageUri(msg.video || null)}
                        style={styles.mediaContainer}
                      >
                        <Image
                          source={{ uri: msg.video }}
                          style={styles.bubbleImage}
                          resizeMode="cover"
                        />
                        <View style={styles.videoOverlay}>
                          <View style={styles.videoPlayCircle}>
                            <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                          </View>
                          <View style={styles.videoDurationBadge}>
                            <Text style={styles.videoDurationText}>0:15</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}

                    {/* Media: Document File */}
                    {msg.fileDoc && (
                      <View style={styles.fileDocCardOutgoing}>
                        <View style={styles.fileDocIconBgOutgoing}>
                          <FileText size={18} color="#FFFFFF" strokeWidth={2} />
                        </View>
                        <View style={styles.fileDocInfo}>
                          <Text style={styles.fileDocTitleOutgoing} numberOfLines={1}>
                            {msg.fileDoc.name}
                          </Text>
                          <Text style={styles.fileDocSubOutgoing}>
                            {msg.fileDoc.size} • PDF Document
                          </Text>
                        </View>
                        <Download size={15} color="rgba(255,255,255,0.7)" />
                      </View>
                    )}

                    {/* Media: Audio Note */}
                    {msg.audioNote && (
                      <View style={styles.audioNoteCardOutgoing}>
                        <View style={styles.audioPlayCircleOutgoing}>
                          <Play size={13} color="#365B45" fill="#365B45" style={{ marginLeft: 1 }} />
                        </View>
                        <View style={styles.audioWaveformWrap}>
                          <View style={[styles.audioWaveBarOutgoing, { height: 10 }]} />
                          <View style={[styles.audioWaveBarOutgoing, { height: 18 }]} />
                          <View style={[styles.audioWaveBarOutgoing, { height: 12 }]} />
                          <View style={[styles.audioWaveBarOutgoing, { height: 22 }]} />
                          <View style={[styles.audioWaveBarOutgoing, { height: 9 }]} />
                          <View style={[styles.audioWaveBarOutgoing, { height: 16 }]} />
                          <View style={[styles.audioWaveBarOutgoing, { height: 12 }]} />
                          <View style={[styles.audioWaveBarOutgoing, { height: 7 }]} />
                        </View>
                        <Text style={styles.audioDurationTextOutgoing}>
                          {msg.audioNote.duration}
                        </Text>
                      </View>
                    )}

                    {/* Message Text */}
                    {msg.text ? <Text style={styles.outgoingText}>{msg.text}</Text> : null}

                    {/* WhatsApp Read Receipt Double Checkmark */}
                    <View style={styles.readReceiptRow}>
                      <CheckCheck size={12} color="rgba(255,255,255,0.75)" strokeWidth={2} />
                    </View>
                  </TouchableOpacity>

                  {/* Reaction Pills on Outgoing */}
                  <View style={styles.reactionsAlignRight}>
                    {Object.entries(reactions).map(([emoji, count]) => {
                      const hasReacted = myReactions.includes(emoji);
                      return (
                        <TouchableOpacity
                          key={emoji}
                          style={[
                            styles.reactionPill,
                            hasReacted && styles.reactionPillActive,
                          ]}
                          onPress={() => onReactMessage?.(msg.id, emoji)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.reactionEmoji}>{emoji}</Text>
                          <Text
                            style={[
                              styles.reactionCount,
                              hasReacted && styles.reactionCountActive,
                            ]}
                          >
                            {count}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    <TouchableOpacity
                      style={styles.addReactionMiniBtn}
                      onPress={() =>
                        setActiveReactionPickerMessageId(prev =>
                          prev === msg.id ? null : msg.id
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Smile size={13} color="#55655B" />
                    </TouchableOpacity>
                  </View>

                  {/* Inline Reaction Picker */}
                  {isPickerOpen && (
                    <View style={[styles.reactionPickerTrayRight, Shadows.md]}>
                      {EMOJI_PICKER_LIST.map(emoji => (
                        <TouchableOpacity
                          key={emoji}
                          style={styles.pickerEmojiTouch}
                          onPress={() => handleSelectReaction(msg.id, emoji)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.pickerEmojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          }

          // 3. INCOMING MESSAGE (Left side)
          return (
            <View key={msg.id} style={styles.incomingRow}>
              <View style={styles.incomingAvatar}>
                <Text style={styles.avatarInitials}>
                  {msg.senderInitials || msg.senderName.slice(0, 2).toUpperCase()}
                </Text>
              </View>

              <View style={styles.incomingContent}>
                <View style={styles.metaLeft}>
                  <Text style={styles.metaSenderName}>
                    {msg.senderHandle || `@${msg.senderName.toLowerCase().replace(/\s+/g, '_')}`}
                  </Text>
                  <Text style={styles.metaTimestamp}>{msg.timestamp}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onLongPress={() => setSelectedMessageForAction(msg)}
                  style={[styles.incomingBubble, Shadows.sm]}
                >
                  {/* Media: Image Attachment */}
                  {msg.image && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => setFullscreenImageUri(msg.image || null)}
                      style={styles.mediaContainer}
                    >
                      <Image
                        source={{ uri: msg.image }}
                        style={styles.bubbleImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}

                  {/* Media: Video Attachment */}
                  {msg.video && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => setFullscreenImageUri(msg.video || null)}
                      style={styles.mediaContainer}
                    >
                      <Image
                        source={{ uri: msg.video }}
                        style={styles.bubbleImage}
                        resizeMode="cover"
                      />
                      <View style={styles.videoOverlay}>
                        <View style={styles.videoPlayCircle}>
                          <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                        </View>
                        <View style={styles.videoDurationBadge}>
                          <Text style={styles.videoDurationText}>0:15</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Media: Document File */}
                  {msg.fileDoc && (
                    <View style={styles.fileDocCardIncoming}>
                      <View style={styles.fileDocIconBgIncoming}>
                        <FileText size={18} color="#365B45" strokeWidth={2} />
                      </View>
                      <View style={styles.fileDocInfo}>
                        <Text style={styles.fileDocTitleIncoming} numberOfLines={1}>
                          {msg.fileDoc.name}
                        </Text>
                        <Text style={styles.fileDocSubIncoming}>
                          {msg.fileDoc.size} • PDF Document
                        </Text>
                      </View>
                      <Download size={15} color="#55655B" />
                    </View>
                  )}

                  {/* Media: Audio Note */}
                  {msg.audioNote && (
                    <View style={styles.audioNoteCardIncoming}>
                      <View style={styles.audioPlayCircleIncoming}>
                        <Play size={13} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 1 }} />
                      </View>
                      <View style={styles.audioWaveformWrap}>
                        <View style={[styles.audioWaveBarIncoming, { height: 10 }]} />
                        <View style={[styles.audioWaveBarIncoming, { height: 18 }]} />
                        <View style={[styles.audioWaveBarIncoming, { height: 12 }]} />
                        <View style={[styles.audioWaveBarIncoming, { height: 22 }]} />
                        <View style={[styles.audioWaveBarIncoming, { height: 9 }]} />
                        <View style={[styles.audioWaveBarIncoming, { height: 16 }]} />
                        <View style={[styles.audioWaveBarIncoming, { height: 12 }]} />
                        <View style={[styles.audioWaveBarIncoming, { height: 7 }]} />
                      </View>
                      <Text style={styles.audioDurationTextIncoming}>
                        {msg.audioNote.duration}
                      </Text>
                    </View>
                  )}

                  {/* Message Text */}
                  {msg.text ? <Text style={styles.incomingText}>{msg.text}</Text> : null}
                </TouchableOpacity>

                {/* Reaction Pills on Incoming */}
                <View style={styles.reactionsAlignLeft}>
                  {Object.entries(reactions).map(([emoji, count]) => {
                    const hasReacted = myReactions.includes(emoji);
                    return (
                      <TouchableOpacity
                        key={emoji}
                        style={[
                          styles.reactionPill,
                          hasReacted && styles.reactionPillActive,
                        ]}
                        onPress={() => onReactMessage?.(msg.id, emoji)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.reactionEmoji}>{emoji}</Text>
                        <Text
                          style={[
                            styles.reactionCount,
                            hasReacted && styles.reactionCountActive,
                          ]}
                        >
                          {count}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  <TouchableOpacity
                    style={styles.addReactionMiniBtn}
                    onPress={() =>
                      setActiveReactionPickerMessageId(prev =>
                        prev === msg.id ? null : msg.id
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Smile size={13} color="#55655B" />
                  </TouchableOpacity>
                </View>

                {/* Inline Reaction Picker */}
                {isPickerOpen && (
                  <View style={[styles.reactionPickerTrayLeft, Shadows.md]}>
                    {EMOJI_PICKER_LIST.map(emoji => (
                      <TouchableOpacity
                        key={emoji}
                        style={styles.pickerEmojiTouch}
                        onPress={() => handleSelectReaction(msg.id, emoji)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.pickerEmojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* PENDING ATTACHMENT PREVIEW BAR (Above Composer) */}
      {pendingAttachment && (
        <View style={[styles.pendingAttachmentBar, Shadows.sm]}>
          {pendingAttachment.type === 'image' && (
            <Image
              source={{ uri: pendingAttachment.uri }}
              style={styles.pendingThumb}
              resizeMode="cover"
            />
          )}
          {pendingAttachment.type === 'video' && (
            <View style={styles.pendingVideoThumbWrap}>
              <Image
                source={{ uri: pendingAttachment.uri }}
                style={styles.pendingThumb}
                resizeMode="cover"
              />
              <Play size={12} color="#FFFFFF" fill="#FFFFFF" style={styles.pendingPlayIcon} />
            </View>
          )}
          {pendingAttachment.type === 'file' && (
            <View style={[styles.pendingThumb, styles.pendingIconBox]}>
              <FileText size={18} color="#365B45" />
            </View>
          )}
          {pendingAttachment.type === 'audio' && (
            <View style={[styles.pendingThumb, styles.pendingIconBox]}>
              <Headphones size={18} color="#365B45" />
            </View>
          )}
          <View style={styles.pendingMeta}>
            <Text style={styles.pendingTitle} numberOfLines={1}>
              {pendingAttachment.type === 'image'
                ? 'Photo attachment ready'
                : pendingAttachment.type === 'video'
                ? 'Video attachment ready'
                : pendingAttachment.type === 'file'
                ? pendingAttachment.name
                : 'Mindful Audio Note'}
            </Text>
            <Text style={styles.pendingSubtitle}>
              Type an optional caption or press send
            </Text>
          </View>
          <TouchableOpacity
            style={styles.pendingCloseBtn}
            onPress={() => setPendingAttachment(null)}
          >
            <X size={16} color="#7B857F" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      )}

      {/* WHATSAPP-STYLE ATTACHMENT SHEET / TRAY */}
      {isAttachmentSheetVisible && (
        <View style={[styles.attachmentTray, Shadows.md]}>
          <View style={styles.attachmentTrayHeader}>
            <Text style={styles.attachmentTrayTitle}>Share to Global Circle</Text>
            <TouchableOpacity
              onPress={() => setIsAttachmentSheetVisible(false)}
              style={styles.attachmentCloseBtn}
            >
              <X size={16} color="#55655B" />
            </TouchableOpacity>
          </View>

          {/* 6 Circular Icons in WhatsApp Grid */}
          <View style={styles.attachmentGrid}>
            {/* 1. Gallery */}
            <TouchableOpacity
              style={styles.attachmentItem}
              onPress={handlePickFromGallery}
              activeOpacity={0.75}
            >
              <View style={[styles.attachmentCircle, { backgroundColor: '#9C27B0' }]}>
                <ImageIcon size={22} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.attachmentLabel}>Gallery</Text>
            </TouchableOpacity>

            {/* 2. Video */}
            <TouchableOpacity
              style={styles.attachmentItem}
              onPress={handlePickVideo}
              activeOpacity={0.75}
            >
              <View style={[styles.attachmentCircle, { backgroundColor: '#E91E63' }]}>
                <Video size={22} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.attachmentLabel}>Video</Text>
            </TouchableOpacity>

            {/* 3. Poll */}
            <TouchableOpacity
              style={styles.attachmentItem}
              onPress={() => {
                setIsAttachmentSheetVisible(false);
                setIsPollModalVisible(true);
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.attachmentCircle, { backgroundColor: '#FF9800' }]}>
                <BarChart2 size={22} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.attachmentLabel}>Poll</Text>
            </TouchableOpacity>

            {/* 4. Document */}
            <TouchableOpacity
              style={styles.attachmentItem}
              onPress={() => {
                setPendingAttachment({
                  type: 'file',
                  name: '🌿 Midterm_Stress_Reset_Guide.pdf',
                  size: '420 KB',
                });
                setIsAttachmentSheetVisible(false);
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.attachmentCircle, { backgroundColor: '#3F51B5' }]}>
                <FileText size={22} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.attachmentLabel}>Document</Text>
            </TouchableOpacity>

            {/* 5. Audio Note */}
            <TouchableOpacity
              style={styles.attachmentItem}
              onPress={() => {
                setPendingAttachment({
                  type: 'audio',
                  name: '🎧 2-min Guided Box Breathing',
                  duration: '0:45',
                });
                setIsAttachmentSheetVisible(false);
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.attachmentCircle, { backgroundColor: '#009688' }]}>
                <Headphones size={22} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.attachmentLabel}>Audio</Text>
            </TouchableOpacity>

            {/* 6. Location / Study Spot */}
            <TouchableOpacity
              style={styles.attachmentItem}
              onPress={() => {
                setIsAttachmentSheetVisible(false);
                onSendMessage('📍 Quiet botanical garden reading terrace — North Campus 🌿');
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.attachmentCircle, { backgroundColor: '#0288D1' }]}>
                <MapPin size={22} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.attachmentLabel}>Study Spot</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Presets Horizontal Carousel */}
          <View style={styles.presetsSection}>
            <Text style={styles.presetsSectionTitle}>QUICK PHOTO & VIDEO PRESETS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
              {QUICK_PRESETS.map(preset => (
                <TouchableOpacity
                  key={preset.id}
                  style={styles.presetChip}
                  onPress={() => {
                    if (preset.type === 'image') {
                      setPendingAttachment({
                        type: 'image',
                        uri: preset.uri,
                      });
                      setInputText(preset.caption);
                    } else {
                      setPendingAttachment({
                        type: 'video',
                        uri: preset.uri,
                        duration: preset.duration,
                      });
                      setInputText(preset.caption);
                    }
                    setIsAttachmentSheetVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: preset.uri }} style={styles.presetChipImage} />
                  <View style={styles.presetChipInfo}>
                    <Text style={styles.presetChipTitle} numberOfLines={1}>{preset.title}</Text>
                    <Text style={styles.presetChipSub}>{preset.type === 'video' ? '🎥 Video' : '📷 Photo'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Bottom Composer Capsule */}
      <View style={[styles.composerWrapper, { paddingBottom: bottomInset }]}>
        <View style={[styles.composerCapsule, Shadows.sm]}>
          {/* WhatsApp Attachment Plus (+) Button */}
          <TouchableOpacity
            style={[
              styles.iconCircle,
              isAttachmentSheetVisible && styles.iconCircleActive,
            ]}
            onPress={() => setIsAttachmentSheetVisible(prev => !prev)}
            activeOpacity={0.7}
            accessibilityLabel="Add attachment"
          >
            <Plus
              size={20}
              color={isAttachmentSheetVisible ? '#FFFFFF' : '#365B45'}
              strokeWidth={2.4}
              style={
                isAttachmentSheetVisible
                  ? { transform: [{ rotate: '45deg' }] }
                  : undefined
              }
            />
          </TouchableOpacity>

          <TextInput
            style={styles.chatInput}
            placeholder={
              pendingAttachment
                ? 'Add an optional caption...'
                : 'Share some warmth with campus...'
            }
            placeholderTextColor="#7B857F"
            value={inputText}
            onChangeText={setInputText}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity
            style={[
              styles.sendCircle,
              !inputText.trim() && !pendingAttachment && styles.sendCircleDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() && !pendingAttachment}
            activeOpacity={0.8}
            accessibilityLabel="Send message"
          >
            <Send
              size={16}
              color={inputText.trim() || pendingAttachment ? Colors.white : '#8A9990'}
              strokeWidth={2.4}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* CREATE POLL MODAL */}
      <Modal
        visible={isPollModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPollModalVisible(false)}
      >
        <View style={styles.pollModalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.pollModalCard}
          >
            <View style={styles.pollModalHeader}>
              <View style={styles.pollModalTitleRow}>
                <BarChart2 size={20} color="#365B45" strokeWidth={2.4} />
                <Text style={styles.pollModalTitle}>New Community Poll</Text>
              </View>
              <TouchableOpacity
                style={styles.pollModalCloseBtn}
                onPress={() => setIsPollModalVisible(false)}
                activeOpacity={0.7}
              >
                <X size={18} color="#141E19" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.pollModalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.pollFieldLabel}>QUESTION</Text>
              <TextInput
                style={styles.pollQuestionInput}
                placeholder="Ask your campus community a question..."
                placeholderTextColor="#7B857F"
                value={pollQuestion}
                onChangeText={setPollQuestion}
                maxLength={100}
              />

              <Text style={styles.pollFieldLabel}>OPTIONS</Text>
              <TextInput
                style={styles.pollOptionInput}
                placeholder="Option 1 (e.g. 🍵 Herbal tea)"
                placeholderTextColor="#7B857F"
                value={pollOption1}
                onChangeText={setPollOption1}
                maxLength={40}
              />
              <TextInput
                style={styles.pollOptionInput}
                placeholder="Option 2 (e.g. 🚶 15-min walk)"
                placeholderTextColor="#7B857F"
                value={pollOption2}
                onChangeText={setPollOption2}
                maxLength={40}
              />
              <TextInput
                style={styles.pollOptionInput}
                placeholder="Option 3 (optional)"
                placeholderTextColor="#7B857F"
                value={pollOption3}
                onChangeText={setPollOption3}
                maxLength={40}
              />

              <TouchableOpacity
                style={[
                  styles.submitPollBtn,
                  (!pollQuestion.trim() || !pollOption1.trim() || !pollOption2.trim()) &&
                    styles.submitPollBtnDisabled,
                  Shadows.sm,
                ]}
                onPress={handleCreatePollSubmit}
                disabled={!pollQuestion.trim() || !pollOption1.trim() || !pollOption2.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.submitPollBtnText}>Post Poll to Global Chat</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* WHATSAPP-STYLE SINGLE MESSAGE ACTION MENU MODAL */}
      <Modal
        visible={!!selectedMessageForAction}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMessageForAction(null)}
      >
        <TouchableOpacity
          style={styles.messageActionBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedMessageForAction(null)}
        >
          <View style={[styles.messageActionCard, Shadows.lg]}>
            <View style={styles.messageActionHeader}>
              <Text style={styles.messageActionSender} numberOfLines={1}>
                {selectedMessageForAction?.isMe ? 'Your message' : selectedMessageForAction?.senderName}
              </Text>
              <Text style={styles.messageActionTime}>
                {selectedMessageForAction?.timestamp}
              </Text>
            </View>

            {/* Emoji Reactions row */}
            <View style={styles.messageActionEmojiRow}>
              {EMOJI_PICKER_LIST.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.messageActionEmojiBtn}
                  onPress={() => {
                    if (selectedMessageForAction) {
                      handleSelectReaction(selectedMessageForAction.id, emoji);
                    }
                    setSelectedMessageForAction(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.messageActionEmojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.messageActionDivider} />

            {/* Action 1: Delete message from all */}
            <TouchableOpacity
              style={styles.messageActionItem}
              onPress={() => {
                if (selectedMessageForAction) {
                  onDeleteSingleMessage?.(selectedMessageForAction.id);
                }
                setSelectedMessageForAction(null);
              }}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color="#D9534F" strokeWidth={2} />
              <View style={styles.messageActionItemContent}>
                <Text style={[styles.messageActionItemTitle, { color: '#D9534F' }]}>
                  Delete for everyone
                </Text>
                <Text style={styles.messageActionItemSub}>
                  Remove message from global community stream
                </Text>
              </View>
            </TouchableOpacity>

            {/* Action 2: Delete for me */}
            <TouchableOpacity
              style={styles.messageActionItem}
              onPress={() => {
                if (selectedMessageForAction) {
                  onDeleteSingleMessage?.(selectedMessageForAction.id);
                }
                setSelectedMessageForAction(null);
              }}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color="#55655B" strokeWidth={2} />
              <View style={styles.messageActionItemContent}>
                <Text style={styles.messageActionItemTitle}>Delete for me</Text>
                <Text style={styles.messageActionItemSub}>
                  Remove from this device only
                </Text>
              </View>
            </TouchableOpacity>

            {/* Action 3: Copy Text */}
            {selectedMessageForAction?.text ? (
              <TouchableOpacity
                style={styles.messageActionItem}
                onPress={() => {
                  setSelectedMessageForAction(null);
                  Alert.alert('Copied', 'Message copied to clipboard.');
                }}
                activeOpacity={0.7}
              >
                <Copy size={18} color="#29332E" strokeWidth={2} />
                <View style={styles.messageActionItemContent}>
                  <Text style={styles.messageActionItemTitle}>Copy message</Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FULLSCREEN IMAGE MODAL */}
      <Modal
        visible={!!fullscreenImageUri}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenImageUri(null)}
      >
        <View style={styles.fullscreenBackdrop}>
          <TouchableOpacity
            style={styles.fullscreenCloseBtn}
            onPress={() => setFullscreenImageUri(null)}
            activeOpacity={0.7}
          >
            <X size={24} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
          {fullscreenImageUri && (
            <Image
              source={{ uri: fullscreenImageUri }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },

  // Search Bar
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: '#141E19',
    paddingVertical: 2,
  },
  searchIconBtn: {
    padding: 4,
  },
  searchCloseBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  searchCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#365B45',
  },
  emptySearchWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptySearchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#141E19',
  },
  emptySearchSubtitle: {
    fontSize: 13,
    color: '#7B857F',
  },

  // Message Stream
  messageList: {
    flex: 1,
  },
  messageContent: {
    gap: 14,
    paddingVertical: Spacing.sm,
  },

  // Outgoing (You)
  outgoingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  outgoingContent: {
    alignItems: 'flex-end',
    maxWidth: '82%',
    gap: 4,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaSenderMe: {
    fontSize: 12,
    fontWeight: '700',
    color: '#141E19',
  },
  metaTimestamp: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  outgoingBubble: {
    backgroundColor: '#365B45',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderTopRightRadius: 4,
  },
  outgoingText: {
    fontSize: 14,
    color: Colors.white,
    lineHeight: 20,
  },
  readReceiptRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  reactionsAlignRight: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 5,
    marginTop: 2,
  },

  // Incoming
  incomingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
  },
  incomingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#A8C5B2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '700',
    color: '#141E19',
  },
  incomingContent: {
    flex: 1,
    maxWidth: '82%',
    gap: 4,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaSenderName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#141E19',
  },
  incomingBubble: {
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  incomingText: {
    fontSize: 14,
    color: '#29332E',
    lineHeight: 20,
  },
  reactionsAlignLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },

  // Media bubble contents
  mediaContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
    position: 'relative',
  },
  bubbleImage: {
    width: 220,
    height: 160,
    borderRadius: 12,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  videoDurationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Document Bubbles
  fileDocCardOutgoing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  fileDocIconBgOutgoing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileDocInfo: {
    flex: 1,
  },
  fileDocTitleOutgoing: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fileDocSubOutgoing: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
  },
  fileDocCardIncoming: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F5F2',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  fileDocIconBgIncoming: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F1E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileDocTitleIncoming: {
    fontSize: 13,
    fontWeight: '700',
    color: '#141E19',
  },
  fileDocSubIncoming: {
    fontSize: 11,
    color: '#55655B',
  },

  // Audio Note Bubbles
  audioNoteCardOutgoing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  audioPlayCircleOutgoing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioWaveformWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  audioWaveBarOutgoing: {
    width: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 2,
  },
  audioDurationTextOutgoing: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  audioNoteCardIncoming: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F5F2',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  audioPlayCircleIncoming: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#365B45',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioWaveBarIncoming: {
    width: 3,
    backgroundColor: '#365B45',
    borderRadius: 2,
  },
  audioDurationTextIncoming: {
    fontSize: 11,
    fontWeight: '600',
    color: '#55655B',
  },

  // Reaction Pills
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: '#DCE8DE',
    gap: 3,
  },
  reactionPillActive: {
    backgroundColor: '#E8F1E8',
    borderColor: '#365B45',
  },
  reactionEmoji: {
    fontSize: 13,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#55655B',
  },
  reactionCountActive: {
    color: '#365B45',
  },
  addReactionMiniBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },

  // Inline Reaction Picker Trays
  reactionPickerTrayRight: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DCE8DE',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  reactionPickerTrayLeft: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DCE8DE',
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  pickerEmojiTouch: {
    padding: 3,
  },
  pickerEmojiText: {
    fontSize: 20,
  },

  // Community Poll Card
  pollWrapper: {
    width: '100%',
    marginVertical: 4,
  },
  pollCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  pollHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pollBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F1E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pollBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2A5C3C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pollVotesCount: {
    fontSize: 12,
    color: Colors.mutedText,
    fontWeight: '500',
  },
  pollQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#141E19',
    lineHeight: 21,
    marginBottom: 12,
  },
  pollOptionsContainer: {
    gap: 8,
  },
  pollOptionBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: '#E8ECE9',
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  pollOptionBtnVoted: {
    borderColor: '#365B45',
    backgroundColor: '#F1F7F3',
  },
  pollOptionFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 12,
  },
  pollOptionFillNormal: {
    backgroundColor: '#E2EBE5',
    opacity: 0.7,
  },
  pollOptionFillVoted: {
    backgroundColor: '#D1E6D8',
    opacity: 0.9,
  },
  pollOptionContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 1,
  },
  pollOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pollRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#A8C5B2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pollRadioVoted: {
    backgroundColor: '#365B45',
    borderColor: '#365B45',
  },
  pollOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#29332E',
    flex: 1,
  },
  pollOptionTextVoted: {
    fontWeight: '700',
    color: '#141E19',
  },
  pollPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#55655B',
    marginLeft: 6,
  },
  pollPercentTextVoted: {
    color: '#365B45',
  },
  pollFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F1',
  },
  pollTimestamp: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  pollMoreBtn: {
    padding: 2,
  },

  // Pending Attachment Capsule
  pendingAttachmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#DCE8DE',
    gap: 10,
  },
  pendingThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  pendingVideoThumbWrap: {
    position: 'relative',
  },
  pendingPlayIcon: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  pendingIconBox: {
    backgroundColor: '#E8F1E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingMeta: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#141E19',
  },
  pendingSubtitle: {
    fontSize: 11,
    color: '#7B857F',
  },
  pendingCloseBtn: {
    padding: 6,
  },

  // WhatsApp Attachment Tray
  attachmentTray: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: Spacing.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  attachmentTrayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  attachmentTrayTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#365B45',
  },
  attachmentCloseBtn: {
    padding: 4,
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    marginBottom: 14,
  },
  attachmentItem: {
    width: '30%',
    alignItems: 'center',
    gap: 6,
  },
  attachmentCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#29332E',
  },
  presetsSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F1',
  },
  presetsSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#7B857F',
    marginBottom: 8,
  },
  presetsRow: {
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAF8',
    borderRadius: 12,
    padding: 5,
    paddingRight: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  presetChipImage: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  presetChipInfo: {
    maxWidth: 100,
  },
  presetChipTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#141E19',
  },
  presetChipSub: {
    fontSize: 10,
    color: '#55655B',
  },

  // Composer Wrapper
  composerWrapper: {
    paddingTop: Spacing.xs,
  },
  composerCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: '#365B45',
  },
  chatInput: {
    flex: 1,
    fontSize: 14,
    color: '#141E19',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  sendCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#365B45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCircleDisabled: {
    backgroundColor: '#E8ECE9',
  },

  // Single Message Action Menu
  messageActionBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 25, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  messageActionCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  messageActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  messageActionSender: {
    fontSize: 14,
    fontWeight: '700',
    color: '#141E19',
    flex: 1,
  },
  messageActionTime: {
    fontSize: 11,
    color: '#7B857F',
  },
  messageActionEmojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: '#F7FAF8',
    borderRadius: 14,
  },
  messageActionEmojiBtn: {
    padding: 4,
  },
  messageActionEmojiText: {
    fontSize: 22,
  },
  messageActionDivider: {
    height: 1,
    backgroundColor: '#F0F3F1',
    marginVertical: 12,
  },
  messageActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  messageActionItemContent: {
    flex: 1,
  },
  messageActionItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#29332E',
  },
  messageActionItemSub: {
    fontSize: 11,
    color: '#7B857F',
    marginTop: 1,
  },

  // Fullscreen Image Modal
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },

  // Poll Modal
  pollModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 25, 0.55)',
    justifyContent: 'flex-end',
  },
  pollModalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.xl,
    maxHeight: '85%',
  },
  pollModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  pollModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pollModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#141E19',
    letterSpacing: -0.3,
  },
  pollModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pollModalScroll: {
    gap: 10,
  },
  pollFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#55655B',
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 4,
  },
  pollQuestionInput: {
    backgroundColor: '#F6FAF7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#141E19',
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  pollOptionInput: {
    backgroundColor: '#F6FAF7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#141E19',
    borderWidth: 1,
    borderColor: '#DCE8DE',
    marginBottom: 8,
  },
  submitPollBtn: {
    backgroundColor: '#365B45',
    borderRadius: BorderRadius.round,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 20,
  },
  submitPollBtnDisabled: {
    backgroundColor: '#C5D6CA',
  },
  submitPollBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
