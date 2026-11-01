import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { router } from 'expo-router';
import { X, Sparkles, Check, LucideIcon } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

export interface FeatureDetail {
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  color: string;
  backgroundColor: string;
  description: string;
  tags: string[];
  actionLabel: string;
}

interface FeatureDetailModalProps {
  visible: boolean;
  feature: FeatureDetail | null;
  onClose: () => void;
}

export const FeatureDetailModal: React.FC<FeatureDetailModalProps> = ({
  visible,
  feature,
  onClose,
}) => {
  const [started, setStarted] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setStarted(false);
    }
  }, [visible]);

  if (!feature) return null;

  const { title, subtitle, Icon, color, backgroundColor, description, tags, actionLabel } = feature;

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
              <View style={styles.handleBar} />

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={20} color={Colors.mutedText} strokeWidth={2} />
              </TouchableOpacity>

              {/* Icon Container */}
              <View style={[styles.iconContainer, { backgroundColor }]}>
                <Icon size={38} color={color} strokeWidth={2} />
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>

              {/* Description */}
              <Text style={styles.description}>{description}</Text>

              {/* Suggested Activities/Modes */}
              <View style={styles.tagsContainer}>
                {tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagPill}>
                    <Sparkles size={11} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  started && styles.actionButtonActive,
                  Shadows.sm,
                ]}
                onPress={() => {
                  if (title === 'Heal Bubble') {
                    onClose();
                    router.push('/heal-bubble');
                  } else if (title === 'Music') {
                    onClose();
                    router.push('/music');
                  } else {
                    setStarted(prev => !prev);
                  }
                }}
                activeOpacity={0.8}
              >
                {started ? (
                  <>
                    <Check size={18} color={Colors.white} strokeWidth={2.5} />
                    <Text style={styles.actionButtonText}>Session Started</Text>
                  </>
                ) : (
                  <Text style={styles.actionButtonText}>{actionLabel}</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.comingSoonNotice}>
                ✦ Interactive prototype · Full audio & interactive sessions in Bloom v1.1
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
    alignItems: 'center',
    position: 'relative',
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    fontSize: 22,
    color: Colors.darkText,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.primaryDark,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightSage,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    gap: 5,
  },
  tagText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    width: '100%',
    gap: 8,
  },
  actionButtonActive: {
    backgroundColor: Colors.success,
  },
  actionButtonText: {
    ...Typography.button,
    fontWeight: '700',
    fontSize: 15,
  },
  comingSoonNotice: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.lightText,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
