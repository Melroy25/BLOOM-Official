import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Platform,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Search,
  Plus,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Music2,
  Sparkles,
  ListMusic,
  Upload,
  Play,
  Pause,
  MoreVertical,
  Edit3,
  Trash2,
  FolderPlus,
  Disc3,
  HardDrive,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { FloatingParticles } from '../../components/heal-zone/FloatingParticles';
import { CustomPlaylist, MusicSong, MusicPlaylist } from '../../components/music/musicData';
import { CustomPlaylistStore } from '../../components/music/customPlaylistStore';
import {
  UserSong,
  UserMusicStorage,
  pickAudioFilesFromDevice,
} from '../../services/userMusicStorage';
import { UploadSongModal } from '../../components/music/UploadSongModal';
import { useMusicPlayer } from '../../components/music/MusicPlayerContext';
import { BottomMusicPlayer } from '../../components/music/BottomMusicPlayer';

const EMOJI_OPTIONS = ['🎵', '✨', '🌙', '🌸', '☀️', '🌿', '🦋', '💗'];

export default function CreatePlaylistScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 16);
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 20);
  const { width } = useWindowDimensions();
  const contentMaxWidth = Math.min(width - 32, 540);

  const params = useLocalSearchParams<{ id?: string; from?: string }>();
  const editingId = params.id;
  const parentPage = params.from || '/music';

  // Global music player for previewing uploaded tracks
  const { currentSong, isPlaying, playSong, togglePlayPause } = useMusicPlayer();

  // If editing existing playlist, load initial playlist
  const existingPlaylist = useMemo(() => {
    if (!editingId) return null;
    return CustomPlaylistStore.getCustomPlaylists().find((p) => p.id === editingId) || null;
  }, [editingId]);

  const [playlistName, setPlaylistName] = useState<string>(existingPlaylist?.name || '');
  const [selectedEmoji, setSelectedEmoji] = useState<string>(existingPlaylist?.iconEmoji || '🎵');
  const [selectedSongs, setSelectedSongs] = useState<MusicSong[]>(existingPlaylist?.songs || []);

  // User uploaded songs state (from persistent IndexedDB + metadata storage)
  const [userSongs, setUserSongs] = useState<UserSong[]>(() => UserMusicStorage.getUserSongs());
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload & Edit Song Modals
  const [uploadModalVisible, setUploadModalVisible] = useState<boolean>(false);
  const [filesQueue, setFilesQueue] = useState<File[]>([]);
  const [editingSong, setEditingSong] = useState<UserSong | null>(null);

  // Three-dot action menu modal for uploaded song
  const [activeMenuSong, setActiveMenuSong] = useState<UserSong | null>(null);

  // Prompt modal for playlist name when missing on submit
  const [namePromptVisible, setNamePromptVisible] = useState<boolean>(false);
  const [promptNameText, setPromptNameText] = useState<string>('');

  // Subscribe to changes in user's music library
  useEffect(() => {
    const unsubscribe = UserMusicStorage.subscribe(() => {
      setUserSongs(UserMusicStorage.getUserSongs());
    });
    return unsubscribe;
  }, []);

  // Back button returning to Music Therapy
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/music' });
    }
  }, []);

  // Filter uploaded songs based on search query
  const filteredUserSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return userSongs;
    return userSongs.filter((song) => {
      const matchTitle = song.title.toLowerCase().includes(q);
      const matchArtist = song.artist ? song.artist.toLowerCase().includes(q) : false;
      const matchFile = song.fileName ? song.fileName.toLowerCase().includes(q) : false;
      return matchTitle || matchArtist || matchFile;
    });
  }, [userSongs, searchQuery]);

  // Open file dialog to add audio files from device
  const handlePickAudioFiles = async () => {
    try {
      const files = await pickAudioFilesFromDevice();
      if (files && files.length > 0) {
        setEditingSong(null);
        setFilesQueue(files);
        setUploadModalVisible(true);
      }
    } catch (err) {
      Alert.alert('File Picker', 'Could not open file picker. Please try again.');
    }
  };

  // Open edit modal for an uploaded song
  const handleEditUploadedSong = (song: UserSong) => {
    setActiveMenuSong(null);
    setEditingSong(song);
    setFilesQueue([]);
    setUploadModalVisible(true);
  };

  // Delete an uploaded song
  const handleDeleteUploadedSong = (song: UserSong) => {
    setActiveMenuSong(null);
    Alert.alert(
      'Delete Song',
      `Are you sure you want to delete "${song.title}" from your music library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await UserMusicStorage.deleteSong(song.id);
            // Also remove from selected playlist songs if present
            setSelectedSongs((prev) => prev.filter((s) => s.id !== song.id));
          },
        },
      ]
    );
  };

  // Callback when a song is saved in UploadSongModal
  const handleSongSaved = (savedSong: UserSong) => {
    setUserSongs(UserMusicStorage.getUserSongs());
  };

  // Toggle song selection for custom playlist
  const handleToggleSelectSong = async (userSong: UserSong) => {
    const isAlreadySelected = selectedSongs.some((s) => s.id === userSong.id);
    if (isAlreadySelected) {
      setSelectedSongs((prev) => prev.filter((s) => s.id !== userSong.id));
    } else {
      const musicSong = await UserMusicStorage.toMusicSong(userSong);
      setSelectedSongs((prev) => [...prev, musicSong]);
    }
  };

  // Remove song from selected list
  const handleRemoveSelectedSong = (songId: string) => {
    setSelectedSongs((prev) => prev.filter((s) => s.id !== songId));
  };

  // Move song up in selected list
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setSelectedSongs((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Move song down in selected list
  const handleMoveDown = (index: number) => {
    if (index >= selectedSongs.length - 1) return;
    setSelectedSongs((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Play / Pause uploaded song preview in list
  const handleTogglePlaySong = async (e: any, userSong: UserSong) => {
    e.stopPropagation();
    if (currentSong?.id === userSong.id && isPlaying) {
      await togglePlayPause();
      return;
    }

    const musicSong = await UserMusicStorage.toMusicSong(userSong);
    const virtualLibraryPlaylist: MusicPlaylist = {
      id: 'virtual-user-library',
      name: 'My Music Library',
      theme: 'User Uploads',
      description: 'Your personal music collection',
      iconEmoji: '🎧',
      iconName: 'Sparkles',
      bgColor: '#FFF5EE',
      borderColor: '#FAD7C0',
      accentColor: '#D96B43',
      badgeBg: '#FCE6D8',
      songs: [musicSong],
    };

    await playSong(musicSong, virtualLibraryPlaylist);
  };

  // Complete playlist creation and save to store
  const doSavePlaylist = (finalName: string) => {
    const trimmed = finalName.trim();
    if (!trimmed) {
      Alert.alert('Playlist Name Required', 'Please enter a name for your playlist.');
      return;
    }

    if (selectedSongs.length === 0) {
      Alert.alert('No Songs Selected', 'Please select at least one song from your music library.');
      return;
    }

    const playlistId = existingPlaylist ? existingPlaylist.id : `custom-${Date.now()}`;
    const newCustomPlaylist: CustomPlaylist = {
      id: playlistId,
      name: trimmed,
      theme: 'Personalized mood playlist',
      description: `Custom collection with ${selectedSongs.length} hand-picked tracks.`,
      iconEmoji: selectedEmoji,
      iconName: 'Sparkles',
      bgColor: '#FFF5EE',
      borderColor: '#FAD7C0',
      accentColor: '#D96B43',
      badgeBg: '#FCE6D8',
      isCustom: true,
      createdAt: existingPlaylist?.createdAt || Date.now(),
      songs: selectedSongs,
    };

    CustomPlaylistStore.saveCustomPlaylist(newCustomPlaylist);
    handleBack();
  };

  // Submit button click handler
  const handleCreateButtonClick = () => {
    const trimmedName = playlistName.trim();

    if (selectedSongs.length === 0) {
      Alert.alert(
        'No Songs Selected',
        'Please select at least one song from your music library to include in this playlist.'
      );
      return;
    }

    // If playlist name has not been provided yet, open name prompt dialog
    if (!trimmedName) {
      setPromptNameText('');
      setNamePromptVisible(true);
      return;
    }

    doSavePlaylist(trimmedName);
  };

  // Handle prompt modal submission
  const handlePromptSubmit = () => {
    const trimmed = promptNameText.trim();
    if (!trimmed) {
      Alert.alert('Name Required', 'Please enter a name for your playlist.');
      return;
    }
    setPlaylistName(trimmed);
    setNamePromptVisible(false);
    doSavePlaylist(trimmed);
  };

  return (
    <View style={styles.screen}>
      <FloatingParticles />

      {/* TOP HEADER */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={[styles.headerIconBtn, Shadows.sm]}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back to Music Therapy"
          >
            <ChevronLeft size={24} color={Colors.darkText} strokeWidth={2.4} />
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              {existingPlaylist ? 'Edit Playlist' : 'Custom Playlist'}
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.title}>
          {existingPlaylist ? 'Edit Your Playlist 🎵' : 'Create Your Own Playlist 🎵'}
        </Text>
        <Text style={styles.subtitle}>
          Your mood, your music, your playlist.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
          {/* SECTION 1: NAME YOUR PLAYLIST */}
          <View style={[styles.cardSection, Shadows.sm]}>
            <Text style={styles.sectionLabel}>1. NAME YOUR PLAYLIST</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. My Happy Moments, Peaceful Mind, Late Night Thoughts"
              placeholderTextColor={Colors.lightText}
              value={playlistName}
              onChangeText={setPlaylistName}
              maxLength={40}
              autoCorrect={false}
            />

            {/* Emoji Cover Selector */}
            <Text style={styles.emojiPickerLabel}>CHOOSE COVER ICON</Text>
            <View style={styles.emojiRow}>
              {EMOJI_OPTIONS.map((emoji) => {
                const isSelected = selectedEmoji === emoji;
                return (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiButton,
                      isSelected && styles.emojiButtonSelected,
                    ]}
                    onPress={() => setSelectedEmoji(emoji)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.emojiButtonText}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SECTION 2: SELECTED SONGS SUMMARY & REORDERING */}
          <View style={[styles.cardSection, Shadows.sm]}>
            <View style={styles.selectedHeaderRow}>
              <View>
                <Text style={styles.sectionLabel}>2. SELECTED SONGS</Text>
                <Text style={styles.selectedSubLabel}>
                  {selectedSongs.length} {selectedSongs.length === 1 ? 'song' : 'songs'} added
                </Text>
              </View>
              {selectedSongs.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSelectedSongs([])}
                  activeOpacity={0.7}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {selectedSongs.length === 0 ? (
              <View style={styles.emptySelectedBox}>
                <ListMusic size={26} color="#D9A08B" strokeWidth={2} />
                <Text style={styles.emptySelectedText}>
                  No songs selected yet. Tap (+) on any song in your music library below to add it.
                </Text>
              </View>
            ) : (
              <View style={styles.selectedSongsList}>
                {selectedSongs.map((song, idx) => (
                  <View key={song.id} style={styles.selectedSongRow}>
                    <View style={styles.selectedTrackNumberBadge}>
                      <Text style={styles.selectedTrackNumberText}>{idx + 1}</Text>
                    </View>

                    <View style={styles.selectedSongDetails}>
                      <Text style={styles.selectedSongTitle} numberOfLines={1}>
                        {song.title}
                      </Text>
                      <Text style={styles.selectedSongArtist} numberOfLines={1}>
                        {song.artist} • {song.durationFormatted}
                      </Text>
                    </View>

                    {/* Move Up, Move Down, Remove */}
                    <View style={styles.orderControlsRow}>
                      <TouchableOpacity
                        style={[styles.miniControlBtn, idx === 0 && styles.miniControlDisabled]}
                        disabled={idx === 0}
                        onPress={() => handleMoveUp(idx)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <ArrowUp size={14} color={idx === 0 ? Colors.border : Colors.darkText} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.miniControlBtn,
                          idx === selectedSongs.length - 1 && styles.miniControlDisabled,
                        ]}
                        disabled={idx === selectedSongs.length - 1}
                        onPress={() => handleMoveDown(idx)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <ArrowDown
                          size={14}
                          color={idx === selectedSongs.length - 1 ? Colors.border : Colors.darkText}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.removeSongBtn}
                        onPress={() => handleRemoveSelectedSong(song.id)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        accessibilityLabel={`Remove ${song.title}`}
                      >
                        <X size={15} color="#C46D4B" strokeWidth={2.4} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* SECTION 3: MY MUSIC LIBRARY */}
          <View style={[styles.cardSection, Shadows.sm]}>
            <View style={styles.libraryHeaderRow}>
              <View style={styles.libraryHeaderTitles}>
                <Text style={styles.sectionLabel}>MY MUSIC LIBRARY 🎵</Text>
                <Text style={styles.librarySubHeading}>
                  Add your favourite songs and build your own collection.
                </Text>
              </View>

              {/* Prominent + Add Music Button */}
              <TouchableOpacity
                style={[styles.addMusicBtn, Shadows.sm]}
                onPress={handlePickAudioFiles}
                activeOpacity={0.85}
              >
                <Plus size={16} color={Colors.white} strokeWidth={2.6} />
                <Text style={styles.addMusicBtnText}>Add Music</Text>
              </TouchableOpacity>
            </View>

            {/* Supported formats hint */}
            <View style={styles.supportedFormatsBadge}>
              <Disc3 size={12} color="#D96B43" strokeWidth={2.2} />
              <Text style={styles.supportedFormatsText}>
                Supports MP3, WAV, M4A, AAC, OGG • Multiple files supported
              </Text>
            </View>

            {/* Search Bar for Uploaded Songs */}
            {userSongs.length > 0 && (
              <View style={styles.searchBar}>
                <Search size={16} color={Colors.mutedText} strokeWidth={2.2} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search uploaded songs by title or artist..."
                  placeholderTextColor={Colors.lightText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <X size={16} color={Colors.mutedText} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* EMPTY STATE (No Uploads Yet) */}
            {userSongs.length === 0 ? (
              <View style={styles.emptyLibraryCard}>
                <View style={styles.emptyLibraryIconBadge}>
                  <Text style={styles.emptyLibraryEmoji}>🎧</Text>
                </View>
                <Text style={styles.emptyLibraryTitle}>Your music library is waiting! 🎧</Text>
                <Text style={styles.emptyLibrarySubtitle}>
                  Upload your favourite songs from your device to get started.
                </Text>

                <TouchableOpacity
                  style={[styles.emptyAddMusicCTA, Shadows.sm]}
                  onPress={handlePickAudioFiles}
                  activeOpacity={0.85}
                >
                  <Plus size={16} color={Colors.white} strokeWidth={2.6} />
                  <Text style={styles.emptyAddMusicCTAText}>+ Add Music</Text>
                </TouchableOpacity>
              </View>
            ) : filteredUserSongs.length === 0 ? (
              /* Search Empty State */
              <View style={styles.searchEmptyCard}>
                <Text style={styles.searchEmptyTitle}>No songs found</Text>
                <Text style={styles.searchEmptySubtitle}>
                  No uploaded songs match &quot;{searchQuery}&quot;.
                </Text>
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearSearchBtnText}>Clear Search</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* UPLOADED SONGS LIST */
              <View style={styles.librarySongsList}>
                {filteredUserSongs.map((song) => {
                  const isSelected = selectedSongs.some((s) => s.id === song.id);
                  const isThisPlaying = currentSong?.id === song.id && isPlaying;

                  return (
                    <TouchableOpacity
                      key={song.id}
                      style={[
                        styles.uploadedSongCard,
                        isSelected && styles.uploadedSongCardSelected,
                      ]}
                      onPress={() => handleToggleSelectSong(song)}
                      activeOpacity={0.7}
                    >
                      {/* Album Cover / Musical Icon */}
                      <View style={styles.songCoverBox}>
                        {song.coverUrl ? (
                          <Image
                            source={{ uri: song.coverUrl }}
                            style={styles.songCoverImage}
                          />
                        ) : (
                          <View style={styles.songDefaultCover}>
                            <Music2 size={18} color="#D96B43" strokeWidth={2.2} />
                          </View>
                        )}
                      </View>

                      {/* Song Details */}
                      <View style={styles.songDetailsCol}>
                        <Text style={styles.songTitleText} numberOfLines={1}>
                          {song.title}
                        </Text>
                        <View style={styles.songSubDetailsRow}>
                          <Text style={styles.songArtistText} numberOfLines={1}>
                            {song.artist || 'My Upload'}
                          </Text>
                          <Text style={styles.dot}>•</Text>
                          <Text style={styles.songDurationText}>
                            {song.durationFormatted}
                          </Text>
                        </View>
                      </View>

                      {/* Action buttons on right */}
                      <View style={styles.songActionsRow}>
                        {/* Play/Pause Button */}
                        <TouchableOpacity
                          style={[
                            styles.songPlayBtn,
                            isThisPlaying && styles.songPlayBtnActive,
                          ]}
                          onPress={(e) => handleTogglePlaySong(e, song)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          accessibilityLabel={isThisPlaying ? 'Pause song' : 'Play song'}
                        >
                          {isThisPlaying ? (
                            <Pause size={13} color={Colors.white} strokeWidth={2.4} />
                          ) : (
                            <Play
                              size={13}
                              color={Colors.white}
                              strokeWidth={2.4}
                              style={{ marginLeft: 1 }}
                            />
                          )}
                        </TouchableOpacity>

                        {/* Three-dot menu button */}
                        <TouchableOpacity
                          style={styles.moreOptionsBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            setActiveMenuSong(song);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessibilityLabel="More song options"
                        >
                          <MoreVertical size={16} color={Colors.mutedText} strokeWidth={2.2} />
                        </TouchableOpacity>

                        {/* Add (+) / Added Checkbox Button */}
                        <TouchableOpacity
                          style={[
                            styles.addToggleBtn,
                            isSelected
                              ? styles.addToggleBtnSelected
                              : styles.addToggleBtnUnselected,
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleToggleSelectSong(song);
                          }}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          {isSelected ? (
                            <>
                              <Check size={13} color={Colors.white} strokeWidth={2.8} />
                              <Text style={styles.addToggleTextSelected}>Added</Text>
                            </>
                          ) : (
                            <>
                              <Plus size={14} color="#D96B43" strokeWidth={2.4} />
                              <Text style={styles.addToggleTextUnselected}>Add</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* STICKY BOTTOM SUBMIT BAR */}
      <View style={[styles.bottomBarWrapper, { paddingBottom: bottomPadding }]}>
        <View style={[styles.bottomBarCard, Shadows.lg, { maxWidth: contentMaxWidth }]}>
          <TouchableOpacity
            style={[
              styles.createSubmitBtn,
              Shadows.sm,
              selectedSongs.length === 0 && styles.createSubmitBtnDisabled,
            ]}
            onPress={handleCreateButtonClick}
            disabled={selectedSongs.length === 0}
            activeOpacity={0.85}
          >
            <Sparkles size={18} color={Colors.white} strokeWidth={2.2} />
            <Text style={styles.createSubmitBtnText}>
              {existingPlaylist
                ? `Save Changes (${selectedSongs.length} Songs)`
                : `Create My Playlist (${selectedSongs.length} Songs)`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* THREE-DOT SONG ACTION MODAL (EDIT & DELETE) */}
      <Modal
        visible={Boolean(activeMenuSong)}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setActiveMenuSong(null)}
      >
        <TouchableOpacity
          style={styles.actionMenuOverlay}
          activeOpacity={1}
          onPress={() => setActiveMenuSong(null)}
        >
          <View style={[styles.actionMenuCard, Shadows.lg]}>
            <View style={styles.actionMenuHeader}>
              <Text style={styles.actionMenuSongTitle} numberOfLines={1}>
                {activeMenuSong?.title}
              </Text>
              <Text style={styles.actionMenuSongSubtitle} numberOfLines={1}>
                {activeMenuSong?.artist} • {activeMenuSong?.durationFormatted}
              </Text>
            </View>

            {/* Edit Option */}
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                if (activeMenuSong) handleEditUploadedSong(activeMenuSong);
              }}
            >
              <View style={[styles.actionMenuIconBadge, { backgroundColor: '#FDEEE4' }]}>
                <Edit3 size={16} color="#D96B43" strokeWidth={2.2} />
              </View>
              <View style={styles.actionMenuTextCol}>
                <Text style={styles.actionMenuItemText}>Edit Song Details</Text>
                <Text style={styles.actionMenuItemSub}>
                  Change song title, artist, or album cover photo
                </Text>
              </View>
            </TouchableOpacity>

            {/* Delete Option */}
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                if (activeMenuSong) handleDeleteUploadedSong(activeMenuSong);
              }}
            >
              <View style={[styles.actionMenuIconBadge, { backgroundColor: '#FDF2F0' }]}>
                <Trash2 size={16} color="#C45B73" strokeWidth={2.2} />
              </View>
              <View style={styles.actionMenuTextCol}>
                <Text style={[styles.actionMenuItemText, { color: '#C45B73' }]}>
                  Delete Song
                </Text>
                <Text style={styles.actionMenuItemSub}>
                  Remove permanently from library and playlists
                </Text>
              </View>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.actionMenuCancelBtn}
              onPress={() => setActiveMenuSong(null)}
            >
              <Text style={styles.actionMenuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PLAYLIST NAME PROMPT MODAL (When missing on submit) */}
      <Modal
        visible={namePromptVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setNamePromptVisible(false)}
      >
        <View style={styles.actionMenuOverlay}>
          <View style={[styles.promptModalCard, Shadows.lg]}>
            <View style={styles.promptHeaderRow}>
              <View style={styles.promptIconBadge}>
                <Music2 size={18} color="#D96B43" strokeWidth={2.4} />
              </View>
              <Text style={styles.promptHeading}>Name Your Playlist 🎵</Text>
            </View>

            <Text style={styles.promptSubtext}>
              Give your new playlist a title before saving.
            </Text>

            <TextInput
              style={styles.promptInput}
              placeholder="e.g. Morning Calm, Weekend Chill"
              placeholderTextColor={Colors.lightText}
              value={promptNameText}
              onChangeText={setPromptNameText}
              maxLength={40}
              autoFocus={true}
            />

            <View style={styles.promptBtnRow}>
              <TouchableOpacity
                style={styles.promptCancelBtn}
                onPress={() => setNamePromptVisible(false)}
              >
                <Text style={styles.promptCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.promptSaveBtn, Shadows.sm]}
                onPress={handlePromptSubmit}
              >
                <Text style={styles.promptSaveText}>Save Playlist</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* UPLOAD / EDIT SONG MODAL */}
      <UploadSongModal
        visible={uploadModalVisible}
        onClose={() => {
          setUploadModalVisible(false);
          setEditingSong(null);
          setFilesQueue([]);
        }}
        filesQueue={filesQueue}
        editingSong={editingSong}
        onSongSaved={handleSongSaved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xs,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    backgroundColor: '#FDEEE4',
    borderWidth: 1,
    borderColor: '#FAD7C0',
  },
  headerBadgeText: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: '700',
    color: '#D96B43',
  },
  headerSpacer: {
    width: 42,
  },
  title: {
    ...Typography.h1,
    fontSize: 24,
    color: Colors.darkText,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.mutedText,
    marginBottom: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  cardSection: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F6EAE1',
  },
  sectionLabel: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: '800',
    color: '#D96B43',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FCFBF7',
    borderWidth: 1.5,
    borderColor: '#F2DFD3',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    ...Typography.body,
    fontSize: 14,
    color: Colors.darkText,
    marginBottom: Spacing.md,
  },
  emojiPickerLabel: {
    ...Typography.label,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.mutedText,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FAF7F2',
    borderWidth: 1.5,
    borderColor: '#EFE7DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonSelected: {
    backgroundColor: '#FDEEE4',
    borderColor: '#D96B43',
    transform: [{ scale: 1.08 }],
  },
  emojiButtonText: {
    fontSize: 20,
  },
  selectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  selectedSubLabel: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: -4,
  },
  clearAllText: {
    ...Typography.label,
    fontSize: 11,
    color: '#C45B73',
    fontWeight: '700',
  },
  emptySelectedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#FAF7F2',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#EFE3D8',
    gap: 8,
  },
  emptySelectedText: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 18,
  },
  selectedSongsList: {
    gap: 8,
  },
  selectedSongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F2DFD3',
  },
  selectedTrackNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FDEEE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedTrackNumberText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: '#D96B43',
  },
  selectedSongDetails: {
    flex: 1,
    marginRight: 8,
  },
  selectedSongTitle: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkText,
  },
  selectedSongArtist: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 1,
  },
  orderControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniControlBtn: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniControlDisabled: {
    opacity: 0.4,
  },
  removeSongBtn: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#FDEEE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  libraryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  libraryHeaderTitles: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  librarySubHeading: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: -4,
  },
  addMusicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D96B43',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
  },
  addMusicBtnText: {
    ...Typography.label,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  supportedFormatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF8F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#FCE6D8',
    marginBottom: Spacing.md,
  },
  supportedFormatsText: {
    ...Typography.caption,
    fontSize: 11,
    color: '#8A4A28',
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCFBF7',
    borderWidth: 1,
    borderColor: '#F2DFD3',
    borderRadius: BorderRadius.round,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    marginBottom: Spacing.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 13,
    color: Colors.darkText,
    padding: 0,
  },
  emptyLibraryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl + 8,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#FAF7F2',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#FAD7C0',
    gap: 8,
  },
  emptyLibraryIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDEEE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyLibraryEmoji: {
    fontSize: 26,
  },
  emptyLibraryTitle: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkText,
    textAlign: 'center',
  },
  emptyLibrarySubtitle: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyAddMusicCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D96B43',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.round,
    marginTop: 6,
  },
  emptyAddMusicCTAText: {
    ...Typography.label,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  searchEmptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: 6,
  },
  searchEmptyTitle: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkText,
  },
  searchEmptySubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
  },
  clearSearchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#FAF4EF',
    borderWidth: 1,
    borderColor: '#F2DFD3',
    marginTop: 4,
  },
  clearSearchBtnText: {
    ...Typography.label,
    fontSize: 11,
    color: '#D96B43',
    fontWeight: '700',
  },
  librarySongsList: {
    gap: 10,
  },
  uploadedSongCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#F2DFD3',
    padding: 10,
    gap: 10,
  },
  uploadedSongCardSelected: {
    backgroundColor: '#FDF7F3',
    borderColor: '#D96B43',
    borderWidth: 1.5,
  },
  songCoverBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#FDEEE4',
  },
  songCoverImage: {
    width: 44,
    height: 44,
  },
  songDefaultCover: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDEEE4',
  },
  songDetailsCol: {
    flex: 1,
  },
  songTitleText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkText,
  },
  songSubDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  songArtistText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
  },
  dot: {
    fontSize: 10,
    color: Colors.lightText,
  },
  songDurationText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
  },
  songActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  songPlayBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#D96B43',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songPlayBtnActive: {
    backgroundColor: '#C45B73',
  },
  moreOptionsBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#EFE7DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  addToggleBtnUnselected: {
    backgroundColor: Colors.white,
    borderWidth: 1.2,
    borderColor: '#FAD7C0',
  },
  addToggleBtnSelected: {
    backgroundColor: '#4A7C59',
  },
  addToggleTextUnselected: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: '700',
    color: '#D96B43',
  },
  addToggleTextSelected: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    backgroundColor: 'transparent',
  },
  bottomBarCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F2DFD3',
  },
  createSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D96B43',
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
  },
  createSubmitBtnDisabled: {
    opacity: 0.5,
  },
  createSubmitBtnText: {
    ...Typography.label,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 24, 20, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  actionMenuCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#FAD7C0',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  actionMenuHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#F6EAE1',
    paddingBottom: Spacing.sm,
  },
  actionMenuSongTitle: {
    ...Typography.h3,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkText,
  },
  actionMenuSongSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 2,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  actionMenuIconBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionMenuTextCol: {
    flex: 1,
  },
  actionMenuItemText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkText,
  },
  actionMenuItemSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
  },
  actionMenuCancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F6EAE1',
    marginTop: 4,
  },
  actionMenuCancelText: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  promptModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#FAD7C0',
    padding: Spacing.lg,
  },
  promptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  promptIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDEEE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptHeading: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkText,
  },
  promptSubtext: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.mutedText,
    marginBottom: Spacing.md,
    marginTop: 4,
  },
  promptInput: {
    backgroundColor: '#FCFBF7',
    borderWidth: 1.5,
    borderColor: '#F2DFD3',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    ...Typography.body,
    fontSize: 14,
    color: Colors.darkText,
    marginBottom: Spacing.lg,
  },
  promptBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  promptCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  promptCancelText: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  promptSaveBtn: {
    backgroundColor: '#D96B43',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  promptSaveText: {
    ...Typography.label,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});
