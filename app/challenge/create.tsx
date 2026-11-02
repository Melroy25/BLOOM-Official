import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Camera,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Check,
  Globe,
  Lock,
  Compass,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { ChallengeCategory } from '../../types/collabs';
import {
  createCommunityChallenge,
  getTodayDateString,
} from '../../services/challengeService';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES: ChallengeCategory[] = [
  'Fitness',
  'Mindfulness',
  'Productivity',
  'Study',
  'Digital Detox',
  'Sleep',
  'Lifestyle',
  'Personal Growth',
];

const PRESET_DURATIONS = [7, 14, 21, 30, 70, 75, 90];

// Curated landscape cover image presets (~16:5 ratio) for quick selection
const CURATED_COVERS = [
  {
    name: 'Winter / Frost',
    url: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=800&auto=format&fit=crop&q=75',
  },
  {
    name: 'Athletic / Flow',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=75',
  },
  {
    name: 'Study / Desk',
    url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=75',
  },
  {
    name: 'Serene Sunset',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=75',
  },
  {
    name: 'Peace / Nature',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=75',
  },
  {
    name: 'Botanical Growth',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=75',
  },
];

export default function CreateChallengeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const { user, userProfile } = useAuth();

  // Form Fields State
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ChallengeCategory>('Fitness');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [customDays, setCustomDays] = useState('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [coverImageUrl, setCoverImageUrl] = useState(CURATED_COVERS[0].url);

  // Daily Activities (at least 1 required)
  const [activities, setActivities] = useState<string[]>([
    'Exercise or stretch for 30 minutes',
    'Read 10 pages of a book',
    'Drink 2.5 liters of water',
  ]);
  const [newActivityInput, setNewActivityInput] = useState('');

  // Rules (optional bullets)
  const [rules, setRules] = useState<string[]>([
    'Log your completed tasks each evening.',
    'Do not skip two days in a row.',
  ]);
  const [newRuleInput, setNewRuleInput] = useState('');

  // Visibility
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate End Date
  const endDateStr = useMemo(() => {
    const days = isCustomDuration ? parseInt(customDays, 10) || 30 : durationDays;
    const start = new Date(startDate || getTodayDateString());
    const end = new Date(start.getTime() + days * 86400000);
    return end.toISOString().split('T')[0];
  }, [startDate, durationDays, customDays, isCustomDuration]);

  // Pick Cover Image using existing Expo Image Picker
  const handlePickDeviceImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 5],
        quality: 0.75,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCoverImageUrl(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Notice', 'Could not access photo library. You can select one of the curated presets below.');
    }
  };

  // Add Activity
  const handleAddActivity = () => {
    if (!newActivityInput.trim()) return;
    setActivities((prev) => [...prev, newActivityInput.trim()]);
    setNewActivityInput('');
  };

  // Remove Activity
  const handleRemoveActivity = (idx: number) => {
    setActivities((prev) => prev.filter((_, i) => i !== idx));
  };

  // Add Rule
  const handleAddRule = () => {
    if (!newRuleInput.trim()) return;
    setRules((prev) => [...prev, newRuleInput.trim()]);
    setNewRuleInput('');
  };

  // Remove Rule
  const handleRemoveRule = (idx: number) => {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Challenge
  const handlePublish = async () => {
    const effectiveUid = user?.uid || 'creator_' + Date.now().toString(36);
    const creatorName = userProfile?.fullName || user?.displayName || 'Bloom Member';
    const creatorAvatar = userProfile?.photoURL || user?.photoURL || '';

    const trimmedTitle = title.trim();
    const trimmedShortDesc = shortDescription.trim();
    const trimmedDesc = description.trim();
    const effectiveDays = isCustomDuration ? parseInt(customDays, 10) || 0 : durationDays;

    // Strict Validations
    if (!trimmedTitle) {
      Alert.alert('Validation Error', 'Please enter a challenge name.');
      return;
    }
    if (!trimmedDesc) {
      Alert.alert('Validation Error', 'Please enter a full description.');
      return;
    }
    if (effectiveDays < 1) {
      Alert.alert('Validation Error', 'Challenge duration must be at least 1 day.');
      return;
    }
    if (activities.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one daily activity.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newChallengeId = await createCommunityChallenge(
        {
          title: trimmedTitle,
          shortDescription: trimmedShortDesc || trimmedDesc.slice(0, 100),
          description: trimmedDesc,
          category,
          durationDays: effectiveDays,
          startDate,
          coverImageUrl,
          dailyActivities: activities.map((a) => ({ title: a.trim(), description: '' })),
          rules,
          visibility,
        },
        {
          uid: effectiveUid,
          name: creatorName,
          avatar: creatorAvatar,
        }
      );

      // Navigate to the reusable challenge details page!
      router.replace({
        pathname: '/challenge/[challengeId]',
        params: { challengeId: newChallengeId },
      } as any);
    } catch (err: any) {
      Alert.alert('Publish Failed', err?.message || 'Could not save challenge to Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.headerRow, { paddingTop: topInset + 4 }]}>
        <TouchableOpacity
          style={[styles.backCircleBtn, Shadows.sm]}
          onPress={() => router.back()}
          accessibilityLabel="Back"
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#141E19" strokeWidth={2.2} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Create Challenge</Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. COVER IMAGE SELECTION */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Cover Image (Compact Landscape)</Text>
          <View style={[styles.coverPreviewBox, Shadows.sm]}>
            <Image
              source={{ uri: coverImageUrl }}
              style={styles.coverPreviewImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.uploadOverlayBtn}
              onPress={handlePickDeviceImage}
              activeOpacity={0.8}
            >
              <Camera size={14} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.uploadOverlayText}>Choose from Photos</Text>
            </TouchableOpacity>
          </View>

          {/* Curated Preset Row */}
          <Text style={styles.subFieldHint}>Or choose a curated wellness landscape:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsRow}
          >
            {CURATED_COVERS.map((preset, idx) => {
              const isSelected = coverImageUrl === preset.url;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.presetThumb,
                    isSelected && styles.presetThumbSelected,
                  ]}
                  onPress={() => setCoverImageUrl(preset.url)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: preset.url }}
                    style={styles.presetImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.presetName} numberOfLines={1}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. CHALLENGE NAME */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>
            Challenge Name <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, Shadows.sm]}
            placeholder="e.g. Winter Arc – 90 Days"
            placeholderTextColor="#A5AEA8"
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />
        </View>

        {/* 3. CATEGORY */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. DURATION */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Duration (Days)</Text>
          <View style={styles.durationPillsWrap}>
            {PRESET_DURATIONS.map((days) => {
              const isSelected = !isCustomDuration && durationDays === days;
              return (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.durationPill,
                    isSelected && styles.durationPillActive,
                  ]}
                  onPress={() => {
                    setIsCustomDuration(false);
                    setDurationDays(days);
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.durationPillText,
                      isSelected && styles.durationPillTextActive,
                    ]}
                  >
                    {days} Days
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[
                styles.durationPill,
                isCustomDuration && styles.durationPillActive,
              ]}
              onPress={() => setIsCustomDuration(true)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.durationPillText,
                  isCustomDuration && styles.durationPillTextActive,
                ]}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </View>

          {isCustomDuration && (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Enter number of days (e.g. 45)"
              placeholderTextColor="#A5AEA8"
              keyboardType="number-pad"
              value={customDays}
              onChangeText={setCustomDays}
            />
          )}

          {/* Date Calculation Preview */}
          <View style={styles.dateCalcRow}>
            <Calendar size={14} color="#789B83" strokeWidth={2} />
            <Text style={styles.dateCalcText}>
              Starts: <Text style={styles.boldDate}>{startDate}</Text> · Ends:{' '}
              <Text style={styles.boldDate}>{endDateStr}</Text>
            </Text>
          </View>
        </View>

        {/* 5. SHORT DESCRIPTION */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Short Description</Text>
          <Text style={styles.subFieldHint}>
            Shown on discovery cards in Global Trends (1–2 sentences).
          </Text>
          <TextInput
            style={[styles.input, styles.shortDescInput]}
            placeholder="e.g. Build physical discipline, daily reading, and mental focus."
            placeholderTextColor="#A5AEA8"
            value={shortDescription}
            onChangeText={setShortDescription}
            maxLength={120}
          />
        </View>

        {/* 6. FULL DESCRIPTION */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>
            Full Description <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Explain the purpose of this challenge, the daily expectations, and who should join..."
            placeholderTextColor="#A5AEA8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* 7. DAILY ACTIVITIES */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>
            Daily Activities <Text style={styles.requiredStar}>*</Text>
          </Text>
          <Text style={styles.subFieldHint}>
            Checklist activities participants will complete each day.
          </Text>

          <View style={styles.activityList}>
            {activities.map((act, idx) => (
              <View key={idx} style={styles.activityItemRow}>
                <View style={styles.activityBullet} />
                <Text style={styles.activityItemText}>{act}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveActivity(idx)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Trash2 size={14} color="#D98B8B" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.addInputRow}>
            <TextInput
              style={styles.addInput}
              placeholder="Add another daily task..."
              placeholderTextColor="#A5AEA8"
              value={newActivityInput}
              onChangeText={setNewActivityInput}
            />
            <TouchableOpacity
              style={styles.addActivityBtn}
              onPress={handleAddActivity}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 8. RULES & GUIDELINES */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Challenge Rules & Guidelines</Text>

          <View style={styles.activityList}>
            {rules.map((rule, idx) => (
              <View key={idx} style={styles.activityItemRow}>
                <View style={styles.ruleBullet} />
                <Text style={styles.activityItemText}>{rule}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveRule(idx)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Trash2 size={14} color="#D98B8B" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.addInputRow}>
            <TextInput
              style={styles.addInput}
              placeholder="Add an instruction or rule..."
              placeholderTextColor="#A5AEA8"
              value={newRuleInput}
              onChangeText={setNewRuleInput}
            />
            <TouchableOpacity
              style={styles.addActivityBtn}
              onPress={handleAddRule}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 9. VISIBILITY */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Visibility</Text>
          <View style={styles.visibilityRow}>
            <TouchableOpacity
              style={[
                styles.visibilityCard,
                visibility === 'public' && styles.visibilityCardActive,
              ]}
              onPress={() => setVisibility('public')}
              activeOpacity={0.8}
            >
              <Globe
                size={18}
                color={visibility === 'public' ? '#365B45' : '#7B857F'}
                strokeWidth={2}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.visibilityTitle}>Public Discovery</Text>
                <Text style={styles.visibilitySubtitle}>
                  Appears in Global Trends for all students
                </Text>
              </View>
              {visibility === 'public' && (
                <Check size={16} color="#365B45" strokeWidth={2.4} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.visibilityCard,
                visibility === 'private' && styles.visibilityCardActive,
              ]}
              onPress={() => setVisibility('private')}
              activeOpacity={0.8}
            >
              <Lock
                size={18}
                color={visibility === 'private' ? '#365B45' : '#7B857F'}
                strokeWidth={2}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.visibilityTitle}>Private Circle</Text>
                <Text style={styles.visibilitySubtitle}>
                  Only accessible via direct challenge link
                </Text>
              </View>
              {visibility === 'private' && (
                <Check size={16} color="#365B45" strokeWidth={2.4} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 10. PUBLISH BUTTON */}
        <TouchableOpacity
          style={[styles.publishBtn, Shadows.md]}
          onPress={handlePublish}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Sparkles size={18} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.publishBtnText}>Publish Challenge</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 10,
    backgroundColor: '#FAF8F2',
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#141E19',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 18,
  },
  formSection: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#141E19',
  },
  requiredStar: {
    color: '#D98B8B',
  },
  subFieldHint: {
    fontSize: 11,
    color: Colors.mutedText,
    marginBottom: 4,
  },
  coverPreviewBox: {
    width: '100%',
    height: 90,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E8F1E8',
  },
  coverPreviewImage: {
    width: '100%',
    height: '100%',
  },
  uploadOverlayBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(54, 91, 69, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
  },
  uploadOverlayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  presetsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  presetThumb: {
    width: 100,
    height: 52,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#E8F1E8',
  },
  presetThumbSelected: {
    borderColor: '#365B45',
  },
  presetImage: {
    width: '100%',
    height: 36,
  },
  presetName: {
    fontSize: 9,
    fontWeight: '700',
    color: '#365B45',
    textAlign: 'center',
    paddingTop: 1,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#141E19',
  },
  shortDescInput: {
    paddingVertical: 8,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  chipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  categoryChipActive: {
    backgroundColor: '#365B45',
    borderColor: '#365B45',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#29332E',
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  durationPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  durationPillActive: {
    backgroundColor: '#365B45',
    borderColor: '#365B45',
  },
  durationPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#29332E',
  },
  durationPillTextActive: {
    color: Colors.white,
  },
  dateCalcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  dateCalcText: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  boldDate: {
    fontWeight: '700',
    color: '#365B45',
  },
  activityList: {
    gap: 6,
    marginBottom: 6,
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    gap: 8,
  },
  activityBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#365B45',
  },
  ruleBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E88B5D',
  },
  activityItemText: {
    flex: 1,
    fontSize: 12,
    color: '#141E19',
  },
  addInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#141E19',
  },
  addActivityBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#365B45',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visibilityRow: {
    gap: 8,
  },
  visibilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    gap: 12,
  },
  visibilityCardActive: {
    borderColor: '#365B45',
    backgroundColor: '#E8F1E8',
  },
  visibilityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#141E19',
  },
  visibilitySubtitle: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#365B45',
    paddingVertical: 14,
    borderRadius: BorderRadius.round,
    marginTop: 10,
  },
  publishBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
