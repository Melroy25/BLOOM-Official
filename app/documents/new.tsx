import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronLeft,
  Bold,
  Italic,
  Underline,
  Image as ImageIcon,
  AlignLeft,
  ListPlus,
  Check,
  Tag,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { addDocument, DocumentItem } from '../../data/documentsData';

export default function NewDocumentScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 16);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState('Reflection');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center'>('left');
  const [saveStatus, setSaveStatus] = useState<'Drafting' | 'Saved'>('Drafting');

  const contentInputRef = useRef<any>(null);

  // Real-time formatted date & time
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Handle Save
  const handleDone = () => {
    const finalTitle = title.trim() || 'Untitled Reflection';
    const finalContent = content.trim() || 'No additional content written.';

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: finalTitle,
      content: finalContent,
      date: dateFormatted,
      time: timeFormatted,
      wordCount,
      tags: [selectedTag],
      category: 'recent',
      isPinned: false,
      callout: 'Every word written is a step toward clarity and peace.',
      checklist: [],
      updatedAt: Date.now(),
    };

    setSaveStatus('Saved');
    addDocument(newDoc);
    Keyboard.dismiss();

    // Route back to /documents list
    setTimeout(() => {
      router.back();
    }, 150);
  };

  const availableTags = ['Reflection', '✨ Gratitude', 'Study Logs', 'Mindset', 'Ideas'];

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.screen, { paddingTop: topPadding }]}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={24} color={Colors.darkText} strokeWidth={2.4} />
          </TouchableOpacity>

          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{saveStatus}</Text>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* MAIN CANVAS */}
        <ScrollView
          style={styles.canvasScroll}
          contentContainerStyle={styles.canvasContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.cardContainer, Shadows.md]}>
            {/* TAG SELECTION CHIPS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagSelectorScroll}
            >
              {availableTags.map((tag, idx) => {
                const isSelected = selectedTag === tag;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.tagChip,
                      isSelected && styles.tagChipSelected,
                    ]}
                    onPress={() => setSelectedTag(tag)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tagChipText,
                        isSelected && styles.tagChipTextSelected,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* METADATA LINE */}
            <Text style={styles.metadataLine}>
              {dateFormatted} • {timeFormatted} • {wordCount} words
            </Text>

            {/* TITLE INPUT */}
            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor={Colors.lightText}
              value={title}
              onChangeText={text => {
                setTitle(text);
                setSaveStatus('Drafting');
              }}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => contentInputRef.current?.focus()}
              maxLength={80}
            />

            {/* DIVIDER */}
            <View style={styles.canvasDivider} />

            {/* BODY TEXT INPUT */}
            <TextInput
              ref={contentInputRef}
              style={[
                styles.bodyInput,
                { textAlign },
                isBold && styles.boldText,
                isItalic && styles.italicText,
                isUnderline && styles.underlineText,
              ]}
              placeholder="enter the text..."
              placeholderTextColor={Colors.lightText}
              value={content}
              onChangeText={text => {
                setContent(text);
                setSaveStatus('Drafting');
              }}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* BOTTOM TOOLBAR (FIXED ABOVE KEYBOARD) */}
        <View
          style={[
            styles.bottomToolbar,
            Shadows.md,
            { paddingBottom: bottomPadding },
          ]}
        >
          <View style={styles.toolbarRow}>
            {/* BOLD BUTTON */}
            <TouchableOpacity
              style={[styles.toolBtn, isBold && styles.toolBtnActive]}
              onPress={() => setIsBold(prev => !prev)}
              activeOpacity={0.7}
            >
              <Bold
                size={18}
                color={isBold ? Colors.primaryDark : Colors.mutedText}
                strokeWidth={2.4}
              />
            </TouchableOpacity>

            {/* ITALIC BUTTON */}
            <TouchableOpacity
              style={[styles.toolBtn, isItalic && styles.toolBtnActive]}
              onPress={() => setIsItalic(prev => !prev)}
              activeOpacity={0.7}
            >
              <Italic
                size={18}
                color={isItalic ? Colors.primaryDark : Colors.mutedText}
                strokeWidth={2.4}
              />
            </TouchableOpacity>

            {/* UNDERLINE BUTTON */}
            <TouchableOpacity
              style={[styles.toolBtn, isUnderline && styles.toolBtnActive]}
              onPress={() => setIsUnderline(prev => !prev)}
              activeOpacity={0.7}
            >
              <Underline
                size={18}
                color={isUnderline ? Colors.primaryDark : Colors.mutedText}
                strokeWidth={2.4}
              />
            </TouchableOpacity>

            {/* IMAGE UPLOAD BUTTON */}
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => {
                setContent(prev =>
                  prev ? `${prev}\n\n[Attached image]` : '[Attached image]'
                );
              }}
              activeOpacity={0.7}
            >
              <ImageIcon size={18} color={Colors.mutedText} strokeWidth={2} />
            </TouchableOpacity>

            {/* ALIGNMENT BUTTON */}
            <TouchableOpacity
              style={[
                styles.toolBtn,
                textAlign === 'center' && styles.toolBtnActive,
              ]}
              onPress={() =>
                setTextAlign(prev => (prev === 'left' ? 'center' : 'left'))
              }
              activeOpacity={0.7}
            >
              <AlignLeft
                size={18}
                color={
                  textAlign === 'center'
                    ? Colors.primaryDark
                    : Colors.mutedText
                }
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },
  statusText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
  },
  doneButtonText: {
    ...Typography.button,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  canvasScroll: {
    flex: 1,
  },
  canvasContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.massive,
  },
  cardContainer: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 460,
  },
  tagSelectorScroll: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  tagChip: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  tagChipSelected: {
    backgroundColor: Colors.lightSage,
    borderColor: Colors.primary,
  },
  tagChipText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  tagChipTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  metadataLine: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.lightText,
    marginBottom: Spacing.md,
  },
  titleInput: {
    ...Typography.h1,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.darkText,
    paddingVertical: 0,
    marginBottom: Spacing.md,
  },
  canvasDivider: {
    height: 1,
    backgroundColor: 'rgba(232, 236, 233, 0.7)',
    marginBottom: Spacing.lg,
  },
  bodyInput: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.darkText,
    lineHeight: 24,
    minHeight: 320,
    paddingVertical: 0,
  },
  boldText: {
    fontWeight: '700',
  },
  italicText: {
    fontStyle: 'italic',
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
  bottomToolbar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 44,
  },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolBtnActive: {
    backgroundColor: Colors.lightSage,
  },
});
