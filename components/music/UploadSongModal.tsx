import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import {
  X,
  Music,
  Play,
  Pause,
  Upload,
  Sparkles,
  Check,
  Volume2,
  Clock,
  HardDrive,
  User,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import {
  UserSong,
  UserMusicStorage,
  formatFileSize,
  formatDuration,
  cleanFileNameToTitle,
  detectAudioDuration,
  pickCoverImageFromDevice,
} from '../../services/userMusicStorage';

interface UploadSongModalProps {
  visible: boolean;
  onClose: () => void;
  filesQueue?: File[];
  editingSong?: UserSong | null;
  onSongSaved?: (savedSong: UserSong) => void;
}

const EMOJI_COVERS = ['🎵', '🌸', '🌿', '🌙', '☀️', '🦋', '✨', '🌊'];

export const UploadSongModal: React.FC<UploadSongModalProps> = ({
  visible,
  onClose,
  filesQueue = [],
  editingSong = null,
  onSongSaved,
}) => {
  const isEditing = Boolean(editingSong);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [artist, setArtist] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);
  const [durationMillis, setDurationMillis] = useState<number>(180000);
  const [durationFormatted, setDurationFormatted] = useState<string>('3:00');
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string>('');
  const [currentBlobUrl, setCurrentBlobUrl] = useState<string | null>(null);

  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [isDetectingDuration, setIsDetectingDuration] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  // Stop & unload audio preview cleanly
  const stopAudioPreview = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null;
    }
    setIsPreviewPlaying(false);
  }, []);

  // Revoke temp blob url when no longer needed
  const cleanupTempBlobUrl = useCallback(() => {
    if (currentBlobUrlRef.current && !isEditing) {
      try {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      } catch (e) {}
      currentBlobUrlRef.current = null;
    }
  }, [isEditing]);

  // Reset and populate form based on mode (new file or edit)
  useEffect(() => {
    if (!visible) {
      stopAudioPreview();
      cleanupTempBlobUrl();
      setErrorMsg(null);
      setCurrentFileIndex(0);
      return;
    }

    if (isEditing && editingSong) {
      setTitle(editingSong.title);
      setArtist(editingSong.artist === 'Unknown Artist' ? '' : editingSong.artist);
      setCoverUrl(editingSong.coverUrl);
      setDurationMillis(editingSong.durationMillis);
      setDurationFormatted(editingSong.durationFormatted);
      setCurrentFileName(editingSong.fileName);
      setFileSizeFormatted(editingSong.fileSizeFormatted);

      // Resolve audio URI for preview in edit mode
      UserMusicStorage.getAudioUriForSong(editingSong.id).then((uri) => {
        if (uri) {
          setCurrentBlobUrl(uri);
          currentBlobUrlRef.current = uri;
        }
      });
    } else if (filesQueue.length > 0) {
      loadQueueItem(currentFileIndex);
    }
  }, [visible, isEditing, editingSong, filesQueue.length, currentFileIndex]);

  // Load a specific file from queue
  const loadQueueItem = async (index: number) => {
    const file = filesQueue[index];
    if (!file) return;

    await stopAudioPreview();
    cleanupTempBlobUrl();

    const rawName = file.name;
    const cleanTitle = cleanFileNameToTitle(rawName);
    setTitle(cleanTitle);
    setArtist('');
    setCoverUrl(undefined);
    setCurrentFileName(rawName);
    setFileSizeFormatted(formatFileSize(file.size));
    setErrorMsg(null);

    // Create object URL for preview and duration detection
    if (typeof URL !== 'undefined') {
      const url = URL.createObjectURL(file);
      setCurrentBlobUrl(url);
      currentBlobUrlRef.current = url;
    }

    // Detect duration asynchronously
    setIsDetectingDuration(true);
    try {
      const ms = await detectAudioDuration(file);
      setDurationMillis(ms);
      setDurationFormatted(formatDuration(ms));
    } catch (e) {
      setDurationMillis(180000);
      setDurationFormatted('3:00');
    } finally {
      setIsDetectingDuration(false);
    }
  };

  // Play / Pause preview toggle
  const handleTogglePreview = async () => {
    if (!currentBlobUrl) return;

    try {
      if (soundRef.current) {
        if (isPreviewPlaying) {
          await soundRef.current.pauseAsync();
          setIsPreviewPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPreviewPlaying(true);
        }
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: currentBlobUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setIsPreviewPlaying(status.isPlaying);
              if (status.didJustFinish) {
                setIsPreviewPlaying(false);
              }
            }
          }
        );
        soundRef.current = sound;
        setIsPreviewPlaying(true);
      }
    } catch (err) {
      setErrorMsg('Could not preview audio file.');
      setIsPreviewPlaying(false);
    }
  };

  // Pick cover image from device
  const handlePickCover = async () => {
    try {
      const imageUri = await pickCoverImageFromDevice();
      if (imageUri) {
        setCoverUrl(imageUri);
      }
    } catch (e) {
      Alert.alert('Cover Picker', 'Could not select an image. Please try again.');
    }
  };

  // Remove current cover image
  const handleRemoveCover = () => {
    setCoverUrl(undefined);
  };

  // Save current song to library
  const handleSaveCurrentSong = async (andNext: boolean = false) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMsg('Please enter a song title.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    await stopAudioPreview();

    try {
      if (isEditing && editingSong) {
        // Edit existing song
        const updated = UserMusicStorage.updateSong(editingSong.id, {
          title: trimmedTitle,
          artist: artist.trim() || 'Unknown Artist',
          coverUrl: coverUrl,
        });

        if (updated && onSongSaved) {
          onSongSaved(updated);
        }
        setIsSaving(false);
        onClose();
      } else {
        // Save new uploaded song
        const currentFile = filesQueue[currentFileIndex];
        if (!currentFile) {
          setIsSaving(false);
          return;
        }

        const saved = await UserMusicStorage.saveSong(currentFile, {
          title: trimmedTitle,
          artist: artist.trim() || 'Unknown Artist',
          coverUrl: coverUrl,
          durationMillis: durationMillis,
          fileName: currentFileName || currentFile.name,
          fileSize: currentFile.size,
        });

        if (onSongSaved) {
          onSongSaved(saved);
        }

        // Check if more files in queue
        if (andNext && currentFileIndex < filesQueue.length - 1) {
          setCurrentFileIndex((prev) => prev + 1);
          setIsSaving(false);
        } else {
          setIsSaving(false);
          onClose();
        }
      }
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg('Could not save song to library. Please try again.');
    }
  };

  // Batch-save all remaining files with auto-formatted titles
  const handleSaveAllRemaining = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    await stopAudioPreview();

    try {
      for (let i = currentFileIndex; i < filesQueue.length; i++) {
        const file = filesQueue[i];
        const isCurrent = i === currentFileIndex;
        const songTitle = isCurrent ? title.trim() || cleanFileNameToTitle(file.name) : cleanFileNameToTitle(file.name);
        const songArtist = isCurrent ? artist.trim() || 'Unknown Artist' : 'Unknown Artist';
        const songCover = isCurrent ? coverUrl : undefined;
        const dur = await detectAudioDuration(file);

        const saved = await UserMusicStorage.saveSong(file, {
          title: songTitle,
          artist: songArtist,
          coverUrl: songCover,
          durationMillis: dur,
          fileName: file.name,
          fileSize: file.size,
        });

        if (onSongSaved) {
          onSongSaved(saved);
        }
      }
      setIsSaving(false);
      onClose();
    } catch (e) {
      setIsSaving(false);
      setErrorMsg('Error saving some songs. Please try again.');
    }
  };

  const hasMultipleInQueue = filesQueue.length > 1;
  const isLastInQueue = currentFileIndex >= filesQueue.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, Shadows.lg]}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconBadge}>
                <Music size={18} color="#D96B43" strokeWidth={2.4} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.modalHeading}>
                  {isEditing ? 'Edit Song Details ✏️' : 'Add to My Music Library 🎵'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {hasMultipleInQueue && !isEditing
                    ? `Song ${currentFileIndex + 1} of ${filesQueue.length} • Personalize your track`
                    : 'Personalize your song details before saving.'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={Colors.mutedText} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* FILE METADATA PILL */}
            <View style={styles.fileMetadataCard}>
              <View style={styles.fileMetadataRow}>
                <HardDrive size={15} color="#D96B43" strokeWidth={2.2} />
                <Text style={styles.fileNameText} numberOfLines={1}>
                  {currentFileName || 'Audio file'}
                </Text>
              </View>

              <View style={styles.filePillsRow}>
                <View style={styles.infoBadge}>
                  <Clock size={12} color={Colors.mutedText} strokeWidth={2.2} />
                  <Text style={styles.infoBadgeText}>
                    {isDetectingDuration ? 'Detecting...' : durationFormatted}
                  </Text>
                </View>

                {fileSizeFormatted ? (
                  <View style={styles.infoBadge}>
                    <Text style={styles.infoBadgeText}>{fileSizeFormatted}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* ERROR BANNER */}
            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* 1. SONG TITLE INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                SONG TITLE <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.inputField}
                placeholder="Enter song name..."
                placeholderTextColor={Colors.lightText}
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  if (errorMsg) setErrorMsg(null);
                }}
                maxLength={60}
                autoCorrect={false}
              />
            </View>

            {/* 2. ARTIST NAME INPUT */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithOptional}>
                <Text style={styles.inputLabel}>ARTIST NAME</Text>
                <Text style={styles.optionalTag}>Optional</Text>
              </View>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Yourself, Favorite Artist, Unknown"
                placeholderTextColor={Colors.lightText}
                value={artist}
                onChangeText={setArtist}
                maxLength={50}
                autoCorrect={false}
              />
            </View>

            {/* 3. ALBUM COVER SECTION */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithOptional}>
                <Text style={styles.inputLabel}>ALBUM COVER</Text>
                <Text style={styles.optionalTag}>Optional</Text>
              </View>

              {coverUrl ? (
                <View style={styles.coverPreviewContainer}>
                  <Image source={{ uri: coverUrl }} style={styles.coverImagePreview} />
                  <View style={styles.coverActionButtons}>
                    <TouchableOpacity
                      style={styles.changeCoverBtn}
                      onPress={handlePickCover}
                      activeOpacity={0.75}
                    >
                      <ImageIcon size={14} color="#D96B43" strokeWidth={2.2} />
                      <Text style={styles.changeCoverText}>Change Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.removeCoverBtn}
                      onPress={handleRemoveCover}
                      activeOpacity={0.75}
                    >
                      <Trash2 size={14} color="#C45B73" strokeWidth={2.2} />
                      <Text style={styles.removeCoverText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.coverPickerOptionsBox}>
                  <TouchableOpacity
                    style={styles.choosePhotoBtn}
                    onPress={handlePickCover}
                    activeOpacity={0.8}
                  >
                    <Upload size={16} color="#D96B43" strokeWidth={2.2} />
                    <Text style={styles.choosePhotoBtnText}>+ Choose Cover Image</Text>
                  </TouchableOpacity>

                  {/* Or select a cheerful mood emoji as icon cover */}
                  <Text style={styles.orEmojiText}>or select a cover icon</Text>
                  <View style={styles.emojiCoverRow}>
                    {EMOJI_COVERS.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        style={styles.emojiCoverPill}
                        onPress={() => setArtist((prev) => (prev ? prev : emoji))}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.emojiCoverText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* 4. AUDIO PREVIEW PLAYER */}
            <View style={styles.previewContainer}>
              <View style={styles.previewHeaderRow}>
                <View style={styles.previewTitleRow}>
                  <Volume2 size={16} color="#D96B43" strokeWidth={2.2} />
                  <Text style={styles.previewHeading}>AUDIO PREVIEW</Text>
                </View>
                <Text style={styles.previewStatusText}>
                  {isPreviewPlaying ? 'Playing audio preview...' : 'Listen before saving'}
                </Text>
              </View>

              <View style={styles.previewPlayerBar}>
                <TouchableOpacity
                  style={[
                    styles.previewPlayBtn,
                    Shadows.sm,
                    isPreviewPlaying && styles.previewPlayBtnActive,
                  ]}
                  onPress={handleTogglePreview}
                  activeOpacity={0.8}
                  disabled={!currentBlobUrl}
                >
                  {isPreviewPlaying ? (
                    <Pause size={16} color={Colors.white} strokeWidth={2.4} />
                  ) : (
                    <Play size={16} color={Colors.white} strokeWidth={2.4} style={{ marginLeft: 2 }} />
                  )}
                </TouchableOpacity>

                <View style={styles.previewTrackInfo}>
                  <Text style={styles.previewTrackTitle} numberOfLines={1}>
                    {title || 'Audio preview'}
                  </Text>
                  <Text style={styles.previewTrackDuration}>
                    {durationFormatted}
                  </Text>
                </View>

                {/* Animated sound indicator bars */}
                <View style={styles.waveBarsRow}>
                  <View
                    style={[
                      styles.waveBar,
                      { height: isPreviewPlaying ? 16 : 6, backgroundColor: '#D96B43' },
                    ]}
                  />
                  <View
                    style={[
                      styles.waveBar,
                      { height: isPreviewPlaying ? 22 : 8, backgroundColor: '#FAD7C0' },
                    ]}
                  />
                  <View
                    style={[
                      styles.waveBar,
                      { height: isPreviewPlaying ? 14 : 5, backgroundColor: '#D96B43' },
                    ]}
                  />
                  <View
                    style={[
                      styles.waveBar,
                      { height: isPreviewPlaying ? 18 : 7, backgroundColor: '#FAD7C0' },
                    ]}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* FOOTER ACTIONS */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <View style={styles.footerSubmitRow}>
              {hasMultipleInQueue && !isEditing && (
                <TouchableOpacity
                  style={styles.saveAllBtn}
                  onPress={handleSaveAllRemaining}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveAllBtnText}>
                    Save All ({filesQueue.length - currentFileIndex})
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled, Shadows.sm]}
                onPress={() => handleSaveCurrentSong(!isLastInQueue)}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Check size={16} color={Colors.white} strokeWidth={2.6} />
                    <Text style={styles.saveBtnText}>
                      {isEditing
                        ? 'Save Changes'
                        : hasMultipleInQueue && !isLastInQueue
                        ? 'Save & Next ➔'
                        : 'Save to My Library'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 24, 20, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#FAD7C0',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F6EAE1',
    backgroundColor: '#FCFBF7',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    backgroundColor: '#FDEEE4',
    borderWidth: 1,
    borderColor: '#FAD7C0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerTextGroup: {
    flex: 1,
  },
  modalHeading: {
    ...Typography.h2,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.darkText,
  },
  modalSubtitle: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.round,
    backgroundColor: '#F7F3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    maxHeight: 480,
  },
  modalBodyContent: {
    padding: Spacing.lg,
  },
  fileMetadataCard: {
    backgroundColor: '#FFF8F2',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FCE6D8',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  fileMetadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileNameText: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: '#8A4A28',
    flex: 1,
  },
  filePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#F2DFD3',
  },
  infoBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.darkText,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FDE8E8',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.bodySmall,
    color: '#9B1C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  labelWithOptional: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.darkText,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: '#C45B73',
  },
  optionalTag: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.lightText,
  },
  inputField: {
    backgroundColor: '#FCFBF7',
    borderWidth: 1.5,
    borderColor: '#F2DFD3',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    ...Typography.body,
    fontSize: 14,
    color: Colors.darkText,
  },
  coverPickerOptionsBox: {
    backgroundColor: '#FAF7F2',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#E8D9CD',
    padding: Spacing.md,
    alignItems: 'center',
  },
  choosePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#FAD7C0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
  },
  choosePhotoBtnText: {
    ...Typography.label,
    fontSize: 12,
    fontWeight: '700',
    color: '#D96B43',
  },
  orEmojiText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
    marginVertical: 6,
  },
  emojiCoverRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  emojiCoverPill: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#F2DFD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCoverText: {
    fontSize: 16,
  },
  coverPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF7F2',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#F2DFD3',
    padding: Spacing.sm,
  },
  coverImagePreview: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F0ECE4',
  },
  coverActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  changeCoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#FAD7C0',
  },
  changeCoverText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: '#D96B43',
  },
  removeCoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },
  removeCoverText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: '#C45B73',
  },
  previewContainer: {
    backgroundColor: '#FFF9F5',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FAD7C0',
    padding: Spacing.md,
    marginTop: 4,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewHeading: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: '700',
    color: '#D96B43',
    letterSpacing: 0.6,
  },
  previewStatusText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
  },
  previewPlayerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#F6EAE1',
    padding: 10,
    gap: 12,
  },
  previewPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    backgroundColor: '#D96B43',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPlayBtnActive: {
    backgroundColor: '#C45B73',
  },
  previewTrackInfo: {
    flex: 1,
  },
  previewTrackTitle: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkText,
  },
  previewTrackDuration: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 1,
  },
  waveBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 24,
    paddingHorizontal: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F6EAE1',
    backgroundColor: '#FCFBF7',
  },
  cancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  cancelBtnText: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  footerSubmitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveAllBtn: {
    backgroundColor: '#FAF4EF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#F2DFD3',
  },
  saveAllBtnText: {
    ...Typography.label,
    fontSize: 12,
    fontWeight: '700',
    color: '#8A4A28',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D96B43',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    ...Typography.label,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});
