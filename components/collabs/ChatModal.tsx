import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowLeft, Send, Sparkles } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { Conversation, UserProfile, ChatMessage } from '../../types/collabs';
import { ProfileAvatar } from '../common/ProfileAvatar';

interface ChatModalProps {
  visible: boolean;
  activeConversation: Conversation | null;
  onClose: () => void;
  onSendMessage: (conversationId: string, text: string) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  visible,
  activeConversation,
  onClose,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [visible, activeConversation?.messages]);

  if (!activeConversation) return null;

  const { withUser, messages } = activeConversation;

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(activeConversation.id, inputText.trim());
    setInputText('');
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Chat Header */}
        <View style={[styles.header, Shadows.sm]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={Colors.darkText} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <View style={styles.avatarWrap}>
              <ProfileAvatar name={withUser.name} size={38} />
              {withUser.isOnline && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.nameWrap}>
              <Text style={styles.headerName}>{withUser.name}</Text>
              <Text style={styles.statusText}>
                {withUser.isOnline ? 'Online now' : 'Active today'}
              </Text>
            </View>
          </View>
        </View>

        {/* Conversation Notice */}
        <View style={styles.sanctuaryBanner}>
          <Sparkles size={12} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.sanctuaryText}>
            Bloom Private Chat · A space for mindful encouragement
          </Text>
        </View>

        {/* Messages ScrollView */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.bubbleWrapper,
                msg.isMe ? styles.myBubbleWrap : styles.theirBubbleWrap,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  msg.isMe ? styles.myBubble : styles.theirBubble,
                  Shadows.sm,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.isMe ? styles.myMessageText : styles.theirMessageText,
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    msg.isMe ? styles.myTimestamp : styles.theirTimestamp,
                  ]}
                >
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={`Message ${withUser.name.split(' ')[0]}...`}
            placeholderTextColor={Colors.lightText}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={250}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              !inputText.trim() && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Send size={18} color={Colors.white} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'android' ? 36 : 48,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: Spacing.sm,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  nameWrap: {
    flex: 1,
  },
  headerName: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.darkText,
  },
  statusText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.primaryDark,
  },
  sanctuaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lightSage,
    paddingVertical: 6,
    gap: 6,
  },
  sanctuaryText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  myBubbleWrap: {
    justifyContent: 'flex-end',
  },
  theirBubbleWrap: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  myBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.white,
  },
  theirMessageText: {
    color: Colors.darkText,
  },
  timestamp: {
    ...Typography.caption,
    fontSize: 9,
    marginTop: 4,
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'right',
  },
  theirTimestamp: {
    color: Colors.lightText,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    maxHeight: 90,
    ...Typography.body,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.lightSage,
    opacity: 0.6,
  },
});
