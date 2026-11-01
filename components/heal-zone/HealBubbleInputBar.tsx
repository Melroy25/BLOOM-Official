import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
import { Plus, X, Sparkles } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

interface HealBubbleInputBarProps {
  onSubmit: (problemText: string) => void;
  disabled?: boolean;
}

export const HealBubbleInputBar: React.FC<HealBubbleInputBarProps> = ({
  onSubmit,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setInputText('');
    Keyboard.dismiss();
  };

  const handleClear = () => {
    setInputText('');
  };

  return (
    <View style={[styles.container, Shadows.md]}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Enter your problem or worry..."
          placeholderTextColor={Colors.lightText}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          returnKeyType="done"
          maxLength={140}
          editable={!disabled}
        />

        {inputText.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={15} color={Colors.mutedText} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* CREATE / ASK TO CREATE BUTTON */}
      <TouchableOpacity
        style={[
          styles.createButton,
          (!inputText.trim() || disabled) && styles.createButtonDisabled,
          Shadows.sm,
        ]}
        onPress={handleSend}
        disabled={!inputText.trim() || disabled}
        activeOpacity={0.8}
      >
        <Plus size={18} color={Colors.white} strokeWidth={2.5} />
        <Text style={styles.createButtonText}>Create</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.lg,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontSize: 14,
    color: Colors.darkText,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.lg,
    height: 48,
    gap: 6,
  },
  createButtonDisabled: {
    backgroundColor: '#C5D6CA',
    opacity: 0.7,
  },
  createButtonText: {
    ...Typography.button,
    fontWeight: '700',
    fontSize: 14,
  },
});
