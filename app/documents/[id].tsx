import React, { useState, useEffect, useRef } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Cloud,
  Check,
  Lightbulb,
  CheckSquare,
  Square,
  Plus,
  Bold,
  Italic,
  Underline,
  Image as ImageIcon,
  AlignLeft,
  ListPlus,
  Trash2,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import {
  getDocumentById,
  updateDocument,
  DocumentItem,
  ChecklistItem,
} from '../../data/documentsData';

export default function DocumentDetailScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 16);

  const { id } = useLocalSearchParams<{ id: string }>();

  // Fetch document from store or fallback
  const existingDoc = id ? getDocumentById(id) : undefined;

  // Local state
  const [docId, setDocId] = useState<string>(existingDoc?.id || id || 'doc-1');
  const [title, setTitle] = useState(existingDoc?.title || 'Daily Gratitude');
  const [content, setContent] = useState(
    existingDoc?.content ||
      'Today was surprisingly calm. I took time to breathe between lectures, sat in the campus garden, and noticed the autumn leaves falling.\n\nThree simple things that brought warmth today:\n1. A warm cup of chamomile tea before morning study.\n2. A friendly smile from a classmate in the library.\n3. The quiet 15 minutes of uninterrupted reading at sunset.'
  );
  const [dateStr, setDateStr] = useState(existingDoc?.date || 'October 24');
  const [timeStr, setTimeStr] = useState(existingDoc?.time || '9:42 AM');
  const [tags, setTags] = useState<string[]>(
    existingDoc?.tags || ['✨ Gratitude', 'Reflection']
  );
  const [calloutText, setCalloutText] = useState(
    existingDoc?.callout ||
      'Gratitude turns what we have into enough. Keep noticing the small anchors of peace.'
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    existingDoc?.checklist || [
      { id: 'c1', text: 'Drink 2L of water today', done: true },
      { id: 'c2', text: '10-minute mindful breathing break', done: true },
      { id: 'c3', text: 'Evening gratitude journaling', done: false },
    ]
  );
  const [newChecklistText, setNewChecklistText] = useState('');
  const [saveStatus, setSaveStatus] = useState<string>('Cloud Saved just now');

  // Toolbar formatting state
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center'>('left');

  const contentInputRef = useRef<any>(null);

  // Sync state if id or document changes
  useEffect(() => {
    if (id) {
      const found = getDocumentById(id);
      if (found) {
        setDocId(found.id);
        setTitle(found.title);
        setContent(found.content);
        setDateStr(found.date);
        setTimeStr(found.time);
        setTags(found.tags);
        setCalloutText(
          found.callout ||
            'Gratitude turns what we have into enough. Keep noticing the small anchors of peace.'
        );
        if (found.checklist) {
          setChecklist(found.checklist);
        }
      }
    }
  }, [id]);

  // Dynamic word count calculation
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Toggle checklist item
  const toggleChecklistItem = (itemId: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, done: !item.done } : item
      )
    );
    setSaveStatus('Saving changes...');
    setTimeout(() => {
      setSaveStatus('Cloud Saved just now');
    }, 400);
  };

  // Add new checklist item
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `check-${Date.now()}`,
      text: newChecklistText.trim(),
      done: false,
    };
    setChecklist(prev => [...prev, newItem]);
    setNewChecklistText('');
    setSaveStatus('Saving changes...');
    setTimeout(() => {
      setSaveStatus('Cloud Saved just now');
    }, 400);
  };

  // Delete checklist item
  const handleDeleteChecklistItem = (itemId: string) => {
    setChecklist(prev => prev.filter(item => item.id !== itemId));
    setSaveStatus('Saving changes...');
    setTimeout(() => {
      setSaveStatus('Cloud Saved just now');
    }, 400);
  };

  // Save changes and return
  const handleDone = () => {
    updateDocument(docId, {
      title: title.trim() || 'Untitled Reflection',
      content: content.trim(),
      wordCount,
      checklist,
      callout: calloutText,
      tags,
    });

    Keyboard.dismiss();
    setSaveStatus('Cloud Saved just now');
    setTimeout(() => {
      router.back();
    }, 150);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.screen, { paddingTop: topPadding }]}>
        {/* HEADER */}
        <View style={styles.header}>
          {/* BACK ARROW */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={24} color={Colors.darkText} strokeWidth={2.4} />
          </TouchableOpacity>

          {/* CLOUD SAVED BADGE */}
          <View style={styles.cloudBadge}>
            <Cloud size={13} color={Colors.primaryDark} strokeWidth={2.2} />
            <Text style={styles.cloudBadgeText}>{saveStatus}</Text>
          </View>

          {/* DONE ACTION BUTTON */}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* MAIN BODY CANVAS */}
        <ScrollView
          style={styles.canvasScroll}
          contentContainerStyle={styles.canvasContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* WHITE DETAIL CARD CONTAINER (20px rounded corners) */}
          <View style={[styles.cardContainer, Shadows.md]}>
            {/* METADATA BAR */}
            <View style={styles.metadataBar}>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataItem}>{dateStr}</Text>
                <Text style={styles.metadataDot}>•</Text>
                <Text style={styles.metadataItem}>{timeStr}</Text>
                <Text style={styles.metadataDot}>•</Text>
                <Text style={styles.metadataItem}>{wordCount} words</Text>
              </View>

              {/* TAG CHIPS */}
              <View style={styles.tagChipsRow}>
                {tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* DOCUMENT TITLE */}
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={text => {
                setTitle(text);
                setSaveStatus('Drafting...');
              }}
              placeholder="Title"
              placeholderTextColor={Colors.lightText}
              maxLength={90}
            />

            {/* LIGHT SAGE CALLOUT CARD WITH LIGHTBULB ICON */}
            <View style={styles.calloutCard}>
              <View style={styles.calloutIconCircle}>
                <Lightbulb size={18} color={Colors.primaryDark} strokeWidth={2.4} />
              </View>
              <TextInput
                style={styles.calloutInput}
                value={calloutText}
                onChangeText={text => {
                  setCalloutText(text);
                  setSaveStatus('Drafting...');
                }}
                multiline
                placeholder="Mindful reminder or intention..."
                placeholderTextColor={Colors.mutedText}
              />
            </View>

            {/* FORMATTED TEXT PARAGRAPHS */}
            <TextInput
              ref={contentInputRef}
              style={[
                styles.bodyInput,
                { textAlign },
                isBold && styles.boldText,
                isItalic && styles.italicText,
                isUnderline && styles.underlineText,
              ]}
              value={content}
              onChangeText={text => {
                setContent(text);
                setSaveStatus('Drafting...');
              }}
              multiline
              textAlignVertical="top"
              placeholder="Write your thoughts..."
              placeholderTextColor={Colors.lightText}
            />

            {/* DIVIDER */}
            <View style={styles.sectionDivider} />

            {/* INTERACTIVE CHECKLIST */}
            <View style={styles.checklistSection}>
              <View style={styles.checklistHeaderRow}>
                <Text style={styles.checklistTitle}>Action Items & Checklist</Text>
                <Text style={styles.checklistBadge}>
                  {checklist.filter(c => c.done).length}/{checklist.length} done
                </Text>
              </View>

              {checklist.map(item => (
                <View key={item.id} style={styles.checkItemRow}>
                  <TouchableOpacity
                    style={styles.checkboxTouchable}
                    onPress={() => toggleChecklistItem(item.id)}
                    activeOpacity={0.7}
                  >
                    {item.done ? (
                      <CheckSquare
                        size={20}
                        color={Colors.primary}
                        strokeWidth={2.2}
                      />
                    ) : (
                      <Square
                        size={20}
                        color={Colors.mutedText}
                        strokeWidth={1.8}
                      />
                    )}
                    <Text
                      style={[
                        styles.checkItemText,
                        item.done && styles.checkItemTextDone,
                      ]}
                    >
                      {item.text}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteCheckBtn}
                    onPress={() => handleDeleteChecklistItem(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={15} color={Colors.lightText} strokeWidth={1.8} />
                  </TouchableOpacity>
                </View>
              ))}

              {/* ADD NEW CHECKLIST ITEM INPUT */}
              <View style={styles.addCheckRow}>
                <TextInput
                  style={styles.addCheckInput}
                  placeholder="Add a new checklist item..."
                  placeholderTextColor={Colors.lightText}
                  value={newChecklistText}
                  onChangeText={setNewChecklistText}
                  onSubmitEditing={handleAddChecklistItem}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[
                    styles.addCheckBtn,
                    !newChecklistText.trim() && styles.addCheckBtnDisabled,
                  ]}
                  onPress={handleAddChecklistItem}
                  disabled={!newChecklistText.trim()}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color={Colors.white} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* BOTTOM EDITING TOOLBAR (FIXED ABOVE KEYBOARD) */}
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
                setSaveStatus('Saving changes...');
                setTimeout(() => setSaveStatus('Cloud Saved just now'), 400);
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

            {/* ADD CHECKLIST ROW QUICK BUTTON */}
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => {
                setChecklist(prev => [
                  ...prev,
                  {
                    id: `check-${Date.now()}`,
                    text: 'Mindful practice item',
                    done: false,
                  },
                ]);
                setSaveStatus('Saving changes...');
                setTimeout(() => setSaveStatus('Cloud Saved just now'), 400);
              }}
              activeOpacity={0.7}
            >
              <ListPlus size={18} color={Colors.mutedText} strokeWidth={2} />
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
  cloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  cloudBadgeText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  doneButton: {
    paddingHorizontal: 18,
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
    borderRadius: 20,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 520,
  },
  metadataBar: {
    marginBottom: Spacing.md,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: Spacing.xs,
  },
  metadataItem: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
    fontWeight: '500',
  },
  metadataDot: {
    marginHorizontal: 6,
    color: Colors.lightText,
    fontSize: 12,
  },
  tagChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tagChip: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  tagChipText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  titleInput: {
    ...Typography.h1,
    fontSize: 23,
    fontWeight: '700',
    color: Colors.darkText,
    paddingVertical: 0,
    marginBottom: Spacing.md,
  },
  calloutCard: {
    flexDirection: 'row',
    backgroundColor: Colors.lightSage,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(120, 155, 131, 0.2)',
  },
  calloutIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  calloutInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.primaryDark,
    fontStyle: 'italic',
    paddingVertical: 0,
  },
  bodyInput: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.darkText,
    lineHeight: 25,
    minHeight: 220,
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
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(232, 236, 233, 0.8)',
    marginVertical: Spacing.lg,
  },
  checklistSection: {
    marginTop: Spacing.xs,
  },
  checklistHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  checklistTitle: {
    ...Typography.h3,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkText,
  },
  checklistBadge: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.mutedText,
    backgroundColor: Colors.cream,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  checkboxTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  checkItemText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.darkText,
    flex: 1,
  },
  checkItemTextDone: {
    textDecorationLine: 'line-through',
    color: Colors.lightText,
  },
  deleteCheckBtn: {
    padding: 4,
  },
  addCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
  },
  addCheckInput: {
    flex: 1,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.round,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.darkText,
  },
  addCheckBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCheckBtnDisabled: {
    opacity: 0.5,
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
