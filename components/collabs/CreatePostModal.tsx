import React, { useState } from 'react';
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
  Image,
  Switch,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ImagePlus,
  X,
  Globe,
  Lock,
  Heart,
  MessageCircle,
  Check,
  Sparkles,
  Plus,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { UserProfile } from '../../types/collabs';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    content: string,
    category: string,
    image?: string,
    isPrivate?: boolean,
    likesVisible?: boolean,
    commentsEnabled?: boolean
  ) => void;
  currentUser?: UserProfile;
}

// Preset aesthetic photos for student wellness reflections
const SAMPLE_PRESET_PHOTOS = [
  {
    id: 'pic1',
    title: 'Study Desk',
    uri: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'pic2',
    title: 'Morning Matcha',
    uri: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'pic3',
    title: 'Mindful Walk',
    uri: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'pic4',
    title: 'Botanical Notes',
    uri: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'pic5',
    title: 'Campus Sunset',
    uri: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'pic6',
    title: 'Focus Sprint',
    uri: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
  },
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onSubmit,
  currentUser,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const bottomInset = Math.max(insets.bottom, 16);

  // Form States
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<string[]>([
    'Wellness',
    'Study Win',
    'Habits',
    'Mindset',
  ]);
  const [category, setCategory] = useState<string>('Wellness');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryText, setNewCategoryText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [likesVisible, setLikesVisible] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  const handleSaveNewCategory = () => {
    const trimmed = newCategoryText.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!categories.includes(formatted)) {
      setCategories(prev => [...prev, formatted]);
    }
    setCategory(formatted);
    setNewCategoryText('');
    setIsAddingCategory(false);
  };

  const handlePickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(
          'Photo Permission',
          'Permission to access device photos is needed to upload an image from your gallery.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setShowPhotoPicker(false);
      }
    } catch (err) {
      console.warn('Error picking image from gallery:', err);
    }
  };

  const handleShare = () => {
    if (!content.trim() && !selectedImage) return;

    onSubmit(
      content.trim(),
      category,
      selectedImage || undefined,
      isPrivate,
      likesVisible,
      commentsEnabled
    );

    // Reset Form
    setContent('');
    setSelectedImage(null);
    setIsPrivate(false);
    setLikesVisible(true);
    setCommentsEnabled(true);
    setShowPhotoPicker(false);
    setIsAddingCategory(false);
    setNewCategoryText('');
    onClose();
  };

  const isShareEnabled = content.trim().length > 0 || selectedImage !== null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={[styles.screenContainer, { paddingTop: topInset }]}>
        {/* Full-Screen Top Header Bar (Instagram Style) */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={[styles.headerCircleBtn, Shadows.sm]}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityLabel="Cancel"
          >
            <ArrowLeft size={20} color="#141E19" strokeWidth={2.2} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>New Post</Text>

          <TouchableOpacity
            style={[
              styles.shareBtn,
              !isShareEnabled && styles.shareBtnDisabled,
              Shadows.sm,
            ]}
            onPress={handleShare}
            disabled={!isShareEnabled}
            activeOpacity={0.8}
            accessibilityLabel="Share post"
          >
            <Text style={[styles.shareBtnText, !isShareEnabled && styles.shareBtnTextDisabled]}>
              Share
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Form Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 30 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* User Info Row */}
            <View style={styles.userRow}>
              <View style={styles.userAvatar}>
                {currentUser?.avatar ? (
                  <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitials}>
                    {currentUser?.initials || 'MA'}
                  </Text>
                )}
              </View>
              <View style={styles.userInfoCol}>
                <Text style={styles.userName}>{currentUser?.name || 'Maya Anderson'}</Text>
                <Text style={styles.userHandle}>
                  {currentUser?.handle || '@maya_bloom'} · {isPrivate ? 'Private Circle' : 'Public Feed'}
                </Text>
              </View>
            </View>

            {/* Description / Caption Text Area */}
            <View style={styles.captionContainer}>
              <TextInput
                style={styles.captionInput}
                placeholder="Write a caption or reflection..."
                placeholderTextColor="#7B857F"
                multiline
                numberOfLines={4}
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
                maxLength={400}
                autoFocus
              />
              <Text style={styles.charCount}>{content.length}/400</Text>
            </View>

            {/* Category / Topic Pills */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionLabel}>TOPIC / CATEGORY</Text>
              <View style={styles.categoryRow}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catPill,
                      category === cat && styles.catPillActive,
                    ]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.catText,
                        category === cat && styles.catTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* + Custom Category Button */}
                <TouchableOpacity
                  style={[
                    styles.addCatPill,
                    isAddingCategory && styles.addCatPillActive,
                  ]}
                  onPress={() => {
                    setIsAddingCategory(prev => !prev);
                    setNewCategoryText('');
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="Create custom category"
                >
                  <Plus
                    size={14}
                    color={isAddingCategory ? Colors.white : '#365B45'}
                    strokeWidth={2.6}
                  />
                  <Text
                    style={[
                      styles.addCatText,
                      isAddingCategory && styles.addCatTextActive,
                    ]}
                  >
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Inline Custom Category Creator */}
              {isAddingCategory && (
                <View style={[styles.customCatBox, Shadows.sm]}>
                  <TextInput
                    style={styles.customCatInput}
                    placeholder="Enter custom topic..."
                    placeholderTextColor="#7B857F"
                    value={newCategoryText}
                    onChangeText={setNewCategoryText}
                    maxLength={20}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSaveNewCategory}
                  />
                  <TouchableOpacity
                    style={[
                      styles.customCatAddBtn,
                      !newCategoryText.trim() && styles.customCatAddBtnDisabled,
                    ]}
                    onPress={handleSaveNewCategory}
                    disabled={!newCategoryText.trim()}
                    activeOpacity={0.75}
                  >
                    <Check size={14} color={Colors.white} strokeWidth={2.8} />
                    <Text style={styles.customCatAddBtnText}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.customCatCancelBtn}
                    onPress={() => {
                      setIsAddingCategory(false);
                      setNewCategoryText('');
                    }}
                    activeOpacity={0.7}
                  >
                    <X size={15} color="#7B857F" strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Photo Section (Instagram Inspiration) */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionLabel}>PHOTO ATTACHMENT</Text>

              {selectedImage ? (
                /* Selected Photo Preview */
                <View style={[styles.photoPreviewCard, Shadows.sm]}>
                  <Image source={{ uri: selectedImage }} style={styles.photoPreviewImg} />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => setSelectedImage(null)}
                    activeOpacity={0.8}
                    accessibilityLabel="Remove photo"
                  >
                    <X size={16} color={Colors.white} strokeWidth={2.5} />
                  </TouchableOpacity>
                  
                  {/* Change Photo Actions: Gallery or Presets */}
                  <View style={styles.photoChangeBar}>
                    <TouchableOpacity
                      style={styles.changeActionPill}
                      onPress={handlePickFromGallery}
                      activeOpacity={0.8}
                    >
                      <ImagePlus size={13} color={Colors.white} strokeWidth={2} />
                      <Text style={styles.changeActionText}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.changeActionPill}
                      onPress={() => setShowPhotoPicker(prev => !prev)}
                      activeOpacity={0.8}
                    >
                      <Sparkles size={13} color={Colors.white} strokeWidth={2} />
                      <Text style={styles.changeActionText}>Presets</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Photo Options Container: Gallery Upload + Presets */
                <View style={[styles.photoOptionsCard, Shadows.sm]}>
                  {/* Primary Option: Device Gallery */}
                  <TouchableOpacity
                    style={styles.galleryTriggerRow}
                    onPress={handlePickFromGallery}
                    activeOpacity={0.75}
                  >
                    <View style={styles.addPhotoIconCircle}>
                      <ImagePlus size={22} color="#365B45" strokeWidth={2} />
                    </View>
                    <View style={styles.addPhotoTextCol}>
                      <Text style={styles.addPhotoTitle}>Add photo from Gallery</Text>
                      <Text style={styles.addPhotoSubtitle}>
                        Choose any picture from your device
                      </Text>
                    </View>
                    <View style={styles.galleryBadge}>
                      <Text style={styles.galleryBadgeText}>Open</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Aesthetic Presets Toggle */}
                  <TouchableOpacity
                    style={styles.presetToggleRow}
                    onPress={() => setShowPhotoPicker(prev => !prev)}
                    activeOpacity={0.7}
                  >
                    <Sparkles size={14} color="#365B45" strokeWidth={2} />
                    <Text style={styles.presetToggleText}>
                      {showPhotoPicker ? 'Hide aesthetic presets' : 'Or choose from aesthetic presets'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Photo Picker Tray (Toggled) */}
              {showPhotoPicker && (
                <View style={styles.photoPickerTray}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.presetScroll}
                  >
                    {SAMPLE_PRESET_PHOTOS.map(photo => {
                      const isSelected = selectedImage === photo.uri;
                      return (
                        <TouchableOpacity
                          key={photo.id}
                          style={[
                            styles.presetThumbCard,
                            isSelected && styles.presetThumbSelected,
                          ]}
                          onPress={() => {
                            setSelectedImage(photo.uri);
                            setShowPhotoPicker(false);
                          }}
                          activeOpacity={0.8}
                        >
                          <Image source={{ uri: photo.uri }} style={styles.presetThumbImg} />
                          <Text style={styles.presetThumbTitle} numberOfLines={1}>
                            {photo.title}
                          </Text>
                          {isSelected && (
                            <View style={styles.presetCheckBadge}>
                              <Check size={12} color={Colors.white} strokeWidth={3} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* INSTAGRAM-STYLE POST SETTINGS (Audience, Likes, Comments) */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionLabel}>POST SETTINGS</Text>

              <View style={[styles.settingsCard, Shadows.sm]}>
                {/* 1. Audience: Public vs Private Toggle */}
                <View style={styles.settingItemRow}>
                  <View style={styles.settingIconWrap}>
                    {isPrivate ? (
                      <Lock size={18} color="#8E583A" strokeWidth={2} />
                    ) : (
                      <Globe size={18} color="#365B45" strokeWidth={2} />
                    )}
                  </View>
                  <View style={styles.settingTextCol}>
                    <Text style={styles.settingTitle}>Audience</Text>
                    <Text style={styles.settingSubtitle}>
                      {isPrivate
                        ? 'Private · Visible only to friends in My Circle'
                        : 'Public · Visible to all students in Global Circle'}
                    </Text>
                  </View>

                  {/* Segmented Pill Selector: Public vs Private */}
                  <View style={styles.audienceSegment}>
                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        !isPrivate && styles.segmentBtnActive,
                      ]}
                      onPress={() => setIsPrivate(false)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          !isPrivate && styles.segmentTextActive,
                        ]}
                      >
                        Public
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        isPrivate && styles.segmentBtnActive,
                      ]}
                      onPress={() => setIsPrivate(true)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          isPrivate && styles.segmentTextActive,
                        ]}
                      >
                        Private
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.settingDivider} />

                {/* 2. Likes Visible Toggle */}
                <View style={styles.settingItemRow}>
                  <View style={styles.settingIconWrap}>
                    <Heart size={18} color="#D98B8B" strokeWidth={2} />
                  </View>
                  <View style={styles.settingTextCol}>
                    <Text style={styles.settingTitle}>Likes Visible</Text>
                    <Text style={styles.settingSubtitle}>
                      {likesVisible
                        ? 'Like counts are visible to other students'
                        : 'Hide like counts on this post'}
                    </Text>
                  </View>
                  <Switch
                    value={likesVisible}
                    onValueChange={setLikesVisible}
                    trackColor={{ false: '#DCE8DE', true: '#789B83' }}
                    thumbColor={Colors.white}
                  />
                </View>

                <View style={styles.settingDivider} />

                {/* 3. Allow Comments Toggle */}
                <View style={styles.settingItemRow}>
                  <View style={styles.settingIconWrap}>
                    <MessageCircle size={18} color="#365B45" strokeWidth={2} />
                  </View>
                  <View style={styles.settingTextCol}>
                    <Text style={styles.settingTitle}>Allow Comments</Text>
                    <Text style={styles.settingSubtitle}>
                      {commentsEnabled
                        ? 'Peers can comment and cheer you on'
                        : 'Turn off commenting for this post'}
                    </Text>
                  </View>
                  <Switch
                    value={commentsEnabled}
                    onValueChange={setCommentsEnabled}
                    trackColor={{ false: '#DCE8DE', true: '#789B83' }}
                    thumbColor={Colors.white}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#E8F1E8', // Light sage greenish background
  },
  // Instagram Style Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#141E19',
    letterSpacing: -0.3,
  },
  shareBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: BorderRadius.round,
    backgroundColor: '#365B45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnDisabled: {
    backgroundColor: '#C5D6CA',
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  shareBtnTextDisabled: {
    color: 'rgba(255,255,255,0.7)',
  },

  keyboardContainer: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: 16,
  },

  // User Info Row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C8DEC9',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '700',
    color: '#365B45',
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#141E19',
  },
  userHandle: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 1,
  },

  // Description / Caption Text Area
  captionContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  captionInput: {
    fontSize: 14,
    color: '#141E19',
    lineHeight: 22,
    minHeight: 100,
  },
  charCount: {
    fontSize: 11,
    color: Colors.mutedText,
    textAlign: 'right',
    marginTop: 6,
  },

  // Sections
  sectionWrap: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#55655B',
    letterSpacing: 0.6,
    paddingHorizontal: 4,
  },

  // Category Pills
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  catPillActive: {
    backgroundColor: '#365B45',
    borderColor: '#365B45',
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  catTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  addCatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
    backgroundColor: '#E8F1E8',
    borderWidth: 1.5,
    borderColor: '#365B45',
    borderStyle: 'dashed',
  },
  addCatPillActive: {
    backgroundColor: '#365B45',
    borderStyle: 'solid',
  },
  addCatText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#365B45',
  },
  addCatTextActive: {
    color: Colors.white,
  },
  customCatBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.2,
    borderColor: '#365B45',
    marginTop: 4,
  },
  customCatInput: {
    flex: 1,
    fontSize: 13,
    color: '#141E19',
    paddingVertical: 4,
  },
  customCatAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#365B45',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  customCatAddBtnDisabled: {
    backgroundColor: '#C5D6CA',
  },
  customCatAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  customCatCancelBtn: {
    padding: 4,
  },

  // Photo Section
  photoOptionsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#DCE8DE',
    gap: 6,
  },
  galleryTriggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.xs,
  },
  galleryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    backgroundColor: '#365B45',
  },
  galleryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  presetToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F5F1',
  },
  presetToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#365B45',
  },
  addPhotoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#DCE8DE',
    borderStyle: 'dashed',
  },
  addPhotoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoTextCol: {
    flex: 1,
  },
  addPhotoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#141E19',
  },
  addPhotoSubtitle: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 2,
  },

  photoPreviewCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#DCE8DE',
    position: 'relative',
  },
  photoPreviewImg: {
    width: '100%',
    height: 200,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(20, 30, 25, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoChangeBar: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 6,
  },
  changeActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(20, 30, 25, 0.75)',
  },
  changeActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  changePhotoBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(20, 30, 25, 0.75)',
  },
  changePhotoText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },

  photoPickerTray: {
    marginTop: 6,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  presetScroll: {
    gap: 10,
  },
  presetThumbCard: {
    width: 80,
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  presetThumbSelected: {
    borderWidth: 2,
    borderColor: '#365B45',
  },
  presetThumbImg: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  presetThumbTitle: {
    fontSize: 10,
    color: '#141E19',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  presetCheckBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#365B45',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Instagram Style Settings Card
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  settingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextCol: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#141E19',
  },
  settingSubtitle: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 2,
    lineHeight: 15,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#F0F5F1',
    marginVertical: 12,
  },

  // Audience Segmented Control
  audienceSegment: {
    flexDirection: 'row',
    backgroundColor: '#E8F1E8',
    borderRadius: BorderRadius.round,
    padding: 2,
  },
  segmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
  },
  segmentBtnActive: {
    backgroundColor: '#365B45',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#365B45',
  },
  segmentTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
});

export default CreatePostModal;
