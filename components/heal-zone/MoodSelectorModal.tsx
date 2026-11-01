import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { X, Sparkles } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { moodOptions } from '../../data/mockData';
import { MoodOption } from '../../types';

interface MoodSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMood: (option: MoodOption) => void;
}

export const MoodSelectorModal: React.FC<MoodSelectorModalProps> = ({
  visible,
  onClose,
  onSelectMood,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheetContainer, Shadows.lg]}>
              {/* Handle Bar */}
              <View style={styles.handleBar} />

              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.headerTextContainer}>
                  <View style={styles.sparkleRow}>
                    <Sparkles size={16} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.subtitle}>DAILY CHECK-IN</Text>
                  </View>
                  <Text style={styles.title}>How are you feeling?</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <X size={20} color={Colors.mutedText} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Mood Grid (4 columns x 2 rows) */}
              <View style={styles.grid}>
                {moodOptions.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.moodItem, { backgroundColor: option.bgColor }]}
                    onPress={() => onSelectMood(option)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.moodEmoji}>{option.emoji}</Text>
                    <Text style={styles.moodName}>{option.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.footerNote}>
                🌱 Logging your mood regularly helps you reflect on your emotional growth.
              </Text>
            </View>
          </TouchableWithoutFeedback>
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
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  headerTextContainer: {
    flex: 1,
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.label,
    color: Colors.primaryDark,
    fontSize: 11,
  },
  title: {
    ...Typography.h2,
    fontSize: 22,
    color: Colors.darkText,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  moodItem: {
    width: '23%',
    aspectRatio: 0.9,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  moodEmoji: {
    fontSize: 30,
    marginBottom: 4,
  },
  moodName: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.darkText,
  },
  footerNote: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: 'center',
    marginTop: Spacing.xl,
    lineHeight: 18,
  },
});
