import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  BackHandler,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Play,
  Pause,
  Shuffle,
  Music2,
  Clock,
  Sparkles,
  Volume2,
  Edit3,
  Trash2,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { FloatingParticles } from '../../components/heal-zone/FloatingParticles';
import { PLAYLISTS, MusicPlaylist, MusicSong, CustomPlaylist } from '../../components/music/musicData';
import { CustomPlaylistStore } from '../../components/music/customPlaylistStore';
import { useMusicPlayer } from '../../components/music/MusicPlayerContext';
import { BottomMusicPlayer } from '../../components/music/BottomMusicPlayer';

export default function PlaylistDetailScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 16);
  const { width } = useWindowDimensions();

  const params = useLocalSearchParams<{ id?: string; from?: string }>();
  const playlistId = params.id || 'happy-vibes';
  const parentPage = params.from || '/heal-zone';

  const playlist =
    CustomPlaylistStore.getPlaylistById(playlistId) || PLAYLISTS[0];
  const isCustomPlaylist = Boolean((playlist as any)?.isCustom);

  const {
    currentPlaylist,
    currentSong,
    isPlaying,
    playSong,
    playAll,
    togglePlayPause,
  } = useMusicPlayer();

  const contentMaxWidth = Math.min(width - 32, 540);

  // Return to Music Therapy overview
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({
        pathname: '/music',
        params: { from: parentPage },
      });
    }
  }, [parentPage]);

  // Edit custom playlist
  const handleEditPlaylist = useCallback(() => {
    router.push({
      pathname: '/music/create-playlist',
      params: { id: playlist.id },
    });
  }, [playlist.id]);

  // Delete custom playlist
  const handleDeletePlaylist = useCallback(() => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            CustomPlaylistStore.deleteCustomPlaylist(playlist.id);
            handleBack();
          },
        },
      ]
    );
  }, [playlist.id, playlist.name, handleBack]);

  // Hardware back press on Android
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => backHandler.remove();
  }, [handleBack]);

  const isCurrentPlaylistActive = currentPlaylist?.id === playlist.id;

  // Handle Play All
  const handlePlayAll = () => {
    if (isCurrentPlaylistActive && isPlaying) {
      togglePlayPause();
    } else {
      playAll(playlist);
    }
  };

  // Handle Shuffle: Pick random song from playlist to start
  const handleShuffle = () => {
    const randomIndex = Math.floor(Math.random() * playlist.songs.length);
    playSong(playlist.songs[randomIndex], playlist);
  };

  // Handle song row tap
  const handleSongPress = (song: MusicSong) => {
    if (currentSong?.id === song.id) {
      togglePlayPause();
    } else {
      playSong(song, playlist);
    }
  };

  return (
    <View style={styles.screen}>
      <FloatingParticles />

      {/* TOP HEADER */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.headerTopRow}>
          {/* Back to Music Therapy */}
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

          <View
            style={[
              styles.headerCategoryPill,
              { backgroundColor: playlist.badgeBg, borderColor: playlist.borderColor },
            ]}
          >
            <Text style={[styles.headerCategoryText, { color: playlist.accentColor }]}>
              {playlist.iconEmoji} {playlist.name}
            </Text>
          </View>

          {/* Spacer */}
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* SCROLLABLE PLAYLIST CONTENT */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: currentSong ? 120 : 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
          {/* HERO PLAYLIST BANNER CARD */}
          <View
            style={[
              styles.heroBanner,
              Shadows.sm,
              { backgroundColor: playlist.bgColor, borderColor: playlist.borderColor },
            ]}
          >
            <View style={styles.heroTopRow}>
              {/* Big Mood Badge */}
              <View
                style={[
                  styles.heroIconBadge,
                  { backgroundColor: playlist.badgeBg, borderColor: playlist.borderColor },
                ]}
              >
                <Text style={styles.heroEmoji}>{playlist.iconEmoji}</Text>
              </View>

              <View style={styles.heroMetaInfo}>
                <View style={styles.themeTag}>
                  <Text style={[styles.themeTagText, { color: playlist.accentColor }]}>
                    {playlist.theme.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.heroTitle}>{playlist.name}</Text>
                <Text style={styles.heroSubtitle}>
                  {playlist.songs.length} calming tracks • Mood Therapy
                </Text>
              </View>
            </View>

            <Text style={styles.heroDescription}>{playlist.description}</Text>

            {/* ACTION BUTTONS ROW */}
            <View style={styles.actionButtonsRow}>
              {/* Play All Button */}
              <TouchableOpacity
                style={[
                  styles.playAllBtn,
                  Shadows.sm,
                  { backgroundColor: playlist.accentColor },
                ]}
                onPress={handlePlayAll}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Play all songs"
              >
                {isCurrentPlaylistActive && isPlaying ? (
                  <Pause size={17} color={Colors.white} strokeWidth={2.4} />
                ) : (
                  <Play
                    size={17}
                    color={Colors.white}
                    strokeWidth={2.4}
                    style={styles.playIconOffset}
                  />
                )}
                <Text style={styles.playAllBtnText}>
                  {isCurrentPlaylistActive && isPlaying ? 'Pause Playlist' : 'Play All'}
                </Text>
              </TouchableOpacity>

              {/* Shuffle Button */}
              <TouchableOpacity
                style={[
                  styles.shuffleBtn,
                  { borderColor: playlist.borderColor },
                ]}
                onPress={handleShuffle}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Shuffle playlist"
              >
                <Shuffle size={16} color={playlist.accentColor} strokeWidth={2.2} />
                <Text style={[styles.shuffleBtnText, { color: playlist.accentColor }]}>
                  Shuffle
                </Text>
              </TouchableOpacity>

              {/* If Custom Playlist: Show Edit & Delete buttons */}
              {isCustomPlaylist && (
                <>
                  <TouchableOpacity
                    style={[styles.customActionBtn, { borderColor: playlist.borderColor }]}
                    onPress={handleEditPlaylist}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Edit playlist"
                  >
                    <Edit3 size={15} color={playlist.accentColor} strokeWidth={2.2} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.customActionBtn, styles.customDeleteBtn]}
                    onPress={handleDeletePlaylist}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Delete playlist"
                  >
                    <Trash2 size={15} color="#C46D4B" strokeWidth={2.2} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* TRACK LIST SECTION HEADER */}
          <View style={styles.trackListHeader}>
            <Text style={styles.trackListTitle}>TRACKS IN THIS PLAYLIST</Text>
            <Text style={styles.trackCountLabel}>{playlist.songs.length} Audio Tracks</Text>
          </View>

          {/* LIST OF 4 SONGS */}
          <View style={styles.songsListContainer}>
            {playlist.songs.map((song, index) => {
              const isThisSongActive = currentSong?.id === song.id;
              const isThisSongPlaying = isThisSongActive && isPlaying;

              return (
                <TouchableOpacity
                  key={song.id}
                  style={[
                    styles.songRowCard,
                    Shadows.sm,
                    isThisSongActive && {
                      borderColor: playlist.accentColor,
                      borderWidth: 1.5,
                      backgroundColor: playlist.bgColor,
                    },
                  ]}
                  onPress={() => handleSongPress(song)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Play ${song.title} by ${song.artist}`}
                >
                  {/* Left: Track Number / Active Speaker Icon */}
                  <View
                    style={[
                      styles.trackIndexBadge,
                      isThisSongActive && { backgroundColor: playlist.badgeBg },
                    ]}
                  >
                    {isThisSongPlaying ? (
                      <Volume2 size={16} color={playlist.accentColor} strokeWidth={2.4} />
                    ) : (
                      <Text
                        style={[
                          styles.trackIndexText,
                          isThisSongActive && { color: playlist.accentColor, fontWeight: '700' },
                        ]}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>

                  {/* Middle: Song Details */}
                  <View style={styles.songMainInfo}>
                    <Text
                      style={[
                        styles.songRowTitle,
                        isThisSongActive && { color: playlist.accentColor, fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      {song.title}
                    </Text>
                    <Text style={styles.songRowArtist} numberOfLines={1}>
                      {song.artist}
                    </Text>
                    {song.description && (
                      <Text style={styles.songRowDescription} numberOfLines={1}>
                        {song.description}
                      </Text>
                    )}
                  </View>

                  {/* Right: Duration & Individual Play Button */}
                  <View style={styles.songRightControls}>
                    <Text style={styles.songDurationText}>{song.durationFormatted}</Text>

                    <TouchableOpacity
                      style={[
                        styles.individualPlayBtn,
                        isThisSongPlaying
                          ? { backgroundColor: playlist.accentColor }
                          : { backgroundColor: '#F0ECE3' },
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleSongPress(song);
                      }}
                      activeOpacity={0.8}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={isThisSongPlaying ? 'Pause song' : 'Play song'}
                    >
                      {isThisSongPlaying ? (
                        <Pause size={14} color={Colors.white} strokeWidth={2.4} />
                      ) : (
                        <Play
                          size={14}
                          color={isThisSongActive ? playlist.accentColor : Colors.darkText}
                          strokeWidth={2.4}
                          style={styles.songPlayIconOffset}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* COMPACT BOTTOM MUSIC PLAYER */}
      <BottomMusicPlayer />
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
  headerCategoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  headerCategoryText: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 42,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  heroBanner: {
    width: '100%',
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  heroIconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroEmoji: {
    fontSize: 30,
  },
  heroMetaInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  themeTag: {
    marginBottom: 2,
  },
  themeTagText: {
    ...Typography.label,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    ...Typography.h2,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 2,
  },
  heroSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
  },
  heroDescription: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.darkText,
    lineHeight: 18,
    marginBottom: 14,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playAllBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.round,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  playIconOffset: {
    marginLeft: 2,
  },
  playAllBtnText: {
    ...Typography.button,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  shuffleBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.white,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shuffleBtnText: {
    ...Typography.button,
    fontSize: 13,
    fontWeight: '700',
  },
  customActionBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.white,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customDeleteBtn: {
    borderColor: '#F8D7D0',
    backgroundColor: '#FEF4F2',
  },
  trackListHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  trackListTitle: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.mutedText,
    letterSpacing: 0.6,
  },
  trackCountLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.lightText,
  },
  songsListContainer: {
    width: '100%',
    gap: 8,
  },
  songRowCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackIndexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF8F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackIndexText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.mutedText,
    fontWeight: '600',
  },
  songMainInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  songRowTitle: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 1,
  },
  songRowArtist: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.mutedText,
  },
  songRowDescription: {
    ...Typography.caption,
    fontSize: 10.5,
    color: Colors.lightText,
    marginTop: 1,
  },
  songRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  songDurationText: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.mutedText,
    fontVariant: ['tabular-nums'],
  },
  individualPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songPlayIconOffset: {
    marginLeft: 1.5,
  },
});
