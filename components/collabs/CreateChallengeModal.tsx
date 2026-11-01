import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Trophy, Plus } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

interface CreateChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (challenge: {
    title: string;
    description: string;
    category: 'Trending' | 'Daily' | 'Weekly' | 'Popular';
    duration: string;
  }) => void;
}

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  visible,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Trending' | 'Daily' | 'Weekly' | 'Popular'>('Daily');
  const [duration, setDuration] = useState('7 Days');

  const categories: Array<'Trending' | 'Daily' | 'Weekly' | 'Popular'> = [
    'Daily',
    'Weekly',
    'Trending',
    'Popular',
  ];

  const durations = ['7 Days', '14 Days', '21 Days', '30 Days'];

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      description: description.trim() || 'A mindful daily wellness challenge to grow together.',
      category,
      duration,
    });
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'android' ? 'height' : 'padding'}
            style={styles.avoidingView}
          >
            <TouchableWithoutFeedback>
              <View style={[styles.sheetContainer, Shadows.lg]}>
                <View style={styles.handleBar} />

                <View style={styles.headerRow}>
                  <View style={styles.titleWithIcon}>
                    <Trophy size={18} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.title}>Create a Challenge</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <X size={18} color={Colors.mutedText} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                {/* Title Input */}
                <Text style={styles.label}>Challenge Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 14-Day Morning Hydration"
                  placeholderTextColor={Colors.lightText}
                  value={title}
                  onChangeText={setTitle}
                />

                {/* Category Selector */}
                <Text style={styles.label}>Category</Text>
                <View style={styles.pillsRow}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.pill,
                        category === cat && styles.pillActive,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          category === cat && styles.pillTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Duration Selector */}
                <Text style={styles.label}>Duration</Text>
                <View style={styles.pillsRow}>
                  {durations.map(dur => (
                    <TouchableOpacity
                      key={dur}
                      style={[
                        styles.pill,
                        duration === dur && styles.pillActive,
                      ]}
                      onPress={() => setDuration(dur)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          duration === dur && styles.pillTextActive,
                        ]}
                      >
                        {dur}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Description */}
                <Text style={styles.label}>Description & Goal</Text>
                <TextInput
                  style={[styles.input, { minHeight: 60 }]}
                  placeholder="What is the goal of this challenge?"
                  placeholderTextColor={Colors.lightText}
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />

                {/* Submit */}
                <TouchableOpacity
                  style={[
                    styles.createBtn,
                    !title.trim() && styles.createBtnDisabled,
                    Shadows.sm,
                  ]}
                  onPress={handleCreate}
                  disabled={!title.trim()}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color={Colors.white} strokeWidth={2.4} />
                  <Text style={styles.createBtnText}>Publish Challenge</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(41, 51, 46, 0.45)',
    justifyContent: 'flex-end',
  },
  avoidingView: {
    width: '100%',
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...Typography.h3,
    fontSize: 18,
    color: Colors.darkText,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 4,
    marginTop: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    ...Typography.body,
    fontSize: 14,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.cream,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  pillTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    gap: 6,
    marginTop: Spacing.sm,
  },
  createBtnDisabled: {
    backgroundColor: Colors.lightSage,
    opacity: 0.7,
  },
  createBtnText: {
    ...Typography.button,
    fontSize: 15,
  },
});
