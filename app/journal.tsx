import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpen, Check, Sparkles } from 'lucide-react-native';
import { Spacing, BorderRadius } from '../constants/spacing';
import { Shadows } from '../constants/shadows';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { addMoodEntry } from '../services/firestoreService';
import { MoodType } from '../types';

const MOODS: Array<{ name: MoodType; emoji: string; color: string }> = [
  { name: 'Calm', emoji: '😌', color: '#789B83' },
  { name: 'Happy', emoji: '😊', color: '#E8A87C' },
  { name: 'Tired', emoji: '🥱', color: '#9BA8A0' },
  { name: 'Stressed', emoji: '😣', color: '#82789B' },
  { name: 'Anxious', emoji: '😰', color: '#5F9B82' },
  { name: 'Sad', emoji: '😢', color: '#6D8E9E' },
];

export default function JournalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const { colors } = useTheme();
  const { user } = useAuth();
  const { setCurrentMood } = useTheme();

  const [selectedMood, setSelectedMood] = useState<MoodType>('Calm');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!note.trim()) {
      Alert.alert('Empty Note', 'Please write a few thoughts before saving.');
      return;
    }
    if (!user?.uid) {
      Alert.alert('Sign In Required', 'Please sign in to save your reflections.');
      return;
    }

    setIsSaving(true);
    try {
      const selectedObj = MOODS.find((m) => m.name === selectedMood) || MOODS[0];
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      await addMoodEntry({
        userId: user.uid,
        mood: selectedMood,
        emoji: selectedObj.emoji,
        score: selectedMood === 'Happy' ? 90 : selectedMood === 'Calm' ? 80 : 50,
        note: note.trim(),
        date: dateStr,
        time: timeStr,
      });

      setCurrentMood(selectedMood);

      Alert.alert('Reflection Saved', 'Your journal entry has been safely recorded.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Save Error', err?.message || 'Could not save reflection.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.headerRow, { paddingTop: topPadding + 4 }]}>
        <TouchableOpacity
          style={[
            styles.circleBtn,
            Shadows.sm,
            { backgroundColor: colors.white, borderColor: colors.border },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.darkText} strokeWidth={2.2} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.darkText }]}>Write Journal</Text>

        <TouchableOpacity
          style={[
            styles.savePillBtn,
            { backgroundColor: colors.primary },
            (!note.trim() || isSaving) && { opacity: 0.6 },
          ]}
          onPress={handleSave}
          disabled={!note.trim() || isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Check size={14} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.savePillText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mood Selector */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>
            How are you feeling right now?
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodsRow}
          >
            {MOODS.map((m) => {
              const isSelected = selectedMood === m.name;
              return (
                <TouchableOpacity
                  key={m.name}
                  style={[
                    styles.moodChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.white,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedMood(m.name)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text
                    style={[
                      styles.moodText,
                      { color: isSelected ? '#FFFFFF' : colors.darkText },
                    ]}
                  >
                    {m.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Reflection Note */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>
            Your Thoughts
          </Text>
          <TextInput
            style={[
              styles.textArea,
              Shadows.sm,
              {
                backgroundColor: colors.white,
                color: colors.darkText,
                borderColor: colors.border,
              },
            ]}
            placeholder="Write freely. What went well today? What's on your mind?..."
            placeholderTextColor={colors.lightText}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  savePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
  },
  savePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: 20,
  },
  sectionWrap: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  moodsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 220,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    fontSize: 15,
    lineHeight: 22,
    borderWidth: 1,
  },
});
